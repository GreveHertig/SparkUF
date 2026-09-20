import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";
import type { OutreachProvider, CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import { saraCompanies } from "./RegistryProvider";
import { useDemoStore } from "./demoStore";
import { getBeatAt } from "./sara";

/** Källa för svarsfrekvensen på Marknad-sidan (Datalöftet: även Sparks egen
 * utskicksdata bär en källa och ett datum) — samma datum som 05a:s "efter"
 * i sara.ts, då de sex första svaren kommit in. */
export const outreachSource: Record<Locale, Källa> = {
  sv: { namn: "Sparks utskick (Gmail)", hämtad: "2026-01-19" },
  en: { namn: "Spark's outreach (Gmail)", hämtad: "2026-01-19" },
};

/** De nio svaren (9.3 steg 05–06) — index i saraCompanies. Tre säger nej
 * till priset 2 000 kr (samtliga under 10 anställda), sex bekräftar
 * problemet och accepterar priset (samtliga 10+ anställda). */
const responses: Record<number, Record<Locale, string>> = {
  0: {
    sv: "Problemet är verkligt, men 2 000 kr i månaden är för mycket för en byrå som vår.",
    en: "The problem is real, but SEK 2,000 a month is too much for a firm our size.",
  },
  2: {
    sv: "Vi skulle betala runt 900 kr, inte 2 000.",
    en: "We'd pay around SEK 900, not 2,000.",
  },
  9: {
    sv: "Bra idé, men priset känns högt för oss just nu.",
    en: "Good idea, but the price feels high for us right now.",
  },
  5: {
    sv: "2 000 kr i månaden är inga pengar mot vad vi sparar i tid.",
    en: "SEK 2,000 a month is nothing compared to the time we'd save.",
  },
  8: {
    sv: "Skulle vilja testa det på våra tre största kunder direkt.",
    en: "We'd want to try it on our three biggest clients right away.",
  },
  10: {
    sv: "Vi lägger minst två hela dagar varje månadsskifte på att jaga kvitton. Absolut ett problem.",
    en: "We spend at least two full days every month-end chasing receipts. Absolutely a real problem.",
  },
  13: {
    sv: "Ja, definitivt ett problem — men vi vill se det i praktiken innan vi bestämmer pris.",
    en: "Yes, definitely a problem — but we want to see it in practice before we settle on a price.",
  },
  15: {
    sv: "Låter som precis det vi behöver för våra minsta kunder.",
    en: "Sounds like exactly what we need for our smallest clients.",
  },
  19: {
    sv: "Vi har testat liknande lösningar förut men ingen har varit svensk och enkel nog.",
    en: "We've tried similar solutions before but none were Swedish and simple enough.",
  },
};

// De sex som svarar först (05a-utskicket-efter) och bekräftar problemet,
// respektive de tre som svarar senare (05b-svaren-efter) och säger nej till
// priset — se responses ovan för citaten. Tillsammans de nio svaren i 9.3.
const FIRST_WAVE_INDICES = [5, 8, 10, 13, 15, 19];
const SECOND_WAVE_INDICES = [0, 2, 9];
const RESPONDED_INDICES = [...FIRST_WAVE_INDICES, ...SECOND_WAVE_INDICES];
// Öppnat men inte svarat än, synligt redan under utskicksmomentets körning.
const OPENED_BEFORE_RESPONSES = [0, 2, 5, 8, 9, 10, 13, 15];

type OutreachStage = "notSent" | "sending" | "firstWave" | "secondWave";

/** Vilket skede utskicket är i, härlett ur den aktuella beatens moment
 * (avsnitt 9.1) i stället för en enda hårdkodad beat-id-jämförelse — håller
 * sig stabil oavsett hur steg 05:s interna beats namnges. */
function stageFor(beat: ReturnType<typeof getBeatAt>): OutreachStage {
  if (beat.stepNumber < 5) return "notSent";
  if (beat.id.startsWith("05a")) {
    if (beat.momentKind === "before") return "notSent";
    if (beat.momentKind === "running") return "sending";
    return "firstWave";
  }
  if (beat.id.startsWith("05b")) {
    return beat.momentKind === "after" ? "secondWave" : "firstWave";
  }
  return "secondWave";
}

function statusFor(index: number, stage: OutreachStage): OutreachStatus {
  if (stage === "notSent") return "draft";
  if (stage === "sending") return OPENED_BEFORE_RESPONSES.includes(index) ? "opened" : "sent";
  if (stage === "firstWave") return FIRST_WAVE_INDICES.includes(index) ? "responded" : "opened";
  return RESPONDED_INDICES.includes(index) ? "responded" : "opened";
}

export const demoOutreachProvider: OutreachProvider = {
  async send() {},
  async getStatuses() {
    return {};
  },

  async getCampaign(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    // Ingen kundlista är byggd för Jonas (persona B) — jonas.ts nämner bara
    // "25 hallar" i löptext, ingen namngiven, strukturerad rad per hall.
    // Hitta inte på bolagsnamn/anställda/omsättning — ärligt tomt läge i
    // stället (screens/Customers.tsx via notInScenario-propen).
    if (entry === "hasIdea") return [];
    const beat = getBeatAt(beatIndex);
    if (beat.stepNumber < 4) return [];

    const stage = stageFor(beat);
    return saraCompanies.map((company, index): CampaignRow => {
      const status = statusFor(index, stage);
      return {
        companyName: company.name,
        sniCode: company.sniCode,
        employees: company.employees,
        revenueKsek: company.revenueKsek,
        status,
        quote: status === "responded" ? responses[index]?.[locale] : undefined,
      };
    });
  },
};
