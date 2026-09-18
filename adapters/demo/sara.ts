// Sara Lindqvists fulla scenario (docs/uppdrag.md 9.3) — Persona A, "Jag har
// ingen idé". Ersätter det gamla testScenario.ts (Session 2:s wiring-bevis).
// Alla 12 steg, båda språken. Poängen sätts aldrig här — varje beat bygger
// PartEvidence och låter calculateScore (core/score.ts) räkna den.
//
// Steg 05 ("Samtalen") har två beats (utskicket, sedan svaren) eftersom
// uppdraget explicit visar poängen först stiga till 47 och sedan sjunka till
// 43 inom samma steg — den viktigaste demonstrationen av regel 7.4 "poängen
// kan sjunka". Demoraden (steg X av 12) visar samma stegnummer för båda.
//
// Kalibrering: målvärdena i 9.3 är en riktlinje med högst ±2 poängs
// avvikelse. De flesta stegen här träffar exakt; ett fåtal ligger ±1–2 ifrån
// (se docs/status.md).
import type { Locale } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import type { Dictionary } from "@/i18n/dictionary";
import type { NextStep, SinceLastTime, ScoreSnapshot, Källa, Profile, PulseSignal } from "@/core/domain";
import type { JourneySummary } from "@/ports/JourneyRepository";
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

function källa(namn: string, hämtad: string): Källa {
  return { namn, hämtad };
}

function pt(points: number, source: Källa, overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return { points, source, dataType: "register", ...overrides };
}

/** Bygger PartEvidence för alla åtta delar. Delar utan angivna items får en
 * tom lista — calculateScore hoppar över dem om de inte är upplåsta i fasen. */
