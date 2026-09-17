// Minimalt testscenario för Session 2 — bevisar att demomotorn och
// calculateScore (core/score.ts) hänger ihop: poäng och NextStepCard ändras
// när demoraden klickas framåt/bakåt. INTE Saras eller Jonas riktiga
// scenario — se docs/uppdrag.md 9.3/9.4. Session 3 bygger
// adapters/demo/sara.ts ut till alla 12 steg och den här filen kan då
// försvinna eller bli en av flera scenarier.
import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { Dictionary } from "@/i18n/dictionary";
import type { NextStep, SinceLastTime, ScoreSnapshot, Källa } from "@/core/domain";
import type { JourneySummary } from "@/ports/JourneyRepository";
import { calculateScore, type PartEvidence, type PhaseId, type EvidenceItem } from "@/core/score";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

function källa(namn: string, hämtad: string): Källa {
  return { namn, hämtad };
}

function item(points: number, source: Källa, overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return { points, source, dataType: "register", ...overrides };
}

const testKälla = (locale: Locale, hämtad: string) => källa(dictionaries[locale].demoBar.personaLabel, hämtad);

/** Bygger PartEvidence för alla åtta delar för ett givet moment. Delar som
 * inte är upplåsta i fasen behöver ingen items-lista (calculateScore hoppar
 * över dem), men behöver ändå en lokaliserad etikett. */
function parts(locale: Locale, filled: Partial<Record<string, EvidenceItem[]>>): PartEvidence[] {
  const labels = dictionaries[locale].score.parts;
  return (Object.keys(labels) as Array<PartEvidence["partId"]>).map((partId) => ({
    partId,
    label: labels[partId],
    items: filled[partId] ?? [],
  }));
}

type Beat = {
  id: string;
  stepNumber: number;
  phase: PhaseId;
  todayIso: string;
  momentLabel: Record<Locale, string>;
  nextStep: Record<Locale, NextStep>;
  sinceLastTime: Record<Locale, SinceLastTime>;
  partsByLocale: Record<Locale, PartEvidence[]>;
  deltaReason: Record<Locale, string>;
};

const placeholderSinceLastTime = (locale: Locale, todayIso: string, overrides: Partial<SinceLastTime> = {}) => {
  const source = testKälla(locale, todayIso);
  return {
    emailSentSource: source,
    recipientCount: 0,
    openRate: 0,
    openRateSource: source,
    reminderSentDateIso: todayIso,
    responsesReceived: 0,
    responsesSource: source,
    ...overrides,
  };
};

