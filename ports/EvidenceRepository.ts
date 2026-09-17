import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";

/**
 * Modul: Evidens och poäng (avsnitt 14.3). `calculateScore` (`core/`, Session 2)
 * räknar poängen — den här porten hämtar underlaget den räknas ifrån.
 * Liveadapter bygger på Supabase.
 */
export interface EvidenceRepository {
  getScoreSnapshot(locale: Locale): Promise<ScoreSnapshot>;
}
