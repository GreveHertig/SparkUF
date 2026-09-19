// Jonas Bergs fulla scenario (docs/uppdrag.md 9.4) — Persona B, "Jag har
// redan en idé". Poängen sätts aldrig här — varje beat bygger PartEvidence
// och låter calculateScore (core/score.ts) räkna den. Samma verktyg
// (`källa`/`pt`/`parts`/`partsBoth`/`noSinceLastTime`/`makeStepBeats` osv.)
// återanvänds rakt av från adapters/demo/sara.ts, exporterade därifrån för
// just det här syftet.
//
// Omfång (avsedd avgränsning, se docs/status.md): Jonas byggs i BREDD, ett
// moment ("after") per steg — inte i samma tre-momentsdjup (före/körning/
// efter) som Saras steg 01–12 fick i tidigare sessioner. Idégenomlysningen
// och det kortare passform-samtalet händer redan i onboardingen
// (adapters/demo/ProjectRepository.ts / ProfileRepository.ts) — steg 01/02
// här representerar det som redan hänt DÄR, inte nya moment att klicka
// igenom i /demo/app.
//
// Pivoten i steg 06 (9.4): hallägarna vill inte ha dynamisk prissättning —
// modelleras som en motsägande bevispost i Betalningsvilja (samma mekanik
// som Saras steg 05b), vilket sänker poängen från 41 till 38. "Efter nya
// samtal" är ett eget kontrollpunkt mellan steg 06 och 07 (9.4:s tabell),
// byggt som ett andra steg-06-beat — samma mönster som Saras 05a/05b.
//
// Kalibrering (9.4, samma ±2-tolerans som 9.3): alla tolv kontrollpunkterna
// träffar sina målvärden EXAKT (12, 22, 28, 41, 38, 52, 58, 64, 68, 76, 86,
// 89) — verifierat med ett tillfälligt testskript (inte kvarlämnat, se
// docs/status.md för mönstret). Marknad/Konkurrens/Passform låses tidigt
// (steg 04) och hålls sedan fasta, precis som i Saras scenario — samma
// arkitektoniska begränsning (docs/status.md, Session "Saras steg 01-06 i
// djup") gäller här också.
import type { Locale } from "@/i18n/context";
import type { NextStep, SinceLastTime, Profile } from "@/core/domain";
import type { JourneySummary } from "@/ports/JourneyRepository";
import type { JourneyEngine } from "./journeyEngine";
import {
  calculateScore,
  type PartEvidence,
  type PhaseId,
  type ScoreSuggestionInput,
} from "@/core/score";
import {
  källa,
  pt,
  partsBoth,
  noSinceLastTime,
  zeroSinceLastTimeBoth,
  withMoment,
  type Beat,
  type StepMeta,
} from "./sara";

export const jonasProfile: Profile = {
  name: "Jonas Berg",
  initials: "JB",
};

export const jonasBackground: Record<Locale, { role: string; bio: string; quote: string }> = {
  sv: {
    role: "31 år, Göteborg",
    bio: "Åtta år som B2B-säljare. Spelar padel varje vecka, ingen kodvana.",
    quote: "Jag har sålt B2B i åtta år och spelar padel varje vecka — jag ser tomma banor hela tiden.",
  },
  en: {
    role: "31, Gothenburg",
    bio: "Eight years as a B2B salesperson. Plays padel every week, no coding experience.",
    quote: "I've sold B2B for eight years and play padel every week — I see empty courts all the time.",
  },
};

export const jonasResources: Record<Locale, { time: string; money: string; risk: string }> = {
  sv: { time: "Kvällar och helger till att börja med", money: "50 000 kr sparat", risk: "Hög riskaptit" },
  en: { time: "Evenings and weekends to start", money: "SEK 50,000 saved", risk: "High risk appetite" },
};

type JonasStepInput = {
  id: string;
  stepNumber: number;
  phase: PhaseId;
  todayIso: string;
  momentLabelBase: Record<Locale, string>;
  nextStep: Record<Locale, NextStep>;
  sinceLastTime: Record<Locale, SinceLastTime>;
  parts: Record<Locale, PartEvidence[]>;
  deltaReason: Record<Locale, string>;
  highlights: Record<Locale, string[]>;
  traceSummary: Record<Locale, string>;
  verdict?: Record<Locale, { headline: string; reasoning: string }>;
};

/** Ett enda "after"-moment per kontrollpunkt (se avgränsningen ovan) —
 * motsvarar Saras `makeStepBeats`s tredje element, utan ett eget "-fore"/
 * "-korning"-par. */
function makeJonasBeat(input: JonasStepInput): Beat {
  return {
    id: input.id,
    stepNumber: input.stepNumber,
    phase: input.phase,
    todayIso: input.todayIso,
    momentKind: "after",
    momentLabel: withMoment(input.momentLabelBase, "after"),
    nextStep: input.nextStep,
    sinceLastTime: input.sinceLastTime,
    partsByLocale: input.parts,
    deltaReason: input.deltaReason,
    highlights: input.highlights,
    traceSummary: input.traceSummary,
    verdict: input.verdict,
  };
}

// ---------------------------------------------------------------------------
// Steg 01 · Om dig (passform-samtalet, redan fört i onboardingen)
// ---------------------------------------------------------------------------
const step01: Beat = makeJonasBeat({
  id: "01-om-dig",
  stepNumber: 1,
  phase: "discover",
  todayIso: "2026-02-02",
  momentLabelBase: { sv: "Om dig", en: "About you" },
  nextStep: {
    sv: {
      eyebrow: "STEG 01 · OM DIG",
      title: "Passform-samtalet är klart",
      why: "Ett kortare samtal med fokus på passform, efter idégenomlysningen — din säljbakgrund vägs mot den skarpare idén.",
      maxPoints: 10,
      estimatedTime: "~5 min",
      doneItems: [],
      actionLabel: "Se profilen",
    },
    en: {
      eyebrow: "STEP 01 · ABOUT YOU",
      title: "The fit chat is done",
      why: "A shorter chat focused on fit, after the idea screening — your sales background weighed against the sharper idea.",
      maxPoints: 10,
      estimatedTime: "~5 min",
      doneItems: [],
      actionLabel: "See the profile",
    },
  },
  sinceLastTime: zeroSinceLastTimeBoth("2026-02-02"),
  parts: partsBoth(
    { fit: [pt(4, källa("Profilsamtal", "2026-02-02"))], market: [pt(1, källa("Bolagsverket", "2026-01-03"))] },
    { fit: [pt(4, källa("Profile chat", "2026-02-02"))], market: [pt(1, källa("Bolagsverket", "2026-01-03"))] },
  ),
  deltaReason: { sv: "efter passform-samtalet", en: "after the fit chat" },
  highlights: {
    sv: [
      "Åtta år som B2B-säljare, ingen kodvana.",
      "Kvällar och helger till att börja med, 50 000 kr sparat, hög riskaptit.",
      "Passform mot en konsumentmarknadsplats var svag — genomlysningen pekade mot ett B2B-verktyg i stället.",
    ],
    en: [
      "Eight years as a B2B salesperson, no coding experience.",
      "Evenings and weekends to start, SEK 50,000 saved, high risk appetite.",
      "Fit against a consumer marketplace was weak — the screening pointed to a B2B tool instead.",
    ],
  },
  traceSummary: {
    sv: "Passform-samtalet klart — säljbakgrunden är en styrka mot hallägare, inte mot spelare.",
    en: "Fit chat done — the sales background is a strength with hall owners, not with players.",
  },
});

