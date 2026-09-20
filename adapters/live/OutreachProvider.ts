import type { OutreachProvider } from "@/ports/OutreachProvider";
import { OutreachSendDisabledError } from "@/core/errors";

/**
 * SÄNDNING ÄR AVSTÄNGD (docs/moduler/utskick-och-svar.md, "Sändspärr").
 * Ingen Gmail-koppling, inga sända mejl, ingen öppningsspårning, inga
 * automatiska påminnelser — inte förrän Theodor och grundaren uttryckligen
 * sagt ja. Mejlsökning och utkast ligger i adapters/live/OutreachPrep.ts.
 */
export const liveOutreachProvider: OutreachProvider = {
  async send() {
    throw new OutreachSendDisabledError();
  },
  async getStatuses() {
    throw new OutreachSendDisabledError();
  },
  async getCampaign() {
    throw new OutreachSendDisabledError();
  },
};
