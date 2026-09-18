import type { MemoryRepository } from "@/ports/MemoryRepository";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/minnet.md";

export const liveMemoryRepository: MemoryRepository = {
  async getProfileSummary() {
    throw new NotImplementedError("Minnet", DOC);
  },
  async getBrainNotes() {
    throw new NotImplementedError("Minnet", DOC);
  },
  async setBrainNotes() {
    throw new NotImplementedError("Minnet", DOC);
  },
  async getTraceEvents() {
    throw new NotImplementedError("Minnet", DOC);
  },
};
