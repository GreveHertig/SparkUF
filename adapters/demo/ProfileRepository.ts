import type { Locale } from "@/i18n/context";
import type { OnboardingEntry } from "@/core/domain";
import type { ProfileRepository, OnboardingScript } from "@/ports/ProfileRepository";
import { saraProfile } from "./sara";

// Ingång A (Sara, "Jag har ingen idé än"): samma tre frågor/svar som redan
// finns i cofounderScript.ts under "01-om-dig" — där som ett redan avklarat
// transkript, här som frågor med klickbart svarsförslag i onboardingen
// (avsnitt 6, 9.1). Medvetet duplicerat innehåll, inte samma datastruktur
// (TranscriptItem vs OnboardingQuestion) — se docs/status.md om de någonsin
// ska slås ihop till en källa.
const saraOnboarding: Record<Locale, OnboardingScript> = {
  sv: {
    questions: [
      {
        id: "sara-01-vad-gor-du",
        cofounderText: "Innan vi börjar behöver jag veta vem du är. Vad gör du idag?",
        suggestedAnswer: "Jag jobbar som redovisningsassistent på en liten byrå. Har gjort det i fyra år.",
      },
      {
        id: "sara-02-tid-pengar",
        cofounderText: "Bra. Hur mycket tid och pengar har du att lägga på det här?",
        suggestedAnswer: "Runt 15 timmar i veckan, och 30 000 kr sparat.",
      },
      {
        id: "sara-03-bygga-sjalv",
        cofounderText: "Noterat. En sak till: kan du bygga en produkt själv?",
        suggestedAnswer: "Nej, ingen kodvana alls.",
      },
    ],
    closingMessage:
      "Det löser vi senare — Lovable bygger åt dig när det är dags. Din styrka är branschinsikten.",
  },
  en: {
    questions: [
      {
        id: "sara-01-vad-gor-du",
        cofounderText: "Before we start, I need to know who you are. What do you do today?",
        suggestedAnswer: "I work as an accounting assistant at a small firm. I've done it for four years.",
      },
      {
        id: "sara-02-tid-pengar",
        cofounderText: "Good. How much time and money do you have to put into this?",
        suggestedAnswer: "About 15 hours a week, and SEK 30,000 saved.",
      },
      {
        id: "sara-03-bygga-sjalv",
        cofounderText: "Noted. One more thing: can you build a product yourself?",
        suggestedAnswer: "No, no coding experience at all.",
      },
    ],
    closingMessage: "We'll solve that later — Lovable builds it for you when the time comes. Your strength is your industry knowledge.",
  },
};

// Ingång B (Jonas, "Jag har redan en idé"): kortare samtal med fokus på
// passform (avsnitt 2.1) — kommer efter idégenomlysningen, inte före den.
// Jonas fulla resa (9.4) är inte byggd, bara det här och genomlysningen
// (ProjectRepository.getIdeaScreening) — se docs/status.md.
const jonasOnboarding: Record<Locale, OnboardingScript> = {
  sv: {
    questions: [
      {
        id: "jonas-01-vad-gor-du",
        cofounderText: "Du har redan en idé, så låt oss fokusera på passform. Vad gör du idag?",
        suggestedAnswer: "Jag har sålt B2B i åtta år. Ingen kodvana, men jag är van att prata med företag.",
      },
      {
        id: "jonas-02-tid-pengar",
        cofounderText: "Hur mycket tid och pengar har du att lägga på det här?",
        suggestedAnswer: "Kvällar och helger till att börja med, och 50 000 kr sparat.",
      },
    ],
    closingMessage: "Din säljbakgrund är en fördel här — särskilt mot hallägare, inte mot spelare.",
  },
  en: {
    questions: [
      {
        id: "jonas-01-vad-gor-du",
        cofounderText: "You already have an idea, so let's focus on fit. What do you do today?",
        suggestedAnswer: "I've sold B2B for eight years. No coding experience, but I'm used to talking to companies.",
      },
      {
        id: "jonas-02-tid-pengar",
        cofounderText: "How much time and money do you have to put into this?",
        suggestedAnswer: "Evenings and weekends to start, and SEK 50,000 saved.",
      },
    ],
    closingMessage: "Your sales background is an advantage here — especially with hall owners, not players.",
  },
};

const scriptsByEntry: Record<OnboardingEntry, Record<Locale, OnboardingScript>> = {
  noIdea: saraOnboarding,
  hasIdea: jonasOnboarding,
};

export const demoProfileRepository: ProfileRepository = {
  async getProfile() {
    return saraProfile;
  },
  async getOnboardingScript(entry, locale) {
    return scriptsByEntry[entry][locale];
  },
};
