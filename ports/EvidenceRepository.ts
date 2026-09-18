import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";

/**
 * Modul: Evidens och poäng (avsnitt 14.3). `calculateScore` (`core/`, Session 2)
 * räknar poängen — den här porten hämtar underlaget den räknas ifrån.
 * Liveadapter bygger på Supabase.
 */
export interface EvidenceRepository {
  getScoreSnapshot(locale: Locale): Promise<ScoreSnapshot>;
  /** "Höj din poäng" (7.6) — härledd med `deriveSuggestions` (core/score.ts),
   * sorterad efter poäng per minut, låsta delar redan bortfiltrerade. */
  getSuggestions(locale: Locale): Promise<ScoreSuggestion[]>;
}
