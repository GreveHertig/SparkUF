// Sara Lindqvists scenario (docs/uppdrag.md 9.3), hittills bara steg 05 — det
// underlag som redan fanns i den statiska /app-förhandsvisningen
// (app/(app)/sara-mock.ts). Session 3 bygger ut hela scenariot i
// adapters/demo/scenarios/sara.ts och ersätter den här filen.
import type { Locale } from "@/i18n/context";
import type { Profile, PulseSignal, ScoreSnapshot, Källa } from "@/core/domain";
import type { JourneySummary } from "@/ports/JourneyRepository";

const bolagsverket: Källa = { namn: "Bolagsverket", hämtad: "2026-09-10" };
const profilsamtal: Källa = { namn: "Profilsamtal", hämtad: "2026-09-08" };
const kundsamtalSteg05: Källa = { namn: "Kundsamtal, steg 05", hämtad: "2026-09-17" };
const utskicketSteg05: Källa = { namn: "Utskicket, steg 05", hämtad: "2026-09-11" };
const utskicketSteg05Öppningar: Källa = { namn: "Utskicket, steg 05", hämtad: "2026-09-13" };
const bolagsverketPuls: Källa = { namn: "Bolagsverket", hämtad: "2026-09-17" };

export const saraProfile: Profile = {
  name: "Sara Lindqvist",
  initials: "SL",
};

export const saraJourneySummary: Record<Locale, JourneySummary> = {
  sv: {
    todayIso: "2026-09-17",
    nextStep: {
      eyebrow: "STEG 05 · SAMTALEN",
      title: "Gå igenom svaren och förbered steg 06",
      why: "9 byråer har svarat sedan utskicket, men tre säger nej till priset. Se mönstret i svaren innan du går vidare till att förfina idén.",
      maxPoints: 12,
      estimatedTime: "~20 min",
      doneItems: ["Utskick skickat till 40 byråer", "Påminnelse skickad", "9 svar mottagna"],
      actionLabel: "Öppna steg 05",
    },
    sinceLastTime: {
      emailSentSource: utskicketSteg05,
      recipientCount: 40,
      openRate: 38,
      openRateSource: utskicketSteg05Öppningar,
      reminderSentDateIso: "2026-09-15",
      responsesReceived: 9,
      responsesSource: kundsamtalSteg05,
    },
  },
  en: {
    todayIso: "2026-09-17",
    nextStep: {
      eyebrow: "STEP 05 · THE CALLS",
      title: "Review the responses and prepare step 06",
      why: "9 firms have responded since the outreach, but three say no to the price. See the pattern in the answers before moving on to refining the idea.",
      maxPoints: 12,
      estimatedTime: "~20 min",
      doneItems: ["Outreach sent to 40 firms", "Reminder sent", "9 responses received"],
      actionLabel: "Open step 05",
    },
    sinceLastTime: {
      emailSentSource: utskicketSteg05,
      recipientCount: 40,
      openRate: 38,
      openRateSource: utskicketSteg05Öppningar,
      reminderSentDateIso: "2026-09-15",
      responsesReceived: 9,
      responsesSource: kundsamtalSteg05,
    },
  },
};

export const saraScoreSnapshot: Record<Locale, ScoreSnapshot> = {
  sv: {
    total: 43,
    previousTotal: 47,
    delta: -4,
    deltaReason: "efter nya svar",
    calculatedAtIso: "2026-09-17",
    parts: [
      { name: "Marknad", points: 10, weight: 12, source: bolagsverket, dataType: "register" },
      { name: "Konkurrens", points: 6, weight: 8, source: bolagsverket, dataType: "register" },
      { name: "Passform", points: 7, weight: 10, source: profilsamtal, dataType: "register" },
      { name: "Problem", points: 12, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
      { name: "Betalningsvilja", points: 8, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
    ],
    lockedParts: [
      { name: "Produkt", unlocksAfterStep: 8 },
      { name: "Genomförbarhet", unlocksAfterStep: 9 },
      { name: "Traktion", unlocksAfterStep: 11 },
    ],
  },
  en: {
    total: 43,
    previousTotal: 47,
    delta: -4,
    deltaReason: "after new responses",
    calculatedAtIso: "2026-09-17",
    parts: [
      { name: "Market", points: 10, weight: 12, source: bolagsverket, dataType: "register" },
      { name: "Competition", points: 6, weight: 8, source: bolagsverket, dataType: "register" },
      { name: "Fit", points: 7, weight: 10, source: profilsamtal, dataType: "register" },
      { name: "Problem", points: 12, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
      { name: "Willingness to pay", points: 8, weight: 18, source: kundsamtalSteg05, dataType: "customer" },
    ],
    lockedParts: [
      { name: "Product", unlocksAfterStep: 8 },
      { name: "Feasibility", unlocksAfterStep: 9 },
      { name: "Traction", unlocksAfterStep: 11 },
    ],
  },
};

export const saraPulseSignal: Record<Locale, PulseSignal> = {
  sv: {
    category: "Marknad",
    headline: "14 nya redovisningsbyråer registrerade i Stockholms län senaste kvartalet",
    whyItMatters: "Fler byråer i ditt starkaste område betyder fler potentiella kunder till Kvittojakten.",
    timestamp: "Uppdaterad 06:00",
    source: bolagsverketPuls,
  },
  en: {
    category: "Market",
    headline: "14 new accounting firms registered in the Stockholm region last quarter",
    whyItMatters: "More firms in your strongest region means more potential customers for Kvittojakten.",
    timestamp: "Updated 06:00",
    source: bolagsverketPuls,
  },
};
