export type Simulation = {
  question: string;
  populationSize: number;
  sources: string[];
  result: string;
  uncertaintyRangeLabel: string;
};

/**
 * Modul: Simuleringar (avsnitt 14.3, 2.2). Liveadapter bygger på Hiasynth
 * (koncept, alltid stub) — ger aldrig poäng, se avsnitt 7.4.
 */
export interface SimulationProvider {
  simulate(question: string): Promise<Simulation>;
}
