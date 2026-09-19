// Sara Lindqvists fulla scenario (docs/uppdrag.md 9.3) — Persona A, "Jag har
// ingen idé". Poängen sätts aldrig här — varje beat bygger PartEvidence och
// låter calculateScore (core/score.ts) räkna den.
//
// Steg 01–06 är byggda i djup (uppdrag 9.1): varje steg har tre klickbara
// moment — "-fore" (Nästa steg-kortet, inget har hänt än), "-korning"
// (Medgrundaren kör — se cofounderScript.ts) och "-efter" (fynd, poäng-
// ändring, nya poster i Spåret, nya pulssignaler, vad som låstes upp).
// Poängen ändras ALDRIG i "-fore"/"-korning" — de bär samma bevis som
// föregående stegs "-efter" (`makeStepBeats`s `partsCarried`), och ändras
// bara i "-efter" (`partsAfter`). Steg 05 avviker med fem beats i stället
// för tre: 05a (utskicket) har alla tre moment och når 47 poäng i sitt
// "-efter"; 05b (svaren) har bara körning+efter och visar nedgången till 43
// — uppdragets viktigaste pedagogiska ögonblick (avsnitt 9.1, punkt 3).
//
// Kalibrering: målvärdena i 9.3 är en riktlinje med högst ±2 poängs
// avvikelse. Steg 01, 03, 05 (både 47 och 43) och 06 träffar exakt. Steg 02
// och 04 ligger −2 — matematiskt tvunget inom nuvarande fasarkitektur utan
// att rubba steg 07–12:s redan godkända kalibrering (docs/status.md,
// Session 3), se resonemanget i PR-beskrivningen/status.md för den här
// sessionen.
import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { Dictionary } from "@/i18n/dictionary";
import type { NextStep, SinceLastTime, ScoreSnapshot, Källa, Profile } from "@/core/domain";
import type { JourneySummary } from "@/ports/JourneyRepository";
import type { JourneyEngine } from "./journeyEngine";
import {
  calculateScore,
  type PartEvidence,
  type PhaseId,
  type EvidenceItem,
  type ScorePartId,
  type ScoreSuggestionInput,
} from "@/core/score";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

export const saraProfile: Profile = {
  name: "Sara Lindqvist",
  initials: "SL",
};

/** Bakgrund och resurser (9.3) — visas i Minnet/Profilen. Egennamn och
 * siffror hör hemma i källdata, inte i18n (docs/status.md, Session 1). */
export const saraBackground: Record<Locale, { role: string; bio: string; quote: string }> = {
  sv: {
    role: "26 år, Stockholm",
    bio: "Fyra år som redovisningsassistent på en liten byrå. Kan byråns flöden och Excel men har ingen kodvana.",
    quote: "Varje månadsskifte jagar vi kvitton från kunderna via mejl och sms. Det äter två dagar.",
  },
  en: {
    role: "26, Stockholm",
    bio: "Four years as an accounting assistant at a small firm. Knows the firm's workflows and Excel, but has no coding experience.",
    quote: "Every month-end we chase receipts from clients over email and text. It eats two days.",
  },
};

export const saraResources: Record<Locale, { time: string; money: string; risk: string }> = {
  sv: { time: "15 timmar i veckan", money: "30 000 kr sparat", risk: "Medelhög riskaptit" },
  en: { time: "15 hours a week", money: "SEK 30,000 saved", risk: "Medium risk appetite" },
};

export function källa(namn: string, hämtad: string): Källa {
  return { namn, hämtad };
}

export function pt(points: number, source: Källa, overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return { points, source, dataType: "register", ...overrides };
}

/** Bygger PartEvidence för alla åtta delar. Delar utan angivna items får en
 * tom lista — calculateScore hoppar över dem om de inte är upplåsta i fasen. */
export function parts(locale: Locale, filled: Partial<Record<ScorePartId, EvidenceItem[]>>): PartEvidence[] {
  const labels = dictionaries[locale].score.parts;
  return (Object.keys(labels) as ScorePartId[]).map((partId) => ({
    partId,
    label: labels[partId],
    items: filled[partId] ?? [],
  }));
}

/** Två parallella `parts()`-anrop (sv+en) — sparar en rad per evidensuppsättning. */
export function partsBoth(
  filledSv: Partial<Record<ScorePartId, EvidenceItem[]>>,
  filledEn: Partial<Record<ScorePartId, EvidenceItem[]>>,
): Record<Locale, PartEvidence[]> {
  return { sv: parts("sv", filledSv), en: parts("en", filledEn) };
}

export type Beat = {
  id: string;
  stepNumber: number;
  phase: PhaseId;
  todayIso: string;
  /** Vilket av de tre klickbara momenten (uppdrag 9.1) beatet är. */
  momentKind: "before" | "running" | "after";
  momentLabel: Record<Locale, string>;
  nextStep: Record<Locale, NextStep>;
  sinceLastTime: Record<Locale, SinceLastTime>;
  partsByLocale: Record<Locale, PartEvidence[]>;
  deltaReason: Record<Locale, string>;
  highlights: Record<Locale, string[]>;
  /** Kort retrospektiv rad för Spåret (avsnitt 9.1) — bara satt på
   * "-efter"-beats. Faller annars tillbaka på momentLabel + nextStep.title
   * (adapters/demo/MemoryRepository.ts). */
  traceSummary?: Record<Locale, string>;
  /** Domen (steg 06) — kör/förfina/pivotera + motivering. */
  verdict?: Record<Locale, { headline: string; reasoning: string }>;
  /** Simuleringsytan (avsnitt 2.2, steg 03/04/06) — vilken kanonisk
   * simulering (adapters/demo/SimulationProvider.ts) som hör till beatet. */
  simulationKind?: "time" | "tolerance" | "price";
};

export const noSinceLastTime = (locale: Locale, todayIso: string, overrides: Partial<SinceLastTime> = {}): SinceLastTime => {
  // Platshållarkälla för ett tomt "sedan sist"-läge (inget utskick än) —
  // egennamnsfri scenariodata, inte UI-kedjetext, så den hör hemma här och
  // inte i i18n-ordböckerna (samma resonemang som övriga källor i den här filen).
  const source = källa(locale === "sv" ? "Inget utskick ännu" : "No outreach yet", todayIso);
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

export function zeroSinceLastTimeBoth(dateIso: string): Record<Locale, SinceLastTime> {
  return { sv: noSinceLastTime("sv", dateIso), en: noSinceLastTime("en", dateIso) };
}

/** "· Före"/"· Körning"/"· Efter" — samma pill-text som journeyPage.momentPill
 * (screens/JourneyStep.tsx), återanvänd här för demoradens momentLabel. */
export function withMoment(base: Record<Locale, string>, kind: "before" | "running" | "after"): Record<Locale, string> {
  return {
    sv: `${base.sv} · ${dictionaries.sv.journeyPage.momentPill[kind]}`,
    en: `${base.en} · ${dictionaries.en.journeyPage.momentPill[kind]}`,
  };
}

export type StepBeatsInput = {
  idPrefix: string;
  stepNumber: number;
  phaseBefore: PhaseId;
  phaseAfter: PhaseId;
  momentLabelBase: Record<Locale, string>;
  nextStep: Record<Locale, NextStep>;
  datesFore: string;
  datesKorning: string;
  datesEfter: string;
  sinceLastTimeFore: Record<Locale, SinceLastTime>;
  sinceLastTimeKorning: Record<Locale, SinceLastTime>;
  sinceLastTimeEfter: Record<Locale, SinceLastTime>;
  partsCarried: Record<Locale, PartEvidence[]>;
  partsAfter: Record<Locale, PartEvidence[]>;
  deltaReasonAfter: Record<Locale, string>;
  highlightsAfter: Record<Locale, string[]>;
  traceSummaryAfter: Record<Locale, string>;
  verdictAfter?: Record<Locale, { headline: string; reasoning: string }>;
  simulationKindAfter?: "time" | "tolerance" | "price";
};

/** Bygger de tre symmetriska beatsen för ett steg (01–04, 06). Steg 05 har en
 * egen, asymmetrisk form (05a har alla tre, 05b bara körning+efter) och
 * skrivs för hand längre ner. */
export function makeStepBeats(input: StepBeatsInput): [Beat, Beat, Beat] {
  const noHighlights = { sv: [] as string[], en: [] as string[] };
  const noDelta = { sv: "", en: "" };

  return [
    {
      id: `${input.idPrefix}-fore`,
      stepNumber: input.stepNumber,
      phase: input.phaseBefore,
      todayIso: input.datesFore,
      momentKind: "before",
      momentLabel: withMoment(input.momentLabelBase, "before"),
      nextStep: input.nextStep,
      sinceLastTime: input.sinceLastTimeFore,
      partsByLocale: input.partsCarried,
      deltaReason: noDelta,
      highlights: noHighlights,
    },
    {
      id: `${input.idPrefix}-korning`,
      stepNumber: input.stepNumber,
      phase: input.phaseBefore,
      todayIso: input.datesKorning,
      momentKind: "running",
      momentLabel: withMoment(input.momentLabelBase, "running"),
      nextStep: input.nextStep,
      sinceLastTime: input.sinceLastTimeKorning,
      partsByLocale: input.partsCarried,
      deltaReason: noDelta,
      highlights: noHighlights,
    },
    {
      id: `${input.idPrefix}-efter`,
      stepNumber: input.stepNumber,
      phase: input.phaseAfter,
      todayIso: input.datesEfter,
      momentKind: "after",
      momentLabel: withMoment(input.momentLabelBase, "after"),
      nextStep: input.nextStep,
      sinceLastTime: input.sinceLastTimeEfter,
      partsByLocale: input.partsAfter,
      deltaReason: input.deltaReasonAfter,
      highlights: input.highlightsAfter,
      traceSummary: input.traceSummaryAfter,
      verdict: input.verdictAfter,
      simulationKind: input.simulationKindAfter,
    },
  ];
}

// ---------------------------------------------------------------------------
// Steg 01 · Om dig
// ---------------------------------------------------------------------------
const step01NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 01 · OM DIG",
    title: "Svara på profilfrågorna",
    why: "Spark behöver veta vem du är — bakgrund, kompetens, nätverk, tid, pengar och riskaptit — innan den kan visa några siffror ur registret.",
    maxPoints: 10,
    estimatedTime: "~10 min",
    doneItems: [],
    actionLabel: "Starta profilsamtalet",
  },
  en: {
    eyebrow: "STEP 01 · ABOUT YOU",
    title: "Answer the profile questions",
    why: "Spark needs to know who you are — background, skills, network, time, money and risk appetite — before it can show any numbers from the registry.",
    maxPoints: 10,
    estimatedTime: "~10 min",
    doneItems: [],
    actionLabel: "Start the profile chat",
  },
};

