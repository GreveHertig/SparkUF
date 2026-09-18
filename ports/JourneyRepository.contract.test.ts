import { expect } from "vitest";
import type { JourneyRepository } from "./JourneyRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { describeContract, contractIt } from "./testContract";

describeContract<JourneyRepository>(
  "JourneyRepository",
  { demo: demoJourneyRepository, live: liveJourneyRepository },
  (journey) => {
    contractIt("getSteps returnerar exakt de 12 stegen i avsnitt 1.5, i ordning", async () => {
      const steps = await journey.getSteps("sv");
      expect(steps).toHaveLength(12);
      expect(steps.map((step) => step.stepNumber)).toEqual(
        Array.from({ length: 12 }, (_, i) => i + 1),
      );
    });

    contractIt("getSteps har högst ett aktuellt steg och inget klart efter ett låst", async () => {
      const steps = await journey.getSteps("sv");
      const currentCount = steps.filter((step) => step.status === "current").length;
      expect(currentCount).toBeLessThanOrEqual(1);

      const firstLockedIndex = steps.findIndex((step) => step.status === "locked");
      if (firstLockedIndex === -1) return;
      const doneAfterLocked = steps
        .slice(firstLockedIndex)
        .some((step) => step.status === "done");
      expect(doneAfterLocked).toBe(false);
    });

    contractIt("getStepDetail på ett okänt stegnummer ger null, inte ett fel", async () => {
      const result = await journey.getStepDetail(999, "sv");
      expect(result).toBeNull();
    });

    contractIt("getStepDetail på ett giltigt steg matchar stegnumret", async () => {
      const result = await journey.getStepDetail(1, "sv");
      expect(result?.stepNumber).toBe(1);
    });

    contractIt("getHomeSummary har ett handlingssteg med titel och maxpoäng", async () => {
      const summary = await journey.getHomeSummary("sv");
      expect(summary.todayIso).toBeTruthy();
      expect(summary.nextStep.title).toBeTruthy();
      expect(summary.nextStep.maxPoints).toBeGreaterThan(0);
    });
  },
);
