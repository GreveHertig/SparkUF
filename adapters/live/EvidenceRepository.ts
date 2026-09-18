import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/evidens-och-poang.md";

export const liveEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot() {
    throw new NotImplementedError("Evidens och poäng", DOC);
  },
  async getSuggestions() {
    throw new NotImplementedError("Evidens och poäng", DOC);
  },
  async getScoreHistory() {
    throw new NotImplementedError("Evidens och poäng", DOC);
  },
};
