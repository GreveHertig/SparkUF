import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";

export type Simulation = {
  question: string;
  populationSize: number;
  source: Källa;
  result: string;
  uncertaintyRangeLabel: string;
};

/**
 * Modul: Simuleringar (avsnitt 14.3, 2.2). Liveadapter bygger på Hiasynth
 * (koncept, alltid stub) — ger aldrig poäng, se avsnitt 7.4. `locale` styr
 * språket på `result`, samma mönster som övriga portar med fritext
 * (docs/arkitektur.md avsnitt 7).
 */
export interface SimulationProvider {
  simulate(question: string, locale: Locale): Promise<Simulation>;
}
