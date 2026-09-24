import { describe, expect, it } from "vitest";
import { getScoreLevel } from "@/score/levels";
import { sv } from "@/i18n/sv";
import { exampleScores } from "./exampleEvidence";

const labels = {
  parts: sv.score.parts,
  sources: sv.experimentLanding.proof.sources,
  deltaReason: sv.experimentLanding.proof.deltaReason,
};

describe("exampleScores", () => {
  it("räknar båda lägena med calculateScore, och poängen sjunker när kunder säger emot", () => {
    const { base, contradicted } = exampleScores(labels);
    expect(contradicted.total).toBeLessThan(base.total);
    expect(contradicted.previousTotal).toBe(base.total);
    expect(contradicted.delta).toBe(contradicted.total - base.total);
  });

  it("byter nivå, så att sänkningen syns i nivånamnet och inte bara i talet", () => {
    const { base, contradicted } = exampleScores(labels);
    expect(getScoreLevel(base.total).key).not.toBe(getScoreLevel(contradicted.total).key);
  });

  it("har källa på varje upplåst del och visar låsta delar som låsta", () => {
    const { base } = exampleScores(labels);
    for (const part of base.parts) expect(part.source.namn).not.toBe("");
    expect(base.lockedParts.length).toBeGreaterThan(0);
  });
});
