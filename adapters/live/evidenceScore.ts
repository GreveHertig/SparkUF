import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/i18n/context";
import type { Källa, ScoreSnapshot } from "@/core/domain";
import { calculateScore, type PartEvidence, type PhaseId } from "@/core/score";
import { scorePhaseForCompletedSteps } from "@/core/journey";
import { toPartEvidence, type EvidenceStatus, type StoredEvidence } from "@/core/evidenceInput";
import { isEvidenceKind } from "@/core/evidenceKinds";
import { fill } from "@/i18n/fill";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

/**
 * Den delade läsvägen för poängen i live: rader ur Supabase →
 * toPartEvidence (core/evidenceInput.ts) → calculateScore (core/score.ts).
 * Används av adapters/live/EvidenceRepository.ts (läsning) och
 * adapters/live/EvidenceRecorder.ts (poängen före och efter en skrivning),
 * så att båda räknar exakt likadant. Räknar ALDRIG poäng själv.
 */

const dictionaries = { sv, en };

/** Prefixet för Sparks egna källor, lagrade som nyckel (docs/bevislagring.md 7.12). */
export const INTERNAL_SOURCE_PREFIX = "spark:";

export type EvidenceRow = {
  id: string;
  kind: string;
  part_id: string;
  points: number | string;
  contradicts: boolean;
  data_type: string;
  source_name: string;
  source_url: string | null;
  fetched_at: string;
  quote: string | null;
  entered_by: "founder" | "system";
  created_at: string;
  retracted_at: string | null;
};

const EVIDENCE_COLUMNS =
  "id, kind, part_id, points, contradicts, data_type, source_name, source_url, fetched_at, quote, entered_by, created_at, retracted_at";

