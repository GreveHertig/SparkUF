import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MIN_RESPONSES,
  computeVerdict,
  type PriceStance,
  type ProblemStance,
  type VerdictResponse,
} from "./verdict";

const source = { namn: "Test", hämtad: "2026-01-20" };

function r(
  id: string,
  problemStance: ProblemStance,
  priceStance: PriceStance,
  employees: number,
  extra: Partial<VerdictResponse> = {},
): VerdictResponse {
  return {
    id,
    companyName: `Bolag ${id}`,
    employees,
    dateIso: "2026-01-19",
    quote: `citat ${id}`,
    problemStance,
    priceStance,
    priceTestedKr: 2000,
    source,
    ...extra,
  };
}

describe("computeVerdict", () => {
  it("färre än 5 svar ger 'insufficient', aldrig 'run', hur bra svaren än är", () => {
    const four = Array.from({ length: MIN_RESPONSES - 1 }, (_, i) => r(`a${i}`, "confirms", "accepts", 15));
    const v = computeVerdict({ contacted: 10, responses: four });
    expect(v.decision).toBe("insufficient");
    expect(v.reasonCodes).toEqual(["smallSample"]);
  });

  it("0 svar och 0 kontaktade ger 'insufficient' utan att kasta", () => {
    const v = computeVerdict({ contacted: 0, responses: [] });
    expect(v.decision).toBe("insufficient");
    expect(v.stats.responseRate).toBe(0);
    expect(v.stats.counterOfferMedianKr).toBeNull();
  });

  it("exakt 5 svar räcker för en dom", () => {
    const five = Array.from({ length: 5 }, (_, i) => r(`a${i}`, "confirms", "accepts", 15));
    expect(computeVerdict({ contacted: 20, responses: five }).decision).toBe("run");
  });

  it("alla avvisar problemet: pivot", () => {
    const rs = Array.from({ length: 6 }, (_, i) => r(`a${i}`, "rejects", "declines", 8));
    const v = computeVerdict({ contacted: 20, responses: rs });
    expect(v.decision).toBe("pivot");
    expect(v.reasonCodes).toEqual(["problemRejected"]);
    expect(v.citedResponseIds).toEqual(["a0"]);
  });

  it("gränsen 40 %: 2 av 5 bekräftar är inte pivot, 1 av 5 är det", () => {
    const mk = (n: number) => [
      ...Array.from({ length: n }, (_, i) => r(`c${i}`, "confirms", "accepts", 15)),
      ...Array.from({ length: 5 - n }, (_, i) => r(`x${i}`, "rejects", "declines", 15)),
    ];
    expect(computeVerdict({ contacted: 10, responses: mk(2) }).decision).toBe("refine");
    expect(computeVerdict({ contacted: 10, responses: mk(1) }).decision).toBe("pivot");
  });

  it("Saras scenario (9 svar, tre nej till priset, alla ja har 10+ anställda) blir 'refine'", () => {
    const rs = [
      r("0", "partial", "declines", 6),
      r("2", "partial", "declines", 7, { counterOfferKr: 900 }),
      r("9", "partial", "declines", 8),
      r("5", "confirms", "accepts", 12),
      r("8", "confirms", "accepts", 14),
      r("10", "confirms", "accepts", 11),
      r("13", "partial", "undecided", 15),
      r("15", "confirms", "accepts", 18),
      r("19", "confirms", "accepts", 20),
    ];
    const v = computeVerdict({ contacted: 20, responses: rs });
    expect(v.decision).toBe("refine");
    expect(v.reasonCodes).toEqual(expect.arrayContaining(["priceTooHigh", "segmentSkew"]));
    expect(v.stats.counterOfferMedianKr).toBe(900);
    expect(v.stats.counterOfferCount).toBe(1);
    expect(v.stats.acceptingMinEmployees).toBe(11);
    expect(v.citedResponseIds.length).toBeGreaterThan(0);
  });

  it("alla bekräftar och accepterar priset: run", () => {
    const rs = Array.from({ length: 6 }, (_, i) => r(`a${i}`, "confirms", "accepts", 5 + i));
    const v = computeVerdict({ contacted: 12, responses: rs });
    expect(v.decision).toBe("run");
    expect(v.reasonCodes).toEqual([]);
  });

  it("problemet bekräftas men priset är obevisat (alla obeslutsamma): refine/priceUnproven", () => {
    const rs = Array.from({ length: 6 }, (_, i) => r(`a${i}`, "confirms", "undecided", 10));
    const v = computeVerdict({ contacted: 12, responses: rs });
    expect(v.decision).toBe("refine");
    expect(v.reasonCodes).toEqual(["priceUnproven"]);
  });

  it("median av motbud: jämnt antal ger medelvärdet av de två mittersta", () => {
    const rs = [
      r("a", "confirms", "declines", 10, { counterOfferKr: 800 }),
      r("b", "confirms", "declines", 10, { counterOfferKr: 1000 }),
      ...Array.from({ length: 4 }, (_, i) => r(`c${i}`, "confirms", "accepts", 10)),
    ];
    expect(computeVerdict({ contacted: 10, responses: rs }).stats.counterOfferMedianKr).toBe(900);
  });

  it("är deterministisk och muterar inte indata", () => {
    const rs = [r("b", "partial", "declines", 5), ...Array.from({ length: 5 }, (_, i) => r(`a${i}`, "confirms", "accepts", 12))];
    const copy = JSON.stringify(rs);
    const a = computeVerdict({ contacted: 10, responses: rs });
    const b = computeVerdict({ contacted: 10, responses: rs });
    expect(a).toEqual(b);
    expect(JSON.stringify(rs)).toBe(copy);
  });
});

describe("core/verdict.ts är fri från poäng", () => {
  it("importerar inte poängmotorn och innehåller ingen text", () => {
    const src = readFileSync("core/verdict.ts", "utf8");
    expect(src).not.toMatch(/from\s+["'][^"']*score/);
    expect(src).not.toMatch(/from\s+["']@\/i18n/);
  });
});