const [step01Fore, step01Korning, step01Efter] = makeStepBeats({
  idPrefix: "01-om-dig",
  stepNumber: 1,
  phaseBefore: "discover",
  phaseAfter: "discover",
  momentLabelBase: { sv: "Om dig", en: "About you" },
  nextStep: step01NextStep,
  datesFore: "2026-01-05",
  datesKorning: "2026-01-05",
  datesEfter: "2026-01-05",
  sinceLastTimeFore: zeroSinceLastTimeBoth("2026-01-05"),
  sinceLastTimeKorning: zeroSinceLastTimeBoth("2026-01-05"),
  sinceLastTimeEfter: zeroSinceLastTimeBoth("2026-01-05"),
  // Innan samtalet är klart vet Spark bara att Sara är intresserad — en
  // minimal, men äkta, bevispost (calculateScore kastar annars: "ingen poäng
  // utan källa", 7.4). Fullständig bild kommer först i "-efter".
  partsCarried: partsBoth(
    { fit: [pt(2, källa("Profilsamtal", "2026-01-05"))], market: [pt(1, källa("Bolagsverket", "2026-01-05"))] },
    { fit: [pt(2, källa("Profile chat", "2026-01-05"))], market: [pt(1, källa("Bolagsverket", "2026-01-05"))] },
  ),
  partsAfter: partsBoth(
    { fit: [pt(5, källa("Profilsamtal", "2026-01-05"))], market: [pt(1, källa("Bolagsverket", "2026-01-05"))] },
    { fit: [pt(5, källa("Profile chat", "2026-01-05"))], market: [pt(1, källa("Bolagsverket", "2026-01-05"))] },
  ),
  deltaReasonAfter: { sv: "efter profilsamtalet", en: "after the profile chat" },
  highlightsAfter: {
    sv: [
      "Styrka: fyra års branschinsikt som redovisningsassistent.",
      "Strukturell lucka: kan inte bygga själv — löses senare av Lovable-bygget.",
      "15 timmar i veckan, 30 000 kr sparat, medelhög riskaptit.",
    ],
    en: [
      "Strength: four years of industry insight as an accounting assistant.",
      "Structural gap: can't build it herself — solved later by the Lovable build.",
      "15 hours a week, SEK 30,000 saved, medium risk appetite.",
    ],
  },
  traceSummaryAfter: {
    sv: "Profilsamtalet klart — branschinsikt som styrka, bygget löses av Lovable senare.",
    en: "Profile chat done — industry insight as a strength, the build solved by Lovable later.",
  },
});

// ---------------------------------------------------------------------------
// Steg 02 · Möjligheter
// ---------------------------------------------------------------------------
const step02NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 02 · MÖJLIGHETER",
    title: "Välj en idé ur tre förslag",
    why: "Spark föreslår tre idéer grundade i din profil, korsade med luckor i registret.",
    maxPoints: 12,
    estimatedTime: "~10 min",
    doneItems: ["Profilsamtalet klart"],
    actionLabel: "Se förslagen",
  },
  en: {
    eyebrow: "STEP 02 · OPPORTUNITIES",
    title: "Choose one idea from three suggestions",
    why: "Spark suggests three ideas grounded in your profile, crossed with gaps in the registry.",
    maxPoints: 12,
    estimatedTime: "~10 min",
    doneItems: ["Profile chat done"],
    actionLabel: "See the suggestions",
  },
};

const [step02Fore, step02Korning, step02Efter] = makeStepBeats({
  idPrefix: "02-mojligheter",
  stepNumber: 2,
  phaseBefore: "discover",
  phaseAfter: "discover",
  momentLabelBase: { sv: "Möjligheter", en: "Opportunities" },
  nextStep: step02NextStep,
  datesFore: "2026-01-07",
  datesKorning: "2026-01-07",
  datesEfter: "2026-01-07",
  sinceLastTimeFore: zeroSinceLastTimeBoth("2026-01-07"),
  sinceLastTimeKorning: zeroSinceLastTimeBoth("2026-01-07"),
  sinceLastTimeEfter: zeroSinceLastTimeBoth("2026-01-07"),
  partsCarried: step01Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [pt(3, källa("Bolagsverket", "2026-01-07")), pt(3, källa("Bolagsverket", "2026-01-07"))],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [pt(3, källa("Bolagsverket", "2026-01-07")), pt(3, källa("Bolagsverket", "2026-01-07"))],
    },
  ),
  deltaReasonAfter: { sv: "efter idéval", en: "after choosing the idea" },
  highlightsAfter: {
    sv: [
      "Tre idéer föreslagna ur profilen och registret.",
      "Vald idé: Kvittojakten — automatisk insamling av underlag från byråernas småföretagskunder.",
      "Preliminär registerträff: redovisningsbyråer, SNI 69.201.",
    ],
    en: [
      "Three ideas suggested from the profile and the registry.",
      "Chosen idea: Kvittojakten — automatic collection of receipts from accounting firms' small-business clients.",
      "Preliminary registry match: accounting firms, SNI 69.201.",
    ],
  },
  traceSummaryAfter: {
    sv: "Idé vald: Kvittojakten — automatisk insamling av kvittounderlag åt redovisningsbyråer.",
    en: "Idea chosen: Kvittojakten — automatic collection of receipts for accounting firms.",
  },
});

// ---------------------------------------------------------------------------
// Steg 03 · Marknaden
// ---------------------------------------------------------------------------
const step03NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 03 · MARKNADEN",
    title: "Se de första siffrorna ur registret",
    why: "Riktiga siffror ur registret: antal företag, storleksfördelning, medianomsättning, tillväxt och geografi.",
    maxPoints: 12,
    estimatedTime: "~5 min",
    doneItems: ["Profilsamtalet klart", "Idé vald"],
    actionLabel: "Öppna marknadsbilden",
  },
  en: {
    eyebrow: "STEP 03 · THE MARKET",
    title: "See the first numbers from the registry",
    why: "Real numbers from the registry: number of companies, size distribution, median revenue, growth and geography.",
    maxPoints: 12,
    estimatedTime: "~5 min",
    doneItems: ["Profile chat done", "Idea chosen"],
    actionLabel: "Open the market picture",
  },
};

