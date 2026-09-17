import type { SimulationProvider } from "@/ports/SimulationProvider";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/simuleringar.md";

export const liveSimulationProvider: SimulationProvider = {
  async simulate() {
    throw new NotImplementedError("Simuleringar", DOC);
  },
};
