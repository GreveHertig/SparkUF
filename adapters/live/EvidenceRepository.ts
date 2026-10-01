import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import { EmptyStateError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { getActiveProjectId } from "@/lib/server/activeProject";
import { computeScore, previousFromLatest, readLatestSnapshot, withPrevious } from "./evidenceScore";

/**
 * Modul: Evidens och poäng. KÄRNREGELN (docs/moduler/evidens-och-poang.md):
 * den här adaptern räknar ALDRIG poäng själv — den hämtar rader ur
 * `evidence`/`journey_steps`/`score_snapshots` och skickar dem genom
 * toPartEvidence (core/evidenceInput.ts) och calculateScore (core/score.ts)
 * via den delade läsvägen i ./evidenceScore.ts, som skrivvägen
 * (./EvidenceRecorder.ts) också använder.
 */

const DOC = "docs/moduler/evidens-och-poang.md";

export const liveEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot(locale: Locale): Promise<ScoreSnapshot> {
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    if (!projectId) throw new EmptyStateError("Evidens och poäng", DOC);

    const [computed, latest] = await Promise.all([
      computeScore(supabase, userId, projectId, locale),
      readLatestSnapshot(supabase, userId, projectId),
    ]);
    // Inget bevis samlat än — ett giltigt tomt tillstånd för ett nytt konto.
    // En upplåst del utan bevis när andra bevis finns är något annat: den
    // visas som en lucka av calculateScore (beslut B4), aldrig som ett fel.
    if (computed.rows.length === 0) throw new EmptyStateError("Evidens och poäng", DOC);

    const hasStale = Object.values(computed.status).includes("stale");
    // Fel 3 (docs/bevislagring.md 3.4): förändringen jämförs mot rätt
    // tidigare värde, se previousFromLatest.
    return withPrevious(computed, previousFromLatest(computed.snapshot.total, latest, hasStale, locale));
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
