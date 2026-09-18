import type { PulseProvider } from "@/ports/PulseProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/webbresearch-och-pulsen.md";

export const livePulseProvider: PulseProvider = {
  async getTodaysSignal() {
    throw new NotImplementedError("Pulsen", DOC);
  },
  async getSignals() {
    throw new NotImplementedError("Pulsen", DOC);
  },
};
