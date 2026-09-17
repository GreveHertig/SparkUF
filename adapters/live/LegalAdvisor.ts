import type { LegalAdvisor } from "@/ports/LegalAdvisor";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/juridisk-koll.md";

export const liveLegalAdvisor: LegalAdvisor = {
  async getLegalMap() {
    throw new NotImplementedError("Juridisk koll", DOC);
  },
};
