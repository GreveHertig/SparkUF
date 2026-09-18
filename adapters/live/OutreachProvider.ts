import type { OutreachProvider } from "@/ports/OutreachProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/utskick-och-svar.md";

export const liveOutreachProvider: OutreachProvider = {
  async send() {
    throw new NotImplementedError("Utskick och svar", DOC);
  },
  async getStatuses() {
    throw new NotImplementedError("Utskick och svar", DOC);
  },
  async getCampaign() {
    throw new NotImplementedError("Utskick och svar", DOC);
  },
};
