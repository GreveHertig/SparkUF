import { describe, expect, it } from "vitest";
import { fiscalYearSpanOf, formatFiscalYearSpan } from "./fiscalYear";

describe("fiscalYear", () => {
  it("ger spannet av räkenskapsåren", () => {
    expect(fiscalYearSpanOf([2024, 2023, 2024])).toEqual({ from: 2023, to: 2024 });
  });

  it("ger null utan år, aldrig ett påhittat år", () => {
    expect(fiscalYearSpanOf([])).toBeNull();
    expect(fiscalYearSpanOf([0, Number.NaN])).toBeNull();
  });

  it("skriver ett år eller ett spann", () => {
    expect(formatFiscalYearSpan({ from: 2024, to: 2024 })).toBe("2024");
    expect(formatFiscalYearSpan({ from: 2023, to: 2024 })).toBe("2023–2024");
  });
});