export async function readEvidenceRows(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<EvidenceRow[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select(EVIDENCE_COLUMNS)
    .eq("user_id", userId)
    .eq("project_id", projectId)
    // Ordningen styr avtagande värde-trappan. toPartEvidence sorterar också
    // själv, så att ordningen aldrig hänger på svarets radordning.
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(`Evidens och poäng: kunde inte läsa bevisen (${error.message}).`);
  return (data ?? []) as EvidenceRow[];
}

/** Källans namn som det ska visas. Sparks egna källor lagras som nyckel. */
export function displaySourceName(sourceName: string, locale: Locale): string {
  if (!sourceName.startsWith(INTERNAL_SOURCE_PREFIX)) return sourceName;
  const key = sourceName.slice(INTERNAL_SOURCE_PREFIX.length);
  const internal = dictionaries[locale].evidence.internalSources;
  return Object.hasOwn(internal, key) ? internal[key as keyof typeof internal] : sourceName;
}

export function toStoredEvidence(row: EvidenceRow, locale: Locale): StoredEvidence {
  const source: Källa = {
    namn: displaySourceName(row.source_name, locale),
    hämtad: row.fetched_at,
    url: row.source_url ?? undefined,
  };
  return {
    id: row.id,
    kind: row.kind,
    partId: row.part_id,
    dataType: row.data_type,
    contradicts: row.contradicts,
    // numeric kommer som text från PostgREST.
    points: Number(row.points),
    enteredBy: row.entered_by,
    source,
    createdAtIso: row.created_at,
    retractedAtIso: row.retracted_at,
  };
}

export async function readCompletedStepNumbers(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<number[]> {
  const { data, error } = await supabase
    .from("journey_steps")
    .select("step_number, completed_at")
    .eq("user_id", userId)
    .eq("project_id", projectId);
  if (error) throw new Error(`Evidens och poäng: kunde inte läsa resans framsteg (${error.message}).`);
  return ((data ?? []) as { step_number: number; completed_at: string | null }[])
    .filter((row) => row.completed_at !== null)
    .map((row) => row.step_number);
}

export type LatestSnapshot = { total: number; delta: number; delta_reason: string };

export async function readLatestSnapshot(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<LatestSnapshot | null> {
  const { data, error } = await supabase
    .from("score_snapshots")
    .select("total, delta, delta_reason")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Evidens och poäng: kunde inte läsa poänghistoriken (${error.message}).`);
  if (!data) return null;
  const row = data as { total: number; delta?: number | null; delta_reason?: string | null };
  return { total: row.total, delta: row.delta ?? 0, delta_reason: row.delta_reason ?? "" };
}

/** Dagens datum i svensk tid (Vercel kör i UTC). Föråldringen räknas mot det. */
export function stockholmToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(now);
}

/** Orsaksnyckeln i score_snapshots.delta_reason ("recorded:profileFitAnswer")
 * som text. En okänd nyckel visas inte alls, hellre än som rå nyckel. */
export function translateDeltaReason(key: string, locale: Locale): string {
  const copy = dictionaries[locale].evidence;
  const [reason, kind] = key.split(":");
  if (reason === "stale" || reason === "recalculated") return copy.deltaReason[reason];
  if ((reason === "recorded" || reason === "replaced" || reason === "retracted") && isEvidenceKind(kind)) {
    return fill(copy.deltaReason[reason], { kind: copy.kinds[kind] });
  }
  return "";
}

export type ComputedScore = {
  snapshot: ScoreSnapshot;
  phase: PhaseId;
  parts: PartEvidence[];
  status: Record<string, EvidenceStatus>;
  rows: EvidenceRow[];
};

/** Räknar poängen ur projektets alla bevis just nu, utan förändring
 * (previousTotal = totalen). Förändringen sätts med `withPrevious`. */
export async function computeScore(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  locale: Locale,
): Promise<ComputedScore> {
  const [rows, completedStepNumbers] = await Promise.all([
    readEvidenceRows(supabase, userId, projectId),
    readCompletedStepNumbers(supabase, userId, projectId),
  ]);
  const phase = scorePhaseForCompletedSteps(completedStepNumbers);
  const { parts, status } = toPartEvidence(
    rows.map((row) => toStoredEvidence(row, locale)),
    stockholmToday(),
    dictionaries[locale].score.parts,
  );
  const snapshot = calculateScore({ phase, parts, calculatedAtIso: new Date().toISOString() });
  return { snapshot, phase, parts, status, rows };
}

/** Samma underlag genom calculateScore igen, nu med förändringen. Totalen
 * blir densamma: previousTotal styr bara förändringen som visas. */
export function withPrevious(computed: ComputedScore, previous: { total?: number; deltaReason?: string }): ScoreSnapshot {
  return calculateScore({
    phase: computed.phase,
    parts: computed.parts,
    previousTotal: previous.total,
    deltaReason: previous.deltaReason,
    calculatedAtIso: computed.snapshot.calculatedAtIso,
  });
}

/**
 * Rättelsen av fel 3 (docs/bevislagring.md 3.4). Förut blev previousTotal den
 * senaste snapshottens total, och eftersom en snapshot skrivs när totalen
 * ändras var förändringen då alltid 0. Nu bär varje snapshot sin egen
 * förändring: stämmer totalen fortfarande med den senaste snapshotten visas
 * dess förändring och orsak. Har totalen ändrats sedan dess (ett bevis har
 * blivit för gammalt, eller en ny fas har låsts upp) jämförs mot den.
 */
export function previousFromLatest(
  currentTotal: number,
  latest: LatestSnapshot | null,
  hasStaleEvidence: boolean,
  locale: Locale,
): { total?: number; deltaReason?: string } {
  if (!latest) return {};
  if (latest.total === currentTotal) {
    return { total: latest.total - latest.delta, deltaReason: translateDeltaReason(latest.delta_reason, locale) };
  }
  const reason = currentTotal < latest.total && hasStaleEvidence ? "stale" : "recalculated";
  return { total: latest.total, deltaReason: translateDeltaReason(reason, locale) };
}
