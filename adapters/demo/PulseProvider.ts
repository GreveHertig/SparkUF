import type { PulseProvider } from "@/ports/PulseProvider";
import type { Locale } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import { saraPulseSignal } from "./sara";

/** 9.5: 3–5 signaler per fas, alla med källa, tid och en mening om varför de
 * spelar roll för just Sara. Nyast först. */
const saraPulseSignals: Record<Locale, PulseSignal[]> = {
  sv: [
    saraPulseSignal.sv,
    {
      category: "Konkurrens",
      headline: "Fiktiva ByråFlöde tar in 4 Mkr i en såddrunda",
      whyItMatters: "En konkurrent rustar för att expandera mot samma kundgrupp — ett skäl att röra sig snabbt.",
      timestamp: "3 dagar sedan",
      source: { namn: "Fiktiv branschtidning", hämtad: "2026-09-14" },
    },
    {
      category: "Reglering",
      headline: "Skatteverket skärper kraven på digital arkivering av underlag",
      whyItMatters: "Byråer behöver bättre digitala flöden för kvitton och underlag — stärker argumentet för Kvittojakten.",
      timestamp: "1 vecka sedan",
      source: { namn: "Skatteverket", hämtad: "2026-09-10" },
    },
    {
      category: "Marknad",
      headline: "22 % fler nya enskilda firmor i Stockholms län senaste året",
      whyItMatters: "Fler småföretagare betyder fler kunder åt de redovisningsbyråer Kvittojakten riktar sig till.",
      timestamp: "2 veckor sedan",
      source: { namn: "Bolagsverket", hämtad: "2026-09-03" },
    },
  ],
  en: [
    saraPulseSignal.en,
    {
      category: "Competition",
      headline: "Fictional ByråFlöde raises SEK 4M in a seed round",
      whyItMatters: "A competitor is gearing up to expand toward the same customer group — a reason to move fast.",
      timestamp: "3 days ago",
      source: { namn: "Fictional trade press", hämtad: "2026-09-14" },
    },
    {
      category: "Regulation",
      headline: "Skatteverket tightens requirements for digital record-keeping",
      whyItMatters: "Firms need better digital flows for receipts and records — strengthens the case for Kvittojakten.",
      timestamp: "1 week ago",
      source: { namn: "Skatteverket", hämtad: "2026-09-10" },
    },
    {
      category: "Market",
      headline: "22% more new sole proprietorships in the Stockholm region over the past year",
      whyItMatters: "More small businesses means more potential customers for the accounting firms Kvittojakten targets.",
      timestamp: "2 weeks ago",
      source: { namn: "Bolagsverket", hämtad: "2026-09-03" },
    },
  ],
};

export const demoPulseProvider: PulseProvider = {
  async getTodaysSignal(locale: Locale) {
    return saraPulseSignal[locale];
  },
  async getSignals(locale: Locale) {
    return saraPulseSignals[locale];
  },
};
