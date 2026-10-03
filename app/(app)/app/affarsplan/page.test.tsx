import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { fill } from "@/i18n/fill";
import { NotImplementedError } from "@/core/errors";
import { buildBusinessPlan } from "@/core/businessPlan";
import type { JourneyStepStatus, JourneyStepView } from "@/ports/JourneyRepository";

const getLiveBusinessPlanMock = vi.hoisted(() => vi.fn());
const getStepsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/businessPlan", () => ({ getLiveBusinessPlan: getLiveBusinessPlanMock }));
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getSteps: getStepsMock, getStepDetail: vi.fn(), getHomeSummary: vi.fn() },
}));

/** Tolv steg där `current` är det aktuella; tidigare steg klara, senare låsta. */
function stepsAt(current: number): JourneyStepView[] {
  return Array.from({ length: 12 }, (_, index) => {
    const stepNumber = index + 1;
    const status: JourneyStepStatus = stepNumber < current ? "done" : stepNumber === current ? "current" : "locked";
    return { stepNumber, journeyPhase: "discover", title: `Steget ${stepNumber}`, oneLiner: "", maxPoints: 5, status };
  });
}

const plan = buildBusinessPlan([
  {
    id: "idea",
    checks: [
      {
        claims: [{ text: "Kvittojakt: påminnelser till byråers kunder", source: { namn: "Ditt projekt", hämtad: "2026-10-01" }, dataType: "user" }],
        requiredStepNumber: 2,
      },
    ],
  },
  { id: "market", checks: [{ claims: [], requiredStepNumber: 3 }, { claims: [], requiredStepNumber: 3 }] },
  { id: "customerAndProblem", checks: [{ claims: [], requiredStepNumber: 5 }] },
]);

afterEach(() => cleanup());
beforeEach(() => {
  getLiveBusinessPlanMock.mockReset();
  getStepsMock.mockReset();
});

async function renderPage() {
  const { default: LiveBusinessPlanPage } = await import("./page");
  const tree = await LiveBusinessPlanPage();
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/affarsplan (riktig data)", () => {
  it("visar planen med mognad, luckor som pekar på steget och nästa steg med länk", async () => {
    getLiveBusinessPlanMock.mockResolvedValue(plan);
    getStepsMock.mockResolvedValue(stepsAt(3));
    await renderPage();

    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("Kvittojakt: påminnelser till byråers kunder")).toBeInTheDocument();
    // Marknaden väntar på steg 3 två gånger, men luckan visas en gång.
    expect(screen.getAllByText(fill(sv.businessPlanPage.requiresStepTemplate, { step: 3 }))).toHaveLength(1);
    // Steg 3 är aktuellt: kortet och luckan länkar dit. Steg 5 är låst: ingen länk.
    const next = screen.getByRole("heading", { name: fill(sv.businessPlanPage.nextStep.titleTemplate, { step: "03", title: "Steget 3" }) });
    expect(next).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: fill(sv.businessPlanPage.openStepTemplate, { step: "03" }) });
    expect(links.every((link) => link.getAttribute("href") === "/app/resan/3")).toBe(true);
    expect(screen.queryByRole("link", { name: fill(sv.businessPlanPage.openStepTemplate, { step: "05" }) })).not.toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett platshållarfel i hopsamlingen ger Kommer snart i alla nio avsnitt och mognaden luckan", async () => {
    getLiveBusinessPlanMock.mockRejectedValue(new NotImplementedError("Affärsplanen", "docs/uppdrag.md"));
    getStepsMock.mockResolvedValue(stepsAt(1));
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: sv.businessPlanPage.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(9);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("ett äkta fel kastas vidare, det döljs aldrig som en tom plan", async () => {
    getLiveBusinessPlanMock.mockRejectedValue(new Error("nätverket"));
    getStepsMock.mockResolvedValue(stepsAt(1));
    await expect(renderPage()).rejects.toThrow("nätverket");
  });

  it("använder aldrig demots hopsamling", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");
    expect(source).not.toMatch(/adapters\/demo/);
  });

  it("skickar inga funktioner till klientskärmen", async () => {
    getLiveBusinessPlanMock.mockResolvedValue(plan);
    getStepsMock.mockResolvedValue(stepsAt(3));
    const tree = await renderPage();
    const props = tree.props as { data: Record<string, unknown> };
    const functionProps = Object.entries(props.data).filter(([, value]) => typeof value === "function");
    expect(functionProps).toEqual([]);
  });
});
