// ORDAGRANN KOPIA av signaldatan i adapters/demo/PulseProvider.ts
// (baseSignal … segmentValidationSignal). Kopierad eftersom
// demoPulseProvider bara kan läsas via det riktiga demots delade läge
// (useDemoStore), och /experiment/fri/demo har ett eget läge för att aldrig
// påverka det riktiga demot. Ändra inte här — ändras källan, kopiera om.
import type { Locale } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import type { OnboardingEntry } from "@/core/domain";
import { findBeatIndexById } from "@/adapters/demo/sara";

const baseSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Marknad",
    headline: "14 nya redovisningsbyråer registrerade i Stockholms län senaste kvartalet",
    whyItMatters: "Fler byråer i ditt starkaste område betyder fler potentiella kunder till Kvittojakten.",
    timestamp: "Uppdaterad 06:00",
    source: { namn: "Bolagsverket", hämtad: "2026-09-17" },
  },
  en: {
    category: "Market",
    headline: "14 new accounting firms registered in the Stockholm region last quarter",
    whyItMatters: "More firms in your strongest region means more potential customers for Kvittojakten.",
    timestamp: "Updated 06:00",
    source: { namn: "Bolagsverket", hämtad: "2026-09-17" },
  },
};

const fundingSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Konkurrens",
    headline: "Fiktiva ByråFlöde tar in 4 Mkr i en såddrunda",
    whyItMatters: "En konkurrent rustar för att expandera mot samma kundgrupp — ett skäl att röra sig snabbt.",
    timestamp: "3 dagar sedan",
    source: { namn: "Fiktiv branschtidning", hämtad: "2026-09-14" },
  },
  en: {
    category: "Competition",
    headline: "Fictional ByråFlöde raises SEK 4M in a seed round",
    whyItMatters: "A competitor is gearing up to expand toward the same customer group — a reason to move fast.",
    timestamp: "3 days ago",
    source: { namn: "Fictional trade press", hämtad: "2026-09-14" },
  },
};

const regulationSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Reglering",
    headline: "Skatteverket skärper kraven på digital arkivering av underlag",
    whyItMatters: "Byråer behöver bättre digitala flöden för kvitton och underlag — stärker argumentet för Kvittojakten.",
    timestamp: "1 vecka sedan",
    source: { namn: "Skatteverket", hämtad: "2026-09-10" },
  },
  en: {
    category: "Regulation",
    headline: "Skatteverket tightens requirements for digital record-keeping",
    whyItMatters: "Firms need better digital flows for receipts and records — strengthens the case for Kvittojakten.",
    timestamp: "1 week ago",
    source: { namn: "Skatteverket", hämtad: "2026-09-10" },
  },
};

// Låses upp efter 03-marknaden-efter (avsnitt 9.1: "nya pulssignaler" hör
// till "efter"-momentet) — bekräftar registerbilden som just hämtades.
const registryGrowthSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Marknad",
    headline: "22 % fler nya enskilda firmor i Stockholms län senaste året",
    whyItMatters: "Fler småföretagare betyder fler kunder åt de redovisningsbyråer Kvittojakten riktar sig till.",
    timestamp: "2 veckor sedan",
    source: { namn: "Bolagsverket", hämtad: "2026-09-03" },
  },
  en: {
    category: "Market",
    headline: "22% more new sole proprietorships in the Stockholm region over the past year",
    whyItMatters: "More small businesses means more potential customers for the accounting firms Kvittojakten targets.",
    timestamp: "2 weeks ago",
    source: { namn: "Bolagsverket", hämtad: "2026-09-03" },
  },
};

// Låses upp efter 06-domen-efter — bekräftar utifrån att segmentbytet till
// 10–20 anställda (Domen, steg 06) redan syns i registret, inte bara i
// Saras egen simulering.
const segmentValidationSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Marknad",
    headline: "Byråer med 10–20 anställda växer snabbare än branschsnittet",
    whyItMatters: "Registret bekräftar precis det segment Domen pekade ut — inte bara Saras egen simulering.",
    timestamp: "4 dagar sedan",
    source: { namn: "Bolagsverket", hämtad: "2026-09-19" },
  },
  en: {
    category: "Market",
    headline: "Firms with 10–20 employees are growing faster than the industry average",
    whyItMatters: "The registry confirms exactly the segment the verdict pointed to — not just Sara's own simulation.",
    timestamp: "4 days ago",
    source: { namn: "Bolagsverket", hämtad: "2026-09-19" },
  },
};

function isRevealed(beatId: string, beatIndex: number): boolean {
  const revealIndex = findBeatIndexById(beatId);
  return revealIndex !== -1 && beatIndex >= revealIndex;
}

/** Samma urval som demoPulseProvider.getSignals, men för ett givet moment. */
export function pulseSignalsFor(entry: OnboardingEntry, beatIndex: number, locale: Locale): PulseSignal[] {
    // Ingen pulssignal är byggd för Jonas (persona B) — docs/status.md,
    // "Jonas hela resan": hitta inte på signaler, visa ett ärligt tomt läge
    // i stället (screens/Pulse.tsx renderar t.pulsePage.emptyState).
    if (entry === "hasIdea") return [];
    const signals = [baseSignal, fundingSignal, regulationSignal];
    if (isRevealed("03-marknaden-efter", beatIndex)) signals.unshift(registryGrowthSignal);
    if (isRevealed("06-domen-efter", beatIndex)) signals.unshift(segmentValidationSignal);
    return signals.map((signal) => signal[locale]);
}