// Konkurrensen kartläggs medvetet ytligt här (5 av 8 poäng, två av tre
// konkurrenter på djupet) — steg 04 fördjupar den till fullt (7/8) i
// samband med att kundlistan tas fram. Se saraSuggestionCandidates.market
// nedan, som redan pekade ut just den här luckan innan den här sessionen.
const [step03Fore, step03Korning, step03Efter] = makeStepBeats({
  idPrefix: "03-marknaden",
  stepNumber: 3,
  phaseBefore: "discover",
  phaseAfter: "tryBeforeCalls",
  momentLabelBase: { sv: "Marknaden", en: "The market" },
  nextStep: step03NextStep,
  datesFore: "2026-01-09",
  datesKorning: "2026-01-09",
  datesEfter: "2026-01-09",
  sinceLastTimeFore: zeroSinceLastTimeBoth("2026-01-09"),
  sinceLastTimeKorning: zeroSinceLastTimeBoth("2026-01-09"),
  sinceLastTimeEfter: zeroSinceLastTimeBoth("2026-01-09"),
  partsCarried: step02Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
      ],
      competition: [pt(3, källa("Bolagsverket", "2026-01-09")), pt(2, källa("Bolagsverket", "2026-01-09"))],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
      ],
      competition: [pt(3, källa("Bolagsverket", "2026-01-09")), pt(2, källa("Bolagsverket", "2026-01-09"))],
    },
  ),
  deltaReasonAfter: { sv: "efter registerdata", en: "after registry data" },
  highlightsAfter: {
    sv: [
      "312 redovisningsbyråer med 5–20 anställda (SNI 69.201).",
      "Medianomsättning 4,2 Mkr.",
      "18 % växte mer än 10 % förra året.",
      "31 % finns i Stockholms län.",
      "Tre fiktiva konkurrenter identifierade, bara ytligt kartlagda så här långt.",
      "Simulering (Hiasynth, koncept): ~6,5 h/mån per anställd går åt till underlagsjakt, intervall 4–9 h.",
    ],
    en: [
      "312 accounting firms with 5–20 employees (SNI 69.201).",
      "Median revenue SEK 4.2M.",
      "18% grew more than 10% last year.",
      "31% are located in the Stockholm region.",
      "Three fictional competitors identified, only shallowly mapped so far.",
      "Simulation (Hiasynth, concept): ~6.5 h/month per employee goes to chasing receipts, range 4–9 h.",
    ],
  },
  traceSummaryAfter: {
    sv: "Marknadsbilden hämtad: 312 byråer, 18 % växer över 10 %, tre konkurrenter identifierade.",
    en: "Market picture pulled: 312 firms, 18% growing over 10%, three competitors identified.",
  },
  simulationKindAfter: "time",
});

// ---------------------------------------------------------------------------
// Steg 04 · Kunden
// ---------------------------------------------------------------------------
const step04NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 04 · KUNDEN",
    title: "Se kundprofilen och listan på namngivna företag",
    why: "Kundprofil ur registret: SNI 69.201, 5–20 anställda, 3–15 Mkr i omsättning. Resultatet är en lista på namngivna företag.",
    maxPoints: 8,
    estimatedTime: "~5 min",
    doneItems: ["Profilsamtalet klart", "Idé vald", "Marknadsbilden klar"],
    actionLabel: "Öppna kundlistan",
  },
  en: {
    eyebrow: "STEP 04 · THE CUSTOMER",
    title: "See the customer profile and the list of named companies",
    why: "Customer profile from the registry: SNI 69.201, 5–20 employees, SEK 3–15M revenue. The result is a list of named companies.",
    maxPoints: 8,
    estimatedTime: "~5 min",
    doneItems: ["Profile chat done", "Idea chosen", "Market picture done"],
    actionLabel: "Open the customer list",
  },
};

const [step04Fore, step04Korning, step04Efter] = makeStepBeats({
  idPrefix: "04-kunden",
  stepNumber: 4,
  phaseBefore: "tryBeforeCalls",
  phaseAfter: "tryBeforeCalls",
  momentLabelBase: { sv: "Kunden", en: "The customer" },
  nextStep: step04NextStep,
  datesFore: "2026-01-12",
  datesKorning: "2026-01-12",
  datesEfter: "2026-01-12",
  sinceLastTimeFore: zeroSinceLastTimeBoth("2026-01-12"),
  sinceLastTimeKorning: zeroSinceLastTimeBoth("2026-01-12"),
  sinceLastTimeEfter: zeroSinceLastTimeBoth("2026-01-12"),
  partsCarried: step03Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    },
  ),
  deltaReasonAfter: { sv: "efter kundprofilen", en: "after the customer profile" },
  highlightsAfter: {
    sv: [
      "Kundprofil: SNI 69.201, 5–20 anställda, 3–15 Mkr i omsättning.",
      "Lista över de 40 snabbast växande fiktiva byråerna som matchar profilen.",
      "Konkurrentbilden fördjupad i samma veva som kundlistan togs fram.",
      "Nästa steg: bygga kontaktlista och skriva outreach.",
    ],
    en: [
      "Customer profile: SNI 69.201, 5–20 employees, SEK 3–15M revenue.",
      "List of the 40 fastest-growing fictional firms matching the profile.",
      "The competitor picture deepened alongside the customer list.",
      "Next: build the contact list and write the outreach.",
    ],
  },
  traceSummaryAfter: {
    sv: "Kundlistan klar: 40 namngivna byråer som matchar profilen, konkurrensbilden fördjupad.",
    en: "Customer list done: 40 named firms matching the profile, competitor picture deepened.",
  },
  simulationKindAfter: "tolerance",
});

// ---------------------------------------------------------------------------
// Steg 05a · Samtalen (utskicket)
// ---------------------------------------------------------------------------
const step05aNextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 05 · SAMTALEN",
    title: "Skicka outreach till de 40 byråerna",
    why: "Spark skriver ett svenskt B2B-mejl och skickar det från din egen Gmail. Poängen kan inte gå över 30 förrän riktiga kunder har svarat.",
    maxPoints: 18,
    estimatedTime: "~20 min",
    doneItems: ["Profilsamtalet klart", "Idé vald", "Marknadsbilden klar", "Kundlistan klar"],
    actionLabel: "Skicka utskicket",
  },
  en: {
    eyebrow: "STEP 05 · THE CALLS",
    title: "Send outreach to the 40 firms",
    why: "Spark writes a Swedish B2B email and sends it from your own Gmail. Your score can't pass 30 until real customers have responded.",
    maxPoints: 18,
    estimatedTime: "~20 min",
    doneItems: ["Profile chat done", "Idea chosen", "Market picture done", "Customer list done"],
    actionLabel: "Send the outreach",
  },
};

const [step05aFore, step05aKorning, step05aEfter] = makeStepBeats({
  idPrefix: "05a-utskicket",
  stepNumber: 5,
  phaseBefore: "tryBeforeCalls",
  phaseAfter: "tryAfterCalls",
  momentLabelBase: { sv: "Samtalen · utskicket", en: "The calls · the outreach" },
  nextStep: step05aNextStep,
  datesFore: "2026-01-14",
  datesKorning: "2026-01-18",
  datesEfter: "2026-01-19",
  sinceLastTimeFore: zeroSinceLastTimeBoth("2026-01-14"),
  sinceLastTimeKorning: {
    sv: noSinceLastTime("sv", "2026-01-18", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
    }),
    en: noSinceLastTime("en", "2026-01-18", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
    }),
  },
  sinceLastTimeEfter: {
    sv: noSinceLastTime("sv", "2026-01-19", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 6,
      responsesSource: källa("Kundsamtal, steg 05", "2026-01-19"),
    }),
    en: noSinceLastTime("en", "2026-01-19", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 6,
      responsesSource: källa("Customer calls, step 05", "2026-01-19"),
    }),
  },
  partsCarried: step04Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(11, källa("Kundsamtal, steg 05", "2026-01-19"), { dataType: "customer" })],
      willingnessToPay: [pt(9, källa("Kundsamtal, steg 05", "2026-01-19"), { dataType: "customer" })],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(11, källa("Customer calls, step 05", "2026-01-19"), { dataType: "customer" })],
      willingnessToPay: [pt(9, källa("Customer calls, step 05", "2026-01-19"), { dataType: "customer" })],
    },
  ),
  deltaReasonAfter: { sv: "efter de första 6 svaren", en: "after the first 6 responses" },
  highlightsAfter: {
    sv: [
      "Svenskt B2B-mejl skickat från Saras Gmail till 40 byråer.",
      "2 dagar senare: 38 % har öppnat.",
      "4 dagar senare: påminnelse skickad.",
      "6 svar kommer in — alla bekräftar att problemet är verkligt.",
      "Juridisk koll: regler för marknadsföring via e-post, B2B jämfört med fysiska personer.",
    ],
    en: [
      "Swedish B2B email sent from Sara's Gmail to 40 firms.",
      "2 days later: 38% have opened it.",
      "4 days later: reminder sent.",
      "6 responses come in — all confirm the problem is real.",
      "Legal check: rules for email marketing, B2B versus individuals.",
    ],
  },
  traceSummaryAfter: {
    sv: "Utskicket skickat till 40 byråer — 38 % öppningsfrekvens, sex svar bekräftar problemet.",
    en: "Outreach sent to 40 firms — 38% open rate, six responses confirm the problem.",
  },
});