const beats: Beat[] = [
  {
    id: "profile",
    stepNumber: 1,
    phase: "discover",
    todayIso: "2026-09-01",
    momentLabel: { sv: "Profilsamtalet", en: "The profile chat" },
    nextStep: {
      sv: {
        eyebrow: "MOMENT 1 · PROFILSAMTALET",
        title: "Svara på profilfrågorna",
        why: "Spark behöver veta vem du är innan den kan visa några siffror ur registret.",
        maxPoints: 10,
        estimatedTime: "~10 min",
        doneItems: [],
        actionLabel: "Starta profilsamtalet",
      },
      en: {
        eyebrow: "MOMENT 1 · THE PROFILE CHAT",
        title: "Answer the profile questions",
        why: "Spark needs to know who you are before it can show any numbers from the registry.",
        maxPoints: 10,
        estimatedTime: "~10 min",
        doneItems: [],
        actionLabel: "Start the profile chat",
      },
    },
    sinceLastTime: {
      sv: placeholderSinceLastTime("sv", "2026-09-01"),
      en: placeholderSinceLastTime("en", "2026-09-01"),
    },
    partsByLocale: {
      sv: parts("sv", {
        fit: [item(6, källa("Profilsamtal", "2026-09-01")), item(5, källa("Profilsamtal", "2026-09-01"))],
        market: [item(8, källa("Bolagsverket", "2026-09-01"))],
      }),
      en: parts("en", {
        fit: [item(6, källa("Profile chat", "2026-09-01")), item(5, källa("Profile chat", "2026-09-01"))],
        market: [item(8, källa("Bolagsverket", "2026-09-01"))],
      }),
    },
    deltaReason: { sv: "", en: "" },
  },
  {
    id: "market",
    stepNumber: 3,
    phase: "tryBeforeCalls",
    todayIso: "2026-09-03",
    momentLabel: { sv: "Marknaden", en: "The market" },
    nextStep: {
      sv: {
        eyebrow: "MOMENT 2 · MARKNADEN",
        title: "Se de första siffrorna ur registret",
        why: "Innan du pratar med en enda kund vill vi visa vad registret redan säger om marknaden och konkurrensen.",
        maxPoints: 12,
        estimatedTime: "~5 min",
        doneItems: ["Profilsamtalet klart"],
        actionLabel: "Öppna marknadsbilden",
      },
      en: {
        eyebrow: "MOMENT 2 · THE MARKET",
        title: "See the first numbers from the registry",
        why: "Before you talk to a single customer, here's what the registry already says about the market and competition.",
        maxPoints: 12,
        estimatedTime: "~5 min",
        doneItems: ["Profile chat done"],
        actionLabel: "Open the market picture",
      },
    },
    sinceLastTime: {
      sv: placeholderSinceLastTime("sv", "2026-09-03"),
      en: placeholderSinceLastTime("en", "2026-09-03"),
    },
    partsByLocale: {
      sv: parts("sv", {
        fit: [item(6, källa("Profilsamtal", "2026-09-01")), item(5, källa("Profilsamtal", "2026-09-01"))],
        market: [
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
        ],
        competition: [item(5, källa("Bolagsverket", "2026-09-03")), item(5, källa("Bolagsverket", "2026-09-03"))],
      }),
      en: parts("en", {
        fit: [item(6, källa("Profile chat", "2026-09-01")), item(5, källa("Profile chat", "2026-09-01"))],
        market: [
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
        ],
        competition: [item(5, källa("Bolagsverket", "2026-09-03")), item(5, källa("Bolagsverket", "2026-09-03"))],
      }),
    },
    deltaReason: { sv: "efter registerdata", en: "after registry data" },
  },
  {
    id: "calls",
    stepNumber: 5,
    phase: "tryAfterCalls",
    todayIso: "2026-09-05",
    momentLabel: { sv: "Samtalen", en: "The calls" },
    nextStep: {
      sv: {
        eyebrow: "MOMENT 3 · SAMTALEN",
        title: "Boka och skicka de första kundsamtalen",
        why: "Poängen kan inte gå över 30 förrän riktiga kunder har svarat.",
        maxPoints: 18,
        estimatedTime: "~20 min",
        doneItems: ["Profilsamtalet klart", "Marknadsbilden klar"],
        actionLabel: "Skicka utskicket",
      },
      en: {
        eyebrow: "MOMENT 3 · THE CALLS",
        title: "Book and send the first customer outreach",
        why: "Your score can't pass 30 until real customers have responded.",
        maxPoints: 18,
        estimatedTime: "~20 min",
        doneItems: ["Profile chat done", "Market picture done"],
        actionLabel: "Send the outreach",
      },
    },
    sinceLastTime: {
      sv: placeholderSinceLastTime("sv", "2026-09-05", {
        recipientCount: 20,
        openRate: 45,
        openRateSource: källa("Utskicket", "2026-09-05"),
      }),
      en: placeholderSinceLastTime("en", "2026-09-05", {
        recipientCount: 20,
        openRate: 45,
        openRateSource: källa("The outreach", "2026-09-05"),
      }),
    },
    partsByLocale: {
      sv: parts("sv", {
        fit: [item(6, källa("Profilsamtal", "2026-09-01")), item(5, källa("Profilsamtal", "2026-09-01"))],
        market: [
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
        ],
        competition: [item(5, källa("Bolagsverket", "2026-09-03")), item(5, källa("Bolagsverket", "2026-09-03"))],
        problem: Array.from({ length: 6 }, () =>
          item(3, källa("Kundsamtal, steg 05", "2026-09-05"), { dataType: "customer" }),
        ),
        willingnessToPay: Array.from({ length: 6 }, () =>
          item(2, källa("Kundsamtal, steg 05", "2026-09-05"), { dataType: "customer" }),
        ),
      }),
      en: parts("en", {
        fit: [item(6, källa("Profile chat", "2026-09-01")), item(5, källa("Profile chat", "2026-09-01"))],
        market: [
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
        ],
        competition: [item(5, källa("Bolagsverket", "2026-09-03")), item(5, källa("Bolagsverket", "2026-09-03"))],
        problem: Array.from({ length: 6 }, () =>
          item(3, källa("Customer calls, step 05", "2026-09-05"), { dataType: "customer" }),
        ),
        willingnessToPay: Array.from({ length: 6 }, () =>
          item(2, källa("Customer calls, step 05", "2026-09-05"), { dataType: "customer" }),
        ),
      }),
    },
    deltaReason: { sv: "efter kundsvar", en: "after customer responses" },
  },
  {
    id: "verdict",
    stepNumber: 6,
    phase: "tryAfterCalls",
    todayIso: "2026-09-06",
    momentLabel: { sv: "Domen", en: "The verdict" },
    nextStep: {
      sv: {
        eyebrow: "MOMENT 4 · DOMEN",
        title: "Gå igenom svaren som kom in",
        why: "Tre av sex svar säger nej till priset — se mönstret innan du går vidare till att förfina idén.",
        maxPoints: 18,
        estimatedTime: "~15 min",
        doneItems: ["Profilsamtalet klart", "Marknadsbilden klar", "Utskick skickat"],
        actionLabel: "Öppna svaren",
      },
      en: {
        eyebrow: "MOMENT 4 · THE VERDICT",
        title: "Review the responses that came in",
        why: "Three of six responses say no to the price — see the pattern before you refine the idea.",
        maxPoints: 18,
        estimatedTime: "~15 min",
        doneItems: ["Profile chat done", "Market picture done", "Outreach sent"],
        actionLabel: "Open the responses",
      },
    },
    sinceLastTime: {
      sv: placeholderSinceLastTime("sv", "2026-09-06", {
        recipientCount: 20,
        openRate: 45,
        openRateSource: källa("Utskicket", "2026-09-05"),
        responsesReceived: 6,
        responsesSource: källa("Kundsamtal, steg 05", "2026-09-06"),
      }),
      en: placeholderSinceLastTime("en", "2026-09-06", {
        recipientCount: 20,
        openRate: 45,
        openRateSource: källa("The outreach", "2026-09-05"),
        responsesReceived: 6,
        responsesSource: källa("Customer calls, step 05", "2026-09-06"),
      }),
    },
    partsByLocale: {
      sv: parts("sv", {
        fit: [item(6, källa("Profilsamtal", "2026-09-01")), item(5, källa("Profilsamtal", "2026-09-01"))],
        market: [
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
        ],
        competition: [item(5, källa("Bolagsverket", "2026-09-03")), item(5, källa("Bolagsverket", "2026-09-03"))],
        problem: Array.from({ length: 6 }, () =>
          item(3, källa("Kundsamtal, steg 05", "2026-09-05"), { dataType: "customer" }),
        ),
        // Samma sex svar som i förra momentet, men tre av dem visar sig nu
        // säga nej till priset — samma bevis, omtolkat (7.4: "poängen kan
        // sjunka", "motsägande svar räknas fullt ut ... sänker poängen").
        willingnessToPay: Array.from({ length: 6 }, (_, index) =>
          item(2, källa("Kundsamtal, steg 05", "2026-09-05"), { dataType: "customer", contradicts: index < 3 }),
        ),
      }),
      en: parts("en", {
        fit: [item(6, källa("Profile chat", "2026-09-01")), item(5, källa("Profile chat", "2026-09-01"))],
        market: [
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
          item(6, källa("Bolagsverket", "2026-09-03")),
        ],
        competition: [item(5, källa("Bolagsverket", "2026-09-03")), item(5, källa("Bolagsverket", "2026-09-03"))],
        problem: Array.from({ length: 6 }, () =>
          item(3, källa("Customer calls, step 05", "2026-09-05"), { dataType: "customer" }),
        ),
        willingnessToPay: Array.from({ length: 6 }, (_, index) =>
          item(2, källa("Customer calls, step 05", "2026-09-05"), {
            dataType: "customer",
            contradicts: index < 3,
          }),
        ),
      }),
    },
    deltaReason: { sv: "efter nya svar", en: "after new responses" },
  },
];

export const testScenarioBeats: readonly Beat[] = beats;

function beatAt(index: number): Beat {
  const clamped = Math.min(beats.length - 1, Math.max(0, index));
  return beats[clamped];
}

function totalForBeat(beat: Beat, locale: Locale): number {
  return calculateScore({
    phase: beat.phase,
    parts: beat.partsByLocale[locale],
    calculatedAtIso: beat.todayIso,
  }).total;
}

export function getScoreSnapshotForBeat(index: number, locale: Locale): ScoreSnapshot {
  const beat = beatAt(index);
  const previousBeat = index > 0 ? beatAt(index - 1) : null;
  const previousTotal = previousBeat ? totalForBeat(previousBeat, locale) : undefined;

  return calculateScore({
    phase: beat.phase,
    parts: beat.partsByLocale[locale],
    previousTotal,
    deltaReason: beat.deltaReason[locale],
    calculatedAtIso: beat.todayIso,
  });
}

export function getJourneySummaryForBeat(index: number, locale: Locale): JourneySummary {
  const beat = beatAt(index);
  return {
    todayIso: beat.todayIso,
    nextStep: beat.nextStep[locale],
    sinceLastTime: beat.sinceLastTime[locale],
  };
}