// ---------------------------------------------------------------------------
// Steg 02 · Genomlysningen (redan visad i onboardingen som /demo/start/ide)
// ---------------------------------------------------------------------------
const step02: Beat = makeJonasBeat({
  id: "02-genomlysningen",
  stepNumber: 2,
  phase: "discover",
  todayIso: "2026-02-02",
  momentLabelBase: { sv: "Genomlysningen", en: "The screening" },
  nextStep: {
    sv: {
      eyebrow: "STEG 02 · GENOMLYSNINGEN",
      title: "Skarpare idé: Beläggningsprognosen",
      why: "Idén bröts ner i fem antaganden, en första registerbild visades, och Medgrundaren föreslog en skarpare, B2B-version.",
      maxPoints: 12,
      estimatedTime: "~10 min",
      doneItems: ["Passform-samtalet klart"],
      actionLabel: "Se genomlysningen",
    },
    en: {
      eyebrow: "STEP 02 · THE SCREENING",
      title: "Sharper idea: The Occupancy Forecast",
      why: "The idea was broken into five assumptions, a first registry picture was shown, and the co-founder suggested a sharper, B2B version.",
      maxPoints: 12,
      estimatedTime: "~10 min",
      doneItems: ["Fit chat done"],
      actionLabel: "See the screening",
    },
  },
  sinceLastTime: zeroSinceLastTimeBoth("2026-02-02"),
  parts: partsBoth(
    {
      fit: [pt(4, källa("Profilsamtal", "2026-02-02")), pt(2, källa("Genomlysningen", "2026-02-02"))],
      market: [pt(1, källa("Bolagsverket", "2026-01-03")), pt(5, källa("Bolagsverket", "2026-02-02"))],
    },
    {
      fit: [pt(4, källa("Profile chat", "2026-02-02")), pt(2, källa("Screening", "2026-02-02"))],
      market: [pt(1, källa("Bolagsverket", "2026-01-03")), pt(5, källa("Bolagsverket", "2026-02-02"))],
    },
  ),
  deltaReason: { sv: "efter genomlysningen", en: "after the screening" },
  highlights: {
    sv: [
      "Ursprunglig idé: en app där spelare bokar rabatterade lediga tider i sista minuten.",
      "412 padelhallsbolag i Sverige (SNI 93.110), fallande nyregistreringar, ökande nedläggningar.",
      "Svaghet: en konsumentmarknadsplats — befintliga bokningssystem äger redan spelarna, Jonas har ingen distribution.",
      "Skarpare idé: Beläggningsprognosen — ett B2B-verktyg för beläggningsprognos och dynamisk prissättning åt hallägare.",
    ],
    en: [
      "Original idea: an app where players book discounted last-minute slots.",
      "412 padel-court companies in Sweden (SNI 93.110), falling new registrations, rising closures.",
      "Weakness: a consumer marketplace — existing booking systems already own the players, Jonas has no distribution.",
      "Sharper idea: The Occupancy Forecast — a B2B tool for occupancy forecasting and dynamic pricing for hall owners.",
    ],
  },
  traceSummary: {
    sv: "Genomlysning klar. Pivot till Beläggningsprognosen — ett B2B-verktyg åt hallägare.",
    en: "Screening done. Pivoted to The Occupancy Forecast — a B2B tool for hall owners.",
  },
});

// ---------------------------------------------------------------------------
// Steg 03 · Marknaden
// ---------------------------------------------------------------------------
const step03: Beat = makeJonasBeat({
  id: "03-marknaden",
  stepNumber: 3,
  phase: "tryBeforeCalls",
  todayIso: "2026-02-05",
  momentLabelBase: { sv: "Marknaden", en: "The market" },
  nextStep: {
    sv: {
      eyebrow: "STEG 03 · MARKNADEN",
      title: "Registerbilden fördjupad",
      why: "412 padelhallsbolag, beläggningsmönster och två konkurrerande bokningssystem kartlagda.",
      maxPoints: 12,
      estimatedTime: "~10 min",
      doneItems: ["Passform-samtalet klart", "Genomlysningen klar"],
      actionLabel: "Öppna marknadsbilden",
    },
    en: {
      eyebrow: "STEP 03 · THE MARKET",
      title: "The registry picture deepened",
      why: "412 padel-court companies, occupancy patterns and two competing booking systems mapped.",
      maxPoints: 12,
      estimatedTime: "~10 min",
      doneItems: ["Fit chat done", "Screening done"],
      actionLabel: "Open the market picture",
    },
  },
  sinceLastTime: zeroSinceLastTimeBoth("2026-02-05"),
  parts: partsBoth(
    {
      fit: [pt(4, källa("Profilsamtal", "2026-02-02")), pt(2, källa("Genomlysningen", "2026-02-02"))],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05"))],
    },
    {
      fit: [pt(4, källa("Profile chat", "2026-02-02")), pt(2, källa("Screening", "2026-02-02"))],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05"))],
    },
  ),
  deltaReason: { sv: "efter registerdata", en: "after registry data" },
  highlights: {
    sv: [
      "412 padelhallsbolag (SNI 93.110), 8 nyregistrerade senaste kvartalet (ner från 19), 34 nedläggningar senaste året (upp från 21).",
      "Två fiktiva bokningssystem identifierade — BanBokarn och Hallkalendern — ingen erbjuder beläggningsprognos i dag.",
    ],
    en: [
      "412 padel-court companies (SNI 93.110), 8 new registrations last quarter (down from 19), 34 closures last year (up from 21).",
      "Two fictional booking systems identified — BanBokarn and Hallkalendern — neither offers occupancy forecasting today.",
    ],
  },
  traceSummary: {
    sv: "Marknadsbilden fördjupad: 412 hallbolag, två konkurrerande bokningssystem utan prognosfunktion.",
    en: "Market picture deepened: 412 hall companies, two competing booking systems without forecasting.",
  },
});