// ---------------------------------------------------------------------------
// Steg 05b · Samtalen (svaren — poängen sjunker)
// ---------------------------------------------------------------------------
const step05bNextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 05 · SAMTALEN",
    title: "Läs de tre nya svaren",
    why: "Tre nya svar säger nej till priset 2 000 kr. Samma sanning, mer av den — och poängen sjunker.",
    maxPoints: 18,
    estimatedTime: "~10 min",
    doneItems: [
      "Profilsamtalet klart",
      "Idé vald",
      "Marknadsbilden klar",
      "Kundlistan klar",
      "Utskick skickat",
      "6 svar mottagna",
    ],
    actionLabel: "Öppna svaren",
  },
  en: {
    eyebrow: "STEP 05 · THE CALLS",
    title: "Read the three new responses",
    why: "Three new responses say no to the SEK 2,000 price. Same truth, more of it — and the score drops.",
    maxPoints: 18,
    estimatedTime: "~10 min",
    doneItems: [
      "Profile chat done",
      "Idea chosen",
      "Market picture done",
      "Customer list done",
      "Outreach sent",
      "6 responses received",
    ],
    actionLabel: "Open the responses",
  },
};

const step05bMomentLabelBase: Record<Locale, string> = { sv: "Samtalen · svaren", en: "The calls · the responses" };

const step05bKorning: Beat = {
  id: "05b-svaren-korning",
  stepNumber: 5,
  phase: "tryAfterCalls",
  todayIso: "2026-01-20",
  momentKind: "running",
  momentLabel: withMoment(step05bMomentLabelBase, "running"),
  nextStep: step05bNextStep,
  sinceLastTime: step05aEfter.sinceLastTime,
  partsByLocale: step05aEfter.partsByLocale,
  deltaReason: { sv: "", en: "" },
  highlights: { sv: [], en: [] },
};

const step05bEfterParts = partsBoth(
  {
    fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
    market: [
      pt(4, källa("Bolagsverket", "2026-01-09")),
      pt(4, källa("SCB", "2026-01-09")),
      pt(3, källa("SCB", "2026-01-09")),
      pt(1, källa("Bolagsverket", "2026-01-12")),
    ],
    competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    problem: [pt(11, källa("Kundsamtal, steg 05", "2026-01-19"), { dataType: "customer" })],
    willingnessToPay: [
      pt(9, källa("Kundsamtal, steg 05", "2026-01-19"), { dataType: "customer" }),
      pt(-3, källa("Kundsamtal, steg 05", "2026-01-20"), { dataType: "customer", contradicts: true }),
    ],
  },
  {
    fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
    market: [
      pt(4, källa("Bolagsverket", "2026-01-09")),
      pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
      pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
      pt(1, källa("Bolagsverket", "2026-01-12")),
    ],
    competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    problem: [pt(11, källa("Customer calls, step 05", "2026-01-19"), { dataType: "customer" })],
    willingnessToPay: [
      pt(9, källa("Customer calls, step 05", "2026-01-19"), { dataType: "customer" }),
      pt(-3, källa("Customer calls, step 05", "2026-01-20"), { dataType: "customer", contradicts: true }),
    ],
  },
);

const step05bEfter: Beat = {
  id: "05b-svaren-efter",
  stepNumber: 5,
  phase: "tryAfterCalls",
  todayIso: "2026-01-20",
  momentKind: "after",
  momentLabel: withMoment(step05bMomentLabelBase, "after"),
  nextStep: step05bNextStep,
  sinceLastTime: {
    sv: noSinceLastTime("sv", "2026-01-20", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
    }),
    en: noSinceLastTime("en", "2026-01-20", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Customer calls, step 05", "2026-01-20"),
    }),
  },
  partsByLocale: step05bEfterParts,
  deltaReason: { sv: "3 nya svar säger nej till priset", en: "3 new responses say no to the price" },
  highlights: {
    sv: [
      "3 nya svar kommer in, 9 totalt.",
      "3 av de 9 säger nej till priset 2 000 kr.",
      "Betalningsvilja bygger på två bevisposter: en för de 6 positiva svaren (+9), en för de 3 som säger nej (−3, märkt motsägande).",
      "En av två poster (50 %) motsäger — över 30 %-tröskeln — så hela delen straffas 15 %: (9 − 3) × 0,85 ≈ 5, inte 6.",
      "Poängen sjunker från 47 till 43. Motsägande svar räknas alltid fullt ut, aldrig gömda undan.",
    ],
    en: [
      "3 new responses come in, 9 total.",
      "3 of the 9 say no to the SEK 2,000 price.",
      "Willingness to pay rests on two evidence items: one for the 6 positive responses (+9), one for the 3 that say no (−3, marked contradicting).",
      "One of two items (50%) contradicts — over the 30% threshold — so the whole part is penalized 15%: (9 − 3) × 0.85 ≈ 5, not 6.",
      "The score drops from 47 to 43. Contradicting responses always count in full, never hidden away.",
    ],
  },
  traceSummary: {
    sv: "Tre nya svar säger nej till priset — Betalningsvilja straffas för skevt underlag, poängen sjunker till 43.",
    en: "Three new responses say no to the price — Willingness to pay is penalized for a skewed sample, score drops to 43.",
  },
};

// ---------------------------------------------------------------------------
// Steg 06 · Domen
// ---------------------------------------------------------------------------
const step06NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 06 · DOMEN",
    title: "Förfina: snäva segmentet till 10–20 anställda",
    why: "7 av 9 bekräftar problemet. 6 av 9 tycker att 2 000 kr är för dyrt, median 900 kr. Alla som sa ja har 10+ anställda.",
    maxPoints: 18,
    estimatedTime: "~15 min",
    doneItems: [
      "Profilsamtalet klart",
      "Idé vald",
      "Marknadsbilden klar",
      "Kundlistan klar",
      "Utskick och svar klara",
    ],
    actionLabel: "Se domen",
  },
  en: {
    eyebrow: "STEP 06 · THE VERDICT",
    title: "Refine: narrow the segment to 10–20 employees",
    why: "7 of 9 confirm the problem. 6 of 9 think SEK 2,000 is too expensive, median SEK 900. Everyone who said yes has 10+ employees.",
    maxPoints: 18,
    estimatedTime: "~15 min",
    doneItems: ["Profile chat done", "Idea chosen", "Market picture done", "Customer list done", "Outreach and responses done"],
    actionLabel: "See the verdict",
  },
};

const step06SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-01-23", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-01-23", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const [step06Fore, step06Korning, step06Efter] = makeStepBeats({
  idPrefix: "06-domen",
  stepNumber: 6,
  phaseBefore: "tryAfterCalls",
  phaseAfter: "tryAfterCalls",
  momentLabelBase: { sv: "Domen", en: "The verdict" },
  nextStep: step06NextStep,
  datesFore: "2026-01-23",
  datesKorning: "2026-01-23",
  datesEfter: "2026-01-23",
  sinceLastTimeFore: step06SinceLastTime,
  sinceLastTimeKorning: step06SinceLastTime,
  sinceLastTimeEfter: step06SinceLastTime,
  partsCarried: step05bEfter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
    },
  ),
  deltaReasonAfter: { sv: "efter förfiningen", en: "after refining the segment" },
  highlightsAfter: {
    sv: [
      "Utslag: Förfina — inte kör, inte pivotera.",
      "Nytt segment: 10–20 anställda i stället för 5–20.",
      "Simulering av priskänslighet (Hiasynth, koncept) stöder 1 000–1 300 kr i det nya segmentet.",
    ],
    en: [
      "Verdict: Refine — not go, not pivot.",
      "New segment: 10–20 employees instead of 5–20.",
      "Price-sensitivity simulation (Hiasynth, concept) supports SEK 1,000–1,300 in the new segment.",
    ],
  },
  traceSummaryAfter: {
    sv: "Domen: Förfina. Nytt segment 10–20 anställda, ny prissimulering stöder 1 000–1 300 kr.",
    en: "Verdict: Refine. New segment 10–20 employees, new price simulation supports SEK 1,000–1,300.",
  },
  verdictAfter: {
    sv: {
      headline: "Förfina · snäva segmentet",
      reasoning:
        "7 av 9 bekräftar problemet, men 6 av 9 tycker 2 000 kr är för dyrt — median 900 kr. Alla som sa ja har 10 eller fler anställda. En ny simulering stöder 1 000–1 300 kr i det smalare segmentet.",
    },
    en: {
      headline: "Refine · narrow the segment",
      reasoning:
        "7 of 9 confirm the problem, but 6 of 9 think SEK 2,000 is too expensive — median SEK 900. Everyone who said yes has 10 or more employees. A new simulation supports SEK 1,000–1,300 in the narrower segment.",
    },
  },
  simulationKindAfter: "price",
});

