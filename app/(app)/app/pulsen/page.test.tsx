import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
import type { PulseSignal } from "@/core/domain";

const getSignalsMock = vi.hoisted(() => vi.fn());
const getWatchesMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/PulseProvider", () => ({
  livePulseProvider: { getSignals: getSignalsMock, getWatches: getWatchesMock },
  MAX_WATCHES: 10,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Personlig spelbok och Min plan: Profilen, projektet, Resan och planen.
const getKnownProfileMock = vi.hoisted(() => vi.fn());
const getProjectMock = vi.hoisted(() => vi.fn());
const getStepsMock = vi.hoisted(() => vi.fn());
const getPlanItemsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/MemoryRepository", () => ({
  liveMemoryRepository: { getKnownProfile: getKnownProfileMock },
}));
vi.mock("@/adapters/live/ProjectRepository", () => ({ liveProjectRepository: { getProject: getProjectMock } }));
vi.mock("@/adapters/live/JourneyRepository", () => ({ liveJourneyRepository: { getSteps: getStepsMock } }));
vi.mock("@/adapters/live/PlanRepository", () => ({
  livePlanRepository: { getItems: getPlanItemsMock, addItems: vi.fn() },
}));

beforeEach(() => {
  // Som när migreringen inte är körd: inga knappar, inga bevakningar.
  getWatchesMock.mockRejectedValue(new NotImplementedError("Pulsen: omdöme och bevakningar", "docs"));
  // Ett tomt konto och ingen plan: spelboken ser ut som förut.
  getKnownProfileMock.mockRejectedValue(new EmptyStateError("Profilen", "docs"));
  getProjectMock.mockResolvedValue(null);
  getStepsMock.mockRejectedValue(new NotImplementedError("Resan", "docs"));
  getPlanItemsMock.mockRejectedValue(new NotImplementedError("Min plan", "docs"));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/** Async Server Component — anropas som en funktion, trädet renderas sedan. */
async function renderPage() {
  const { default: LiveAppPulsePage } = await import("./page");
  const tree = await LiveAppPulsePage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

const signal: PulseSignal = {
  category: "Nyheter",
  headline: "Kvittohantering blir krav för småföretag",
  whyItMatters: "Påverkar efterfrågan på din tjänst.",
  timestamp: "",
  source: { namn: "exempel.se", hämtad: "2026-09-30", url: "https://exempel.se/artikel" },
};

describe("/app/pulsen (steg 6)", () => {
  it("visar liveadapterns signaler med rubrik och källa", async () => {
    getSignalsMock.mockResolvedValue([signal]);

    await renderPage();

    expect(getSignalsMock).toHaveBeenCalledWith("sv");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(signal.headline);
    expect(screen.getByText(/exempel\.se/)).toBeInTheDocument();
    // Riktig data får inget fiktionsmärke och ingen exempelkälla (PR 11).
    expect(screen.queryByText(sv.site.demo.badge)).not.toBeInTheDocument();
    expect(screen.queryByText(sv.common.exampleSourceLabel)).not.toBeInTheDocument();
    // Artikeln är media, inte register (docs/beslut.md, 2026-10-01).
    expect(screen.getByText(sv.common.mediaSourceLabel)).toBeInTheDocument();
  });

  it("visar tomläget när det inte finns några signaler (t.ex. inget aktivt projekt)", async () => {
    getSignalsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText(sv.pulsePage.emptyState)).toBeInTheDocument();
  });

  it.each([
    ["stubbe", new NotImplementedError("Pulsen", "docs/moduler/webbresearch-och-pulsen.md")],
    ["tomt konto", new EmptyStateError("Pulsen", "docs/moduler/webbresearch-och-pulsen.md")],
  ])("visar Kommer snart för en platshållare (%s)", async (_label, error) => {
    getSignalsMock.mockRejectedValue(error);

    await renderPage();

    expect(screen.getByText(sv.comingSoon.title)).toBeInTheDocument();
  });

  it("ett riktigt fel sväljs inte", async () => {
    getSignalsMock.mockRejectedValue(new Error("Tavily-nyckel saknas"));

    await expect(renderPage()).rejects.toThrow("Tavily-nyckel saknas");
  });

  it("utan tabellerna (migreringen inte körd): inga omdömesknappar och inga bevakningar", async () => {
    getSignalsMock.mockResolvedValue([{ ...signal, id: "00000000-0000-0000-0000-000000000001" }]);
    await renderPage();
    expect(screen.queryByRole("button", { name: sv.pulsePage.feedback.relevant })).not.toBeInTheDocument();
    expect(screen.queryByText(sv.pulsePage.watches.title)).not.toBeInTheDocument();
  });

  it("med tabellerna: omdömesknappar under signalen och bevakningarna", async () => {
    getSignalsMock.mockResolvedValue([{ ...signal, id: "00000000-0000-0000-0000-000000000001" }]);
    getWatchesMock.mockResolvedValue([{ id: "w1", kind: "competitor", term: "ByråFlöde" }]);
    await renderPage();
    expect(screen.getByRole("button", { name: sv.pulsePage.feedback.relevant })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: sv.pulsePage.feedback.notRelevant })).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.watches.title)).toBeInTheDocument();
    expect(screen.getByText("ByråFlöde")).toBeInTheDocument();
  });

  it("personlig spelbok: grundarens svar, länken till Medgrundaren och knappen till Min plan", async () => {
    const id = "00000000-0000-4000-8000-000000000002";
    getSignalsMock.mockResolvedValue([
      { ...signal, id, opportunity: { area: "funding", actions: [] } },
    ]);
    getKnownProfileMock.mockResolvedValue({ time: "10 timmar i veckan", money: "Ungefär 5 000 kr" });
    getProjectMock.mockResolvedValue({ id: "p", name: "Laddkollen", oneLiner: "Laddning för BRF:er." });
    getStepsMock.mockResolvedValue([
      { stepNumber: 9, journeyPhase: "launch", title: "Det formella", oneLiner: "", maxPoints: 8, status: "locked" },
    ]);
    getPlanItemsMock.mockResolvedValue([]);
    await renderPage();

    expect(screen.getByText(sv.pulsePage.playbook.personalTitle)).toBeInTheDocument();
    expect(screen.getByText(/Laddkollen\. Laddning för BRF:er\./)).toBeInTheDocument();
    expect(screen.getByText(/10 timmar i veckan/)).toBeInTheDocument();
    expect(screen.getByText(sv.pulsePage.playbook.formalOpen.replace("{step}", "Det formella"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: sv.pulsePage.playbook.askCofounder })).toHaveAttribute(
      "href",
      `/app/medgrundaren?signal=${id}`,
    );
    expect(screen.getByRole("button", { name: sv.pulsePage.playbook.addToPlan })).toBeInTheDocument();
  });

  it("utan plan_items: ingen planknapp, men länken till Medgrundaren finns", async () => {
    getSignalsMock.mockResolvedValue([
      { ...signal, id: "00000000-0000-4000-8000-000000000003", risk: { area: "finance", actions: [] } },
    ]);
    await renderPage();
    expect(screen.queryByRole("button", { name: sv.pulsePage.playbook.addToPlan })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: sv.pulsePage.playbook.askCofounder })).toBeInTheDocument();
    expect(screen.queryByText(sv.pulsePage.playbook.personalTitle)).not.toBeInTheDocument();
  });

  it("ett riktigt fel i Profilen, projektet, Resan eller planen fäller inte sidan", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    getSignalsMock.mockResolvedValue([signal]);
    getKnownProfileMock.mockRejectedValue(new Error("nere"));
    getProjectMock.mockRejectedValue(new Error("nere"));
    getStepsMock.mockRejectedValue(new Error("nere"));
    getPlanItemsMock.mockRejectedValue(new Error("nere"));
    await renderPage();
    expect(screen.getAllByText(signal.headline).length).toBeGreaterThan(0);
    log.mockRestore();
  });

  it("ett riktigt fel i bevakningarna sväljs inte", async () => {
    getSignalsMock.mockResolvedValue([signal]);
    getWatchesMock.mockRejectedValue(new Error("Databasen svarar inte"));
    await expect(renderPage()).rejects.toThrow("Databasen svarar inte");
  });
});
