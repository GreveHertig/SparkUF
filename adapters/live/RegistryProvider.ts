import type { RegistryProvider } from "@/ports/RegistryProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/registret.md";

export const liveRegistryProvider: RegistryProvider = {
  async searchCompanies() {
    throw new NotImplementedError("Registret", DOC);
  },
};
