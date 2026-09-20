import { describe, expect, it, vi } from "vitest";
import { recordVerdictTrace } from "./verdictTrace";
import { buildVerdictReport } from "./verdictReport";
import { sv } from "@/i18n/sv";
import type { VerdictResponse } from "./verdict";

const source = { namn: "Test", hämtad: "2026-01-20" };
const rs = (stance: VerdictResponse["problemStance"]): VerdictResponse[] =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `a${i}`,
    companyName: `Bolag ${i}`,
    employees: 10,
    dateIso: "2026-01-20",
    quote: "Citat",
    problemStance: stance,
    priceStance: stance === "rejects" ? "declines" : "accepts",
    priceTestedKr: 2000,
    source,
  }));

describe("recordVerdictTrace", () => {
  it("sparar en pivot i Spåret under modulen Domen", async () => {
    const memory = { recordTraceEvent: vi.fn().mockResolvedValue(undefined) };
    const report = buildVerdictReport({ contacted: 20, responses: rs("rejects") }, sv);
    expect(await recordVerdictTrace(report, memory)).toBe(true);
    expect(memory.recordTraceEvent).toHaveBeenCalledWith({
      module: "Domen",
      description: report.pivotTraceEvent!.description,
      occurredAtIso: "2026-01-20",
    });
  });

  it("sparar inget för andra domar eller när rapporten saknas", async () => {
    const memory = { recordTraceEvent: vi.fn() };
    const run = buildVerdictReport({ contacted: 20, responses: rs("confirms") }, sv);
    expect(await recordVerdictTrace(run, memory)).toBe(false);
    expect(await recordVerdictTrace(null, memory)).toBe(false);
    expect(memory.recordTraceEvent).not.toHaveBeenCalled();
  });
});