function parts(locale: Locale, filled: Partial<Record<ScorePartId, EvidenceItem[]>>): PartEvidence[] {
  const labels = dictionaries[locale].score.parts;
  return (Object.keys(labels) as ScorePartId[]).map((partId) => ({
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
  highlights: Record<Locale, string[]>;
};

const noSinceLastTime = (locale: Locale, todayIso: string, overrides: Partial<SinceLastTime> = {}): SinceLastTime => {
  const source = källa(dictionaries[locale].demoBar.personaLabel, todayIso);
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

// ---------------------------------------------------------------------------
// Steg 01 · Om dig
// ---------------------------------------------------------------------------
const step01: Beat = {
  id: "01-om-dig",
  stepNumber: 1,
  phase: "discover",
  todayIso: "2026-01-05",
  momentLabel: { sv: "Om dig", en: "About you" },
  nextStep: {
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
  },
  sinceLastTime: { sv: noSinceLastTime("sv", "2026-01-05"), en: noSinceLastTime("en", "2026-01-05") },
  partsByLocale: {
    sv: parts("sv", {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05"))],
      market: [pt(1, källa("Bolagsverket", "2026-01-05"))],
    }),
    en: parts("en", {
      fit: [pt(5, källa("Profile chat", "2026-01-05"))],
      market: [pt(1, källa("Bolagsverket", "2026-01-05"))],
    }),
  },
  deltaReason: { sv: "", en: "" },
  highlights: {
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
};

// ---------------------------------------------------------------------------
// Steg 02 · Möjligheter
// ---------------------------------------------------------------------------
const step02: Beat = {
  id: "02-mojligheter",
  stepNumber: 2,
  phase: "discover",
  todayIso: "2026-01-07",
  momentLabel: { sv: "Möjligheter", en: "Opportunities" },
  nextStep: {
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
  },
  sinceLastTime: { sv: noSinceLastTime("sv", "2026-01-07"), en: noSinceLastTime("en", "2026-01-07") },
  partsByLocale: {
    sv: parts("sv", {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [pt(3, källa("Bolagsverket", "2026-01-07")), pt(3, källa("Bolagsverket", "2026-01-07"))],
    }),
    en: parts("en", {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [pt(3, källa("Bolagsverket", "2026-01-07")), pt(3, källa("Bolagsverket", "2026-01-07"))],
    }),
  },
  deltaReason: { sv: "efter idéval", en: "after choosing the idea" },
  highlights: {
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
};

// ---------------------------------------------------------------------------
// Steg 03 · Marknaden
// ---------------------------------------------------------------------------
const step03: Beat = {
  id: "03-marknaden",
  stepNumber: 3,
  phase: "tryBeforeCalls",
  todayIso: "2026-01-09",
  momentLabel: { sv: "Marknaden", en: "The market" },
  nextStep: {
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
  },
  sinceLastTime: { sv: noSinceLastTime("sv", "2026-01-09"), en: noSinceLastTime("en", "2026-01-09") },
  partsByLocale: {
    sv: parts("sv", {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    }),
    en: parts("en", {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    }),
  },
  deltaReason: { sv: "efter registerdata", en: "after registry data" },
  highlights: {
    sv: [
      "312 redovisningsbyråer med 5–20 anställda (SNI 69.201).",
      "Medianomsättning 4,2 Mkr.",
      "18 % växte mer än 10 % förra året.",
      "31 % finns i Stockholms län.",
      "Tre fiktiva konkurrenter kartlagda — ingen dominerar.",
      "Simulering (Hiasynth, koncept): ~6,5 h/mån per anställd går åt till underlagsjakt, intervall 4–9 h.",
    ],
    en: [
      "312 accounting firms with 5–20 employees (SNI 69.201).",
      "Median revenue SEK 4.2M.",
      "18% grew more than 10% last year.",
      "31% are located in the Stockholm region.",
      "Three fictional competitors mapped — none dominant.",
      "Simulation (Hiasynth, concept): ~6.5 h/month per employee goes to chasing receipts, range 4–9 h.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Steg 04 · Kunden
// ---------------------------------------------------------------------------
const step04: Beat = {
  id: "04-kunden",
  stepNumber: 4,
  phase: "tryBeforeCalls",
  todayIso: "2026-01-12",
  momentLabel: { sv: "Kunden", en: "The customer" },
  nextStep: {
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
  },
  sinceLastTime: { sv: noSinceLastTime("sv", "2026-01-12"), en: noSinceLastTime("en", "2026-01-12") },
  partsByLocale: {
    sv: parts("sv", {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    }),
    en: parts("en", {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
    }),
  },
  deltaReason: { sv: "efter kundprofilen", en: "after the customer profile" },
  highlights: {
    sv: [
      "Kundprofil: SNI 69.201, 5–20 anställda, 3–15 Mkr i omsättning.",
      "Lista över de 40 snabbast växande fiktiva byråerna som matchar profilen.",
      "Nästa steg: bygga kontaktlista och skriva outreach.",
    ],
    en: [
      "Customer profile: SNI 69.201, 5–20 employees, SEK 3–15M revenue.",
      "List of the 40 fastest-growing fictional firms matching the profile.",
      "Next: build the contact list and write the outreach.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Steg 05a · Samtalen (utskicket)
// ---------------------------------------------------------------------------
const step05a: Beat = {
  id: "05a-utskicket",
  stepNumber: 5,
  phase: "tryAfterCalls",
  todayIso: "2026-01-14",
  momentLabel: { sv: "Samtalen · utskicket", en: "The calls · the outreach" },
  nextStep: {
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
  },
  sinceLastTime: {
    sv: noSinceLastTime("sv", "2026-01-14", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
    }),
    en: noSinceLastTime("en", "2026-01-14", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
    }),
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter de första 6 svaren", en: "after the first 6 responses" },
  highlights: {
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
};

// ---------------------------------------------------------------------------
// Steg 05b · Samtalen (svaren — poängen sjunker)
// ---------------------------------------------------------------------------
const step05b: Beat = {
  id: "05b-svaren",
  stepNumber: 5,
  phase: "tryAfterCalls",
  todayIso: "2026-01-20",
  momentLabel: { sv: "Samtalen · svaren", en: "The calls · the responses" },
  nextStep: {
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
  },
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
  partsByLocale: {
    sv: parts("sv", {
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
        pt(-3, källa("Kundsamtal, steg 05", "2026-01-20"), {
          dataType: "customer",
          contradicts: true,
        }),
      ],
    }),
    en: parts("en", {
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
        pt(-3, källa("Customer calls, step 05", "2026-01-20"), {
          dataType: "customer",
          contradicts: true,
        }),
      ],
    }),
  },
  deltaReason: { sv: "3 nya svar säger nej till priset", en: "3 new responses say no to the price" },
  highlights: {
    sv: [
      "3 nya svar kommer in, 9 totalt.",
      "3 av de 9 säger nej till priset 2 000 kr.",
      "Betalningsvilja-delen sänks — motsägande svar räknas fullt ut, och ett skevt underlag straffar delen (avsnitt 7.4).",
      "Poängen sjunker från 47 till 43.",
    ],
    en: [
      "3 new responses come in, 9 total.",
      "3 of the 9 say no to the SEK 2,000 price.",
      "The willingness-to-pay part drops — contradicting responses count in full, and a skewed sample penalizes the part (section 7.4).",
      "The score drops from 47 to 43.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Steg 06 · Domen
// ---------------------------------------------------------------------------
const step06: Beat = {
  id: "06-domen",
  stepNumber: 6,
  phase: "tryAfterCalls",
  todayIso: "2026-01-23",
  momentLabel: { sv: "Domen", en: "The verdict" },
  nextStep: {
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
  },
  sinceLastTime: {
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
  },
  partsByLocale: {
    sv: parts("sv", {
      fit: [pt(5, källa("Profilsamtal", "2026-01-05")), pt(3, källa("Profilsamtal", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("SCB", "2026-01-09")),
        pt(3, källa("SCB", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [
        pt(13, källa("Kundsamtal, steg 06", "2026-01-23"), { dataType: "customer" }),
      ],
    }),
    en: parts("en", {
      fit: [pt(5, källa("Profile chat", "2026-01-05")), pt(3, källa("Profile chat", "2026-01-07"))],
      market: [
        pt(4, källa("Bolagsverket", "2026-01-09")),
        pt(4, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(3, källa("Statistics Sweden (SCB)", "2026-01-09")),
        pt(1, källa("Bolagsverket", "2026-01-12")),
      ],
      competition: [pt(4, källa("Bolagsverket", "2026-01-09")), pt(3, källa("Bolagsverket", "2026-01-09"))],
      problem: [pt(14, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" })],
      willingnessToPay: [
        pt(13, källa("Customer calls, step 06", "2026-01-23"), { dataType: "customer" }),
      ],
    }),
  },
  deltaReason: { sv: "efter förfiningen", en: "after refining the segment" },
  highlights: {
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
};

// ---------------------------------------------------------------------------
// Steg 07 · Affärsfall och pris
// ---------------------------------------------------------------------------
const step07: Beat = {
  id: "07-affarsfall",
  stepNumber: 7,
  phase: "launch",
  todayIso: "2026-01-28",
  momentLabel: { sv: "Affärsfall och pris", en: "Business case and price" },
  nextStep: {
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
  },
  sinceLastTime: {
    sv: noSinceLastTime("sv", "2026-01-28", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
    }),
    en: noSinceLastTime("en", "2026-01-28", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Customer calls, step 05", "2026-01-20"),
    }),
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter affärsfallet", en: "after the business case" },
  highlights: {
    sv: [
      "Pris motiverat ur fyra saker: vad kunderna tål, vad jämförbara aktörer tar, vad kunderna själva sagt, vad som krävs för att gå ihop.",
      "Kostnadsgolv ~8 500 kr/mån.",
      "Break-even vid 8 kunder.",
    ],
    en: [
      "Price justified from four things: what customers can afford, what comparable players charge, what customers themselves said, what's needed to break even.",
      "Cost floor ~SEK 8,500/month.",
      "Break-even at 8 customers.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Steg 08 · Omfånget
// ---------------------------------------------------------------------------
const step08: Beat = {
  id: "08-omfanget",
  stepNumber: 8,
  phase: "launch",
  todayIso: "2026-02-03",
  momentLabel: { sv: "Omfånget", en: "The scope" },
  nextStep: {
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
  },
  sinceLastTime: {
    sv: noSinceLastTime("sv", "2026-02-03", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
    }),
    en: noSinceLastTime("en", "2026-02-03", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Customer calls, step 05", "2026-01-20"),
    }),
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter omfångsbeslutet", en: "after the scope decision" },
  highlights: {
    sv: [
      "MVP: kvittoförfrågan via sms-länk, uppladdning, status per kund och export.",
      "Bortvalt med motivering: OCR och egen app — ingen av respondenterna bad om det.",
    ],
    en: [
      "MVP: SMS-link receipt requests, upload, per-customer status and export.",
      "Deliberately cut: OCR and a dedicated app — none of the respondents asked for it.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Steg 09 · Det formella
// ---------------------------------------------------------------------------
const step09: Beat = {
  id: "09-det-formella",
  stepNumber: 9,
  phase: "launch",
  todayIso: "2026-02-06",
  momentLabel: { sv: "Det formella", en: "The paperwork" },
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
  sinceLastTime: {
    sv: noSinceLastTime("sv", "2026-02-06", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
    }),
    en: noSinceLastTime("en", "2026-02-06", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Customer calls, step 05", "2026-01-20"),
    }),
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter registreringen", en: "after registration" },
  highlights: {
    sv: [
      "Bolagsform: enskild firma.",
      "Juridisk karta: GDPR och personuppgiftsbiträdesavtal, skydd av ekonomiska underlag, B2B-villkor och transparens om AI används.",
    ],
    en: [
      "Company form: sole proprietorship.",
      "Legal map: GDPR and data processing agreements, protection of financial records, B2B terms and transparency about AI use.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Steg 10 · Live
// ---------------------------------------------------------------------------
const step10: Beat = {
  id: "10-live",
  stepNumber: 10,
  phase: "launch",
  todayIso: "2026-02-16",
  momentLabel: { sv: "Live", en: "Live" },
  nextStep: {
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
  },
  sinceLastTime: {
    sv: noSinceLastTime("sv", "2026-02-16", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("Utskicket, steg 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Kundsamtal, steg 05", "2026-01-20"),
    }),
    en: noSinceLastTime("en", "2026-02-16", {
      recipientCount: 40,
      openRate: 38,
      openRateSource: källa("The outreach, step 05", "2026-01-16"),
      reminderSentDateIso: "2026-01-18",
      responsesReceived: 9,
      responsesSource: källa("Customer calls, step 05", "2026-01-20"),
    }),
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter publiceringen", en: "after publishing" },
  highlights: {
    sv: [
      "MVP byggd och publicerad via Lovable (koncept, partnerskap utforskas).",
      "Tre pilotbyråer kommer igång gratis.",
    ],
    en: ["MVP built and published via Lovable (concept, partnership in exploration).", "Three pilot firms get started for free."],
  },
};

// ---------------------------------------------------------------------------
// Steg 11 · Första kunderna
// ---------------------------------------------------------------------------
const step11: Beat = {
  id: "11-forsta-kunderna",
  stepNumber: 11,
  phase: "grow",
  todayIso: "2026-03-18",
  momentLabel: { sv: "Första kunderna", en: "The first customers" },
  nextStep: {
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
  },
  sinceLastTime: {
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
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter de fem betalande kunderna", en: "after the five paying customers" },
  highlights: {
    sv: ["30-dagarsplan i svenska kanaler.", "5 betalande byråer, 5 950 kr i MRR."],
    en: ["30-day plan across Swedish channels.", "5 paying firms, SEK 5,950 in MRR."],
  },
};

// ---------------------------------------------------------------------------
// Steg 12 · Kapital
// ---------------------------------------------------------------------------
const step12: Beat = {
  id: "12-kapital",
  stepNumber: 12,
  phase: "grow",
  todayIso: "2026-04-10",
  momentLabel: { sv: "Kapital", en: "Capital" },
  nextStep: {
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
  },
  sinceLastTime: {
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
  },
  partsByLocale: {
    sv: parts("sv", {
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
    }),
    en: parts("en", {
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
    }),
  },
  deltaReason: { sv: "efter fortsatt traktion", en: "after continued traction" },
  highlights: {
    sv: ["Almi och Vinnova, med ansökningsunderlag förberett ur Spåret.", "Slutvy: Bevisad affär."],
    en: ["Almi and Vinnova, with application materials prepared from the Trace.", "Final view: Proven business."],
  },
};

const beats: Beat[] = [
  step01,
  step02,
  step03,
  step04,
  step05a,
  step05b,
  step06,
  step07,
  step08,
  step09,
  step10,
  step11,
  step12,
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

/** Senaste beaten för ett givet officiellt steg (1–12) som redan nåtts vid
 * `upToIndex` — steg 05 har två beats, så det är den senare (svaren) som
 * räknas som "nådd" så snart demot passerat den. `undefined` om steget inte
 * är nått än (används för Resan/[steg] och Resan-listan). */
export function findLatestBeatForStep(stepNumber: number, upToIndex: number): Beat | undefined {
  const reached = beats.filter((beat, index) => beat.stepNumber === stepNumber && index <= upToIndex);
  return reached[reached.length - 1];
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
 * att steg 05 har två beats internt. `journeyPhase` är UI:ts fyra faser
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

/** Bara Saras pulssignal för "idag" (Hem-sidan) — se adapters/demo/PulseProvider.ts
 * för hela listan (9.5) som Pulsen-sidan visar. */
export const saraPulseSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Marknad",
    headline: "14 nya redovisningsbyråer registrerade i Stockholms län senaste kvartalet",
    whyItMatters: "Fler byråer i ditt starkaste område betyder fler potentiella kunder till Kvittojakten.",
    timestamp: "Uppdaterad 06:00",
    source: källa("Bolagsverket", "2026-09-17"),
  },
  en: {
    category: "Market",
    headline: "14 new accounting firms registered in the Stockholm region last quarter",
    whyItMatters: "More firms in your strongest region means more potential customers for Kvittojakten.",
    timestamp: "Updated 06:00",
    source: källa("Bolagsverket", "2026-09-17"),
  },
};
