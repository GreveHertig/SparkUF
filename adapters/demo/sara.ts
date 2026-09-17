// Sara Lindqvists profil och pulssignal (docs/uppdrag.md 9.3). Poängen och
// resans "Nästa steg" kommer sedan Session 2 från demomotorn och
// calculateScore (adapters/demo/testScenario.ts, core/score.ts) i stället
// för att stå hårdkodade här — Session 3 bygger ut hela Saras scenario
// (alla 12 steg, på båda språken) och ersätter testScenario.ts.
import type { Locale } from "@/i18n/context";
import type { Profile, PulseSignal, Källa } from "@/core/domain";

const bolagsverketPuls: Källa = { namn: "Bolagsverket", hämtad: "2026-09-17" };

export const saraProfile: Profile = {
  name: "Sara Lindqvist",
  initials: "SL",
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
