import { describe, it, expect } from "vitest";
import { deriveCurrentStepNumber, deriveStepStatus, scorePhaseForCompletedSteps, JOURNEY_STEP_META } from "@/core/journey";

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
    expect(deriveCurrentStepNumber([], false)).toBe(1);
  });

  it("ger högsta avklarade steg + 1", () => {
    expect(deriveCurrentStepNumber([1, 2, 3], false)).toBe(4);
    expect(deriveCurrentStepNumber([5, 2], false)).toBe(6);
  });

  it("klämmer till 12 efter det sista steget", () => {
    expect(deriveCurrentStepNumber([12], false)).toBe(12);
    expect(deriveCurrentStepNumber([11, 12], true)).toBe(12);
  });

  it("räknar steg 1 som klart när onboardingen är klar, även utan journey_steps-rader", () => {
    expect(deriveCurrentStepNumber([], true)).toBe(2);
  });

  it("onboardingen flyttar aldrig tillbaka ett längre framsteg", () => {
    expect(deriveCurrentStepNumber([1, 2, 3], true)).toBe(4);
  });
});

describe("scorePhaseForCompletedSteps (beslut 2026-10-01: efter avklarat steg)", () => {
  it("räknar fasen ur högsta avklarade steg, inte ur steget som pågår", () => {
    expect(scorePhaseForCompletedSteps([])).toBe("discover");
    expect(scorePhaseForCompletedSteps([1, 2])).toBe("discover");
    expect(scorePhaseForCompletedSteps([1, 2, 3])).toBe("tryBeforeCalls");
    expect(scorePhaseForCompletedSteps([4])).toBe("tryBeforeCalls");
    expect(scorePhaseForCompletedSteps([5])).toBe("tryAfterCalls");
    expect(scorePhaseForCompletedSteps([6])).toBe("tryAfterCalls");
    expect(scorePhaseForCompletedSteps([7])).toBe("launch");
    expect(scorePhaseForCompletedSteps([10])).toBe("launch");
    expect(scorePhaseForCompletedSteps([11])).toBe("grow");
    expect(scorePhaseForCompletedSteps([12, 3])).toBe("grow");
  });

  it("Problem och Betalningsvilja är låsta medan steg 05 pågår (\"Låses upp efter steg 05\")", () => {
    // Steg 1-4 klara: steg 05 pågår. Fasen får inte låsa upp delarna än.
    expect(scorePhaseForCompletedSteps([1, 2, 3, 4])).toBe("tryBeforeCalls");
  });
});

describe("JOURNEY_STEP_META", () => {
  it("har alla 12 steg i ordning med samma maxPoints-summa som adapters/demo/sara.ts's SARA_STEPS", () => {
    expect(JOURNEY_STEP_META.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(JOURNEY_STEP_META.reduce((sum, s) => sum + s.maxPoints, 0)).toBe(146);
  });
});
