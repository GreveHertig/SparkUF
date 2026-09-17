import type { SimulationProvider } from "@/ports/SimulationProvider";

// Ingen skärm använder den här porten än — Hiasynth-simuleringarna (avsnitt 2.2) byggs i Session 3.
export const demoSimulationProvider: SimulationProvider = {
  async simulate(question) {
    return {
      question,
      populationSize: 0,
      sources: ["Hiasynth (koncept)"],
      result: "Simuleringar för det här scenariot byggs i Session 3.",
      uncertaintyRangeLabel: "okänt",
    };
  },
};
