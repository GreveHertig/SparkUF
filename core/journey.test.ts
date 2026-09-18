import { describe, it, expect } from "vitest";
import { deriveCurrentStepNumber, deriveStepStatus, scorePhaseForStep, JOURNEY_STEP_META } from "@/core/journey";

describe("deriveStepStatus", () => {
  it("markerar steg före det aktuella som klara", () => {
    expect(deriveStepStatus(2, 5)).toBe("done");
  });

  it("markerar det aktuella steget", () => {
    expect(deriveStepStatus(5, 5)).toBe("current");
  });

  it("markerar steg efter det aktuella som låsta", () => {
    expect(deriveStepStatus(6, 5)).toBe("locked");
  });

  it("har högst ett 'current' och inget 'done' efter ett 'locked' för alla 12 steg", () => {
    for (let current = 1; current <= 12; current++) {
      const statuses = JOURNEY_STEP_META.map((step) => deriveStepStatus(step.stepNumber, current));
      expect(statuses.filter((s) => s === "current")).toHaveLength(1);
      const firstLocked = statuses.indexOf("locked");
      if (firstLocked !== -1) {
        expect(statuses.slice(firstLocked)).not.toContain("done");
      }
    }
  });
});

describe("deriveCurrentStepNumber", () => {
  it("ger steg 1 för en ny användare utan avklarade steg", () => {
    expect(deriveCurrentStepNumber([])).toBe(1);
  });

  it("ger högsta avklarade steg + 1", () => {
    expect(deriveCurrentStepNumber([1, 2, 3])).toBe(4);
    expect(deriveCurrentStepNumber([5, 2])).toBe(6);
  });

  it("klämmer till 12 efter det sista steget", () => {
    expect(deriveCurrentStepNumber([12])).toBe(12);
    expect(deriveCurrentStepNumber([11, 12])).toBe(12);
  });
});

describe("scorePhaseForStep", () => {
  it("följer core/score.ts's UNLOCK_STEP-gränser (1/2 discover, 3/4 tryBeforeCalls, 5/6 tryAfterCalls, 7-10 launch, 11/12 grow)", () => {
    expect(scorePhaseForStep(1)).toBe("discover");
    expect(scorePhaseForStep(2)).toBe("discover");
    expect(scorePhaseForStep(3)).toBe("tryBeforeCalls");
    expect(scorePhaseForStep(4)).toBe("tryBeforeCalls");
    expect(scorePhaseForStep(5)).toBe("tryAfterCalls");
    expect(scorePhaseForStep(6)).toBe("tryAfterCalls");
    expect(scorePhaseForStep(7)).toBe("launch");
    expect(scorePhaseForStep(10)).toBe("launch");
    expect(scorePhaseForStep(11)).toBe("grow");
    expect(scorePhaseForStep(12)).toBe("grow");
  });
});

describe("JOURNEY_STEP_META", () => {
  it("har alla 12 steg i ordning med samma maxPoints-summa som adapters/demo/sara.ts's SARA_STEPS", () => {
    expect(JOURNEY_STEP_META.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(JOURNEY_STEP_META.reduce((sum, s) => sum + s.maxPoints, 0)).toBe(146);
  });
});
