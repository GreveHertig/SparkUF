import type { JourneyRepository } from "@/ports/JourneyRepository";
import type { Locale } from "@/i18n/context";
import { useDemoStore } from "./demoStore";
import { getJourneySummaryForBeat } from "./sara";

export const demoJourneyRepository: JourneyRepository = {
  async getHomeSummary(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    return getJourneySummaryForBeat(beatIndex, locale);
  },
};
