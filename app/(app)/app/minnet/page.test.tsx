import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import { EmptyStateError, NotAuthenticatedError } from "@/core/errors";

const getProfileSummaryMock = vi.hoisted(() => vi.fn());
const getBrainNotesMock = vi.hoisted(() => vi.fn());
const getTraceEventsMock = vi.hoisted(() => vi.fn());
const setBrainNotesMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/MemoryRepository", () => ({
  liveMemoryRepository: {
    getProfileSummary: getProfileSummaryMock,
    getBrainNotes: getBrainNotesMock,
    getTraceEvents: getTraceEventsMock,
    setBrainNotes: setBrainNotesMock,
  },
}));

const profile = {
  name: "Alva Ek",
  role: "22 år, Umeå",
  bio: "Läser ekonomi.",
  time: "10 timmar i veckan",
  money: "5 000 kr",
  risk: "Låg",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function renderPage() {
  const { default: LiveMemoryPage } = await import("./page");
  const tree = await LiveMemoryPage();
  return render(<LocaleProvider>{tree}</LocaleProvider>);
}

describe("/app/minnet (PR 5)", () => {
  it("visar liveadapterns profil, utan demots Sara-text", async () => {
    getProfileSummaryMock.mockResolvedValue(profile);
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Alva Ek, 22 år, Umeå" })).toBeInTheDocument();
    expect(screen.queryByText(sv.comingSoon.title)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sara/)).not.toBeInTheDocument();
  });

  it("en profil som inte är ifylld ger Kommer snart bara i Profilen", async () => {
    getProfileSummaryMock.mockRejectedValue(new EmptyStateError("Minnet", "docs/moduler/minnet.md"));
    getBrainNotesMock.mockResolvedValue("Anteckning");
    getTraceEventsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: sv.memoryPage.title })).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
  });

  it("ett riktigt fel sväljs inte", async () => {
    getProfileSummaryMock.mockResolvedValue(profile);
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockRejectedValue(new Error("Minnet: kunde inte läsa Spåret"));

    await expect(renderPage()).rejects.toThrow("kunde inte läsa Spåret");
  });
});

describe("saveBrainNotes (Server Action, PR 5)", () => {
  it("sparar text via liveadaptern", async () => {
    const { saveBrainNotes } = await import("./actions");
    setBrainNotesMock.mockResolvedValue(undefined);
    await saveBrainNotes("Nya tankar");
    expect(setBrainNotesMock).toHaveBeenCalledWith("Nya tankar");
  });

  it("vägrar allt som inte är text, utan att nå adaptern", async () => {
    const { saveBrainNotes } = await import("./actions");
    await expect(saveBrainNotes({ notes: "x" })).rejects.toThrow("måste vara text");
    expect(setBrainNotesMock).not.toHaveBeenCalled();
  });

  it("utan session kastar adapterns fel vidare", async () => {
    const { saveBrainNotes } = await import("./actions");
    setBrainNotesMock.mockRejectedValue(new NotAuthenticatedError());
    await expect(saveBrainNotes("x")).rejects.toThrow(NotAuthenticatedError);
  });
});
