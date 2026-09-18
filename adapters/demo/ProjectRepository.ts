import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";
import type { ProjectRepository, IdeaScreening } from "@/ports/ProjectRepository";

// getProject() används inte av någon skärm än — Session 3 byggde idévalet
// (steg 02) direkt ur adapters/demo/sara.ts i stället.

// Jonas idégenomlysning (avsnitt 2.1, 9.4) — bara genomlysningen och det
// kortare passform-samtalet (ProfileRepository.getOnboardingScript) är
// byggda för honom, inte hans fulla 12-stegsresa. Registersiffrorna är
// fiktiva (CLAUDE.md: fiktiva företag i demot), ingen namngiven padelhall.
const registerSource: Record<Locale, Källa> = {
  sv: { namn: "Bolagsverket", hämtad: "2026-01-03" },
  en: { namn: "Bolagsverket", hämtad: "2026-01-03" },
};

const jonasScreening: Record<Locale, IdeaScreening> = {
  sv: {
    originalIdea: "En app där padelhallar säljer lediga tider i sista minuten till rabatt.",
    assumptions: [
      { text: "Spelare vill boka rabatterade lediga tider i sista minuten.", testableNow: false },
      { text: "Padelhallar har regelbundet outnyttjad kapacitet.", testableNow: true },
      { text: "Hallägare är villiga att dela sina lediga tider via en extern app.", testableNow: false },
      { text: "Marknaden för padelhallar växer tillräckligt för att bära en ny aktör.", testableNow: true },
      { text: "Jonas kan nå tillräckligt många hallar utan egen distribution.", testableNow: false },
    ],
    registerFacts: [
      { label: "Padelhallsbolag i Sverige (SNI 93.110)", value: "412", source: registerSource.sv },
      { label: "Nyregistrerade senaste kvartalet", value: "8, ner från 19 kvartalet innan", source: registerSource.sv },
      { label: "Nedläggningar senaste året", value: "34, upp från 21 året innan", source: registerSource.sv },
    ],
    weakness:
      "En konsumentmarknadsplats är svag här: de befintliga bokningssystemen äger redan spelarna, och du har ingen distribution till dem.",
    sharperIdea: {
      name: "Beläggningsprognosen",
      oneLiner: "Ett B2B-verktyg för beläggningsprognos och dynamisk prissättning åt hallägare.",
      why: "Din säljbakgrund blir en passformsfördel mot hallägare, i stället för en svaghet mot spelare du inte når.",
    },
  },
  en: {
    originalIdea: "An app where padel courts sell unfilled last-minute slots at a discount.",
    assumptions: [
      { text: "Players want to book discounted last-minute slots.", testableNow: false },
      { text: "Padel courts regularly have unused capacity.", testableNow: true },
      { text: "Hall owners are willing to share their open slots via an external app.", testableNow: false },
      { text: "The padel-court market is growing enough to support a new player.", testableNow: true },
      { text: "Jonas can reach enough halls without his own distribution.", testableNow: false },
    ],
    registerFacts: [
      { label: "Padel-court companies in Sweden (SNI 93.110)", value: "412", source: registerSource.en },
      { label: "New registrations last quarter", value: "8, down from 19 the quarter before", source: registerSource.en },
      { label: "Closures last year", value: "34, up from 21 the year before", source: registerSource.en },
    ],
    weakness:
      "A consumer marketplace is weak here: the existing booking systems already own the players, and you have no distribution to them.",
    sharperIdea: {
      name: "Occupancy Forecast",
      oneLiner: "A B2B tool for occupancy forecasting and dynamic pricing for hall owners.",
      why: "Your sales background becomes a fit advantage with hall owners, instead of a weakness against players you can't reach.",
    },
  },
};

export const demoProjectRepository: ProjectRepository = {
  async getProject() {
    return {
      id: "kvittojakten",
      name: "Kvittojakten",
      oneLiner: "Automatisk insamling av kvittounderlag åt redovisningsbyråer.",
    };
  },
  async getIdeaScreening(locale) {
    return jonasScreening[locale];
  },
};
