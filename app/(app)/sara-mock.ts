// Hårdkodad mockdata för Saras "Hem"-skärm (docs/uppdrag.md 9.3, steg 05).
// Session 3 bygger den riktiga demomotorn (src/demo/scenarios/sara.ts) och
// ersätter den här filen — formen här är medvetet enkel, ingen kod utanför
// den här mappen ska bero på den.
import type { Källa } from "@/types/evidence";
import type { DataType } from "@/design/tokens";

type BreakdownPart = {
  partName: string;
  points: number;
  weight: number;
  source: Källa;
  dataType: DataType;
};

type SaraHomeContent = {
  founderName: string;
  founderInitials: string;
  todayIso: string;
  score: number;
  previousScore: number;
  scoreDelta: number;
  scoreDeltaReason: string;
  nextStep: {
    eyebrow: string;
    title: string;
    why: string;
    maxPoints: number;
    estimatedTime: string;
    doneItems: string[];
    action: string;
  };
  sinceLastTime: {
    emailSentSource: Källa;
    recipientCount: number;
    openRate: number;
    openRateSource: Källa;
    reminderSentDate: string;
    responsesReceived: number;
    responsesSource: Källa;
  };
  pulse: {
    category: string;
    headline: string;
    whyItMatters: string;
    timestamp: string;
    source: Källa;
  };
  breakdown: BreakdownPart[];
  lockedParts: { name: string; unlocksAfterStep: number }[];
};

const bolagsverket: Källa = { namn: "Bolagsverket", hämtad: "2026-09-10" };
const profilsamtal: Källa = { namn: "Profilsamtal", hämtad: "2026-09-08" };
const kundsamtalSteg05: Källa = { namn: "Kundsamtal, steg 05", hämtad: "2026-09-17" };
const utskicketSteg05: Källa = { namn: "Utskicket, steg 05", hämtad: "2026-09-11" };

export const saraHomeContent: Record<"sv" | "en", SaraHomeContent> = {
  sv: {
    founderName: "Sara Lindqvist",
    founderInitials: "SL",
    todayIso: "2026-09-17",
    score: 43,
    previousScore: 47,
    scoreDelta: -4,
    scoreDeltaReason: "efter nya svar",
    nextStep: {
      eyebrow: "STEG 05 · SAMTALEN",
      title: "Gå igenom svaren och förbered steg 06",
      why: "9 byråer har svarat sedan utskicket, men tre säger nej till priset. Se mönstret i svaren innan du går vidare till att förfina idén.",
      maxPoints: 12,
      estimatedTime: "~20 min",
      doneItems: [
        "Utskick skickat till 40 byråer",
        "Påminnelse skickad",
        "9 svar mottagna",
      ],
      action: "Öppna steg 05",
    },
    sinceLastTime: {
      emailSentSource: utskicketSteg05,
      recipientCount: 40,
      openRate: 38,
      openRateSource: { namn: "Utskicket, steg 05", hämtad: "2026-09-13" },
      reminderSentDate: "2026-09-15",
      responsesReceived: 9,
      responsesSource: kundsamtalSteg05,
    },
    pulse: {
      category: "Marknad",
      headline: "14 nya redovisningsbyråer registrerade i Stockholms län senaste kvartalet",
      whyItMatters:
        "Fler byråer i ditt starkaste område betyder fler potentiella kunder till Kvittojakten.",
      timestamp: "Uppdaterad 06:00",
      source: { namn: "Bolagsverket", hämtad: "2026-09-17" },
    },
    breakdown: [
      { partName: "Marknad", points: 10, weight: 12, source: bolagsverket, dataType: "register" },
      { partName: "Konkurrens", points: 6, weight: 8, source: bolagsverket, dataType: "register" },
      { partName: "Passform", points: 7, weight: 10, source: profilsamtal, dataType: "register" },
      { partName: "Problem", points: 12, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
      { partName: "Betalningsvilja", points: 8, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
    ],
    lockedParts: [
      { name: "Produkt", unlocksAfterStep: 8 },
      { name: "Genomförbarhet", unlocksAfterStep: 9 },
      { name: "Traktion", unlocksAfterStep: 11 },
    ],
  },
  en: {
    founderName: "Sara Lindqvist",
    founderInitials: "SL",
    todayIso: "2026-09-17",
    score: 43,
    previousScore: 47,
    scoreDelta: -4,
    scoreDeltaReason: "after new responses",
    nextStep: {
      eyebrow: "STEP 05 · THE CALLS",
      title: "Review the responses and prepare step 06",
      why: "9 firms have responded since the outreach, but three say no to the price. See the pattern in the answers before moving on to refining the idea.",
      maxPoints: 12,
      estimatedTime: "~20 min",
      doneItems: [
        "Outreach sent to 40 firms",
        "Reminder sent",
        "9 responses received",
      ],
      action: "Open step 05",
    },
    sinceLastTime: {
      emailSentSource: utskicketSteg05,
      recipientCount: 40,
      openRate: 38,
      openRateSource: { namn: "Utskicket, steg 05", hämtad: "2026-09-13" },
      reminderSentDate: "2026-09-15",
      responsesReceived: 9,
      responsesSource: kundsamtalSteg05,
    },
    pulse: {
      category: "Market",
      headline: "14 new accounting firms registered in the Stockholm region last quarter",
      whyItMatters:
        "More firms in your strongest region means more potential customers for Kvittojakten.",
      timestamp: "Updated 06:00",
      source: { namn: "Bolagsverket", hämtad: "2026-09-17" },
    },
    breakdown: [
      { partName: "Market", points: 10, weight: 12, source: bolagsverket, dataType: "register" },
      { partName: "Competition", points: 6, weight: 8, source: bolagsverket, dataType: "register" },
      { partName: "Fit", points: 7, weight: 10, source: profilsamtal, dataType: "register" },
      { partName: "Problem", points: 12, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
      { partName: "Willingness to pay", points: 8, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
    ],
    lockedParts: [
      { name: "Product", unlocksAfterStep: 8 },
      { name: "Feasibility", unlocksAfterStep: 9 },
      { name: "Traction", unlocksAfterStep: 11 },
    ],
  },
};
