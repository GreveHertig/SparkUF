import { describe, expect, it } from "vitest";
import {
  BUSINESS_PLAN_SECTION_ORDER,
  buildBusinessPlan,
  type BusinessPlanCheck,
  type BusinessPlanClaim,
  type BusinessPlanSectionInput,
} from "./businessPlan";
import type { Källa } from "@/core/domain";

// Tester för reglerna i docs/uppdrag.md avsnitt 15.3: luckor visas i stället
// för att fyllas (regel 1), motsägelser döljs inte (regel 2), planen visar
// sin egen färdighetsgrad (regel 3).

function källa(namn = "Testkälla"): Källa {
  return { namn, hämtad: "2026-01-01" };
}

function claim(text: string, overrides: Partial<BusinessPlanClaim> = {}): BusinessPlanClaim {
  return { text, source: källa(), dataType: "register", ...overrides };
}

function met(claims: BusinessPlanClaim[], requiredStepNumber = 1): BusinessPlanCheck {
  return { claims, requiredStepNumber };
}

function unmet(requiredStepNumber: number): BusinessPlanCheck {
  return { claims: [], requiredStepNumber };
}

function section(overrides: Partial<BusinessPlanSectionInput> & { id: BusinessPlanSectionInput["id"] }): BusinessPlanSectionInput {
  return { checks: [met([claim("x")])], ...overrides };
}

describe("buildBusinessPlan — luckor (regel 1)", () => {
  it("ett avsnitt utan uppfyllda kontrollpunkter får status 'missing'", () => {
    const plan = buildBusinessPlan([section({ id: "market", checks: [unmet(3)] })]);
    const market = plan.sections.find((s) => s.id === "market")!;
    expect(market.status).toBe("missing");
    expect(market.claims).toHaveLength(0);
  });

  it("skriver aldrig en text — bara vilket steg som skulle ge underlaget", () => {
    const plan = buildBusinessPlan([section({ id: "competition", checks: [unmet(3)] })]);
    const gaps = plan.sections.find((s) => s.id === "competition")!.gaps;
    expect(gaps).toEqual([{ requiredStepNumber: 3 }]);
  });

  it("ett avsnitt med några men inte alla kontrollpunkter uppfyllda får status 'thin'", () => {
    const plan = buildBusinessPlan([
      section({ id: "offerAndPrice", checks: [met([claim("priset satt")]), unmet(5)] }),
    ]);
    const offer = plan.sections.find((s) => s.id === "offerAndPrice")!;
    expect(offer.status).toBe("thin");
    expect(offer.claims).toHaveLength(1);
    expect(offer.gaps).toEqual([{ requiredStepNumber: 5 }]);
  });

  it("ett avsnitt där alla kontrollpunkter är uppfyllda får status 'solid' och inga luckor", () => {
    const plan = buildBusinessPlan([
      section({ id: "idea", checks: [met([claim("a")]), met([claim("b")])] }),
    ]);
    const idea = plan.sections.find((s) => s.id === "idea")!;
    expect(idea.status).toBe("solid");
    expect(idea.gaps).toHaveLength(0);
  });

  it("kastar om ett avsnitt skickas in utan en enda kontrollpunkt", () => {
    expect(() => buildBusinessPlan([section({ id: "risks", checks: [] })])).toThrow();
  });
});

describe("buildBusinessPlan — motsägelser (regel 2)", () => {
  it("visar båda sidor av en motsägelse, ingen väljs bort", () => {
    const kundsvar = claim("Kunderna säger 900 kr", { dataType: "customer" });
    const kalkylen = claim("Kalkylen kräver 2 000 kr", { dataType: "register" });
    const plan = buildBusinessPlan([
      section({
        id: "offerAndPrice",
        checks: [met([kundsvar, kalkylen])],
        contradictions: [{ a: kundsvar, b: kalkylen }],
      }),
    ]);
    const offer = plan.sections.find((s) => s.id === "offerAndPrice")!;
    expect(offer.contradictions).toHaveLength(1);
    expect(offer.contradictions[0].a.text).toBe("Kunderna säger 900 kr");
    expect(offer.contradictions[0].b.text).toBe("Kalkylen kräver 2 000 kr");
    // Motsägelsen döljer inte de underliggande påståendena.
    expect(offer.claims.map((c) => c.text)).toEqual(
      expect.arrayContaining(["Kunderna säger 900 kr", "Kalkylen kräver 2 000 kr"]),
    );
  });

  it("ett avsnitt utan motsägelser får en tom lista, inte odefinierad", () => {
    const plan = buildBusinessPlan([section({ id: "market" })]);
    expect(plan.sections.find((s) => s.id === "market")!.contradictions).toEqual([]);
  });
});

describe("buildBusinessPlan — färdighetsgraden (regel 3)", () => {
  it("räknas som andelen avsnitt som håller", () => {
    const plan = buildBusinessPlan([
      section({ id: "idea" }), // solid
      section({ id: "market" }), // solid
      section({ id: "competition", checks: [unmet(3)] }), // missing
      section({ id: "offerAndPrice", checks: [met([claim("a")]), unmet(5)] }), // thin
    ]);
    expect(plan.maturity).toEqual({
      solidCount: 2,
      thinCount: 1,
      missingCount: 1,
      totalCount: 4,
      solidShare: 0.5,
    });
  });

  it("sorterar alltid avsnitten i planens fasta ordning, oavsett indataordning", () => {
    const plan = buildBusinessPlan([
      section({ id: "risks" }),
      section({ id: "idea" }),
      section({ id: "market" }),
    ]);
    expect(plan.sections.map((s) => s.id)).toEqual(
      BUSINESS_PLAN_SECTION_ORDER.filter((id) => ["risks", "idea", "market"].includes(id)),
    );
  });
});

describe("buildBusinessPlan — låsta poängdelar (risks)", () => {
  it("låsta delar visas oförändrade, utan att gå genom claims eller gaps", () => {
    const plan = buildBusinessPlan([
      section({ id: "risks", lockedParts: [{ name: "Traktion", unlocksAfterStep: 11 }] }),
    ]);
    const risks = plan.sections.find((s) => s.id === "risks")!;
    expect(risks.lockedParts).toEqual([{ name: "Traktion", unlocksAfterStep: 11 }]);
  });

  it("ett avsnitt utan låsta delar får en tom lista", () => {
    const plan = buildBusinessPlan([section({ id: "risks" })]);
    expect(plan.sections.find((s) => s.id === "risks")!.lockedParts).toEqual([]);
  });
});
