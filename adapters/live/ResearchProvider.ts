import type { ResearchProvider } from "@/ports/ResearchProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/webbresearch-och-pulsen.md";

export const liveResearchProvider: ResearchProvider = {
  async search() {
    throw new NotImplementedError("Webbresearch", DOC);
  },
};
