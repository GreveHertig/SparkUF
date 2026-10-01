import { describe, expect, it } from "vitest";
import { ALL_PART_IDS, calculateScore, type ScorePartId } from "@/core/score";
import { EVIDENCE_KINDS, SELF_REPORTED_MULTIPLIER, type EvidenceKind } from "@/core/evidenceKinds";
import { EvidenceIntegrityError, isStale, toPartEvidence, type StoredEvidence } from "@/core/evidenceInput";

const LABELS = Object.fromEntries(ALL_PART_IDS.map((id) => [id, id])) as Record<ScorePartId, string>;
const TODAY = "2026-10-01";

let counter = 0;
/** En rad som databasen skulle ha skrivit den: fälten ur sorten, poängen
 * ur sorten (halverad om självrapporterad). */
function row(kind: EvidenceKind, overrides: Partial<StoredEvidence> = {}): StoredEvidence {
  counter += 1;
  const spec = EVIDENCE_KINDS[kind];
  const enteredBy = overrides.enteredBy ?? (spec.enteredBy === "founder" ? "founder" : "system");
  const selfReported = enteredBy === "founder" && spec.enteredBy === "either";
  return {
    id: `e${String(counter).padStart(3, "0")}`,
    kind,
    partId: spec.partId,
    dataType: spec.dataType,
    contradicts: spec.contradicts,
    points: selfReported ? spec.basePoints * SELF_REPORTED_MULTIPLIER : spec.basePoints,
    enteredBy,
    source: { namn: `Källa ${counter}`, hämtad: "2026-09-01" },
    createdAtIso: `2026-09-01T00:00:${String(counter % 60).padStart(2, "0")}Z`,
    retractedAtIso: null,
    ...overrides,
  };
}

function part(result: ReturnType<typeof toPartEvidence>, partId: ScorePartId) {
  return result.parts.find((p) => p.partId === partId)!;
}

describe("toPartEvidence — regel 1: återkallade bevis räknas inte", () => {
  it("utesluter ett återkallat bevis och märker det", () => {
    const kept = row("profileFitAnswer");
    const retracted = row("profileFitAnswer", { retractedAtIso: "2026-09-10T00:00:00Z" });
    const result = toPartEvidence([kept, retracted], TODAY, LABELS);
    expect(part(result, "fit").items).toHaveLength(1);
    expect(result.status[retracted.id]).toBe("retracted");
    expect(result.status[kept.id]).toBe("counted");
  });
});

describe("toPartEvidence — regel 2: raden måste stämma med sorten", () => {
  it("kastar om delen inte stämmer (fel del, 7.4)", () => {
    const bad = row("profileFitAnswer", { partId: "traction" });
    expect(() => toPartEvidence([bad], TODAY, LABELS)).toThrow(EvidenceIntegrityError);
  });

  it("kastar om datatypen eller motsäger inte stämmer", () => {
    expect(() => toPartEvidence([row("profileFitAnswer", { dataType: "simulation" })], TODAY, LABELS)).toThrow(
      EvidenceIntegrityError,
    );
    expect(() => toPartEvidence([row("customerProblemRejected", { contradicts: false })], TODAY, LABELS)).toThrow(
      EvidenceIntegrityError,
    );
  });

  it("kastar på en okänd sort", () => {
    expect(() => toPartEvidence([row("profileFitAnswer", { kind: "madeUp" })], TODAY, LABELS)).toThrow(
      EvidenceIntegrityError,
    );
  });

  it("tar datatyp och motsäger ur sorten, inte ur raden", () => {
    const result = toPartEvidence([row("customerProblemRejected")], TODAY, LABELS);
    expect(part(result, "problem").items[0]).toMatchObject({ dataType: "customer", contradicts: true });
  });
});

describe("toPartEvidence — regel 3: gamla bevis utesluts (beslut B9)", () => {
  it("räknar ett kundsvar i exakt 180 dagar, inte en dag till", () => {
    expect(isStale("customerPriceAccepted", "2026-04-04", TODAY)).toBe(false); // 180 dagar
    expect(isStale("customerPriceAccepted", "2026-04-03", TODAY)).toBe(true); // 181 dagar
  });

  it("ett bevis utan livslängd föråldras aldrig", () => {
    expect(isStale("profileFitAnswer", "2010-01-01", TODAY)).toBe(false);
  });

  it("utesluter ett föråldrat bevis helt, graderar det inte ner", () => {
    const fresh = row("customerProblemConfirmed", { source: { namn: "Färsk", hämtad: "2026-09-01" } });
    const old = row("customerProblemConfirmed", { source: { namn: "Gammal", hämtad: "2025-01-01" } });
    const result = toPartEvidence([old, fresh], TODAY, LABELS);
    expect(part(result, "problem").items.map((i) => i.source.namn)).toEqual(["Färsk"]);
    expect(part(result, "problem").items[0].points).toBe(EVIDENCE_KINDS.customerProblemConfirmed.basePoints);
    expect(result.status[old.id]).toBe("stale");
  });

  it("ett föråldrat bevis sänker delpoängen", () => {
    const rows = [row("customerProblemConfirmed"), row("customerProblemConfirmed")];
    const now = toPartEvidence(rows, TODAY, LABELS);
    const inAYear = toPartEvidence(rows, "2027-10-01", LABELS);
    expect(part(inAYear, "problem").items.length).toBeLessThan(part(now, "problem").items.length);
  });

  it("en upplåst del med bara föråldrade bevis blir tom, och calculateScore kastar inte (B4)", () => {
    const rows = [row("profileFitAnswer"), row("registerMarketCount", { source: { namn: "SCB", hämtad: "2024-01-01" } })];
    const result = toPartEvidence(rows, TODAY, LABELS);
    expect(part(result, "market").items).toHaveLength(0);
    const snapshot = calculateScore({ phase: "discover", parts: result.parts, calculatedAtIso: TODAY });
    expect(snapshot.emptyParts).toEqual([{ name: "market", weight: 12 }]);
  });
});

