import { z } from "zod";
import type { EvidenceRecorder, EvidenceView, RecordEvidenceInput, RecordEvidenceResult } from "@/ports/EvidenceRecorder";
import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import { ALL_PART_IDS, type ScorePartId } from "@/core/score";
import { EVIDENCE_KINDS, founderMayRecord, isEvidenceKind, isSelfReported } from "@/core/evidenceKinds";
import { cleanText } from "@/core/text";
import { EmptyStateError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { getActiveProjectId } from "@/lib/server/activeProject";
import { writeScoreSnapshot } from "@/lib/server/scoreSnapshots";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { fill } from "@/i18n/fill";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  INTERNAL_SOURCE_PREFIX,
  computeScore,
  displaySourceName,
  readLatestSnapshot,
  stockholmToday,
  toStoredEvidence,
  translateDeltaReason,
  withPrevious,
  type ComputedScore,
} from "./evidenceScore";

/**
 * Modul: Evidens och poäng, skrivvägen (docs/bevislagring.md 4–5).
 *
 * Bevis skrivs bara via databasfunktionen public.record_evidence (beslut B3),
 * som tar användaren ur auth.uid(), projektet ur det aktiva projektet och
 * sätter del, datatyp, motsäger och poäng ur sorten. Valideringen här är en
 * första spärr med begripliga fel. Den bindande spärren sitter i databasen,
 * eftersom funktionen också går att anropa direkt (supabase/migrations/
 * evidenceWritePath.pg.test.ts).
 *
 * Poängen räknas om på servern direkt efter, med samma läsväg som
 * adapters/live/EvidenceRepository.ts. Ändras totalen jämfört med den senaste
 * snapshotten skrivs en ny (beslut B8) med sin egen förändring och orsak, så
 * att läsvägen kan visa rätt förändring (fel 3, 3.4).
 */

const DOC = "docs/moduler/evidens-och-poang.md";
const MODULE = "Evidens och poäng";
const dictionaries = { sv, en };

const MAX_SUBJECT_REF = 200;
const MAX_SOURCE_NAME = 200;
const MAX_QUOTE = 1000;
const MAX_REASON = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ogiltig indata till skrivvägen. Kastas innan något skrivs. */
export class EvidenceInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceInputError";
  }
}

const InputSchema = z
  .object({
    kind: z.string(),
    subjectRef: z.string(),
    source: z
      .object({
        namn: z.string(),
        hämtad: z.string().date(),
        // Bara http(s): en länk som visas för grundaren får aldrig vara javascript: eller data:.
        url: z
          .string()
          .url()
          .max(2000)
          .refine((url) => /^https?:\/\//i.test(url), "Länken måste börja med http:// eller https://.")
          .optional(),
      })
      .strict(),
    quote: z.string().optional(),
    stepNumber: z.number().int().min(1).max(12).optional(),
  })
  .strict();

type ValidInput = {
  kind: RecordEvidenceInput["kind"];
  subjectRef: string;
  sourceName: string;
  sourceUrl: string | null;
  fetchedAt: string;
  quote: string | null;
  stepNumber: number | null;
};

/** Kontrollerar indata. Exporterad för tester. */
export function validateRecordInput(raw: unknown, todayIso: string): ValidInput {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) throw new EvidenceInputError("Beviset saknar sort, sak, källa eller ett giltigt datum.");
  const input = parsed.data;

  if (!isEvidenceKind(input.kind)) throw new EvidenceInputError("Okänd bevissort.");
  if (!founderMayRecord(input.kind)) throw new EvidenceInputError("Den här sorten kan bara läggas in av systemet.");

  const subjectRef = cleanText(input.subjectRef, MAX_SUBJECT_REF + 1);
  if (!subjectRef || subjectRef.length > MAX_SUBJECT_REF) throw new EvidenceInputError("Vad beviset gäller saknas.");

  // Datalöftet: inget bevis utan källa och datum.
  const sourceName = cleanText(input.source.namn, MAX_SOURCE_NAME + 1);
  if (!sourceName || sourceName.length > MAX_SOURCE_NAME) throw new EvidenceInputError("Beviset saknar källa.");
  if (sourceName.startsWith(INTERNAL_SOURCE_PREFIX) && EVIDENCE_KINDS[input.kind].enteredBy !== "founder") {
    throw new EvidenceInputError("Källan får inte vara en av Sparks egna för den här sorten.");
  }
  // 7.3b: ett datum i framtiden skulle göra att beviset aldrig blev för gammalt.
  if (input.source.hämtad > todayIso) throw new EvidenceInputError("Datumet ligger i framtiden.");

  const quote = input.quote === undefined ? null : cleanText(input.quote, MAX_QUOTE) || null;

  return {
    kind: input.kind,
    subjectRef,
    sourceName,
    sourceUrl: input.source.url ?? null,
    fetchedAt: input.source.hämtad,
    quote,
    stepNumber: input.stepNumber ?? null,
  };
}

async function requireProject(): Promise<{ supabase: SupabaseClient; userId: string; projectId: string }> {
  const { supabase, userId } = await requireSupabaseUser();
  const projectId = await getActiveProjectId(supabase, userId);
  if (!projectId) throw new EmptyStateError(MODULE, DOC);
  return { supabase, userId, projectId };
}

/** Skriver en snapshot om totalen skiljer sig från den senaste (beslut B8)
 * och returnerar poängen med förändringen mot läget före händelsen.
 * Exporterad för Resans skrivväg (adapters/live/JourneyProgress.ts): ett
 * avklarat steg kan låsa upp delar och höja taket. Snapshots skrivs ändå bara
 * härifrån (lint-regeln för lib/server/scoreSnapshots). */
