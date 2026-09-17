import type { JourneyRepository } from "@/ports/JourneyRepository";
import type { Locale } from "@/i18n/context";
import { saraJourneySummary } from "./sara";

export const demoJourneyRepository: JourneyRepository = {
  async getHomeSummary(locale: Locale) {
    return saraJourneySummary[locale];
  },
};