// ---------------------------------------------------------------------------
// Steg 04 · Kunden
// ---------------------------------------------------------------------------
const step04: Beat = makeJonasBeat({
  id: "04-kunden",
  stepNumber: 4,
  phase: "tryBeforeCalls",
  todayIso: "2026-02-09",
  momentLabelBase: { sv: "Kunden", en: "The customer" },
  nextStep: {
    sv: {
      eyebrow: "STEG 04 · KUNDEN",
      title: "Kundprofilen och listan på hallar",
      why: "Kundprofil ur registret: hallar med 3+ banor och regelbunden beläggning över 60 %. Resultatet är en lista på 25 namngivna hallar.",
      maxPoints: 8,
      estimatedTime: "~10 min",
      doneItems: ["Marknadsbilden klar"],
      actionLabel: "Öppna hallistan",
    },
    en: {
      eyebrow: "STEP 04 · THE CUSTOMER",
      title: "The customer profile and hall list",
      why: "Customer profile from the registry: halls with 3+ courts and regular occupancy above 60%. The result is a list of 25 named halls.",
      maxPoints: 8,
      estimatedTime: "~10 min",
      doneItems: ["Market picture done"],
      actionLabel: "Open the hall list",
    },
  },
  sinceLastTime: zeroSinceLastTimeBoth("2026-02-09"),
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
    },
  ),
  deltaReason: { sv: "efter kundprofilen", en: "after the customer profile" },
  highlights: {
    sv: [
      "Kundprofil: hallar med 3 eller fler banor och regelbunden beläggning över 60 %.",
      "25 namngivna hallar matchar profilen.",
      "Konkurrentbilden fördjupad: varken BanBokarn eller Hallkalendern erbjuder prognos eller fyllnadskampanjer.",
    ],
    en: [
      "Customer profile: halls with 3 or more courts and regular occupancy above 60%.",
      "25 named halls match the profile.",
      "Competitor picture deepened: neither BanBokarn nor Hallkalendern offers forecasting or fill campaigns.",
    ],
  },
  traceSummary: {
    sv: "Hallistan klar: 25 namngivna hallar som matchar profilen.",
    en: "Hall list done: 25 named halls matching the profile.",
  },
});

// ---------------------------------------------------------------------------
// Steg 05 · Samtalen
// ---------------------------------------------------------------------------
const step05SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-02-16", {
    recipientCount: 25,
    openRate: 44,
    openRateSource: källa("Utskicket, steg 05", "2026-02-12"),
    reminderSentDateIso: "2026-02-14",
    responsesReceived: 8,
    responsesSource: källa("Kundsamtal, steg 05", "2026-02-16"),
  }),
  en: noSinceLastTime("en", "2026-02-16", {
    recipientCount: 25,
    openRate: 44,
    openRateSource: källa("The outreach, step 05", "2026-02-12"),
    reminderSentDateIso: "2026-02-14",
    responsesReceived: 8,
    responsesSource: källa("Customer calls, step 05", "2026-02-16"),
  }),
};

const step05: Beat = makeJonasBeat({
  id: "05-samtalen",
  stepNumber: 5,
  phase: "tryAfterCalls",
  todayIso: "2026-02-16",
  momentLabelBase: { sv: "Samtalen", en: "The calls" },
  nextStep: {
    sv: {
      eyebrow: "STEG 05 · SAMTALEN",
      title: "8 hallägare svarar",
      why: "Svenskt B2B-mejl skickat till 25 hallar. 8 svar bekräftar beläggningsproblemet och visar tidigt intresse för dynamisk prissättning.",
      maxPoints: 18,
      estimatedTime: "~20 min",
      doneItems: ["Marknadsbilden klar", "Hallistan klar"],
      actionLabel: "Se svaren",
    },
    en: {
      eyebrow: "STEP 05 · THE CALLS",
      title: "8 hall owners respond",
      why: "Swedish B2B email sent to 25 halls. 8 responses confirm the occupancy problem and show early interest in dynamic pricing.",
      maxPoints: 18,
      estimatedTime: "~20 min",
      doneItems: ["Market picture done", "Hall list done"],
      actionLabel: "See the responses",
    },
  },
  sinceLastTime: step05SinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" })],
      willingnessToPay: [pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" })],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" })],
      willingnessToPay: [pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" })],
    },
  ),
  deltaReason: { sv: "efter de första 8 svaren", en: "after the first 8 responses" },
  highlights: {
    sv: [
      "Svenskt B2B-mejl skickat till 25 hallar, 44 % öppningsfrekvens.",
      "8 svar: alla bekräftar att outnyttjad kapacitet är ett verkligt problem.",
      "Tidigt intresse för dynamisk prissättning av lediga tider.",
    ],
    en: [
      "Swedish B2B email sent to 25 halls, 44% open rate.",
      "8 responses: all confirm unused capacity is a real problem.",
      "Early interest in dynamic pricing of open slots.",
    ],
  },
  traceSummary: {
    sv: "8 hallägare svarar — beläggningsproblemet bekräftat, tidigt intresse för dynamisk prissättning.",
    en: "8 hall owners respond — the occupancy problem confirmed, early interest in dynamic pricing.",
  },
});

// ---------------------------------------------------------------------------
// Steg 06a · Domen (pivot — poängen sjunker)
// ---------------------------------------------------------------------------
const step06aMomentLabelBase: Record<Locale, string> = { sv: "Domen · pivot", en: "The verdict · pivot" };

