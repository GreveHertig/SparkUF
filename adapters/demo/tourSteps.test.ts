import { describe, expect, it } from "vitest";
import { TOUR_STEPS } from "./tourSteps";
import { saraEngine } from "./sara";

// Rundturen går framåt i Saras resa: varje stopp med ett moment ligger på
// samma eller ett senare moment än stoppet före, så poängen i sidhuvudet
// aldrig hoppar bakåt i tiden (pitchrättningarna 2026-10-01).
describe("rundturens ordning", () => {
  const beatIndices = TOUR_STEPS.filter((step) => step.beatId).map((step) =>
    saraEngine.beats.findIndex((beat) => beat.id === step.beatId),
  );

  it("varje stopps moment finns i Saras scenario", () => {
    expect(beatIndices.every((index) => index >= 0)).toBe(true);
  });

  it("momenten kommer i ordning, så poängen bara sjunker där resan själv sjunker", () => {
    for (let i = 1; i < beatIndices.length; i++) expect(beatIndices[i]).toBeGreaterThanOrEqual(beatIndices[i - 1]);
  });
});
