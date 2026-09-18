import { expect } from "vitest";
import type { SimulationProvider } from "./SimulationProvider";
import { demoSimulationProvider } from "@/adapters/demo/SimulationProvider";
import { liveSimulationProvider } from "@/adapters/live/SimulationProvider";
import { describeContract, contractIt } from "./testContract";

describeContract<SimulationProvider>(
  "SimulationProvider",
  { demo: demoSimulationProvider, live: liveSimulationProvider },
  (simulation) => {
    contractIt("simulate ekar frågan och visar underlag och osäkerhet (avsnitt 2.2)", async () => {
      const question = "Hur mycket tid lägger byråerna på kvitton?";
      const result = await simulation.simulate(question, "sv");
      expect(result.question).toBe(question);
      expect(result.populationSize).toBeGreaterThan(0);
      expect(result.source.namn).toBeTruthy();
      expect(result.uncertaintyRangeLabel).toBeTruthy();
    });
  },
);