const step06a: Beat = makeJonasBeat({
  id: "06a-pivot",
  stepNumber: 6,
  phase: "tryAfterCalls",
  todayIso: "2026-02-18",
  momentLabelBase: step06aMomentLabelBase,
  nextStep: {
    sv: {
      eyebrow: "STEG 06 · DOMEN",
      title: "Pivotera: hallägarna vill inte ha dynamisk prissättning",
      why: "En närmare läsning av de 8 svaren visar att hallägarna avvisar dynamisk prissättning specifikt — men vill fortfarande ha prognosen.",
      maxPoints: 18,
      estimatedTime: "~15 min",
      doneItems: ["Marknadsbilden klar", "Hallistan klar", "Samtalen klara"],
      actionLabel: "Se domen",
    },
    en: {
      eyebrow: "STEP 06 · THE VERDICT",
      title: "Pivot: hall owners don't want dynamic pricing",
      why: "A closer read of the 8 responses shows hall owners specifically reject dynamic pricing — but still want the forecast.",
      maxPoints: 18,
      estimatedTime: "~15 min",
      doneItems: ["Market picture done", "Hall list done", "Calls done"],
      actionLabel: "See the verdict",
    },
  },
  sinceLastTime: step05SinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" })],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
      ],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" })],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
      ],
    },
  ),
  deltaReason: { sv: "efter pivoten", en: "after the pivot" },
  highlights: {
    sv: [
      "Pivot: bort från dynamisk prissättning, mot beläggningsprognos och fyllnadskampanjer.",
      "Betalningsviljan bygger nu på en motsägande post — hallägarna sa nej till just prissättningsdelen — och straffas 15 % för ett skevt underlag.",
      "Poängen sjunker från 41 till 38. Samma regel som Saras steg 05: motsägande svar räknas fullt ut, aldrig gömda.",
    ],
    en: [
      "Pivot: away from dynamic pricing, toward occupancy forecasting and fill campaigns.",
      "Willingness to pay now rests on a contradicting item — hall owners said no to the pricing part specifically — and is penalized 15% for a skewed sample.",
      "The score drops from 41 to 38. Same rule as Sara's step 05: contradicting responses always count in full, never hidden.",
    ],
  },
  traceSummary: {
    sv: "Domen: pivotera bort från dynamisk prissättning. Poängen sjunker till 38 — skevt underlag straffas.",
    en: "Verdict: pivot away from dynamic pricing. Score drops to 38 — a skewed sample is penalized.",
  },
  verdict: {
    sv: {
      headline: "Pivotera · bort från dynamisk prissättning",
      reasoning:
        "Alla 8 bekräftar beläggningsproblemet, men hallägarna avvisar specifikt dynamisk prissättning — de vill inte att spelare ska se olika priser. Prognosen och fyllnadskampanjer är däremot fortfarande intressanta.",
    },
    en: {
      headline: "Pivot · away from dynamic pricing",
      reasoning:
        "All 8 confirm the occupancy problem, but hall owners specifically reject dynamic pricing — they don't want players to see different prices. The forecast and fill campaigns are still of interest, though.",
    },
  },
});

// ---------------------------------------------------------------------------
// Steg 06b · Efter nya samtal
// ---------------------------------------------------------------------------
const step06bMomentLabelBase: Record<Locale, string> = { sv: "Efter nya samtal", en: "After new calls" };

const step06bSinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-02-24", {
    recipientCount: 25,
    openRate: 44,
    openRateSource: källa("Utskicket, steg 05", "2026-02-12"),
    reminderSentDateIso: "2026-02-14",
    responsesReceived: 13,
    responsesSource: källa("Kundsamtal, steg 06", "2026-02-24"),
  }),
  en: noSinceLastTime("en", "2026-02-24", {
    recipientCount: 25,
    openRate: 44,
    openRateSource: källa("The outreach, step 05", "2026-02-12"),
    reminderSentDateIso: "2026-02-14",
    responsesReceived: 13,
    responsesSource: källa("Customer calls, step 06", "2026-02-24"),
  }),
};

const step06b: Beat = makeJonasBeat({
  id: "06b-nya-samtal",
  stepNumber: 6,
  phase: "tryAfterCalls",
  todayIso: "2026-02-24",
  momentLabelBase: step06bMomentLabelBase,
  nextStep: {
    sv: {
      eyebrow: "STEG 06 · EFTER NYA SAMTAL",
      title: "5 nya svar bekräftar den pivotade idén",
      why: "Jonas går tillbaka till hallarna med den skarpare idén — prognos och fyllnadskampanjer, ingen dynamisk prissättning. 5 nya svar, 13 totalt.",
      maxPoints: 18,
      estimatedTime: "~15 min",
      doneItems: ["Samtalen klara", "Domen: pivotera"],
      actionLabel: "Se de nya svaren",
    },
    en: {
      eyebrow: "STEP 06 · AFTER NEW CALLS",
      title: "5 new responses confirm the pivoted idea",
      why: "Jonas goes back to the halls with the sharper idea — forecast and fill campaigns, no dynamic pricing. 5 new responses, 13 total.",
      maxPoints: 18,
      estimatedTime: "~15 min",
      doneItems: ["Calls done", "Verdict: pivot"],
      actionLabel: "See the new responses",
    },
  },
  sinceLastTime: step06bSinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
    },
  ),
  deltaReason: { sv: "efter 5 nya svar på den pivotade idén", en: "after 5 new responses to the pivoted idea" },
  highlights: {
    sv: [
      "5 nya svar, 13 totalt — samtliga positiva till prognos och fyllnadskampanjer utan dynamisk prissättning.",
      "Poängen stiger till 52. Betalningsviljan är fortfarande skevt straffad (en motsägande post kvarstår), men de nya svaren väger tyngre.",
    ],
    en: [
      "5 new responses, 13 total — all positive on the forecast and fill campaigns without dynamic pricing.",
      "The score rises to 52. Willingness to pay is still penalized for skew (one contradicting item remains), but the new responses weigh heavier.",
    ],
  },
  traceSummary: {
    sv: "5 nya hallägare bekräftar den pivotade idén. Poängen stiger till 52.",
    en: "5 new hall owners confirm the pivoted idea. Score rises to 52.",
  },
});

