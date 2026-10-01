import type { PulseProvider } from "@/ports/PulseProvider";
import type { Locale } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import { useDemoStore } from "./demoStore";
import { exampleSource } from "./exampleSource";
import { findBeatIndexById } from "./sara";

/** En signal utan källa. Källan sätts när signalen lämnas ut: signalerna är
 * påhittade, så den är alltid en exempelkälla för steget där signalen dyker
 * upp ("Påhittad data, steg 03", PR 11), aldrig en myndighet (steg 6). */
type SignalText = Omit<PulseSignal, "source">;

function withSource(signal: SignalText, locale: Locale, step: number): PulseSignal {
  return { ...signal, source: exampleSource(locale, { step }) };
}

/** 9.5: 3–5 signaler, alla med (exempel)källa, tid och en mening om varför de spelar
 * roll för just Sara. Tre är synliga från start; två låses successivt upp i
 * takt med resan (avsnitt 9.1: "efter"-momentet ger nya pulssignaler) — se
 * REVEAL_AFTER_BEAT_ID. `getSignals` returnerar därför alltid 3–5 signaler,
 * aldrig färre (ports/PulseProvider.contract.test.ts). */
const baseSignal: Record<Locale, SignalText> = {
  sv: {
    category: "Marknad",
    headline: "14 nya redovisningsbyråer registrerade i Stockholms län senaste kvartalet",
    whyItMatters: "Fler byråer i ditt starkaste område betyder fler potentiella kunder till Kvittojakten.",
    timestamp: "Uppdaterad 06:00",
  },
  en: {
    category: "Market",
    headline: "14 new accounting firms registered in the Stockholm region last quarter",
    whyItMatters: "More firms in your strongest region means more potential customers for Kvittojakten.",
    timestamp: "Updated 06:00",
  },
};

const fundingSignal: Record<Locale, SignalText> = {
  sv: {
    category: "Konkurrens",
    headline: "Fiktiva ByråFlöde tar in 4 Mkr i en såddrunda",
    whyItMatters: "En konkurrent rustar för att expandera mot samma kundgrupp — ett skäl att röra sig snabbt.",
    timestamp: "3 dagar sedan",
  },
  en: {
    category: "Competition",
    headline: "Fictional ByråFlöde raises SEK 4M in a seed round",
    whyItMatters: "A competitor is gearing up to expand toward the same customer group — a reason to move fast.",
    timestamp: "3 days ago",
  },
};

const regulationSignal: Record<Locale, SignalText> = {
  sv: {
    category: "Bransch",
    headline: "Fler byråer efterfrågar digital arkivering av kvitton och underlag",
    whyItMatters: "Byråer behöver bättre digitala flöden för kvitton och underlag — stärker argumentet för Kvittojakten.",
    timestamp: "1 vecka sedan",
  },
  en: {
    category: "Industry",
    headline: "More accounting firms ask for digital record-keeping of receipts",
    whyItMatters: "Firms need better digital flows for receipts and records — strengthens the case for Kvittojakten.",
    timestamp: "1 week ago",
  },
};

// Låses upp efter 03-marknaden-efter (avsnitt 9.1: "nya pulssignaler" hör
// till "efter"-momentet) — samma riktning som marknadsbilden i steg 03.
const registryGrowthSignal: Record<Locale, SignalText> = {
  sv: {
    category: "Marknad",
    headline: "22 % fler nya enskilda firmor i Stockholms län senaste året",
    whyItMatters: "Fler småföretagare betyder fler kunder åt de redovisningsbyråer Kvittojakten riktar sig till.",
    timestamp: "2 veckor sedan",
  },
  en: {
    category: "Market",
    headline: "22% more new sole proprietorships in the Stockholm region over the past year",
    whyItMatters: "More small businesses means more potential customers for the accounting firms Kvittojakten targets.",
    timestamp: "2 weeks ago",
  },
};

// Låses upp efter 06-domen-efter — pekar på samma segment som Domen (10–20
// anställda, steg 06). Signalen är påhittad och påstår inget om vad ett
// register eller en myndighet har sagt (steg 6, docs/status.md "PR 6: Pulsen").
const segmentValidationSignal: Record<Locale, SignalText> = {
  sv: {
    category: "Marknad",
    headline: "Byråer med 10–20 anställda växer snabbare än branschsnittet",
    whyItMatters: "Fler tecken pekar på samma segment som Domen — inte bara Saras egen simulering.",
    timestamp: "4 dagar sedan",
  },
  en: {
    category: "Market",
    headline: "Firms with 10–20 employees are growing faster than the industry average",
    whyItMatters: "More signs point to the segment the verdict picked — not just Sara's own simulation.",
    timestamp: "4 days ago",
  },
};

function isRevealed(beatId: string, beatIndex: number): boolean {
  const revealIndex = findBeatIndexById(beatId);
  return revealIndex !== -1 && beatIndex >= revealIndex;
}

/**
 * Signalerna med steget där de dyker upp i scenariot, i samma ordning som
 * `getSignals`. Exempelkällan i `getSignals` bygger på samma steg. Demots
 * rutt-filer (Pulsen och Hem) använder stegen för att sätta datatypen.
 */
export function getSignalSteps(): number[] {
  const { beatIndex, entry } = useDemoStore.getState();
  if (entry === "hasIdea") return [];
  const steps = [1, 1, 1];
  if (isRevealed("03-marknaden-efter", beatIndex)) steps.unshift(3);
  if (isRevealed("06-domen-efter", beatIndex)) steps.unshift(6);
  return steps;
}

export const demoPulseProvider: PulseProvider = {
  // Saras signaler bara — porten tillåter inte ett tomt/null-svar här, så
  // Jonas-läget hanteras i stället av anroparen (demots Hem,
  // app/demo/(app)/page.tsx), som aldrig anropar den här metoden för Jonas.
  async getTodaysSignal(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    if (isRevealed("06-domen-efter", beatIndex)) return withSource(segmentValidationSignal[locale], locale, 6);
    if (isRevealed("03-marknaden-efter", beatIndex)) return withSource(registryGrowthSignal[locale], locale, 3);
    return withSource(baseSignal[locale], locale, 1);
  },

  async getSignals(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    // Ingen pulssignal är byggd för Jonas (persona B) — docs/status.md,
    // "Jonas hela resan": hitta inte på signaler, visa ett ärligt tomt läge
    // i stället (screens/Pulse.tsx renderar t.pulsePage.emptyState).
    if (entry === "hasIdea") return [];
    const signals = [baseSignal, fundingSignal, regulationSignal];
    if (isRevealed("03-marknaden-efter", beatIndex)) signals.unshift(registryGrowthSignal);
    if (isRevealed("06-domen-efter", beatIndex)) signals.unshift(segmentValidationSignal);
    const steps = getSignalSteps();
    return signals.map((signal, index) => withSource(signal[locale], locale, steps[index]));
  },
};
