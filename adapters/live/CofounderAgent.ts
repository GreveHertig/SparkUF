import type { CofounderAgent } from "@/ports/CofounderAgent";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/medgrundaren.md";

export const liveCofounderAgent: CofounderAgent = {
  async sendMessage() {
    throw new NotImplementedError("Medgrundaren", DOC);
  },
};
