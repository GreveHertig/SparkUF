import { expect } from "vitest";
import type { PulseProvider } from "./PulseProvider";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { describeContract, contractIt } from "./testContract";

describeContract<PulseProvider>(
  "PulseProvider",
  { demo: demoPulseProvider, live: livePulseProvider },
  (pulse) => {
    contractIt("getTodaysSignal har alltid en källa (Datalöftet)", async () => {
      const signal = await pulse.getTodaysSignal("sv");
      expect(signal.headline).toBeTruthy();
      expect(signal.whyItMatters).toBeTruthy();
      expect(signal.source.namn).toBeTruthy();
      expect(signal.source.hämtad).toBeTruthy();
    });

    contractIt("getSignals ger 3–5 signaler, alla med källa (avsnitt 9.5)", async () => {
      const signals = await pulse.getSignals("sv");
      expect(signals.length).toBeGreaterThanOrEqual(3);
      expect(signals.length).toBeLessThanOrEqual(5);
      for (const signal of signals) {
        expect(signal.source.namn).toBeTruthy();
        expect(signal.source.hämtad).toBeTruthy();
      }
    });
  },
);
