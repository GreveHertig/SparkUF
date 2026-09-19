import type { LegalAdvisor } from "@/ports/LegalAdvisor";
import type { JuridisktKrav } from "@/core/domain";
import { getCurrentStepNumberFor } from "./sara";
import { useDemoStore } from "./demoStore";

// Saras juridiska karta (9.3 steg 05 och 09) för enskild firma. Bara
// svenska — samma medvetna begränsning som liveadaptern
// (adapters/live/LegalAdvisor.ts, se docs/status.md): `getLegalMap` tar
// inte emot `locale` i porten än. Källorna dupliceras medvetet här i
// stället för att importeras från adapters/live/legalSources.ts — demon
// importerar aldrig liveadaptrar (CLAUDE.md, docs/arkitektur.md avsnitt 6).
function krav(
  id: string,
  rubrik: string,
  beskrivning: string,
  källaNamn: string,
  hämtad: string,
  unlockedAtStep: number,
  currentStep: number,
  myndighet?: string,
): JuridisktKrav {
  return {
    id,
    rubrik,
    beskrivning,
    gällerFör: ["enskild_firma"],
    källa: { namn: källaNamn, hämtad },
    status: currentStep >= unlockedAtStep ? "uppfyllt" : "ej_uppfyllt",
    myndighet,
  };
}

export const demoLegalAdvisor: LegalAdvisor = {
  async getLegalMap() {
    const { beatIndex, entry } = useDemoStore.getState();
    // Kravtexterna nedan är skrivna mot Kvittojakten specifikt (t.ex.
    // "kvittounderlag" i gdpr-pub-avtal) — fel för Jonas även om han också
    // valt enskild firma (jonas.ts). Ärligt tomt läge i stället för att
    // hitta på en padel-specifik juridisk karta.
    if (entry === "hasIdea") return [];
    const currentStep = getCurrentStepNumberFor(beatIndex);
    if (currentStep < 5) return [];

    return [
      krav(
        "marknadsforing-b2b",
        "Marknadsföring via e-post, B2B",
        "Utskick till företag kräver inte samma samtycke som till privatpersoner, men avsändare och avregistrering ska vara tydliga.",
        "Konsumentverket",
        "2026-01-14",
        5,
        currentStep,
        "Konsumentverket",
      ),
      krav(
        "gdpr-pub-avtal",
        "GDPR och personuppgiftsbiträdesavtal",
        "Kvittounderlag kan innehålla personuppgifter. Ett personuppgiftsbiträdesavtal med varje byråkund krävs innan lansering.",
        "Integritetsskyddsmyndigheten (IMY)",
        "2026-01-14",
        9,
        currentStep,
        "IMY",
      ),
      krav(
        "registrera-bolagsform",
        "Registrera enskild firma",
        "Enskild firma vald till start — låg risk, inget aktiekapital. Byt till aktiebolag vid tillväxt.",
        "Bolagsverket",
        "2026-02-06",
        9,
        currentStep,
        "Bolagsverket",
      ),
      krav(
        "f-skatt",
        "Ansök om F-skatt",
        "F-skatt krävs innan verksamheten fakturerar kunder.",
        "Skatteverket",
        "2026-02-06",
        9,
        currentStep,
        "Skatteverket",
      ),
      krav(
        "moms",
        "Registrera för moms",
        "Momsregistrering krävs när omsättningen väntas överstiga gränsen för momsbefrielse.",
        "Skatteverket",
        "2026-02-06",
        9,
        currentStep,
        "Skatteverket",
      ),
      krav(
        "bokforingsskyldighet",
        "Bokföringsskyldighet",
        "Enskild firma är bokföringsskyldig från första kronan i intäkt.",
        "Bokföringsnämnden (BFN)",
        "2026-02-06",
        9,
        currentStep,
        "BFN",
      ),
      krav(
        "transparens-ai",
        "Transparens om AI används",
        "Kunder ska tydligt informeras om att Spark AI-assisterar i kundkommunikationen.",
        "Konsumentverket",
        "2026-02-06",
        9,
        currentStep,
        "Konsumentverket",
      ),
    ];
  },
};