describe("toPartEvidence — regel 4: ordningen", () => {
  it("ordnar efter created_at, sedan id, oavsett radordningen in", () => {
    const later = row("profileFitAnswer", { id: "b", createdAtIso: "2026-09-05T00:00:00Z", source: { namn: "Senare", hämtad: "2026-09-05" } });
    const earlier = row("profileFitAnswer", { id: "c", createdAtIso: "2026-09-01T00:00:00Z", source: { namn: "Tidigare", hämtad: "2026-09-01" } });
    const sameTime = row("profileFitAnswer", { id: "a", createdAtIso: "2026-09-01T00:00:00Z", source: { namn: "Samma tid", hämtad: "2026-09-01" } });
    const result = toPartEvidence([later, earlier, sameTime], TODAY, LABELS);
    expect(part(result, "fit").items.map((i) => i.source.namn)).toEqual(["Samma tid", "Tidigare", "Senare"]);
  });

  it("samma indata ger samma utdata", () => {
    const rows = [row("profileFitAnswer"), row("registerMarketCount"), row("customerPriceDeclined")];
    expect(toPartEvidence(rows, TODAY, LABELS)).toEqual(toPartEvidence([...rows].reverse(), TODAY, LABELS));
  });
});

describe("toPartEvidence — regel 5: tak för självrapporterade bevis (beslut B6)", () => {
  it("självrapporterade bevis ger tillsammans högst halva delens vikt", () => {
    // Problem väger 18: taket är 9. Tio självrapporterade bekräftelser à 1,5 = 15.
    const rows = Array.from({ length: 10 }, () => row("customerProblemConfirmed", { enteredBy: "founder" }));
    const result = toPartEvidence(rows, TODAY, LABELS);
    const sum = part(result, "problem").items.reduce((total, i) => total + i.points, 0);
    expect(sum).toBe(9);
    expect(Object.values(result.status).filter((s) => s === "capped").length).toBeGreaterThan(0);

    const snapshot = calculateScore({
      phase: "tryAfterCalls",
      parts: result.parts,
      calculatedAtIso: TODAY,
    });
    expect(snapshot.parts.find((p) => p.name === "problem")?.points).toBeLessThanOrEqual(9);
  });

  it("taket gäller inte bevis Spark själv tagit emot", () => {
    const rows = Array.from({ length: 6 }, () => row("customerProblemConfirmed", { enteredBy: "system" }));
    const result = toPartEvidence(rows, TODAY, LABELS);
    expect(part(result, "problem").items.reduce((total, i) => total + i.points, 0)).toBe(18);
  });

  it("taket gäller inte profilsvar, där grundaren själv är källan", () => {
    const rows = Array.from({ length: 4 }, () => row("profileFitAnswer"));
    const result = toPartEvidence(rows, TODAY, LABELS);
    expect(part(result, "fit").items.reduce((total, i) => total + i.points, 0)).toBe(12);
  });

  it("ett självrapporterat motsägande bevis räknas fortfarande in i underlaget efter taket", () => {
    const rows = [
      ...Array.from({ length: 6 }, () => row("customerPriceAccepted", { enteredBy: "founder" })),
      row("customerPriceDeclined", { enteredBy: "founder" }),
    ];
    const result = toPartEvidence(rows, TODAY, LABELS);
    const items = part(result, "willingnessToPay").items;
    expect(items).toHaveLength(7);
    expect(items[6]).toMatchObject({ contradicts: true, points: 0 });
  });
});

describe("toPartEvidence — regel 5: en sort utan poäng skickas inte till calculateScore", () => {
  it("ett beslutat pris fyller inte Betalningsvilja och märks noPoints", () => {
    const decided = row("priceDecided", { enteredBy: "founder" });
    const result = toPartEvidence([decided], TODAY, LABELS);
    expect(part(result, "willingnessToPay").items).toHaveLength(0);
    expect(result.status[decided.id]).toBe("noPoints");
  });

  it("delen förblir en lucka i calculateScore, inte 0 (beslut B4)", () => {
    const result = toPartEvidence([row("priceDecided", { enteredBy: "founder" })], TODAY, LABELS);
    const snapshot = calculateScore({ phase: "tryAfterCalls", parts: result.parts, calculatedAtIso: `${TODAY}T00:00:00Z` });
    expect((snapshot.emptyParts ?? []).map((empty) => empty.name)).toContain("willingnessToPay");
  });

  it("ett föråldrat beslutat pris märks stale, inte noPoints", () => {
    const old = row("priceDecided", { enteredBy: "founder", source: { namn: "Du", hämtad: "2025-01-01" } });
    expect(toPartEvidence([old], TODAY, LABELS).status[old.id]).toBe("stale");
  });
});
