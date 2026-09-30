import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
import type { ScoreSnapshot } from "@/core/domain";

const getScoreSnapshotMock = vi.hoisted(() => vi.fn());
const getSuggestionsMock = vi.hoisted(() => vi.fn());
const getScoreHistoryMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/EvidenceRepository", () => ({
  liveEvidenceRepository: {
    getScoreSnapshot: getScoreSnapshotMock,
    getSuggestions: getSuggestionsMock,
    getScoreHistory: getScoreHistoryMock,
  },
}));

const DOC = "docs/moduler/evidens-och-poang.md";
const snapshot: ScoreSnapshot = {
  total: 43,
  previousTotal: 43,
  delta: 0,
  deltaReason: "",
  calculatedAtIso: "2026-09-16",
  parts: [],
  lockedParts: [{ name: "Traktion", unlocksAfterStep: 11 }],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveScorePage } = await import("./page");
  const tree = await LiveScorePage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/app/poang (PR 4)", () => {
  it("visar liveadapterns poäng, låsta delar och ärliga tomlägen", async () => {
    getScoreSnapshotMock.mockResolvedValue(snapshot);
    getSuggestionsMock.mockResolvedValue([]);
    getScoreHistoryMock.mockResolvedValue([40, 43]);

    await renderPage();

    expect(screen.getByText("43")).toBeInTheDocument();
    expect(screen.getByText("Låses upp efter steg 11")).toBeInTheDocument();
    expect(screen.getByText(sv.scorePage.noSuggestions)).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
  });

  it("konto utan bevis: Kommer snart bara i poäng och förslag, historiken syns ändå", async () => {
    getScoreSnapshotMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", DOC));
    getSuggestionsMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", DOC));
    getScoreHistoryMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(2);
    expect(screen.getByText(sv.scorePage.noHistory)).toBeInTheDocument();
    // Ingen påhittad poäng, och aldrig en nolla i stället för luckan.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("en stubbe (NotImplementedError) räknas också som platshållarfel", async () => {
    getScoreSnapshotMock.mockResolvedValue(snapshot);
    getSuggestionsMock.mockRejectedValue(new NotImplementedError("Evidens och poäng", DOC));
    getScoreHistoryMock.mockResolvedValue([40, 43]);

    await renderPage();

    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
  });

  it("ett riktigt fel sväljs inte", async () => {
    getScoreSnapshotMock.mockRejectedValue(new Error("Databasen svarar inte"));
    getSuggestionsMock.mockResolvedValue([]);
    getScoreHistoryMock.mockResolvedValue([]);

    await expect(renderPage()).rejects.toThrow("Databasen svarar inte");
  });
});