// ---------------------------------------------------------------------------
// Steg 07 · Affärsfall och pris
// ---------------------------------------------------------------------------
const step07NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 07 · AFFÄRSFALL OCH PRIS",
    title: "Sätt priset: 1 190 kr/mån exkl. moms",
    why: "Svensk kalkyl med moms, arbetsgivaravgifter, F-skatt, kostnadsgolv och break-even. Spann 900–1 500 kr, motiverat ur fyra underlag.",
    maxPoints: 8,
    estimatedTime: "~15 min",
    doneItems: ["Marknadsbilden klar", "Kundsamtal klara", "Förfiningen klar"],
    actionLabel: "Se kalkylen",
  },
  en: {
    eyebrow: "STEP 07 · BUSINESS CASE AND PRICE",
    title: "Set the price: SEK 1,190/month excl. VAT",
    why: "Swedish calculation with VAT, payroll tax, F-tax, cost floor and break-even. Range SEK 900–1,500, justified from four sources.",
    maxPoints: 8,
    estimatedTime: "~15 min",
    doneItems: ["Market picture done", "Customer calls done", "Refinement done"],
    actionLabel: "See the calculation",
  },
};

const step07SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-01-26", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-01-26", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

// 1.5/9.1: prissättningen motiveras uttryckligen ur alla fyra underlagen
// (vad kunderna tål, vad jämförbara aktörer tar, vad kunderna själva sagt,
// vad som krävs för att gå ihop) — inte bara nämnda i förbigående. Priset
// (1 190 kr) ligger dessutom mitt i Hiasynth-simuleringens stödda intervall
// från steg 06 (1 000–1 300 kr), återanvänd här som steg 07:s egen simulering
// (avsnitt 2.2: Hiasynth används i steg 03, 04, 06 OCH 07).
const [step07Fore, step07Korning, step07Efter] = makeStepBeats({
  idPrefix: "07-affarsfall",
  stepNumber: 7,
  phaseBefore: "tryAfterCalls",
  phaseAfter: "launch",
  momentLabelBase: { sv: "Affärsfall och pris", en: "Business case and price" },
  nextStep: step07NextStep,
  datesFore: "2026-01-26",
  datesKorning: "2026-01-27",
  datesEfter: "2026-01-28",
  sinceLastTimeFore: step07SinceLastTime,
  sinceLastTimeKorning: step07SinceLastTime,
  sinceLastTimeEfter: step07SinceLastTime,
  partsCarried: step06Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      product: [pt(4, källa("Affärsfallet, steg 07", "2026-01-28"), { dataType: "customer" })],
      feasibility: [pt(2, källa("Affärsfallet, steg 07", "2026-01-28"))],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      product: [pt(4, källa("Business case, step 07", "2026-01-28"), { dataType: "customer" })],
      feasibility: [pt(2, källa("Business case, step 07", "2026-01-28"))],
    },
  ),
  deltaReasonAfter: { sv: "efter affärsfallet", en: "after the business case" },
  highlightsAfter: {
    sv: [
      "Pris satt till 1 190 kr/mån exkl. moms, spann 900–1 500 kr.",
      "1. Vad kunderna tål: medianomsättning 4,2 Mkr, byråer med 10+ anställda tål mer än de mindre.",
      "2. Vad jämförbara aktörer tar: näraliggande verktyg tar 800–1 600 kr/mån.",
      "3. Vad kunderna själva sagt: median 900 kr bland de nio svaren, men alla som sa ja har 10 eller fler anställda.",
      "4. Vad som krävs för att gå ihop: kostnadsgolv ~8 500 kr/mån, break-even vid 8 kunder (8 × 1 190 kr = 9 520 kr).",
      "Prissimuleringen (Hiasynth, koncept) från steg 06 stöder 1 000–1 300 kr — 1 190 kr ligger mitt i intervallet.",
    ],
    en: [
      "Price set to SEK 1,190/month excl. VAT, range SEK 900–1,500.",
      "1. What customers can afford: median revenue SEK 4.2M, firms with 10+ employees can afford more than smaller ones.",
      "2. What comparable players charge: adjacent tools charge SEK 800–1,600/month.",
      "3. What customers themselves said: median SEK 900 among the nine responses, but everyone who said yes has 10 or more employees.",
      "4. What's needed to break even: cost floor ~SEK 8,500/month, break-even at 8 customers (8 × SEK 1,190 = SEK 9,520).",
      "The price simulation (Hiasynth, concept) from step 06 supports SEK 1,000–1,300 — SEK 1,190 sits right in the middle.",
    ],
  },
  traceSummaryAfter: {
    sv: "Priset satt: 1 190 kr/mån, motiverat ur fyra underlag. Kostnadsgolv ~8 500 kr/mån, break-even vid 8 kunder.",
    en: "Price set: SEK 1,190/month, justified from four sources. Cost floor ~SEK 8,500/month, break-even at 8 customers.",
  },
  simulationKindAfter: "price",
});

// ---------------------------------------------------------------------------
// Steg 08 · Omfånget
// ---------------------------------------------------------------------------
const step08NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 08 · OMFÅNGET",
    title: "Snäva in MVP:n ur bevisen",
    why: "Bygg bara det de som svarade faktiskt bad om: kvittoförfrågan via sms-länk, uppladdning, status per kund och export.",
    maxPoints: 12,
    estimatedTime: "~15 min",
    doneItems: ["Affärsfallet klart"],
    actionLabel: "Se omfånget",
  },
  en: {
    eyebrow: "STEP 08 · THE SCOPE",
    title: "Narrow the MVP from the evidence",
    why: "Build only what the respondents actually asked for: SMS-link receipt requests, upload, per-customer status and export.",
    maxPoints: 12,
    estimatedTime: "~15 min",
    doneItems: ["Business case done"],
    actionLabel: "See the scope",
  },
};

const step08SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-02-01", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-02-01", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const [step08Fore, step08Korning, step08Efter] = makeStepBeats({
  idPrefix: "08-omfanget",
  stepNumber: 8,
  phaseBefore: "launch",
  phaseAfter: "launch",
  momentLabelBase: { sv: "Omfånget", en: "The scope" },
  nextStep: step08NextStep,
  datesFore: "2026-02-01",
  datesKorning: "2026-02-02",
  datesEfter: "2026-02-03",
  sinceLastTimeFore: step08SinceLastTime,
  sinceLastTimeKorning: step08SinceLastTime,
  sinceLastTimeEfter: step08SinceLastTime,
  partsCarried: step07Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      product: [
        pt(4, källa("Affärsfallet, steg 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Omfånget, steg 08", "2026-02-03"), { dataType: "customer" }),
      ],
      feasibility: [
        pt(2, källa("Affärsfallet, steg 07", "2026-01-28")),
        pt(2, källa("Omfånget, steg 08", "2026-02-03")),
      ],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      product: [
        pt(4, källa("Business case, step 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Scope, step 08", "2026-02-03"), { dataType: "customer" }),
      ],
      feasibility: [
        pt(2, källa("Business case, step 07", "2026-01-28")),
        pt(2, källa("Scope, step 08", "2026-02-03")),
      ],
    },
  ),
  deltaReasonAfter: { sv: "efter omfångsbeslutet", en: "after the scope decision" },
  highlightsAfter: {
    sv: [
      "MVP: kvittoförfrågan via sms-länk, uppladdning, status per kund och export.",
      "Bortvalt med motivering: OCR och egen app — ingen av respondenterna bad om det.",
    ],
    en: [
      "MVP: SMS-link receipt requests, upload, per-customer status and export.",
      "Deliberately cut: OCR and a dedicated app — none of the respondents asked for it.",
    ],
  },
  traceSummaryAfter: {
    sv: "Omfånget snävat in ur bevisen: kvittoförfrågan, uppladdning, status och export — inget mer.",
    en: "Scope narrowed from the evidence: receipt request, upload, status and export — nothing more.",
  },
});

// ---------------------------------------------------------------------------
// Steg 09 · Det formella
// ---------------------------------------------------------------------------
const step09NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 09 · DET FORMELLA",
    title: "Registrera enskild firma",
    why: "Enskild firma till start (låg risk, inget aktiekapital) — byt till AB vid tillväxt. F-skatt, moms och bokföring ordnas samtidigt.",
    maxPoints: 8,
    estimatedTime: "~30 min",
    doneItems: ["Omfånget klart"],
    actionLabel: "Se den juridiska kartan",
  },
  en: {
    eyebrow: "STEP 09 · THE PAPERWORK",
    title: "Register a sole proprietorship",
    why: "Sole proprietorship to start (low risk, no share capital) — switch to a limited company on growth. F-tax, VAT and bookkeeping arranged at the same time.",
    maxPoints: 8,
    estimatedTime: "~30 min",
    doneItems: ["Scope done"],
    actionLabel: "See the legal map",
  },
};