export async function settleScore(
  context: { supabase: SupabaseClient; userId: string; projectId: string },
  before: ComputedScore,
  locale: Locale,
  reasonKey: string,
): Promise<ScoreSnapshot> {
  const [after, latest] = await Promise.all([
    computeScore(context.supabase, context.userId, context.projectId, locale),
    readLatestSnapshot(context.supabase, context.userId, context.projectId),
  ]);
  const delta = after.snapshot.total - before.snapshot.total;
  const reasonText = translateDeltaReason(reasonKey, locale);

  if (latest === null || latest.total !== after.snapshot.total) {
    await writeScoreSnapshot({
      userId: context.userId,
      projectId: context.projectId,
      total: after.snapshot.total,
      phase: after.phase,
      delta,
      deltaReason: reasonKey,
    });
  }
  return withPrevious(after, { total: before.snapshot.total, deltaReason: reasonText });
}

export const liveEvidenceRecorder: EvidenceRecorder = {
  async recordEvidence(input: RecordEvidenceInput, locale: Locale): Promise<RecordEvidenceResult> {
    const valid = validateRecordInput(input, stockholmToday());
    const context = await requireProject();
    const before = await computeScore(context.supabase, context.userId, context.projectId, locale);

    const { data, error } = await context.supabase.rpc("record_evidence", {
      p_kind: valid.kind,
      p_subject_ref: valid.subjectRef,
      p_source_name: valid.sourceName,
      p_source_url: valid.sourceUrl,
      p_fetched_at: valid.fetchedAt,
      p_quote: valid.quote,
      p_step_number: valid.stepNumber,
      p_module: MODULE,
    });
    if (error) throw new EvidenceInputError(`Beviset kunde inte sparas (${error.message}).`);
    const result = (Array.isArray(data) ? data[0] : data) as { evidence_id: string; status: string } | undefined;
    if (!result || !["recorded", "duplicate", "replaced"].includes(result.status)) {
      throw new Error("Evidens och poäng: oväntat svar från record_evidence.");
    }
    const status = result.status as RecordEvidenceResult["status"];

    if (status === "duplicate") {
      return { status, evidenceId: result.evidence_id, snapshot: withPrevious(before, { total: before.snapshot.total }) };
    }

    const snapshot = await settleScore(context, before, locale, `${status}:${valid.kind}`);
    const copy = dictionaries[locale].evidence;
    await liveMemoryRepository.recordTraceEvent({
      module: MODULE,
      description: fill(copy.trace.recorded, { kind: copy.kinds[valid.kind], source: displaySourceName(valid.sourceName, locale) }),
      occurredAtIso: new Date().toISOString(),
    });
    return { status, evidenceId: result.evidence_id, snapshot };
  },

  async retractEvidence(evidenceId: string, reason: string, locale: Locale): Promise<ScoreSnapshot> {
    if (typeof evidenceId !== "string" || !UUID_PATTERN.test(evidenceId)) {
      throw new EvidenceInputError("Ogiltigt bevis-id.");
    }
    const cleanReason = typeof reason === "string" ? cleanText(reason, MAX_REASON) : "";
    if (!cleanReason) throw new EvidenceInputError("En anledning krävs för att återkalla ett bevis.");

    const context = await requireProject();
    const before = await computeScore(context.supabase, context.userId, context.projectId, locale);
    const row = before.rows.find((candidate) => candidate.id === evidenceId);
    // Bara egna, självinlagda och inte redan återkallade bevis (7.7). Databasen
    // kontrollerar samma sak i retract_evidence.
    if (!row || row.entered_by !== "founder" || row.retracted_at !== null || !isEvidenceKind(row.kind)) {
      throw new EvidenceInputError("Beviset finns inte eller kan inte återkallas.");
    }

    const { error } = await context.supabase.rpc("retract_evidence", { p_evidence_id: evidenceId, p_reason: cleanReason });
    if (error) throw new EvidenceInputError(`Beviset kunde inte återkallas (${error.message}).`);

    const snapshot = await settleScore(context, before, locale, `retracted:${row.kind}`);
    const copy = dictionaries[locale].evidence;
    await liveMemoryRepository.recordTraceEvent({
      module: MODULE,
      description: fill(copy.trace.retracted, { kind: copy.kinds[row.kind], reason: cleanReason }),
      occurredAtIso: new Date().toISOString(),
    });
    return snapshot;
  },

  async listEvidence(partId: ScorePartId, locale: Locale): Promise<EvidenceView[]> {
    if (!ALL_PART_IDS.includes(partId)) throw new EvidenceInputError("Okänd del.");
    const context = await requireProject();
    const computed = await computeScore(context.supabase, context.userId, context.projectId, locale);
    const copy = dictionaries[locale].evidence;

    // computed.rows är redan kontrollerade mot sorten av toPartEvidence, och
    // ordnade som calculateScore räknar dem.
    return computed.rows
      .filter((row) => isEvidenceKind(row.kind) && EVIDENCE_KINDS[row.kind].partId === partId)
      .sort((a, b) => (a.created_at === b.created_at ? (a.id < b.id ? -1 : 1) : a.created_at < b.created_at ? -1 : 1))
      .map((row): EvidenceView => {
        const stored = toStoredEvidence(row, locale);
        const kind = row.kind as RecordEvidenceInput["kind"];
        return {
          id: row.id,
          partId,
          kind,
          kindLabel: copy.kinds[kind],
          subjectRef: row.subject_ref,
          source: stored.source,
          quote: row.quote ?? undefined,
          enteredBy: row.entered_by,
          selfReported: isSelfReported(kind, row.entered_by),
          status: computed.status[row.id] ?? "counted",
          canRetract: row.entered_by === "founder" && row.retracted_at === null,
        };
      });
  },
};
