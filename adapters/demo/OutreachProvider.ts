import type { Locale } from "@/i18n/context";
import type { OutreachProvider, CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import { saraCompanies } from "./RegistryProvider";
import { useDemoStore } from "./demoStore";
import { getBeatAt, getCurrentStepNumberFor } from "./sara";

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

const RESPONDED_INDICES = Object.keys(responses).map(Number);
// Öppnat men inte svarat än, synligt redan i utskicksmomentet (05a) innan svaren kommit in.
const OPENED_BEFORE_RESPONSES = [0, 2, 5, 8, 9, 10, 13, 15];

function statusFor(index: number, stepNumber: number, isSendMoment: boolean): OutreachStatus {
  if (stepNumber <= 4) return "draft";
  if (isSendMoment) return OPENED_BEFORE_RESPONSES.includes(index) ? "opened" : "sent";
  if (RESPONDED_INDICES.includes(index)) return "responded";
  return "opened";
}

export const demoOutreachProvider: OutreachProvider = {
  async send() {},
  async getStatuses() {
    return {};
  },

  async getCampaign(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    const stepNumber = getCurrentStepNumberFor(beatIndex);
    if (stepNumber < 4) return [];

    const isSendMoment = getBeatAt(beatIndex).id === "05a-utskicket";
    return saraCompanies.map(
      (company, index): CampaignRow => ({
        companyName: company.name,
        sniCode: company.sniCode,
        employees: company.employees,
        revenueKsek: company.revenueKsek,
        status: statusFor(index, stepNumber, isSendMoment),
        quote: !isSendMoment && stepNumber >= 5 ? responses[index]?.[locale] : undefined,
      }),
    );
  },
};
