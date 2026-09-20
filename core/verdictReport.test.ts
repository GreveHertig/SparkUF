import { describe, expect, it } from "vitest";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";
import { buildVerdictReport } from "./verdictReport";
import type { VerdictResponse } from "./verdict";

const source = { namn: "Test", hämtad: "2026-01-20" };
const mk = (id: string, stance: VerdictResponse["problemStance"], extra: Partial<VerdictResponse> = {}): VerdictResponse => ({
  id,
  companyName: `Bolag ${id}`,
  employees: 10,
  dateIso: "2026-01-19",
  quote: "Ett citat",
  problemStance: stance,
  priceStance: stance === "rejects" ? "declines" : "accepts",
  priceTestedKr: 2000,
  source,
  ...extra,
});

describe("buildVerdictReport", () => {
  it("pivot ger en rubrik på rätt språk, ett ordagrant citat med källa och en Spår-post", () => {
    const rs = Array.from({ length: 6 }, (_, i) => mk(`a${i}`, "rejects", { quote: "Nej.​\u0000 Tack" }));
    const svr = buildVerdictReport({ contacted: 20, responses: rs }, sv);
    const enr = buildVerdictReport({ contacted: 20, responses: rs }, en);
    expect(svr.presentation.headline).toBe("Pivotera");
    expect(enr.presentation.headline).toBe("Pivot");
    expect(svr.quotes).toEqual([{ companyName: "Bolag a0", dateIso: "2026-01-19", quote: "Nej. Tack", source }]);
    expect(svr.pivotTraceEvent?.timestampIso).toBe("2026-01-19");
    expect(svr.pivotTraceEvent?.description).toContain("0 av 6");
  });

  it("andra domar ger ingen Spår-post, och 'insufficient' saknar citat", () => {
    const few = buildVerdictReport({ contacted: 5, responses: [mk("a", "confirms")] }, sv);
    expect(few.verdict.decision).toBe("insufficient");
    expect(few.pivotTraceEvent).toBeNull();
    expect(few.quotes).toEqual([]);
    expect(few.presentation.reasoning).not.toMatch(/\{[a-zA-Z]+\}/);
  });

  it("lämnar inga oifyllda platshållare och nämner medianen med underlagsantal", () => {
    const rs = [
      mk("a", "confirms", { priceStance: "declines", counterOfferKr: 900, employees: 5 }),
      ...Array.from({ length: 5 }, (_, i) => mk(`b${i}`, "confirms", { employees: 20 })),
    ];
    const r = buildVerdictReport({ contacted: 12, responses: rs }, sv);
    expect(r.presentation.reasoning).toContain("900 kr");
    expect(r.presentation.reasoning).toContain("1 svar");
    expect(r.presentation.reasoning).not.toMatch(/\{[a-zA-Z]+\}/);
  });
});
