import type { ResearchProvider } from "@/ports/ResearchProvider";

// Ingen skärm använder den här porten än.
export const demoResearchProvider: ResearchProvider = {
  async search() {
    return [];
  },
};
