import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { EVIDENCE_KINDS, type EvidenceKind } from "@/core/evidenceKinds";

/**
 * Systembevis: bevis som Spark själv hämtat ur en extern källa
 * (`entered_by = 'system'`, docs/bevislagring.md avsnitt 4 och 5, beslut i
 * docs/beslut.md 2026-10-04). I dag bara registerbevisen från Marknaden:
 * antalet bolag i branschen (steg 03) och konkurrenterna (steg 04).
 *
 * `public.record_evidence` skriver alltid `entered_by = 'founder'`, och ingen
 * klient får skriva i `evidence`. Därför skriver servern systembevisen med
 * SUPABASE_SERVICE_ROLE_KEY, som går förbi RLS. Skydden:
 * - nyckeln läses bara här (server-only, lint-regel: bara
 *   adapters/live/EvidenceRecorder.ts och tester får importera filen) och har
 *   aldrig NEXT_PUBLIC_-prefix;
 * - bara sorterna i SYSTEM_KINDS går att skriva, och de är `system` i
 *   core/evidenceKinds.ts och i databasen;
 * - userId och projectId kommer från anroparens session, aldrig ur indata.
 *   Den sammansatta främmande nyckeln (project_id, user_id) → projects gör det
 *   omöjligt att skriva på någon annans projekt, även med service role;
 * - triggern `evidence_derive_from_kind` sätter del, datatyp, poäng och
 *   "motsäger" ur sorten vid varje insert, så servern kan inte sätta poängen.
 *
 * Siffrorna hämtas alltid av servern själv (adapters/live/RegistryProvider.ts),
 * aldrig från klienten.
 */

export const SYSTEM_KINDS: readonly EvidenceKind[] = ["registerMarketCount", "registerCompetitorSet"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SUBJECT_PATTERN = /^[a-z]+:[0-9a-z:]{1,180}$/;
const MODULE = "Registret";
const REPLACED_REASON = "Ersatt av en nyare hämtning ur registret.";

export type SystemEvidenceWrite = {
  userId: string;
  projectId: string;
  kind: EvidenceKind;
  /** Registerfrågans nyckel, till exempel "sni:69201:antal". */
  subjectRef: string;
  sourceName: string;
  sourceUrl: string | null;
  /** Faktumets datum: dagen registret svarade. */
  fetchedAt: string;
  quote: string;
  stepNumber: number;
};

export type SystemEvidenceResult = "recorded" | "duplicate" | "replaced";

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

/** Kontrollerar indata. Exporterad för tester. */
export function validateSystemEvidenceWrite(input: SystemEvidenceWrite): void {
  if (!UUID_PATTERN.test(input.userId) || !UUID_PATTERN.test(input.projectId)) {
    throw new Error("Systembevis: ogiltigt användar- eller projekt-id.");
  }
  if (!SYSTEM_KINDS.includes(input.kind) || EVIDENCE_KINDS[input.kind].enteredBy !== "system") {
    throw new Error("Systembevis: sorten får inte skrivas av systemet.");
  }
  if (!SUBJECT_PATTERN.test(input.subjectRef)) throw new Error("Systembevis: ogiltig registerfråga.");
  const sourceName = input.sourceName.trim();
  if (!sourceName || sourceName.length > 200 || sourceName.startsWith("spark:")) {
    throw new Error("Systembevis: ogiltig källa.");
  }
  if (input.sourceUrl !== null && !/^https:\/\/[^\s]{1,1990}$/.test(input.sourceUrl)) {
    throw new Error("Systembevis: ogiltig länk.");
  }
  if (!ISO_DATE.test(input.fetchedAt)) throw new Error("Systembevis: ogiltigt datum.");
  if (!input.quote.trim() || input.quote.length > 1000) throw new Error("Systembevis: ogiltigt citat.");
  if (!Number.isInteger(input.stepNumber) || input.stepNumber < 1 || input.stepNumber > 12) {
    throw new Error("Systembevis: ogiltigt steg.");
  }
}

/**
 * Sparar ett systembevis. Samma sort, fråga och dag finns redan: "duplicate".
 * Återkallelsen och den nya raden är två steg, inte en transaktion: går den
 * nya raden inte att spara står frågan utan bevis tills grundaren sparar igen
 * (poängen kan då sjunka tillfälligt). Det unika indexet hindrar dubbletter.
 * Ett äldre bevis om samma fråga återkallas med en anledning och ersätts:
 * "replaced". Ett bevis ändras aldrig, det återkallas (triggern
 * `evidence_only_retraction`).
 */
export async function recordSystemEvidence(input: SystemEvidenceWrite): Promise<SystemEvidenceResult> {
  validateSystemEvidenceWrite(input);
  const client = getServiceClient();

  const { data: existing, error: readError } = await client
    .from("evidence")
    .select("id, fetched_at")
    .eq("project_id", input.projectId)
    .eq("user_id", input.userId)
    .eq("kind", input.kind)
    .eq("subject_ref", input.subjectRef)
    .is("retracted_at", null)
    .limit(1);
  if (readError) throw new Error(`Systembevis: kunde inte läsa (${readError.code ?? "okänt fel"}).`);

  const previous = (existing ?? [])[0] as { id: string; fetched_at: string } | undefined;
  if (previous && previous.fetched_at === input.fetchedAt) return "duplicate";
  if (previous) {
    const { error } = await client
      .from("evidence")
      .update({ retracted_at: new Date().toISOString(), retracted_reason: REPLACED_REASON })
      .eq("id", previous.id)
      .eq("project_id", input.projectId)
      .eq("user_id", input.userId);
    // 22023: en annan flik hann återkalla den gamla raden (triggern). Då gäller
    // samma sak som vid ett unikt index nedan: den andra fliken sparar den nya.
    if (error && error.code !== "22023") throw new Error(`Systembevis: kunde inte ersätta (${error.code ?? "okänt fel"}).`);
  }

  const spec = EVIDENCE_KINDS[input.kind];
  const { error } = await client.from("evidence").insert({
    user_id: input.userId,
    project_id: input.projectId,
    kind: input.kind,
    subject_ref: input.subjectRef,
    entered_by: "system",
    module: MODULE,
    source_name: input.sourceName.trim(),
    source_url: input.sourceUrl,
    fetched_at: input.fetchedAt,
    quote: input.quote.trim(),
    step_number: input.stepNumber,
    // Skrivs över av triggern ur sorten. Anges bara för not null.
    part_id: spec.partId,
    data_type: spec.dataType,
    points: 0,
    contradicts: spec.contradicts,
  });
  if (error) {
    // Samma fråga hann sparas från en annan flik (unikt index): räknas som redan sparad.
    if (error.code === "23505") return "duplicate";
    throw new Error(`Systembevis: kunde inte spara (${error.code ?? "okänt fel"}).`);
  }
  return previous ? "replaced" : "recorded";
}
