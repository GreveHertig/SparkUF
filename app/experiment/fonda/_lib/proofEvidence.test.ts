import { describe, expect, it } from "vitest";
import { sv } from "@/i18n/sv";
import { getScoreLevel } from "@/score/levels";
import { PROOF_CONTRADICTING_COUNT, proofScores } from "./proofEvidence";

const labels = {
  parts: sv.score.parts,
  sources: sv.experimentFonda.proof.sources,
  deltaReason: sv.experimentFonda.proof.deltaReason,
};

describe("poängexemplet på /experiment/fonda", () => {
  it("sjunker och byter nivå när tre kunder säger emot", () => {
    const { base, contradicted } = proofScores(labels);
    expect(contradicted.total).toBeLessThan(base.total);
    expect(contradicted.delta).toBe(contradicted.total - base.total);
    expect(contradicted.deltaReason).toBe(labels.deltaReason);
    expect(getScoreLevel(contradicted.total).key).not.toBe(getScoreLevel(base.total).key);
  });

  it("har källa på varje del och låser samma delar i båda lägena", () => {
    const { base, contradicted } = proofScores(labels);
    for (const part of [...base.parts, ...contradicted.parts]) {
      expect(part.source.namn).not.toBe("");
    }
    expect(contradicted.lockedParts).toEqual(base.lockedParts);
    expect(PROOF_CONTRADICTING_COUNT).toBe(3);
  });
});
