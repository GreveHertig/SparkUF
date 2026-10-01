import { describe, expect, it } from "vitest";
import { useDemoStore } from "./demoStore";
import { demoPulseProvider, getSignalSteps } from "./PulseProvider";
import { saraBeats } from "./sara";

// Demots Pulsen-sida sätter exempelkällan per signal ur `getSignalSteps`
// (steg 6). Listorna måste följas åt, annars får en signal fel steg.
describe("getSignalSteps", () => {
  it("följer getSignals i varje moment: lika många, steg 01 från start, 03 och 06 när de låses upp", async () => {
    useDemoStore.setState({ entry: "noIdea" });
    for (let beatIndex = 0; beatIndex < saraBeats.length; beatIndex++) {
      useDemoStore.setState({ beatIndex });
      const signals = await demoPulseProvider.getSignals("sv");
      const steps = getSignalSteps();
      expect(steps, `moment ${beatIndex}`).toHaveLength(signals.length);
      expect(steps.slice(-3)).toEqual([1, 1, 1]);
      for (const step of steps) expect([1, 3, 6]).toContain(step);
    }
  });

  it("är tom för Jonas, precis som signalerna", async () => {
    useDemoStore.setState({ entry: "hasIdea", beatIndex: 0 });
    expect(await demoPulseProvider.getSignals("sv")).toEqual([]);
    expect(getSignalSteps()).toEqual([]);
  });
});
