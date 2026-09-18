import type { Locale } from "@/i18n/context";
import type { SimulationProvider, Simulation } from "@/ports/SimulationProvider";

// Hiasynth (koncept, avsnitt 2.2) — ger aldrig poäng (7.4). Två kanoniska
// simuleringar ur Saras scenario (9.3 steg 03 och 06), valda på frågans
// innehåll. Inte en riktig modell — demot har bara de två färdiga svaren.
const simulations: Record<"time" | "price", Record<Locale, Omit<Simulation, "question">>> = {
  time: {
    sv: {
      populationSize: 312,
      source: { namn: "Hiasynth (koncept)", hämtad: "2026-01-09" },
      result: "~6,5 timmar per anställd och månad går åt till att jaga kvitton och underlag.",
      uncertaintyRangeLabel: "Intervall 4–9 timmar",
    },
    en: {
      populationSize: 312,
      source: { namn: "Hiasynth (concept)", hämtad: "2026-01-09" },
      result: "~6.5 hours per employee per month go to chasing receipts and paperwork.",
      uncertaintyRangeLabel: "Range 4–9 hours",
    },
  },
  price: {
    sv: {
      populationSize: 96,
      source: { namn: "Hiasynth (koncept)", hämtad: "2026-01-23" },
      result: "1 000–1 300 kr/mån stöds av priskänsligheten i det smalare segmentet.",
      uncertaintyRangeLabel: "Intervall 1 000–1 300 kr",
    },
    en: {
      populationSize: 96,
      source: { namn: "Hiasynth (concept)", hämtad: "2026-01-23" },
      result: "SEK 1,000–1,300/month is supported by the price sensitivity in the narrower segment.",
      uncertaintyRangeLabel: "Range SEK 1,000–1,300",
    },
  },
};

export const demoSimulationProvider: SimulationProvider = {
  async simulate(question: string, locale: Locale) {
    const kind = /pris|price/i.test(question) ? "price" : "time";
    return { question, ...simulations[kind][locale] };
  },
};
