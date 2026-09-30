import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { fill } from "@/i18n/fill";
import { BUSINESS_PLAN_SECTION_ORDER, buildBusinessPlan, type BusinessPlanClaim } from "@/core/businessPlan";
import { BusinessPlan, type BusinessPlanData } from "./BusinessPlan";

afterEach(() => cleanup());

const claim = (text: string, value?: string): BusinessPlanClaim => ({
  text,
  value,
  source: { namn: "Kundsamtal", hämtad: "2026-01-23" },
  dataType: "customer",
});

const plan = buildBusinessPlan([
  { id: "idea", checks: [{ claims: [claim("Idén håller.")], requiredStepNumber: 1 }] },
  {
    id: "market",
    checks: [
      { claims: [claim("Byråer i registret", "312")], requiredStepNumber: 3 },
      { claims: [], requiredStepNumber: 3 },
    ],
  },
  {
    id: "risks",
    checks: [{ claims: [], requiredStepNumber: 5 }],
    contradictions: [{ a: claim("Priset håller."), b: claim("Priset är för högt.") }],
    lockedParts: [{ name: "Passform", unlocksAfterStep: 8 }],
  },
  { id: "offerAndPrice", checks: [{ claims: [claim("Prissimuleringen (Hiasynth)")], requiredStepNumber: 7 }] },
]);

function renderPlan(data: BusinessPlanData) {
  return render(
    <LocaleProvider>
      <BusinessPlan data={data} />
    </LocaleProvider>,
  );
}

describe("BusinessPlan (PR 10)", () => {
  it("visar mognaden och avsnitten i planens ordning, med status", () => {
    renderPlan({ plan });
    expect(screen.getByText("2/4")).toBeInTheDocument();
    const titles = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(titles).toEqual([
      sv.businessPlanPage.sections.idea.title,
      sv.businessPlanPage.sections.market.title,
      sv.businessPlanPage.sections.offerAndPrice.title,
      sv.businessPlanPage.sections.risks.title,
    ]);
    expect(screen.getAllByText(sv.businessPlanPage.status.solid)).toHaveLength(2);
    expect(screen.getByText(sv.businessPlanPage.status.thin)).toBeInTheDocument();
    expect(screen.getByText(sv.businessPlanPage.status.missing)).toBeInTheDocument();
  });

  it("varje påstående visar sin källa; koncept får etiketten", () => {
    renderPlan({ plan });
    expect(screen.getByText("312")).toBeInTheDocument();
    // Tre uppfyllda påståenden plus motsägelsens två: fem källtaggar.
    expect(screen.getAllByText(/Kundsamtal/)).toHaveLength(5);
    expect(screen.getByText(sv.common.conceptBadge)).toBeInTheDocument();
  });

  it("luckor, motsägelser och låsta delar visas, ingen hittas på", () => {
    renderPlan({ plan });
    expect(screen.getByText(fill(sv.businessPlanPage.requiresStepTemplate, { step: 3 }))).toBeInTheDocument();
    expect(screen.getByText(fill(sv.businessPlanPage.requiresStepTemplate, { step: 5 }))).toBeInTheDocument();
    expect(screen.getByText(sv.businessPlanPage.contradictionLabel)).toBeInTheDocument();
    expect(screen.getByText(`Passform · ${sv.homePage.unlocksAfterStepBefore} 8`)).toBeInTheDocument();
  });

  it("utan plan: alla nio avsnitt visar Kommer snart och mognaden luckan, aldrig 0", () => {
    renderPlan({ plan: null });
    expect(document.querySelectorAll("h2[id^='fdd-plan-']")).toHaveLength(BUSINESS_PLAN_SECTION_ORDER.length);
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(9);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/^0/)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.businessPlanPage.status.missing)).not.toBeInTheDocument();
  });
});