// ---------------------------------------------------------------------------
// Steg 07 · Affärsfall och pris
// ---------------------------------------------------------------------------
const step07: Beat = makeJonasBeat({
  id: "07-affarsfall",
  stepNumber: 7,
  phase: "launch",
  todayIso: "2026-03-02",
  momentLabelBase: { sv: "Affärsfall och pris", en: "Business case and price" },
  nextStep: {
    sv: {
      eyebrow: "STEG 07 · AFFÄRSFALL OCH PRIS",
      title: "Sätt priset: 1 900 kr/mån exkl. moms",
      why: "Svensk kalkyl med moms, arbetsgivaravgifter och F-skatt. Priset motiveras ur vad hallarna tål, vad BanBokarn/Hallkalendern tar för tilläggstjänster, och vad de 13 svaren själva sagt.",
      maxPoints: 8,
      estimatedTime: "~15 min",
      doneItems: ["Samtalen klara", "Nya samtal klara"],
      actionLabel: "Se kalkylen",
    },
    en: {
      eyebrow: "STEP 07 · BUSINESS CASE AND PRICE",
      title: "Set the price: SEK 1,900/month excl. VAT",
      why: "Swedish calculation with VAT, payroll tax and F-tax. The price is justified from what the halls can afford, what BanBokarn/Hallkalendern charge for add-ons, and what the 13 responses themselves said.",
      maxPoints: 8,
      estimatedTime: "~15 min",
      doneItems: ["Calls done", "New calls done"],
      actionLabel: "See the calculation",
    },
  },
  sinceLastTime: step06bSinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      product: [pt(3, källa("Affärsfallet, steg 07", "2026-03-02"), { dataType: "customer" })],
      feasibility: [pt(3, källa("Affärsfallet, steg 07", "2026-03-02"))],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      product: [pt(3, källa("Business case, step 07", "2026-03-02"), { dataType: "customer" })],
      feasibility: [pt(3, källa("Business case, step 07", "2026-03-02"))],
    },
  ),
  deltaReason: { sv: "efter affärsfallet", en: "after the business case" },
  highlights: {
    sv: [
      "Pris satt till 1 900 kr/mån exkl. moms per hall.",
      "1. Vad hallarna tål: hallar med 3+ banor och 60 %+ beläggning har marginal för verktyget.",
      "2. Vad jämförbara tjänster tar: BanBokarns tilläggsmoduler tar 1 200–2 500 kr/mån.",
      "3. Vad hallägarna själva sagt: samtliga 13 svar nämner ett pris under 2 500 kr som rimligt.",
      "4. Vad som krävs för att gå ihop: kostnadsgolv ~9 000 kr/mån, break-even vid 5 kunder (5 × 1 900 kr = 9 500 kr).",
    ],
    en: [
      "Price set to SEK 1,900/month excl. VAT per hall.",
      "1. What the halls can afford: halls with 3+ courts and 60%+ occupancy have margin for the tool.",
      "2. What comparable services charge: BanBokarn's add-on modules charge SEK 1,200–2,500/month.",
      "3. What hall owners themselves said: all 13 responses mention a price under SEK 2,500 as reasonable.",
      "4. What's needed to break even: cost floor ~SEK 9,000/month, break-even at 5 customers (5 × SEK 1,900 = SEK 9,500).",
    ],
  },
  traceSummary: {
    sv: "Priset satt: 1 900 kr/mån per hall. Kostnadsgolv ~9 000 kr/mån, break-even vid 5 kunder.",
    en: "Price set: SEK 1,900/month per hall. Cost floor ~SEK 9,000/month, break-even at 5 customers.",
  },
});

// ---------------------------------------------------------------------------
// Steg 08 · Omfånget
// ---------------------------------------------------------------------------
const step08: Beat = makeJonasBeat({
  id: "08-omfanget",
  stepNumber: 8,
  phase: "launch",
  todayIso: "2026-03-06",
  momentLabelBase: { sv: "Omfånget", en: "The scope" },
  nextStep: {
    sv: {
      eyebrow: "STEG 08 · OMFÅNGET",
      title: "MVP: prognos-dashboard och fyllnadskampanjer",
      why: "Bygg bara det de 13 svaren faktiskt bad om: en beläggningsprognos per vecka och ett verktyg för att skicka fyllnadskampanjer.",
      maxPoints: 12,
      estimatedTime: "~15 min",
      doneItems: ["Affärsfallet klart"],
      actionLabel: "Se omfånget",
    },
    en: {
      eyebrow: "STEP 08 · THE SCOPE",
      title: "MVP: forecast dashboard and fill campaigns",
      why: "Build only what the 13 responses actually asked for: a weekly occupancy forecast and a tool for sending fill campaigns.",
      maxPoints: 12,
      estimatedTime: "~15 min",
      doneItems: ["Business case done"],
      actionLabel: "See the scope",
    },
  },
  sinceLastTime: step06bSinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Affärsfallet, steg 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Omfånget, steg 08", "2026-03-06"), { dataType: "customer" }),
      ],
      feasibility: [
        pt(3, källa("Affärsfallet, steg 07", "2026-03-02")),
        pt(3, källa("Omfånget, steg 08", "2026-03-06")),
      ],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Business case, step 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Scope, step 08", "2026-03-06"), { dataType: "customer" }),
      ],
      feasibility: [
        pt(3, källa("Business case, step 07", "2026-03-02")),
        pt(3, källa("Scope, step 08", "2026-03-06")),
      ],
    },
  ),
  deltaReason: { sv: "efter omfångsbeslutet", en: "after the scope decision" },
  highlights: {
    sv: [
      "MVP: beläggningsprognos per vecka, fyllnadskampanj-verktyg (sms/e-post till spelare), enkel adminvy per hall.",
      "Bortvalt med motivering: dynamisk prissättning och en egen bokningsmotor — ingen bad om det, och det krockar med hallarnas befintliga bokningssystem.",
    ],
    en: [
      "MVP: weekly occupancy forecast, fill-campaign tool (SMS/email to players), simple admin view per hall.",
      "Deliberately cut: dynamic pricing and a dedicated booking engine — nobody asked for it, and it clashes with the halls' existing booking systems.",
    ],
  },
  traceSummary: {
    sv: "Omfånget snävat in: prognos-dashboard och fyllnadskampanjer — ingen egen bokningsmotor.",
    en: "Scope narrowed: forecast dashboard and fill campaigns — no dedicated booking engine.",
  },
});

// ---------------------------------------------------------------------------
// Steg 09 · Det formella
// ---------------------------------------------------------------------------
const step09: Beat = makeJonasBeat({
  id: "09-det-formella",
  stepNumber: 9,
  phase: "launch",
  todayIso: "2026-03-10",
  momentLabelBase: { sv: "Det formella", en: "The paperwork" },
  nextStep: {
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
  },
  sinceLastTime: step06bSinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Affärsfallet, steg 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Omfånget, steg 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Det formella, steg 09", "2026-03-10")),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Business case, step 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Scope, step 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Paperwork, step 09", "2026-03-10")),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
    },
  ),
  deltaReason: { sv: "efter registreringen", en: "after registration" },
  highlights: {
    sv: [
      "Bolagsform: enskild firma.",
      "Juridisk karta: GDPR och personuppgiftsbiträdesavtal (spelarnas kontaktuppgifter), B2B-villkor mot hallarna, transparens om AI används.",
    ],
    en: [
      "Company form: sole proprietorship.",
      "Legal map: GDPR and data processing agreements (players' contact details), B2B terms with the halls, transparency about AI use.",
    ],
  },
  traceSummary: {
    sv: "Enskild firma registrerad hos Bolagsverket. Juridisk karta klar.",
    en: "Sole proprietorship registered with Bolagsverket. Legal map done.",
  },
});

