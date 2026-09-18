import type { BuildProvider } from "@/ports/BuildProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/bygg.md";

export const liveBuildProvider: BuildProvider = {
  async startBuild() {
    throw new NotImplementedError("Bygg", DOC);
  },
  async getStatus() {
    throw new NotImplementedError("Bygg", DOC);
  },
  async getSpec() {
    throw new NotImplementedError("Bygg", DOC);
  },
};
