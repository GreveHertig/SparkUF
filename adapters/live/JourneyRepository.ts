import type { JourneyRepository } from "@/ports/JourneyRepository";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/resan.md";

export const liveJourneyRepository: JourneyRepository = {
  async getHomeSummary() {
    throw new NotImplementedError("Resan", DOC);
  },
};
