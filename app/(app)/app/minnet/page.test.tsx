import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const listEvidenceMock = vi.hoisted(() => vi.fn());
const recordEvidenceMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/EvidenceRecorder", () => ({
  liveEvidenceRecorder: { listEvidence: listEvidenceMock, recordEvidence: recordEvidenceMock },
  EvidenceInputError: class EvidenceInputError extends Error {},
}));
vi.mock("@/adapters/live/evidenceScore", () => ({ stockholmToday: () => "2026-10-01" }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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

beforeEach(() => {
  listEvidenceMock.mockResolvedValue([]);
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

describe("Passform från profilen (/app/minnet)", () => {
  it("visar de fyra frågorna, och ett besvarat svar med källa och märkningen Ditt eget svar", async () => {
    getProfileSummaryMock.mockResolvedValue(profile);
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);
    listEvidenceMock.mockResolvedValue([
      {
        id: "e1",
        partId: "fit",
        kind: "profileFitAnswer",
        kindLabel: sv.evidence.kinds.profileFitAnswer,
        subjectRef: "fit:time",
        source: { namn: "Profilsamtalet", hämtad: "2026-09-30" },
        quote: "Tio timmar i veckan",
        enteredBy: "founder",
        selfReported: false,
        status: "counted",
        canRetract: true,
      },
    ]);

    await renderPage();

    expect(listEvidenceMock).toHaveBeenCalledWith("fit", "sv");
    for (const question of Object.values(sv.fitPanel.questions)) expect(screen.getByText(question)).toBeInTheDocument();
    expect(screen.getByText("Tio timmar i veckan")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(sv.fitPanel.ownAnswer))).toBeInTheDocument();
    expect(screen.getByText(/Profilsamtalet/)).toBeInTheDocument();
    // Tre obesvarade frågor har var sitt fält.
    expect(screen.getAllByRole("button", { name: sv.fitPanel.save })).toHaveLength(3);
  });

  it("utan aktivt projekt visar rutan Kommer snart", async () => {
    getProfileSummaryMock.mockResolvedValue(profile);
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);
    listEvidenceMock.mockRejectedValue(new EmptyStateError("Evidens och poäng", "docs/moduler/evidens-och-poang.md"));

    await renderPage();
    expect(screen.getByText(sv.fitPanel.title)).toBeInTheDocument();
    expect(screen.getAllByText(sv.comingSoon.title)).toHaveLength(1);
  });
});

describe("saveFitAnswer (Server Action)", () => {
  it("sparar ett profilsvar med Sparks källa och dagens datum, och ger den nya poängen", async () => {
    const { saveFitAnswer } = await import("./actions");
    recordEvidenceMock.mockResolvedValue({ status: "recorded", evidenceId: "e1", snapshot: { total: 4, delta: 3 } });
    expect(await saveFitAnswer("time", "  Tio timmar  ")).toEqual({ ok: true, total: 4, delta: 3 });
    expect(recordEvidenceMock).toHaveBeenCalledWith(
      {
        kind: "profileFitAnswer",
        subjectRef: "fit:time",
        source: { namn: "spark:profile", hämtad: "2026-10-01" },
        quote: "Tio timmar",
        stepNumber: 1,
      },
      "sv",
    );
  });

  it("vägrar en okänd fråga, ett tomt eller för långt svar, utan att nå adaptern", async () => {
    const { saveFitAnswer } = await import("./actions");
    expect(await saveFitAnswer("points", "x")).toEqual({ ok: false });
    expect(await saveFitAnswer("time", "   ")).toEqual({ ok: false });
    expect(await saveFitAnswer("time", "x".repeat(1001))).toEqual({ ok: false });
    expect(await saveFitAnswer("time", 42)).toEqual({ ok: false });
    expect(recordEvidenceMock).not.toHaveBeenCalled();
  });
});
