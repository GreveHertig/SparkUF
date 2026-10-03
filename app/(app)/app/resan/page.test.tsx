import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError } from "@/core/errors";
import type { JourneyStepView } from "@/ports/JourneyRepository";

vi.mock("next/navigation", () => ({ usePathname: () => "/app/resan" }));

const getStepsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getSteps: getStepsMock },
}));

const getPlanItemsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PlanRepository", () => ({
  livePlanRepository: { getItems: getPlanItemsMock, setDone: vi.fn(), removeItem: vi.fn() },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const steps: JourneyStepView[] = [
  { stepNumber: 1, journeyPhase: "discover", title: "Om dig", oneLiner: "Vem du är.", maxPoints: 8, status: "done" },
  { stepNumber: 2, journeyPhase: "discover", title: "Idén", oneLiner: "Vad du bygger.", maxPoints: 8, status: "current" },
  { stepNumber: 3, journeyPhase: "tryPhase", title: "Marknaden", oneLiner: "Hur stor.", maxPoints: 10, status: "locked" },
];

beforeEach(() => {
  // Som när migreringen för plan_items inte är körd: ingen plan visas.
  getPlanItemsMock.mockRejectedValue(new NotImplementedError("Min plan", "docs/moduler/min-plan.md"));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveJourneyPage } = await import("./page");
  const tree = await LiveJourneyPage();
  render(<LocaleProvider>{tree}</LocaleProvider>);
  return tree;
}

describe("/app/resan (PR 9)", () => {
  it("visar stegen ur liveadaptern med länkar under /app/resan", async () => {
    getStepsMock.mockResolvedValue(steps);
    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Idén" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Marknaden/ })[0]).toHaveAttribute("href", "/app/resan/3");
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("ett platshållarfel ger Kommer snart och sidans namn som rubrik, ingen krasch", async () => {
    getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: sv.journeyPage.title })).toBeInTheDocument();
    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: sv.site.journey.stepsListLabel })).not.toBeInTheDocument();
  });

  it("ett äkta fel kastas vidare", async () => {
    getStepsMock.mockRejectedValue(new Error("Databasen svarar inte"));
    await expect(renderPage()).rejects.toThrow("Databasen svarar inte");
  });

  it("skickar inga funktioner till klientskärmen", async () => {
    getStepsMock.mockResolvedValue(steps);
    const tree = await renderPage();
    const functionProps = Object.entries(tree.props as Record<string, unknown>).filter(
      ([, value]) => typeof value === "function",
    );
    expect(functionProps).toEqual([]);
  });
  it("utan plan_items visas ingen plan", async () => {
    getStepsMock.mockResolvedValue(steps);
    await renderPage();
    expect(screen.queryByRole("heading", { name: sv.journeyPage.plan.title })).not.toBeInTheDocument();
  });

  it("Min plan: öppna uppgifter först, med sammanhang, och ett tomläge med länk till Pulsen", async () => {
    getStepsMock.mockResolvedValue(steps);
    getPlanItemsMock.mockResolvedValue([
      { id: "a", text: "Läs villkoren", context: "Bidrag till laddboxar", done: false, createdAtIso: "2026-10-03T10:00:00Z" },
      { id: "b", text: "Skriv in sista ansökningsdag", context: null, done: true, createdAtIso: "2026-10-03T10:00:00Z" },
    ]);
    await renderPage();
    expect(screen.getByRole("heading", { name: sv.journeyPage.plan.title })).toBeInTheDocument();
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes[0]).not.toBeChecked();
    expect(boxes[1]).toBeChecked();
    expect(screen.getByText(`${sv.journeyPage.plan.from}: Bidrag till laddboxar`)).toBeInTheDocument();

    cleanup();
    getPlanItemsMock.mockResolvedValue([]);
    await renderPage();
    expect(screen.getByText(sv.journeyPage.plan.empty, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: sv.journeyPage.plan.openPulse })).toHaveAttribute("href", "/app/pulsen");
  });
});
