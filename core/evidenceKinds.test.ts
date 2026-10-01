import { describe, expect, it } from "vitest";
import { ALL_PART_IDS } from "@/core/score";
import {
  ALL_EVIDENCE_KINDS,
  EVIDENCE_KINDS,
  founderMayRecord,
  givesPoints,
  isEvidenceKind,
  isSelfReported,
} from "@/core/evidenceKinds";

describe("EVIDENCE_KINDS (docs/bevislagring.md 1.2)", () => {
  it("varje del har minst en sort", () => {
    for (const partId of ALL_PART_IDS) {
      expect(ALL_EVIDENCE_KINDS.some((kind) => EVIDENCE_KINDS[kind].partId === partId), partId).toBe(true);
    }
  });

  it("ingen sort är en simulering (7.6)", () => {
    for (const kind of ALL_EVIDENCE_KINDS) {
      expect(EVIDENCE_KINDS[kind].dataType).not.toBe("simulation");
    }
  });

  it("alla basePoints är positiva eller 0 och alla livslängder positiva eller null", () => {
    for (const kind of ALL_EVIDENCE_KINDS) {
      const spec = EVIDENCE_KINDS[kind];
      expect(spec.basePoints).toBeGreaterThanOrEqual(0);
      if (spec.freshForDays !== null) expect(spec.freshForDays).toBeGreaterThan(0);
    }
  });

  it("bara kraven för steg 07 och 12 saknar poäng (beslut 2026-10-01)", () => {
    expect(ALL_EVIDENCE_KINDS.filter((kind) => !givesPoints(kind)).sort()).toEqual(["fundingApplied", "priceDecided"]);
  });

  it("ett beslutat pris och en ansökan märks som självrapporterade när grundaren anger dem", () => {
    expect(isSelfReported("priceDecided", "founder")).toBe(true);
    expect(isSelfReported("fundingApplied", "founder")).toBe(true);
  });

  it("isEvidenceKind godtar bara sorter i listan, inte prototypnamn", () => {
    expect(isEvidenceKind("profileFitAnswer")).toBe(true);
    expect(isEvidenceKind("toString")).toBe(false);
    expect(isEvidenceKind("points")).toBe(false);
    expect(isEvidenceKind(42)).toBe(false);
  });

  it("grundaren får aldrig lägga in registerdata", () => {
    expect(founderMayRecord("registerMarketCount")).toBe(false);
    expect(founderMayRecord("customerProblemConfirmed")).toBe(true);
    expect(founderMayRecord("profileFitAnswer")).toBe(true);
  });

  it("bara ett faktum om en tredje part, angivet av grundaren, är självrapporterat", () => {
    expect(isSelfReported("customerPriceAccepted", "founder")).toBe(true);
    expect(isSelfReported("customerPriceAccepted", "system")).toBe(false);
    // Profilen: grundaren är själv källan.
    expect(isSelfReported("profileFitAnswer", "founder")).toBe(false);
  });
});
