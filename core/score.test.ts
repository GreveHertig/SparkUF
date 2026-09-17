import { describe, expect, it } from "vitest";
import {
  ALL_PART_IDS,
  PHASE_UNLOCKED_PARTS,
  calculateScore,
  deriveSuggestions,
  type EvidenceItem,
  type PartEvidence,
  type PhaseId,
  type ScorePartId,
} from "./score";
import type { Källa } from "@/core/domain";

// Tester för reglerna i docs/uppdrag.md avsnitt 7.7: taken, avtagande värde,
// motsägelser, att poängen aldrig blir 0, att poäng utan källa inte kan
// uppstå, samt förslagen (7.6).

function källa(namn = "Testkälla"): Källa {
  return { namn, hämtad: "2026-01-01" };
}

function item(points: number, overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return { points, source: källa(), dataType: "customer", ...overrides };
}

/** Bygger PartEvidence för alla åtta delar. Upplåsta delar får ett minimalt
 * bevis som default (så att `calculateScore` inte kastar), låsta delar får
 * en tom lista. `overrides` skriver över enskilda delars bevis. */
function allParts(
  phase: PhaseId,
  overrides: Partial<Record<ScorePartId, EvidenceItem[]>> = {},
): PartEvidence[] {
  const unlocked = new Set(PHASE_UNLOCKED_PARTS[phase]);
  return ALL_PART_IDS.map((partId) => ({
    partId,
    label: partId,
    items: overrides[partId] ?? (unlocked.has(partId) ? [item(1)] : []),
  }));
}

function pointsFor(snapshotParts: { name: string; points: number }[], partId: ScorePartId): number {
  const found = snapshotParts.find((part) => part.name === partId);
  if (!found) throw new Error(`saknar del "${partId}" i snapshotens parts`);
  return found.points;
}

describe("calculateScore — tak per fas (7.3)", () => {
  it("går aldrig över fasens tak, oavsett hur mycket bevis som finns", () => {
    const heavy = Array.from({ length: 30 }, () => item(20));
    for (const phase of Object.keys(PHASE_UNLOCKED_PARTS) as PhaseId[]) {
      const overrides = Object.fromEntries(
        PHASE_UNLOCKED_PARTS[phase].map((partId) => [partId, heavy]),
      );
      const snapshot = calculateScore({
        phase,
        parts: allParts(phase, overrides),
        calculatedAtIso: "2026-01-01",
      });
      expect(snapshot.total).toBeLessThanOrEqual(100);
      expect(snapshot.total).toBeLessThanOrEqual(
        { discover: 18, tryBeforeCalls: 30, tryAfterCalls: 66, launch: 86, grow: 100 }[phase],
      );
    }
  });

  it("Marknad är bara preliminärt upplåst (halv vikt) i Upptäck", () => {
    const heavy = Array.from({ length: 10 }, () => item(20));
    const snapshot = calculateScore({
      phase: "discover",
      parts: allParts("discover", { market: heavy }),
      calculatedAtIso: "2026-01-01",
    });
    expect(pointsFor(snapshot.parts, "market")).toBeLessThanOrEqual(6);
  });
});

describe("calculateScore — avtagande värde (7.4)", () => {
  it("svar 20–30 är värda nästan inget jämfört med svar 1–10", () => {
    const tenItems = Array.from({ length: 10 }, () => item(1));
    const thirtyItems = Array.from({ length: 30 }, () => item(1));

    const withTen = calculateScore({
      phase: "tryAfterCalls",
      parts: allParts("tryAfterCalls", { problem: tenItems }),
      calculatedAtIso: "2026-01-01",
    });
    const withThirty = calculateScore({
      phase: "tryAfterCalls",
      parts: allParts("tryAfterCalls", { problem: thirtyItems }),
      calculatedAtIso: "2026-01-01",
    });

    const pointsTen = pointsFor(withTen.parts, "problem");
    const pointsThirty = pointsFor(withThirty.parts, "problem");

    expect(pointsThirty).toBeGreaterThan(pointsTen);
    // 20 extra svar (som utan avtagande värde skulle ge +20) ger i praktiken
    // nästan inget extra.
    expect(pointsThirty - pointsTen).toBeLessThan(5);
  });
});