const step09SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-02-05", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-02-05", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const [step09Fore, step09Korning, step09Efter] = makeStepBeats({
  idPrefix: "09-det-formella",
  stepNumber: 9,
  phaseBefore: "launch",
  phaseAfter: "launch",
  momentLabelBase: { sv: "Det formella", en: "The paperwork" },
  nextStep: step09NextStep,
  datesFore: "2026-02-05",
  datesKorning: "2026-02-05",
  datesEfter: "2026-02-06",
  sinceLastTimeFore: step09SinceLastTime,
  sinceLastTimeKorning: step09SinceLastTime,
  sinceLastTimeEfter: step09SinceLastTime,
  partsCarried: step08Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      product: [
        pt(4, källa("Affärsfallet, steg 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Omfånget, steg 08", "2026-02-03"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      product: [
        pt(4, källa("Business case, step 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Scope, step 08", "2026-02-03"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
    },
  ),
  deltaReasonAfter: { sv: "efter registreringen", en: "after registration" },
  highlightsAfter: {
    sv: [
      "Bolagsform: enskild firma.",
      "Juridisk karta: GDPR och personuppgiftsbiträdesavtal, skydd av ekonomiska underlag, B2B-villkor och transparens om AI används.",
    ],
    en: [
      "Company form: sole proprietorship.",
      "Legal map: GDPR and data processing agreements, protection of financial records, B2B terms and transparency about AI use.",
    ],
  },
  traceSummaryAfter: {
    sv: "Enskild firma registrerad hos Bolagsverket, F-skatt och moms ordnat. Juridisk karta klar.",
    en: "Sole proprietorship registered with Bolagsverket, F-tax and VAT arranged. Legal map done.",
  },
});

// ---------------------------------------------------------------------------
// Steg 10 · Live
// ---------------------------------------------------------------------------
const step10NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 10 · LIVE",
    title: "Publicera MVP:n via Lovable",
    why: "Bygg via Lovable (koncept) — från spec till förhandsvisning till publicering på fiktiv domän. Tre pilotbyråer kommer igång gratis.",
    maxPoints: 12,
    estimatedTime: "~1 dag",
    doneItems: ["Det formella klart"],
    actionLabel: "Se bygget",
  },
  en: {
    eyebrow: "STEP 10 · LIVE",
    title: "Publish the MVP via Lovable",
    why: "Build via Lovable (concept) — from spec to preview to publishing on a fictional domain. Three pilot firms get started for free.",
    maxPoints: 12,
    estimatedTime: "~1 day",
    doneItems: ["Paperwork done"],
    actionLabel: "See the build",
  },
};

const step10SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-02-08", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-02-08", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const [step10Fore, step10Korning, step10Efter] = makeStepBeats({
  idPrefix: "10-live",
  stepNumber: 10,
  phaseBefore: "launch",
  phaseAfter: "launch",
  momentLabelBase: { sv: "Live", en: "Live" },
  nextStep: step10NextStep,
  datesFore: "2026-02-08",
  datesKorning: "2026-02-15",
  datesEfter: "2026-02-16",
  sinceLastTimeFore: step10SinceLastTime,
  sinceLastTimeKorning: step10SinceLastTime,
  sinceLastTimeEfter: step10SinceLastTime,
  partsCarried: step09Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [
        pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
        pt(2, källa("Pilotbyråer, steg 10", "2026-02-16"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
        pt(1, källa("Pilotbyråer, steg 10", "2026-02-16"), { dataType: "customer" }),
      ],
      product: [
        pt(4, källa("Affärsfallet, steg 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Omfånget, steg 08", "2026-02-03"), { dataType: "customer" }),
        pt(4, källa("Lovable (koncept), steg 10", "2026-02-16"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [
        pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
        pt(2, källa("Pilot firms, step 10", "2026-02-16"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
        pt(1, källa("Pilot firms, step 10", "2026-02-16"), { dataType: "customer" }),
      ],
      product: [
        pt(4, källa("Business case, step 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Scope, step 08", "2026-02-03"), { dataType: "customer" }),
        pt(4, källa("Lovable (concept), step 10", "2026-02-16"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
    },
  ),
  deltaReasonAfter: { sv: "efter publiceringen", en: "after publishing" },
  highlightsAfter: {
    sv: [
      "Bygg drivs av Lovable · Koncept · partnerskap utforskas.",
      "Från skelett till komponenter till en färdig sida, publicerad på en fiktiv domän.",
      "MVP byggd och publicerad. Tre pilotbyråer kommer igång gratis.",
      "Bygget kostar credits — synligt på Bygg-sidan (62 credits i det här scenariot).",
    ],
    en: [
      "The build is powered by Lovable · Concept · partnership in exploration.",
      "From skeleton to components to a finished page, published to a fictional domain.",
      "MVP built and published. Three pilot firms get started for free.",
      "The build costs credits — visible on the Build page (62 credits in this scenario).",
    ],
  },
  traceSummaryAfter: {
    sv: "MVP publicerad via Lovable (koncept) på en fiktiv domän. Tre pilotbyråer igång gratis.",
    en: "MVP published via Lovable (concept) on a fictional domain. Three pilot firms running for free.",
  },
});

// ---------------------------------------------------------------------------
// Steg 11 · Första kunderna
// ---------------------------------------------------------------------------
const step11NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 11 · FÖRSTA KUNDERNA",
    title: "Kör 30-dagarsplanen",
    why: "LinkedIn, branschnätverk för redovisningskonsulter och Nyföretagarcentrum. Fem betalande byråer ger 5 950 kr i MRR.",
    maxPoints: 14,
    estimatedTime: "~30 dagar",
    doneItems: ["Live klart", "Tre pilotbyråer igång"],
    actionLabel: "Se kunderna",
  },
  en: {
    eyebrow: "STEP 11 · THE FIRST CUSTOMERS",
    title: "Run the 30-day plan",
    why: "LinkedIn, an industry network for accounting consultants and Nyföretagarcentrum. Five paying firms give SEK 5,950 in MRR.",
    maxPoints: 14,
    estimatedTime: "~30 days",
    doneItems: ["Live done", "Three pilot firms running"],
    actionLabel: "See the customers",
  },
};

const step11SinceLastTimeBefore: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-02-17", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-02-17", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const step11SinceLastTimeAfter: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-03-18", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-03-18", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const [step11Fore, step11Korning, step11Efter] = makeStepBeats({
  idPrefix: "11-forsta-kunderna",
  stepNumber: 11,
  phaseBefore: "launch",
  phaseAfter: "grow",
  momentLabelBase: { sv: "Första kunderna", en: "The first customers" },
  nextStep: step11NextStep,
  datesFore: "2026-02-17",
  datesKorning: "2026-02-17",
  datesEfter: "2026-03-18",
  sinceLastTimeFore: step11SinceLastTimeBefore,
  sinceLastTimeKorning: step11SinceLastTimeBefore,
  sinceLastTimeEfter: step11SinceLastTimeAfter,
  partsCarried: step10Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [
        pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
        pt(2, källa("Betalande kunder, steg 11", "2026-03-18"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
        pt(3, källa("Betalande kunder, steg 11", "2026-03-18"), { dataType: "customer" }),
      ],
      product: [
        pt(4, källa("Affärsfallet, steg 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Omfånget, steg 08", "2026-02-03"), { dataType: "customer" }),
        pt(4, källa("Lovable (koncept), steg 10", "2026-02-16"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
      traction: [pt(9, källa("Kundlistan, steg 11", "2026-03-18"), { dataType: "customer" })],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [
        pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
        pt(2, källa("Paying customers, step 11", "2026-03-18"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
        pt(3, källa("Paying customers, step 11", "2026-03-18"), { dataType: "customer" }),
      ],
      product: [
        pt(4, källa("Business case, step 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Scope, step 08", "2026-02-03"), { dataType: "customer" }),
        pt(4, källa("Lovable (concept), step 10", "2026-02-16"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
      traction: [pt(9, källa("Customer list, step 11", "2026-03-18"), { dataType: "customer" })],
    },
  ),
  deltaReasonAfter: { sv: "efter de fem betalande kunderna", en: "after the five paying customers" },
  highlightsAfter: {
    sv: ["30-dagarsplan i svenska kanaler.", "5 betalande byråer, 5 950 kr i MRR."],
    en: ["30-day plan across Swedish channels.", "5 paying firms, SEK 5,950 in MRR."],
  },
  traceSummaryAfter: {
    sv: "30-dagarsplanen gav fem betalande byråer och 5 950 kr i MRR.",
    en: "The 30-day plan brought in five paying firms and SEK 5,950 in MRR.",
  },
});

// ---------------------------------------------------------------------------
// Steg 12 · Kapital
// ---------------------------------------------------------------------------
const step12NextStep: Record<Locale, NextStep> = {
  sv: {
    eyebrow: "STEG 12 · KAPITAL",
    title: "Ansök hos Almi och Vinnova",
    why: "Ansökningsunderlag förberett ur Spåret. Slutvy: Bevisad affär.",
    maxPoints: 14,
    estimatedTime: "~1 vecka",
    doneItems: ["Första kunderna klart", "5 betalande byråer"],
    actionLabel: "Se ansökan",
  },
  en: {
    eyebrow: "STEP 12 · CAPITAL",
    title: "Apply to Almi and Vinnova",
    why: "Application materials prepared from the Trace. Final view: Proven business.",
    maxPoints: 14,
    estimatedTime: "~1 week",
    doneItems: ["First customers done", "5 paying firms"],
    actionLabel: "See the application",
  },
};

const step12SinceLastTimeBefore: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-03-19", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-03-19", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const step12SinceLastTimeAfter: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-04-10", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
  }),
  en: noSinceLastTime("en", "2026-04-10", {
    recipientCount: 40,
    openRate: 38,
    openRateSource: källa("The outreach, step 05", "2026-01-16"),
    reminderSentDateIso: "2026-01-18",
    responsesReceived: 9,
    responsesSource: källa("Customer calls, step 05", "2026-01-20"),
  }),
};

const [step12Fore, step12Korning, step12Efter] = makeStepBeats({
  idPrefix: "12-kapital",
  stepNumber: 12,
  phaseBefore: "grow",
  phaseAfter: "grow",
  momentLabelBase: { sv: "Kapital", en: "Capital" },
  nextStep: step12NextStep,
  datesFore: "2026-03-19",
  datesKorning: "2026-04-03",
  datesEfter: "2026-04-10",
  sinceLastTimeFore: step12SinceLastTimeBefore,
  sinceLastTimeKorning: step12SinceLastTimeBefore,
  sinceLastTimeEfter: step12SinceLastTimeAfter,
  partsCarried: step11Efter.partsByLocale,
  partsAfter: partsBoth(
    {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [
        pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
        pt(2, källa("Betalande kunder, steg 11", "2026-03-18"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
        pt(3, källa("Betalande kunder, steg 11", "2026-03-18"), { dataType: "customer" }),
      ],
      product: [
        pt(4, källa("Affärsfallet, steg 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Omfånget, steg 08", "2026-02-03"), { dataType: "customer" }),
        pt(4, källa("Lovable (koncept), steg 10", "2026-02-16"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
      traction: [pt(13, källa("Kundlistan, steg 12", "2026-04-10"), { dataType: "customer" })],
    },
    {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [
        pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
        pt(2, källa("Paying customers, step 11", "2026-03-18"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
        pt(3, källa("Paying customers, step 11", "2026-03-18"), { dataType: "customer" }),
      ],
      product: [
        pt(4, källa("Business case, step 07", "2026-01-28"), { dataType: "customer" }),
        pt(4, källa("Scope, step 08", "2026-02-03"), { dataType: "customer" }),
        pt(4, källa("Lovable (concept), step 10", "2026-02-16"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-02-06"))],
      traction: [pt(13, källa("Customer list, step 12", "2026-04-10"), { dataType: "customer" })],
    },
  ),
  deltaReasonAfter: { sv: "efter fortsatt traktion", en: "after continued traction" },
  highlightsAfter: {
    sv: ["Almi och Vinnova, med ansökningsunderlag förberett ur Spåret.", "Slutvy: Bevisad affär."],
    en: ["Almi and Vinnova, with application materials prepared from the Trace.", "Final view: Proven business."],
  },
  traceSummaryAfter: {
    sv: "Ansökningar till Almi och Vinnova förberedda ur Spåret. Bevisad affär.",
    en: "Applications to Almi and Vinnova prepared from the Trace. Proven business.",
  },
});

const beats: Beat[] = [
  step01Fore,
  step01Korning,
  step01Efter,
  step02Fore,
  step02Korning,
  step02Efter,
  step03Fore,
  step03Korning,
  step03Efter,
  step04Fore,
  step04Korning,
  step04Efter,
  step05aFore,
  step05aKorning,
  step05aEfter,
  step05bKorning,
  step05bEfter,
  step06Fore,
  step06Korning,
  step06Efter,
  step07Fore,
  step07Korning,
  step07Efter,
  step08Fore,
  step08Korning,
  step08Efter,
  step09Fore,
  step09Korning,
  step09Efter,
  step10Fore,
  step10Korning,
  step10Efter,
  step11Fore,
  step11Korning,
  step11Efter,
  step12Fore,
  step12Korning,
  step12Efter,
];

export const saraBeats: readonly Beat[] = beats;
export type SaraBeat = Beat;

function beatAt(index: number): Beat {
  const clamped = Math.min(beats.length - 1, Math.max(0, index));
  return beats[clamped];
}

/** Exporterad för demoStore.ts (`getCurrentBeat`/`getCurrentStepNumber`) och
 * andra demoadaptrar som behöver veta vad som redan hänt vid ett givet läge. */
export const getBeatAt = beatAt;

export function getCurrentStepNumberFor(beatIndex: number): number {
  return beatAt(beatIndex).stepNumber;
}

/** Ett beats index i `saraBeats`, via dess id — används av Pulsen (progressiv
 * upplåsning av signaler) för att slippa gissa index för hand. */
export function findBeatIndexById(id: string): number {
  return beats.findIndex((beat) => beat.id === id);
}

/** Index för den senaste nådda beaten av ett givet officiellt steg (1–12),
 * `undefined` om steget inte är nått än. Steg 05 har fem beats internt — det
 * är alltid den senast nådda (05b-svaren-efter om den är nådd, annars en
 * tidigare 05-beat) som räknas. */
export function findLatestBeatIndexForStep(stepNumber: number, upToIndex: number): number | undefined {
  let found: number | undefined;
  for (let index = 0; index <= upToIndex && index < beats.length; index += 1) {
    if (beats[index].stepNumber === stepNumber) found = index;
  }
  return found;
}

/** Senaste beaten för ett givet officiellt steg (1–12) som redan nåtts vid
 * `upToIndex` (används av Resan-vyn). */
export function findLatestBeatForStep(stepNumber: number, upToIndex: number): Beat | undefined {
  const index = findLatestBeatIndexForStep(stepNumber, upToIndex);
  return index === undefined ? undefined : beats[index];
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

/** Totalpoängen för varje beat fram till och med `index` (designuppdatering:
 * KPI-radens sparkline, se DESIGN.md). Återanvänder `totalForBeat` — samma
 * beräkning `getScoreSnapshotForBeat` gör, ingen egen poänglogik här. */
export function getScoreHistoryUpToBeat(index: number, locale: Locale): number[] {
  const clamped = Math.min(beats.length - 1, Math.max(0, index));
  return beats.slice(0, clamped + 1).map((beat) => totalForBeat(beat, locale));
}

export function getJourneySummaryForBeat(index: number, locale: Locale): JourneySummary {
  const beat = beatAt(index);
  return {
    todayIso: beat.todayIso,
    nextStep: beat.nextStep[locale],
    sinceLastTime: beat.sinceLastTime[locale],
  };
}

/** De 12 stegen (1.5) för Resan-vyn — en rad per officiellt steg, oavsett
 * att steg 05 har fem beats internt. `journeyPhase` är UI:ts fyra faser
 * (avsnitt 6), skilt från calculateScores fem interna faser (7.3). */
export type JourneyPhaseId = "discover" | "tryPhase" | "launch" | "grow";

export type StepMeta = {
  stepNumber: number;
  journeyPhase: JourneyPhaseId;
  title: Record<Locale, string>;
  oneLiner: Record<Locale, string>;
  maxPoints: number;
};

export const SARA_STEPS: readonly StepMeta[] = [
  {
    stepNumber: 1,
    journeyPhase: "discover",
    title: { sv: "Om dig", en: "About you" },
    oneLiner: {
      sv: "Profilsamtal om bakgrund, kompetens, nätverk, tid, pengar och riskaptit.",
      en: "A profile chat about background, skills, network, time, money and risk appetite.",
    },
    maxPoints: 10,
  },
  {
    stepNumber: 2,
    journeyPhase: "discover",
    title: { sv: "Möjligheter", en: "Opportunities" },
    oneLiner: {
      sv: "Idéer grundade i profilen, korsade med luckor i registret.",
      en: "Ideas grounded in the profile, crossed with gaps in the registry.",
    },
    maxPoints: 12,
  },
  {
    stepNumber: 3,
    journeyPhase: "tryPhase",
    title: { sv: "Marknaden", en: "The market" },
    oneLiner: {
      sv: "Riktiga siffror ur registret: antal företag, storlek, omsättning, tillväxt och geografi.",
      en: "Real numbers from the registry: number of firms, size, revenue, growth and geography.",
    },
    maxPoints: 12,
  },
  {
    stepNumber: 4,
    journeyPhase: "tryPhase",
    title: { sv: "Kunden", en: "The customer" },
    oneLiner: { sv: "Kundprofil ur registret. Resultatet är en lista på namngivna företag.", en: "Customer profile from the registry. The result is a list of named companies." },
    maxPoints: 8,
  },
  {
    stepNumber: 5,
    journeyPhase: "tryPhase",
    title: { sv: "Samtalen", en: "The calls" },
    oneLiner: {
      sv: "Kontaktlista, svensk outreach, öppningar, svar och påminnelse. Bara B2B.",
      en: "Contact list, Swedish outreach, opens, responses and a reminder. B2B only.",
    },
    maxPoints: 18,
  },
  {
    stepNumber: 6,
    journeyPhase: "tryPhase",
    title: { sv: "Domen", en: "The verdict" },
    oneLiner: {
      sv: "Kör, förfina eller pivotera, baserat på faktiska svar med citat och siffror.",
      en: "Go, refine or pivot, based on actual responses with quotes and numbers.",
    },
    maxPoints: 18,
  },
  {
    stepNumber: 7,
    journeyPhase: "launch",
    title: { sv: "Affärsfall och pris", en: "Business case and price" },
    oneLiner: {
      sv: "Svensk kalkyl med moms, arbetsgivaravgifter, F-skatt, kostnadsgolv och break-even.",
      en: "Swedish calculation with VAT, payroll tax, F-tax, cost floor and break-even.",
    },
    maxPoints: 8,
  },
  {
    stepNumber: 8,
    journeyPhase: "launch",
    title: { sv: "Omfånget", en: "The scope" },
    oneLiner: { sv: "MVP ur bevisen. Bygg bara det de som svarade faktiskt bad om.", en: "MVP from the evidence. Build only what respondents actually asked for." },
    maxPoints: 12,
  },
  {
    stepNumber: 9,
    journeyPhase: "launch",
    title: { sv: "Det formella", en: "The paperwork" },
    oneLiner: {
      sv: "Enskild firma eller aktiebolag, Bolagsverket, F-skatt, moms och bokföring.",
      en: "Sole proprietorship or limited company, Bolagsverket, F-tax, VAT and bookkeeping.",
    },
    maxPoints: 8,
  },
  {
    stepNumber: 10,
    journeyPhase: "launch",
    title: { sv: "Live", en: "Live" },
    oneLiner: { sv: "Landningssida eller MVP, byggd och publicerad.", en: "Landing page or MVP, built and published." },
    maxPoints: 12,
  },
  {
    stepNumber: 11,
    journeyPhase: "grow",
    title: { sv: "Första kunderna", en: "The first customers" },
    oneLiner: {
      sv: "30-dagarsplan i svenska kanaler: LinkedIn, branschforum, Nyföretagarcentrum.",
      en: "30-day plan across Swedish channels: LinkedIn, industry forums, Nyföretagarcentrum.",
    },
    maxPoints: 14,
  },
  {
    stepNumber: 12,
    journeyPhase: "grow",
    title: { sv: "Kapital", en: "Capital" },
    oneLiner: {
      sv: "Almi, Vinnova, Tillväxtverket, regionala medel, banklån och bootstrapping.",
      en: "Almi, Vinnova, Tillväxtverket, regional funds, bank loans and bootstrapping.",
    },
    maxPoints: 14,
  },
];

/** Kandidater för "Höj din poäng" (7.6) — en per del, alltid samma
 * förklaring oavsett beat. `deriveSuggestions` (core/score.ts) filtrerar
 * bort låsta delar och sorterar efter poäng per minut, så det är
 * filtreringen/sorteringen som är "härledd med kod", inte den här listan. */
export const saraSuggestionCandidates: Record<Locale, ScoreSuggestionInput[]> = {
  sv: [
    {
      partId: "market",
      label: "Marknad",
      gapType: "insufficient",
      pointsGain: 3,
      estimatedMinutes: 15,
      explanation: "Bara delar av registret är hämtat — hämta hela marknadsbilden för fler poäng.",
      actionLabel: "Se marknadsbilden",
    },
    {
      partId: "competition",
      label: "Konkurrens",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 10,
      explanation: "Bara tre konkurrenter kartlagda ytligt — gräv djupare i deras prissättning.",
      actionLabel: "Se konkurrenterna",
    },
    {
      partId: "fit",
      label: "Passform",
      gapType: "structural",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "Du kan inte bygga produkten själv. Löses av Lovable-bygget i steg 10 — inte av mer arbete nu.",
      actionLabel: "Läs om bygget",
    },
    {
      partId: "problem",
      label: "Problem",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 30,
      explanation: "Fler kundsamtal stärker problembekräftelsen ytterligare.",
      actionLabel: "Boka fler samtal",
    },
    {
      partId: "willingnessToPay",
      label: "Betalningsvilja",
      gapType: "contradicting",
      pointsGain: 6,
      estimatedMinutes: 60,
      explanation: "3 av 9 säger nej till priset — prata med fem kunder till i det smalare segmentet innan du bygger vidare.",
      actionLabel: "Boka fler samtal",
    },
    {
      partId: "product",
      label: "Produkt",
      gapType: "insufficient",
      pointsGain: 4,
      estimatedMinutes: 120,
      explanation: "MVP:n är inte helt byggd än — färdigställ enligt omfånget från steg 08.",
      actionLabel: "Se omfånget",
    },
    {
      partId: "feasibility",
      label: "Genomförbarhet",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 20,
      explanation: "Registrera bolagsformen och ordna F-skatt och moms.",
      actionLabel: "Se det formella",
    },
    {
      partId: "traction",
      label: "Traktion",
      gapType: "insufficient",
      pointsGain: 5,
      estimatedMinutes: 480,
      explanation: "Fler betalande kunder stärker traktionen mot Bevisad affär.",
      actionLabel: "Se kunderna",
    },
  ],
  en: [
    {
      partId: "market",
      label: "Market",
      gapType: "insufficient",
      pointsGain: 3,
      estimatedMinutes: 15,
      explanation: "Only part of the registry is fetched — pull the full market picture for more points.",
      actionLabel: "See the market picture",
    },
    {
      partId: "competition",
      label: "Competition",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 10,
      explanation: "Only three competitors mapped shallowly — dig deeper into their pricing.",
      actionLabel: "See the competitors",
    },
    {
      partId: "fit",
      label: "Fit",
      gapType: "structural",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "You can't build the product yourself. Solved by the Lovable build in step 10 — not by more work now.",
      actionLabel: "Read about the build",
    },
    {
      partId: "problem",
      label: "Problem",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 30,
      explanation: "More customer calls further strengthen the problem confirmation.",
      actionLabel: "Book more calls",
    },
    {
      partId: "willingnessToPay",
      label: "Willingness to pay",
      gapType: "contradicting",
      pointsGain: 6,
      estimatedMinutes: 60,
      explanation: "3 of 9 say no to the price — talk to five more customers in the narrower segment before building further.",
      actionLabel: "Book more calls",
    },
    {
      partId: "product",
      label: "Product",
      gapType: "insufficient",
      pointsGain: 4,
      estimatedMinutes: 120,
      explanation: "The MVP isn't fully built yet — finish it per the scope from step 08.",
      actionLabel: "See the scope",
    },
    {
      partId: "feasibility",
      label: "Feasibility",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 20,
      explanation: "Register the company form and arrange F-tax and VAT.",
      actionLabel: "See the paperwork",
    },
    {
      partId: "traction",
      label: "Traction",
      gapType: "insufficient",
      pointsGain: 5,
      estimatedMinutes: 480,
      explanation: "More paying customers strengthen traction toward Proven business.",
      actionLabel: "See the customers",
    },
  ],
};

/** Saras resa som en `JourneyEngine` (adapters/demo/journeyEngine.ts) —
 * gör motorn utbytbar mot `jonasEngine` för ingångsmedvetna demoadaptrar. */
export const saraEngine: JourneyEngine = {
  beats: saraBeats,
  steps: SARA_STEPS,
  suggestionCandidates: saraSuggestionCandidates,
  getBeatAt,
  getCurrentStepNumberFor,
  findBeatIndexById,
  findLatestBeatIndexForStep,
  findLatestBeatForStep,
  getScoreSnapshotForBeat,
  getScoreHistoryUpToBeat,
  getJourneySummaryForBeat,
};
