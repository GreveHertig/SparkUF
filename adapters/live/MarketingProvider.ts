import type { MarketingProvider } from "@/ports/MarketingProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/marknadsforing.md";

export const liveMarketingProvider: MarketingProvider = {
  async getPlan() {
    throw new NotImplementedError("Marknadsföring", DOC);
  },
  async draftContent() {
    throw new NotImplementedError("Marknadsföring", DOC);
  },
  async reportOutcome() {
    throw new NotImplementedError("Marknadsföring", DOC);
  },
};