describe("calculateScore — motsägelser (7.4)", () => {
  it("räknas fullt ut, men ett skevt underlag sänker delens poäng", () => {
    const consistent = Array.from({ length: 6 }, () => item(2));
    const skewed = consistent.map((evidence, index) => ({ ...evidence, contradicts: index < 3 }));

    const withConsistent = calculateScore({
      phase: "tryAfterCalls",
      parts: allParts("tryAfterCalls", { willingnessToPay: consistent }),
      calculatedAtIso: "2026-01-01",
    });
    const withSkewed = calculateScore({
      phase: "tryAfterCalls",
      parts: allParts("tryAfterCalls", { willingnessToPay: skewed }),
      calculatedAtIso: "2026-01-01",
    });

    const consistentPoints = pointsFor(withConsistent.parts, "willingnessToPay");
    const skewedPoints = pointsFor(withSkewed.parts, "willingnessToPay");

    expect(skewedPoints).toBeLessThan(consistentPoints);
    // Motsägelserna exkluderas inte — de bidrar ändå, straffet är en rabatt
    // på hela delens totalpoäng, inte att bevisen ignoreras.
    expect(skewedPoints).toBeGreaterThan(0);
  });
});

describe("calculateScore — poängen är aldrig 0 (7.4)", () => {
  it("klamras till minst 1 även med minimalt bevis", () => {
    const snapshot = calculateScore({
      phase: "discover",
      parts: allParts("discover", { fit: [item(0)], market: [item(0)] }),
      calculatedAtIso: "2026-01-01",
    });
    expect(snapshot.total).toBeGreaterThanOrEqual(1);
  });
});

describe("calculateScore — ingen poäng utan källa (7.4)", () => {
  it("kastar om en upplåst del helt saknar bevis", () => {
    expect(() =>
      calculateScore({
        phase: "discover",
        parts: allParts("discover", { fit: [] }),
        calculatedAtIso: "2026-01-01",
      }),
    ).toThrow(/ingen poäng utan källa/i);
  });

  it("simuleringar ger alltid 0 poäng, oavsett rått värde", () => {
    const snapshot = calculateScore({
      phase: "discover",
      parts: allParts("discover", { fit: [item(100, { dataType: "simulation" })] }),
      calculatedAtIso: "2026-01-01",
    });
    expect(pointsFor(snapshot.parts, "fit")).toBe(0);
  });
});

describe("calculateScore — låsta delar (7.3)", () => {
  it("visas som låsta, aldrig som en ScorePart med 0 poäng", () => {
    const snapshot = calculateScore({
      phase: "discover",
      parts: allParts("discover"),
      calculatedAtIso: "2026-01-01",
    });
    expect(snapshot.parts.some((part) => part.name === "traction")).toBe(false);
    const locked = snapshot.lockedParts.find((part) => part.name === "traction");
    expect(locked).toBeDefined();
    expect(locked?.unlocksAfterStep).toBeGreaterThan(0);
  });
});

describe("calculateScore — poängen kan sjunka", () => {
  it("ger negativ delta när previousTotal är högre än den nya totalen", () => {
    const snapshot = calculateScore({
      phase: "tryAfterCalls",
      parts: allParts("tryAfterCalls"),
      previousTotal: 90,
      deltaReason: "efter nya svar",
      calculatedAtIso: "2026-01-01",
    });
    expect(snapshot.delta).toBeLessThan(0);
    expect(snapshot.deltaReason).toBe("efter nya svar");
  });
});

describe("deriveSuggestions (7.6)", () => {
  it("sorterar efter poäng per minut, högst först", () => {
    const suggestions = deriveSuggestions(
      [
        {
          partId: "market",
          label: "Marknad",
          gapType: "insufficient",
          pointsGain: 4,
          estimatedMinutes: 20,
          explanation: "",
          actionLabel: "",
        },
        {
          partId: "problem",
          label: "Problem",
          gapType: "insufficient",
          pointsGain: 6,
          estimatedMinutes: 10,
          explanation: "",
          actionLabel: "",
        },
      ],
      [],
    );

    expect(suggestions[0].partId).toBe("problem");
    expect(suggestions[0].pointsPerMinute).toBeGreaterThan(suggestions[1].pointsPerMinute);
  });

  it("ger inga förslag för låsta delar", () => {
    const suggestions = deriveSuggestions(
      [
        {
          partId: "traction",
          label: "Traktion",
          gapType: "structural",
          pointsGain: 10,
          estimatedMinutes: 5,
          explanation: "",
          actionLabel: "",
        },
      ],
      ["traction"],
    );
    expect(suggestions).toHaveLength(0);
  });
});
