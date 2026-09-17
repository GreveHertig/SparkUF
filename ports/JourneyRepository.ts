import type { Locale } from "@/i18n/context";
import type { NextStep, SinceLastTime } from "@/core/domain";

export type JourneySummary = {
  todayIso: string;
  nextStep: NextStep;
  sinceLastTime: SinceLastTime;
};

/**
 * Modul: Resan (avsnitt 14.3). Liveadapter bygger på Supabase.
 * `locale` styr vilket språk den fritext som ingår (t.ex. "why") kommer på.
 */
export interface JourneyRepository {
  getHomeSummary(locale: Locale): Promise<JourneySummary>;
}
