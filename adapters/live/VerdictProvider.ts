import type { VerdictProvider } from "@/ports/VerdictProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/domen.md";

/**
 * Domen har ingen liveindata än: den läser svaren från OutreachProvider
 * (sändning avstängd, ingen Gmail) och antalet anställda från
 * RegistryProvider (grindad, väntar på Bolagsverket). Adaptern byggs när de
 * är live; ren logik (core/verdict.ts) är redan klar och delas med demot.
 */
export const liveVerdictProvider: VerdictProvider = {
  async getVerdictInput() {
    throw new NotImplementedError("Domen", DOC);
  },
  async getVerdictReport() {
    throw new NotImplementedError("Domen", DOC);
  },
};