// ---------------------------------------------------------------------------
// Steg 10 · Live
// ---------------------------------------------------------------------------
const step10: Beat = makeJonasBeat({
  id: "10-live",
  stepNumber: 10,
  phase: "launch",
  todayIso: "2026-03-20",
  momentLabelBase: { sv: "Live", en: "Live" },
  nextStep: {
    sv: {
      eyebrow: "STEG 10 · LIVE",
      title: "Publicera MVP:n via Lovable",
      why: "Bygg drivs av Lovable · Koncept · partnerskap utforskas. Från spec till förhandsvisning till publicering på fiktiv domän. Två pilothallar kommer igång gratis.",
      maxPoints: 12,
      estimatedTime: "~1 dag",
      doneItems: ["Det formella klart"],
      actionLabel: "Se bygget",
    },
    en: {
      eyebrow: "STEP 10 · LIVE",
      title: "Publish the MVP via Lovable",
      why: "The build is powered by Lovable · Concept · partnership in exploration. From spec to preview to publishing on a fictional domain. Two pilot halls get started for free.",
      maxPoints: 12,
      estimatedTime: "~1 day",
      doneItems: ["Paperwork done"],
      actionLabel: "See the build",
    },
  },
  sinceLastTime: step06bSinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
        pt(2, källa("Pilothallar, steg 10", "2026-03-20"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Affärsfallet, steg 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Omfånget, steg 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Det formella, steg 09", "2026-03-10")),
        pt(4, källa("Lovable (koncept), steg 10", "2026-03-20"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
        pt(2, källa("Pilot halls, step 10", "2026-03-20"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Business case, step 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Scope, step 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Paperwork, step 09", "2026-03-10")),
        pt(4, källa("Lovable (concept), step 10", "2026-03-20"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
    },
  ),
  deltaReason: { sv: "efter publiceringen", en: "after publishing" },
  highlights: {
    sv: [
      "MVP byggd och publicerad via Lovable (koncept, partnerskap utforskas) på hallprognos.lovable.app.",
      "Två pilothallar kommer igång gratis.",
    ],
    en: [
      "MVP built and published via Lovable (concept, partnership in exploration) at hallprognos.lovable.app.",
      "Two pilot halls get started for free.",
    ],
  },
  traceSummary: {
    sv: "MVP publicerad via Lovable (koncept). Två pilothallar igång gratis.",
    en: "MVP published via Lovable (concept). Two pilot halls running for free.",
  },
});

// ---------------------------------------------------------------------------
// Steg 11 · Första kunderna
// ---------------------------------------------------------------------------
const step11SinceLastTime: Record<Locale, SinceLastTime> = {
  sv: noSinceLastTime("sv", "2026-04-19", {
    recipientCount: 25,
    openRate: 44,
    openRateSource: källa("Utskicket, steg 05", "2026-02-12"),
    reminderSentDateIso: "2026-02-14",
    responsesReceived: 13,
    responsesSource: källa("Kundsamtal, steg 06", "2026-02-24"),
  }),
  en: noSinceLastTime("en", "2026-04-19", {
    recipientCount: 25,
    openRate: 44,
    openRateSource: källa("The outreach, step 05", "2026-02-12"),
    reminderSentDateIso: "2026-02-14",
    responsesReceived: 13,
    responsesSource: källa("Customer calls, step 06", "2026-02-24"),
  }),
};

const step11: Beat = makeJonasBeat({
  id: "11-forsta-kunderna",
  stepNumber: 11,
  phase: "grow",
  todayIso: "2026-04-19",
  momentLabelBase: { sv: "Första kunderna", en: "The first customers" },
  nextStep: {
    sv: {
      eyebrow: "STEG 11 · FÖRSTA KUNDERNA",
      title: "Kör 30-dagarsplanen",
      why: "Svenska Padelförbundets nätverk, LinkedIn och kalla samtal till hallägare. Fyra betalande hallar ger 7 600 kr i MRR.",
      maxPoints: 14,
      estimatedTime: "~30 dagar",
      doneItems: ["Live klart", "Två pilothallar igång"],
      actionLabel: "Se hallarna",
    },
    en: {
      eyebrow: "STEP 11 · THE FIRST CUSTOMERS",
      title: "Run the 30-day plan",
      why: "The Swedish Padel Federation's network, LinkedIn and cold calls to hall owners. Four paying halls give SEK 7,600 in MRR.",
      maxPoints: 14,
      estimatedTime: "~30 days",
      doneItems: ["Live done", "Two pilot halls running"],
      actionLabel: "See the halls",
    },
  },
  sinceLastTime: step11SinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
        pt(2, källa("Pilothallar, steg 10", "2026-03-20"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Affärsfallet, steg 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Omfånget, steg 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Det formella, steg 09", "2026-03-10")),
        pt(4, källa("Lovable (koncept), steg 10", "2026-03-20"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
      traction: [pt(10, källa("Hallistan, steg 11", "2026-04-19"), { dataType: "customer" })],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
        pt(2, källa("Pilot halls, step 10", "2026-03-20"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Business case, step 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Scope, step 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Paperwork, step 09", "2026-03-10")),
        pt(4, källa("Lovable (concept), step 10", "2026-03-20"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
      traction: [pt(10, källa("Hall list, step 11", "2026-04-19"), { dataType: "customer" })],
    },
  ),
  deltaReason: { sv: "efter de fyra betalande hallarna", en: "after the four paying halls" },
  highlights: {
    sv: ["30-dagarsplan via Svenska Padelförbundets nätverk och LinkedIn.", "4 betalande hallar, 7 600 kr i MRR."],
    en: ["30-day plan via the Swedish Padel Federation's network and LinkedIn.", "4 paying halls, SEK 7,600 in MRR."],
  },
  traceSummary: {
    sv: "30-dagarsplanen gav fyra betalande hallar och 7 600 kr i MRR.",
    en: "The 30-day plan brought in four paying halls and SEK 7,600 in MRR.",
  },
});

// ---------------------------------------------------------------------------
// Steg 12 · Kapital
// ---------------------------------------------------------------------------
const step12: Beat = makeJonasBeat({
  id: "12-kapital",
  stepNumber: 12,
  phase: "grow",
  todayIso: "2026-05-12",
  momentLabelBase: { sv: "Kapital", en: "Capital" },
  nextStep: {
    sv: {
      eyebrow: "STEG 12 · KAPITAL",
      title: "Ansök hos Almi och Vinnova",
      why: "Ansökningsunderlag förberett ur Spåret, inklusive pivoten i steg 06. Slutvy: Bevisad affär.",
      maxPoints: 14,
      estimatedTime: "~1 vecka",
      doneItems: ["Första kunderna klart", "4 betalande hallar"],
      actionLabel: "Se ansökan",
    },
    en: {
      eyebrow: "STEP 12 · CAPITAL",
      title: "Apply to Almi and Vinnova",
      why: "Application materials prepared from the Trace, including the pivot in step 06. Final view: Proven business.",
      maxPoints: 14,
      estimatedTime: "~1 week",
      doneItems: ["First customers done", "4 paying halls"],
      actionLabel: "See the application",
    },
  },
  sinceLastTime: step11SinceLastTime,
  parts: partsBoth(
    {
      fit: [
        pt(4, källa("Profilsamtal", "2026-02-02")),
        pt(2, källa("Genomlysningen", "2026-02-02")),
        pt(2, källa("Kundprofilen, steg 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Kundsamtal, steg 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Kundsamtal, steg 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Kundsamtal, steg 06", "2026-02-24"), { dataType: "customer" }),
        pt(2, källa("Pilothallar, steg 10", "2026-03-20"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Affärsfallet, steg 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Omfånget, steg 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Det formella, steg 09", "2026-03-10")),
        pt(4, källa("Lovable (koncept), steg 10", "2026-03-20"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
      traction: [pt(13, källa("Hallistan, steg 12", "2026-05-12"), { dataType: "customer" })],
    },
    {
      fit: [
        pt(4, källa("Profile chat", "2026-02-02")),
        pt(2, källa("Screening", "2026-02-02")),
        pt(2, källa("Customer profile, step 04", "2026-02-09")),
      ],
      market: [
        pt(1, källa("Bolagsverket", "2026-01-03")),
        pt(5, källa("Bolagsverket", "2026-02-02")),
        pt(4, källa("Bolagsverket", "2026-02-05")),
        pt(2, källa("Bolagsverket", "2026-02-09")),
      ],
      competition: [pt(6, källa("Bolagsverket", "2026-02-05")), pt(2, källa("Bolagsverket", "2026-02-09"))],
      problem: [
        pt(7, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(7, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
      ],
      willingnessToPay: [
        pt(6, källa("Customer calls, step 05", "2026-02-16"), { dataType: "customer" }),
        pt(-2, källa("Customer calls, step 06", "2026-02-18"), { dataType: "customer", contradicts: true }),
        pt(8, källa("Customer calls, step 06", "2026-02-24"), { dataType: "customer" }),
        pt(2, källa("Pilot halls, step 10", "2026-03-20"), { dataType: "customer" }),
      ],
      product: [
        pt(3, källa("Business case, step 07", "2026-03-02"), { dataType: "customer" }),
        pt(3, källa("Scope, step 08", "2026-03-06"), { dataType: "customer" }),
        pt(2, källa("Paperwork, step 09", "2026-03-10")),
        pt(4, källa("Lovable (concept), step 10", "2026-03-20"), { dataType: "customer" }),
      ],
      feasibility: [pt(8, källa("Bolagsverket", "2026-03-10"))],
      traction: [pt(13, källa("Hall list, step 12", "2026-05-12"), { dataType: "customer" })],
    },
  ),
  deltaReason: { sv: "efter fortsatt traktion", en: "after continued traction" },
  highlights: {
    sv: ["Almi och Vinnova, med ansökningsunderlag förberett ur Spåret — pivoten i steg 06 ingår.", "Slutvy: Bevisad affär."],
    en: ["Almi and Vinnova, with application materials prepared from the Trace — including the step 06 pivot.", "Final view: Proven business."],
  },
  traceSummary: {
    sv: "Ansökningar till Almi och Vinnova förberedda ur Spåret, pivoten inkluderad. Bevisad affär.",
    en: "Applications to Almi and Vinnova prepared from the Trace, pivot included. Proven business.",
  },
});

const beats: Beat[] = [step01, step02, step03, step04, step05, step06a, step06b, step07, step08, step09, step10, step11, step12];

export const jonasBeats: readonly Beat[] = beats;

function beatAt(index: number): Beat {
  const clamped = Math.min(beats.length - 1, Math.max(0, index));
  return beats[clamped];
}

export const getBeatAt = beatAt;

export function getCurrentStepNumberFor(beatIndex: number): number {
  return beatAt(beatIndex).stepNumber;
}

export function findBeatIndexById(id: string): number {
  return beats.findIndex((beat) => beat.id === id);
}

export function findLatestBeatIndexForStep(stepNumber: number, upToIndex: number): number | undefined {
  let found: number | undefined;
  for (let index = 0; index <= upToIndex && index < beats.length; index += 1) {
    if (beats[index].stepNumber === stepNumber) found = index;
  }
  return found;
}

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

export function getScoreSnapshotForBeat(index: number, locale: Locale) {
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

export const JONAS_STEPS: readonly StepMeta[] = [
  {
    stepNumber: 1,
    journeyPhase: "discover",
    title: { sv: "Om dig", en: "About you" },
    oneLiner: {
      sv: "Kortare passform-samtal efter genomlysningen: säljbakgrund, tid, pengar och riskaptit.",
      en: "A shorter fit chat after the screening: sales background, time, money and risk appetite.",
    },
    maxPoints: 10,
  },
  {
    stepNumber: 2,
    journeyPhase: "discover",
    title: { sv: "Genomlysningen", en: "The screening" },
    oneLiner: {
      sv: "Idén bruten ner i antaganden, en första registerbild, och en skarpare B2B-idé.",
      en: "The idea broken into assumptions, a first registry picture, and a sharper B2B idea.",
    },
    maxPoints: 12,
  },
  {
    stepNumber: 3,
    journeyPhase: "tryPhase",
    title: { sv: "Marknaden", en: "The market" },
    oneLiner: {
      sv: "412 padelhallsbolag, beläggningsmönster och konkurrerande bokningssystem.",
      en: "412 padel-court companies, occupancy patterns and competing booking systems.",
    },
    maxPoints: 12,
  },
  {
    stepNumber: 4,
    journeyPhase: "tryPhase",
    title: { sv: "Kunden", en: "The customer" },
    oneLiner: {
      sv: "Kundprofil ur registret. Resultatet är en lista på 25 namngivna hallar.",
      en: "Customer profile from the registry. The result is a list of 25 named halls.",
    },
    maxPoints: 8,
  },
  {
    stepNumber: 5,
    journeyPhase: "tryPhase",
    title: { sv: "Samtalen", en: "The calls" },
    oneLiner: {
      sv: "Kontaktlista, svensk outreach, öppningar och svar från hallägare. Bara B2B.",
      en: "Contact list, Swedish outreach, opens and responses from hall owners. B2B only.",
    },
    maxPoints: 18,
  },
  {
    stepNumber: 6,
    journeyPhase: "tryPhase",
    title: { sv: "Domen", en: "The verdict" },
    oneLiner: {
      sv: "Pivot bort från dynamisk prissättning, mot prognos och fyllnadskampanjer.",
      en: "Pivot away from dynamic pricing, toward forecasting and fill campaigns.",
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
    oneLiner: {
      sv: "MVP ur bevisen: prognos-dashboard och fyllnadskampanjer, ingen egen bokningsmotor.",
      en: "MVP from the evidence: forecast dashboard and fill campaigns, no dedicated booking engine.",
    },
    maxPoints: 12,
  },
  {
    stepNumber: 9,
    journeyPhase: "launch",
    title: { sv: "Det formella", en: "The paperwork" },
    oneLiner: {
      sv: "Enskild firma, Bolagsverket, F-skatt, moms och bokföring.",
      en: "Sole proprietorship, Bolagsverket, F-tax, VAT and bookkeeping.",
    },
    maxPoints: 8,
  },
  {
    stepNumber: 10,
    journeyPhase: "launch",
    title: { sv: "Live", en: "Live" },
    oneLiner: { sv: "MVP byggd och publicerad via Lovable (koncept).", en: "MVP built and published via Lovable (concept)." },
    maxPoints: 12,
  },
  {
    stepNumber: 11,
    journeyPhase: "grow",
    title: { sv: "Första kunderna", en: "The first customers" },
    oneLiner: {
      sv: "30-dagarsplan via Svenska Padelförbundets nätverk och LinkedIn.",
      en: "30-day plan via the Swedish Padel Federation's network and LinkedIn.",
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

export const jonasSuggestionCandidates: Record<Locale, ScoreSuggestionInput[]> = {
  sv: [
    {
      partId: "market",
      label: "Marknad",
      gapType: "insufficient",
      pointsGain: 1,
      estimatedMinutes: 10,
      explanation: "Registerbilden är komplett för de 412 hallbolagen — marginell vinst kvar.",
      actionLabel: "Se marknadsbilden",
    },
    {
      partId: "competition",
      label: "Konkurrens",
      gapType: "insufficient",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "BanBokarn och Hallkalendern är redan djupt kartlagda.",
      actionLabel: "Se konkurrenterna",
    },
    {
      partId: "fit",
      label: "Passform",
      gapType: "structural",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "Passformen är redan så stark den kan bli utan en teknisk medgrundare.",
      actionLabel: "Läs om bygget",
    },
    {
      partId: "problem",
      label: "Problem",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 30,
      explanation: "Fler hallägarsamtal stärker problembekräftelsen ytterligare.",
      actionLabel: "Boka fler samtal",
    },
    {
      partId: "willingnessToPay",
      label: "Betalningsvilja",
      gapType: "contradicting",
      pointsGain: 6,
      estimatedMinutes: 60,
      explanation: "En motsägande post om dynamisk prissättning kvarstår — fler bekräftande samtal om den pivotade idén lättar straffet.",
      actionLabel: "Boka fler samtal",
    },
    {
      partId: "product",
      label: "Produkt",
      gapType: "insufficient",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "Produkten är maxad inom nuvarande omfång.",
      actionLabel: "Se omfånget",
    },
    {
      partId: "feasibility",
      label: "Genomförbarhet",
      gapType: "insufficient",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "Bolagsformen är redan registrerad.",
      actionLabel: "Se det formella",
    },
    {
      partId: "traction",
      label: "Traktion",
      gapType: "insufficient",
      pointsGain: 4,
      estimatedMinutes: 480,
      explanation: "Fler betalande hallar stärker traktionen mot Bevisad affär.",
      actionLabel: "Se hallarna",
    },
  ],
  en: [
    {
      partId: "market",
      label: "Market",
      gapType: "insufficient",
      pointsGain: 1,
      estimatedMinutes: 10,
      explanation: "The registry picture is complete for the 412 hall companies — marginal gain left.",
      actionLabel: "See the market picture",
    },
    {
      partId: "competition",
      label: "Competition",
      gapType: "insufficient",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "BanBokarn and Hallkalendern are already mapped in depth.",
      actionLabel: "See the competitors",
    },
    {
      partId: "fit",
      label: "Fit",
      gapType: "structural",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "Fit is already as strong as it can get without a technical co-founder.",
      actionLabel: "Read about the build",
    },
    {
      partId: "problem",
      label: "Problem",
      gapType: "insufficient",
      pointsGain: 2,
      estimatedMinutes: 30,
      explanation: "More hall-owner calls further strengthen the problem confirmation.",
      actionLabel: "Book more calls",
    },
    {
      partId: "willingnessToPay",
      label: "Willingness to pay",
      gapType: "contradicting",
      pointsGain: 6,
      estimatedMinutes: 60,
      explanation: "One contradicting item about dynamic pricing remains — more confirming calls about the pivoted idea ease the penalty.",
      actionLabel: "Book more calls",
    },
    {
      partId: "product",
      label: "Product",
      gapType: "insufficient",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "The product is maxed within the current scope.",
      actionLabel: "See the scope",
    },
    {
      partId: "feasibility",
      label: "Feasibility",
      gapType: "insufficient",
      pointsGain: 0,
      estimatedMinutes: 0,
      explanation: "The company form is already registered.",
      actionLabel: "See the paperwork",
    },
    {
      partId: "traction",
      label: "Traction",
      gapType: "insufficient",
      pointsGain: 4,
      estimatedMinutes: 480,
      explanation: "More paying halls strengthen traction toward Proven business.",
      actionLabel: "See the halls",
    },
  ],
};

/** Jonas resa som en `JourneyEngine` (adapters/demo/journeyEngine.ts) — se
 * `saraEngine` i sara.ts för samma mönster. */
export const jonasEngine: JourneyEngine = {
  beats: jonasBeats,
  steps: JONAS_STEPS,
  suggestionCandidates: jonasSuggestionCandidates,
  getBeatAt,
  getCurrentStepNumberFor,
  findBeatIndexById,
  findLatestBeatIndexForStep,
  findLatestBeatForStep,
  getScoreSnapshotForBeat,
  getScoreHistoryUpToBeat,
  getJourneySummaryForBeat,
};
