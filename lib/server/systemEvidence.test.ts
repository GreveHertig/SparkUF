import { describe, expect, it } from "vitest";
import { validateSystemEvidenceWrite, type SystemEvidenceWrite } from "./systemEvidence";

const valid: SystemEvidenceWrite = {
  userId: "00000000-0000-4000-8000-0000000000d1",
  projectId: "00000000-0000-4000-8000-0000000000d2",
  kind: "registerMarketCount",
  subjectRef: "sni:43.210",
  sourceName: "SCB:s företagsregister",
  sourceUrl: "https://www.scb.se/vara-tjanster/foretagsregistret/",
  fetchedAt: "2026-10-04",
  quote: "4210",
  module: "Marknad",
  stepNumber: 3,
};

describe("validateSystemEvidenceWrite", () => {
  it("tar emot ett giltigt registerbevis", () => {
    expect(() => validateSystemEvidenceWrite(valid)).not.toThrow();
  });

  it("nekar sorter som grundaren lägger in, eller som båda får lägga in", () => {
    for (const kind of ["profileFitAnswer", "customerProblemConfirmed", "priceDecided"] as const) {
      expect(() => validateSystemEvidenceWrite({ ...valid, kind })).toThrow(/systemet/);
    }
  });

  it("kräver en https-länk till källan (bevislagring 7.3c)", () => {
    for (const sourceUrl of ["", "http://scb.se", "javascript:alert(1)"]) {
      expect(() => validateSystemEvidenceWrite({ ...valid, sourceUrl })).toThrow(/https/);
    }
  });

  it("nekar ogiltiga id, datum och steg", () => {
    expect(() => validateSystemEvidenceWrite({ ...valid, userId: "x" })).toThrow();
    expect(() => validateSystemEvidenceWrite({ ...valid, fetchedAt: "4 oktober" })).toThrow();
    expect(() => validateSystemEvidenceWrite({ ...valid, stepNumber: 13 })).toThrow();
  });
});
