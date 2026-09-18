import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import { ALL_PART_IDS, calculateScore, type EvidenceItem, type PartEvidence, type ScoreSuggestion } from "@/core/score";
import { deriveCurrentStepNumber, scorePhaseForStep } from "@/core/journey";
import { EmptyStateError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

/**
 * Modul: Evidens och poäng. KÄRNREGELN (docs/moduler/evidens-och-poang.md):
 * den här adaptern räknar ALDRIG poäng själv — den hämtar rader ur
 * `evidence`/`journey_steps`/`score_snapshots` och skickar dem genom
 * calculateScore (core/score.ts), exakt som adapters/demo/EvidenceRepository.ts
 * gör mot adapters/demo/sara.ts's beats.
 */

const DOC = "docs/moduler/evidens-och-poang.md";
const dictionaries = { sv, en };

type EvidenceRow = {
  part_id: string;
  points: number;
  contradicts: boolean;
  data_type: string;
  source_name: string;
  source_url: string | null;
  fetched_at: string;
};

async function getActiveProjectId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Evidens och poäng: kunde inte läsa projektet (${error.message}).`);
  return data ? (data.id as string) : null;
}

async function getEvidenceRows(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<EvidenceRow[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select("part_id, points, contradicts, data_type, source_name, source_url, fetched_at")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    // Ordningen är signifikant — den styr avtagande värde-trappan i
    // calculateScore (item 1-10 fullt värde, 11-19 · 0.25, 20+ · 0.05).
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw new Error(`Evidens och poäng: kunde inte läsa bevisen (${error.message}).`);
  return (data ?? []) as EvidenceRow[];
}

function buildPartEvidence(rows: EvidenceRow[], locale: Locale): PartEvidence[] {
  const labels = dictionaries[locale].score.parts;
  return ALL_PART_IDS.map((partId) => ({
    partId,
    label: labels[partId],
    items: rows
      .filter((row) => row.part_id === partId)
      .map(
        (row): EvidenceItem => ({
          points: row.points,
          contradicts: row.contradicts,
          dataType: row.data_type as EvidenceItem["dataType"],
          source: { namn: row.source_name, hämtad: row.fetched_at, url: row.source_url ?? undefined },
        }),
      ),
  }));
}

async function getCompletedStepNumbers(
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

async function getLatestSnapshot(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
): Promise<{ total: number; delta_reason: string } | null> {
  const { data, error } = await supabase
    .from("score_snapshots")
    .select("total, delta_reason")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Evidens och poäng: kunde inte läsa poänghistoriken (${error.message}).`);
  return data as { total: number; delta_reason: string } | null;
}

export const liveEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot(locale: Locale): Promise<ScoreSnapshot> {
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    if (!projectId) throw new EmptyStateError("Evidens och poäng", DOC);

    const rows = await getEvidenceRows(supabase, userId, projectId);
    // Inget bevis samlat än — ett giltigt tomt tillstånd för ett nytt konto,
    // inte samma sak som calculateScores egna fel (en upplåst del utan
    // bevis, 7.4) som gäller ETT SPECIFIKT läge (delvis, trasigt underlag)
    // och som ska synas som ett riktigt fel, inte som "Kommer snart".
    if (rows.length === 0) throw new EmptyStateError("Evidens och poäng", DOC);

    const [completedStepNumbers, previous] = await Promise.all([
      getCompletedStepNumbers(supabase, userId, projectId),
      getLatestSnapshot(supabase, userId, projectId),
    ]);
    const phase = scorePhaseForStep(deriveCurrentStepNumber(completedStepNumbers));

    return calculateScore({
      phase,
      parts: buildPartEvidence(rows, locale),
      previousTotal: previous?.total,
      deltaReason: previous?.delta_reason,
      calculatedAtIso: new Date().toISOString(),
    });
  },

  // "Höj din poäng" (7.6) kräver riktig förslagstext (förklaring, uppskattad
  // tid) per lucka — precis som demots saraSuggestionCandidates är det
  // skrivet produktinnehåll, inte något som mekaniskt kan härledas ur
  // rådata utan att uppfinna siffror och påståenden (CLAUDE.md: ingen
  // påhittad data). Ingen skärm i /app använder den här metoden än
  // (docs/moduler/evidens-och-poang.md) — returnerar en tom lista tills det
  // innehållet faktiskt skrivs, i stället för att gissa. Kontraktet
  // (ports/EvidenceRepository.contract.test.ts) kräver bara en array.
  async getSuggestions(): Promise<ScoreSuggestion[]> {
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    if (!projectId) throw new EmptyStateError("Evidens och poäng", DOC);
    return [];
  },

  async getScoreHistory(): Promise<number[]> {
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    if (!projectId) return [];

    const { data, error } = await supabase
      .from("score_snapshots")
      .select("total")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("calculated_at", { ascending: true });
    if (error) throw new Error(`Evidens och poäng: kunde inte läsa poänghistoriken (${error.message}).`);
    // Tom historik är giltig (KpiTile ritar ingen sparkline på en tom
    // serie) — aldrig en påhittad punkt (designuppdateringen, docs/status.md).
    return ((data ?? []) as { total: number }[]).map((row) => row.total);
  },
};
