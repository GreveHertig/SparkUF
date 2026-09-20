import type { Locale } from "@/i18n/context";
import type { VerdictProvider } from "@/ports/VerdictProvider";
import type { PriceStance, VerdictInput, VerdictResponse } from "@/core/verdict";
import { buildVerdictReport } from "@/core/verdictReport";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { demoOutreachProvider, getResponseCards, outreachSource } from "./OutreachProvider";
import { saraCompanies } from "./RegistryProvider";

/**
 * Demoadapter för Domen. Bygger VerdictInput ur de befintliga demohjälparna
 * i OutreachProvider.ts (skrivs inte om) och kör samma ren logik som
 * liveadaptern kommer använda (core/verdict.ts).
 *
 * ANTAGET (docs/moduler/domen.md, "Antaget"): demodatan har varken
 * strukturerad prishållning eller motbud per svar, bara citattext. Fälten
 * nedan är därför en tolkning av citaten i OutreachProvider.ts, på samma sätt
 * som ResponseCard.verdict redan är det. Index = plats i saraCompanies.
 */
const DECLINES_PRICE = [0, 2, 9]; // "för mycket", "runt 900 kr, inte 2 000", "priset känns högt"
const UNDECIDED_PRICE = [13]; // "innan vi bestämmer pris"
const COUNTER_OFFER_KR: Record<number, number> = { 2: 900 };

function priceStanceFor(index: number): PriceStance {
  if (DECLINES_PRICE.includes(index)) return "declines";
  if (UNDECIDED_PRICE.includes(index)) return "undecided";
  return "accepts";
}

export const demoVerdictProvider: VerdictProvider = {
  async getVerdictInput(locale: Locale): Promise<VerdictInput | null> {
    const cards = await getResponseCards(locale);
    if (cards.length === 0) return null; // Jonas, eller steg 05 inte körd än.

    const rows = await demoOutreachProvider.getCampaign(locale);
    const contacted = rows.filter((row) => row.status !== "draft").length;
    const source = outreachSource[locale];

    const responses = cards.map((card): VerdictResponse => {
      const index = saraCompanies.findIndex((c) => c.name === card.companyName);
      return {
        id: `demo-${index}`,
        companyName: card.companyName,
        employees: card.employees,
        dateIso: card.dateIso,
        quote: card.quote,
        problemStance: card.verdict,
        priceStance: priceStanceFor(index),
        priceTestedKr: card.priceTestedKr,
        counterOfferKr: COUNTER_OFFER_KR[index],
        source,
      };
    });
    return { contacted, responses };
  },

  async getVerdictReport(locale: Locale) {
    const input = await this.getVerdictInput(locale);
    return input ? buildVerdictReport(input, locale === "sv" ? sv : en) : null;
  },
};
