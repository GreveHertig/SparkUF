import type { Locale } from "@/i18n/context";
import type { SimulationProvider, Simulation } from "@/ports/SimulationProvider";

// Hiasynth (koncept, avsnitt 2.2) — ger aldrig poäng (7.4). Tre kanoniska
// simuleringar ur Saras scenario (9.3 steg 03, 04 och 06), valda på frågans
// innehåll. Inte en riktig modell — demot har bara de tre färdiga svaren.
const simulations: Record<"time" | "tolerance" | "price", Record<Locale, Omit<Simulation, "question">>> = {
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
  // Steg 04: förhandstips om betalningstolerans, innan ett enda kundsamtal är
  // fört — foreshadowar segmentbytet i steg 06 (7.4: simuleringar ger
  // riktning, aldrig poäng; bara riktiga kundsvar kan bekräfta det).
  tolerance: {
    sv: {
      populationSize: 215,
      source: { namn: "Hiasynth (koncept)", hämtad: "2026-01-12" },
      result: "5–9 anställda: ~600–900 kr/mån. 10–20 anställda: ~1 000–1 400 kr/mån.",
      uncertaintyRangeLabel: "Osäkerhet ±15 %",
    },
    en: {
      populationSize: 215,
      source: { namn: "Hiasynth (concept)", hämtad: "2026-01-12" },
      result: "5–9 employees: ~SEK 600–900/month. 10–20 employees: ~SEK 1,000–1,400/month.",
      uncertaintyRangeLabel: "Uncertainty ±15%",
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

function kindFor(question: string): "time" | "tolerance" | "price" {
  if (/pris|price/i.test(question)) return "price";
  if (/betal|willingness|tolerance/i.test(question)) return "tolerance";
  return "time";
}

export const demoSimulationProvider: SimulationProvider = {
  async simulate(question: string, locale: Locale) {
    return { question, ...simulations[kindFor(question)][locale] };
  },
};

/** Färdigformulerade, lokaliserade frågor för de tre kanoniska simuleringarna
 * — en enda källa så att anropande sidor (Marknad, Kunder, Resan/[steg])
 * aldrig hårdkodar en svensk fråga bakom en engelsk yta. */
export const simulationQuestions: Record<"time" | "tolerance" | "price", Record<Locale, string>> = {
  time: {
    sv: "Hur mycket tid går åt till underlagsjakt per anställd och månad?",
    en: "How much time goes into chasing paperwork per employee per month?",
  },
  tolerance: {
    sv: "Hur mycket skulle olika stora byråer kunna tänkas betala?",
    en: "How much might firms of different sizes be willing to pay?",
  },
  price: {
    sv: "Vilket pris stöder priskänsligheten i det nya segmentet?",
    en: "What price does the price sensitivity in the new segment support?",
  },
};
