import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EVIDENCE_KINDS, type EvidenceKind } from "@/core/evidenceKinds";

/**
 * Skriver bevis som SYSTEMET hämtat ur en extern källa (entered_by = 'system',
 * docs/bevislagring.md 5.1). Grundarens väg, public.record_evidence, vägrar
 * medvetet systemsorterna (registerdata), så att ingen kan skriva in egna
 * registersiffror. Därför skriver servern dem här, med
 * SUPABASE_SERVICE_ROLE_KEY, samma mönster som lib/server/scoreSnapshots.ts.
 *
 * Skydden:
 * - Bara sorter som är "system" i core/evidenceKinds.ts tas emot. Triggern
 *   public.evidence_derive_from_kind kontrollerar samma sak i databasen och
 *   sätter del, datatyp, motsäger och poäng ur sorten, även med service role.
 * - userId och projectId kommer från anroparens session (requireSupabaseUser
 *   och getActiveProjectId), aldrig ur indata. Den sammansatta främmande
 *   nyckeln (project_id, user_id) → projects gör det omöjligt att skriva på
 *   någon annans projekt.
 * - Nyckeln läses bara här (lint-regel: bara adapters/live/EvidenceRecorder.ts
 *   och tester får importera filen) och har aldrig NEXT_PUBLIC_-prefix.
 * - Klienten används bara mot public.evidence: insert av nya rader och
 *   återkallelse av egna systembevis. Den lämnas aldrig ut.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type SystemEvidenceWrite = {
  userId: string;
  projectId: string;
  kind: EvidenceKind;
  subjectRef: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
  quote: string | null;
  module: string;
  /** Steget i resan beviset hör till, om något. */
  stepNumber: number | null;
};

export type SystemEvidenceStatus = "recorded" | "duplicate";

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas. Sätt dem i .env.local (se .env.example).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Kontrollerar skrivningen innan något skickas. Exporterad för tester. */
export function validateSystemEvidenceWrite(input: SystemEvidenceWrite): void {
  if (!UUID_PATTERN.test(input.userId) || !UUID_PATTERN.test(input.projectId)) {
    throw new Error("Systembevis: ogiltigt användar- eller projekt-id.");
  }
  if (EVIDENCE_KINDS[input.kind]?.enteredBy !== "system") {
    throw new Error("Systembevis: sorten kan inte läggas in av systemet.");
  }
  if (!input.subjectRef || input.subjectRef.length > 200) throw new Error("Systembevis: vad beviset gäller saknas.");
  if (!input.sourceName.trim() || input.sourceName.length > 200) throw new Error("Systembevis: källan saknas.");
  // 7.3c: ett systembevis ur en extern källa måste gå att kontrollera.
  if (!/^https:\/\//i.test(input.sourceUrl) || input.sourceUrl.length > 2000) {
    throw new Error("Systembevis: källan saknar en https-länk.");
  }
  if (!DATE_PATTERN.test(input.fetchedAt)) throw new Error("Systembevis: ogiltigt datum.");
  if (input.quote !== null && input.quote.length > 1000) throw new Error("Systembevis: underlaget är för långt.");
  if (!input.module.trim() || input.module.length > 60) throw new Error("Systembevis: modulen saknas.");
  if (input.stepNumber !== null && (!Number.isInteger(input.stepNumber) || input.stepNumber < 1 || input.stepNumber > 12)) {
    throw new Error("Systembevis: ogiltigt steg.");
  }
}

/**
 * Skriver ett systembevis. Samma sort om samma sak (unika indexet
 * evidence_one_per_subject) ger "duplicate" utan att något ändras.
 */
export async function writeSystemEvidence(input: SystemEvidenceWrite): Promise<SystemEvidenceStatus> {
  validateSystemEvidenceWrite(input);
  const { error } = await getServiceClient().from("evidence").insert({
    user_id: input.userId,
    project_id: input.projectId,
    kind: input.kind,
    subject_ref: input.subjectRef,
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    fetched_at: input.fetchedAt,
    quote: input.quote,
    module: input.module,
    step_number: input.stepNumber,
    entered_by: "system",
    // Triggern skriver över del, datatyp, motsäger och poäng ur sorten. De
    // skickas ändå med eftersom kolumnerna är obligatoriska.
    part_id: EVIDENCE_KINDS[input.kind].partId,
    data_type: EVIDENCE_KINDS[input.kind].dataType,
    contradicts: EVIDENCE_KINDS[input.kind].contradicts,
    points: EVIDENCE_KINDS[input.kind].basePoints,
  });
  if (error) {
    if (error.code === "23505") return "duplicate";
    throw new Error(`Systembevis: kunde inte spara (${error.message}).`);
  }
  return "recorded";
}

/**
 * Återkallar ett systembevis på grundarens projekt, till exempel när
 * grundaren byter bransch. Bara rader som är systemets egna och inte redan
 * återkallade träffas. Triggern public.evidence_only_retraction tillåter bara
 * att retracted_at och retracted_reason sätts.
 */
export async function retractSystemEvidence(input: {
  userId: string;
  projectId: string;
  evidenceId: string;
  reason: string;
}): Promise<void> {
  if (!UUID_PATTERN.test(input.userId) || !UUID_PATTERN.test(input.projectId) || !UUID_PATTERN.test(input.evidenceId)) {
    throw new Error("Systembevis: ogiltigt id.");
  }
  const reason = input.reason.trim().slice(0, 500);
  if (!reason) throw new Error("Systembevis: en anledning krävs.");
  const { error } = await getServiceClient()
    .from("evidence")
    .update({ retracted_at: new Date().toISOString(), retracted_reason: reason })
    .eq("id", input.evidenceId)
    .eq("user_id", input.userId)
    .eq("project_id", input.projectId)
    .eq("entered_by", "system")
    .is("retracted_at", null);
  if (error) throw new Error(`Systembevis: kunde inte återkalla (${error.message}).`);
}
