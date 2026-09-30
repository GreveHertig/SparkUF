import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { NotImplementedError, EmptyStateError } from "@/core/errors";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import type { PulseSignal, ScoreSnapshot } from "@/core/domain";

vi.mock("next/navigation", () => ({ usePathname: () => "/app" }));

const getScoreSnapshotMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/EvidenceRepository", () => ({
  liveEvidenceRepository: { getScoreSnapshot: getScoreSnapshotMock },
}));

const getHomeSummaryMock = vi.hoisted(() => vi.fn());
const getStepsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/JourneyRepository", () => ({
  liveJourneyRepository: { getHomeSummary: getHomeSummaryMock, getSteps: getStepsMock },
}));

const getSignalsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PulseProvider", () => ({
  livePulseProvider: { getSignals: getSignalsMock },
}));

const steps: JourneyStepView[] = [
  { stepNumber: 1, journeyPhase: "discover", title: "Om dig", oneLiner: "", maxPoints: 8, status: "current" },
];
const signals: PulseSignal[] = [];
const snapshot: ScoreSnapshot = {
  total: 43,
  previousTotal: 47,
  delta: -4,
  deltaReason: "",
  calculatedAtIso: "2026-09-16",
  parts: [],
  lockedParts: [],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveAppHomePage } = await import("./page");
  const tree = await LiveAppHomePage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/app Hem (PR 3)", () => {
  it("skickar inga funktioner till klientskärmen (Next vägrar det vid rendering)", async () => {
    getHomeSummaryMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getScoreSnapshotMock.mockResolvedValue(snapshot);
    getStepsMock.mockResolvedValue(steps);
    getSignalsMock.mockResolvedValue(signals);

    const { default: LiveAppHomePage } = await import("./page");
    const tree = await LiveAppHomePage();

    const functionProps = Object.entries(tree.props as Record<string, unknown>)
      .filter(([, value]) => typeof value === "function")
      .map(([name]) => name);
    expect(functionProps).toEqual([]);
  });

  it("visar Kommer snart bara i handlingskortets/'sedan sist'-rutan när Resan är en stub, men riktig poäng och Resan-raden", async () => {
    getHomeSummaryMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getScoreSnapshotMock.mockResolvedValue(snapshot);
    getStepsMock.mockResolvedValue(steps);
    getSignalsMock.mockResolvedValue(signals);

    await renderPage();

    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.getByText(String(snapshot.total))).toBeInTheDocument();
    // Resans sidor finns inte i /app än: steget visas, men utan länk till en 404.
    expect(screen.getByText("Om dig")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Om dig/ })).not.toBeInTheDocument();
  });

  it("visar Kommer snart bara i poängrutan när kontot saknar bevis", async () => {
    getHomeSummaryMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getScoreSnapshotMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", "docs/moduler/evidens-och-poang.md"));
    getStepsMock.mockResolvedValue(steps);
    getSignalsMock.mockResolvedValue(signals);

    await renderPage();

    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(3);
  });

  it("visar den neutrala 'ingen signal'-texten, inte demots scenariotext", async () => {
    getHomeSummaryMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getScoreSnapshotMock.mockResolvedValue(snapshot);
    getStepsMock.mockResolvedValue(steps);
    getSignalsMock.mockResolvedValue(signals);

    await renderPage();

    expect(screen.getByText(sv.homePage.noPulseSignal)).toBeInTheDocument();
    expect(screen.queryByText(sv.site.demo.noPulse)).not.toBeInTheDocument();
  });

  it("ett riktigt fel sväljs inte", async () => {
    getHomeSummaryMock.mockRejectedValue(new NotImplementedError("Resan", "docs/moduler/resan.md"));
    getScoreSnapshotMock.mockRejectedValue(new Error("Databasen svarar inte"));
    getStepsMock.mockResolvedValue(steps);
    getSignalsMock.mockResolvedValue(signals);

    await expect(renderPage()).rejects.toThrow("Databasen svarar inte");
  });
});
