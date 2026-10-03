import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocaleProvider } from "@/i18n/context";
import { sv } from "@/i18n/sv";
import {
  EmptyStateError,
  NotAuthenticatedError,
  OnboardingAnswerInvalidError,
  OnboardingAnswerLockedError,
} from "@/core/errors";

const getProfileSummaryMock = vi.hoisted(() => vi.fn());
const getBrainNotesMock = vi.hoisted(() => vi.fn());
const getTraceEventsMock = vi.hoisted(() => vi.fn());
const setBrainNotesMock = vi.hoisted(() => vi.fn());
const getPendingOnboardingQuestionsMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/MemoryRepository", () => ({
  liveMemoryRepository: {
    getProfileSummary: getProfileSummaryMock,
    getBrainNotes: getBrainNotesMock,
    getTraceEvents: getTraceEventsMock,
    setBrainNotes: setBrainNotesMock,
    getPendingOnboardingQuestions: getPendingOnboardingQuestionsMock,
  },
}));

const saveOnboardingAnswerMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ProfileRepository", () => ({
  liveProfileRepository: { saveOnboardingAnswer: saveOnboardingAnswerMock },
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
  entry: "hasIdea",
  name: "Alva Ek",
  role: "22 år, Umeå",
  bio: null,
  time: "10 timmar i veckan",
  money: "5 000 kr",
  risk: null,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  listEvidenceMock.mockResolvedValue([]);
  getPendingOnboardingQuestionsMock.mockResolvedValue([]);
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

  it("utan v4-svar (answers saknas) visas fritextsvaren, och bio och risk som luckor", async () => {
    getProfileSummaryMock.mockResolvedValue(profile);
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText(sv.onboarding.profileQuestions.hasIdea.time)).toBeInTheDocument();
    expect(screen.getByText("10 timmar i veckan")).toBeInTheDocument();
    expect(screen.getAllByText(sv.memoryPage.notAnswered)).toHaveLength(2);
  });

  it("version 2: Dina svar med etiketter, inga luckor för de gamla fritextfrågorna, och Återstår med val", async () => {
    getProfileSummaryMock.mockResolvedValue({
      entry: "noIdea",
      name: "Alva Ek",
      role: null,
      bio: null,
      time: null,
      money: null,
      risk: null,
      frustrations: null,
      customer: null,
      answers: [
        { questionId: "situation", question: "Vad gör du i dag?", answer: "Jobbar", answeredOn: "2026-10-02" },
        { questionId: "time", question: "Hur många timmar?", answer: "3–6 timmar", answeredOn: "2026-10-02" },
        { questionId: "money", question: "Hur mycket pengar?", answer: "Under 1 000 kr", answeredOn: null },
      ],
    });
    getPendingOnboardingQuestionsMock.mockResolvedValue([
      { id: "knowsOwner", cofounderText: "Känner du en företagare?", suggestedAnswer: null, kind: "choice", choices: [{ id: "yes", label: "Ja" }, { id: "no", label: "Nej" }] },
    ]);
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Alva Ek" })).toBeInTheDocument();
    const answers = screen.getByRole("region", { name: sv.memoryPage.answersLabel });
    expect(answers).toHaveTextContent("Vad gör du i dag?");
    expect(answers).toHaveTextContent("Jobbar");
    // En siffra i svaret får källan "Din uppgift" med dagen svaret gavs, och
    // ett svar utan sparad tid får källan utan datum, aldrig dagens.
    const tags = within(answers).getAllByRole("button", { name: sv.common.sourceTag.openDetails });
    expect(tags).toHaveLength(2);
    expect(tags[0]).toHaveTextContent(sv.common.userSourceLabel);
    expect(tags[0]).toHaveTextContent("2 oktober");
    expect(tags[1].textContent).toBe(`${sv.common.userSourceLabel}·${sv.evidence.internalSources.profile}`);
    expect(screen.queryByText(sv.memoryPage.notAnswered)).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: sv.memoryPage.profileBackgroundLabel })).not.toBeInTheDocument();
    const remaining = screen.getByRole("region", { name: sv.memoryPage.remainingTitle });
    expect(remaining).toHaveTextContent("Känner du en företagare?");
    expect(screen.getByRole("group", { name: "Känner du en företagare?" })).toBeInTheDocument();
  });

  it("version 1 med v4-svar efteråt: fritextsvaren och Dina svar syns båda, utan luckor", async () => {
    getProfileSummaryMock.mockResolvedValue({
      ...profile,
      frustrations: null,
      customer: "Små byråer",
      answers: [{ questionId: "payer", question: "Vem betalar för idén?", answer: "Företag", answeredOn: "2026-10-05" }],
    });
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText("10 timmar i veckan")).toBeInTheDocument();
    expect(screen.getByText("Små byråer")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: sv.memoryPage.answersLabel })).toHaveTextContent("Företag");
    expect(screen.queryByText(sv.memoryPage.notAnswered)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: sv.memoryPage.remainingTitle })).toHaveTextContent(sv.memoryPage.remainingDone);
  });

  it("Återstår visar Kommer snart när frågorna inte går att läsa", async () => {
    getProfileSummaryMock.mockResolvedValue({ ...profile, answers: [] });
    getPendingOnboardingQuestionsMock.mockRejectedValue(new EmptyStateError("Minnet", "docs/moduler/minnet.md"));
    getBrainNotesMock.mockResolvedValue("");
    getTraceEventsMock.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByRole("region", { name: sv.memoryPage.remainingTitle })).toHaveTextContent(sv.comingSoon.title);
  });

  it("en profil som inte är ifylld ger Kommer snart bara i Profilen", async () => {
    getProfileSummaryMock.mockRejectedValue(new EmptyStateError("Minnet", "docs/moduler/minnet.md"));
    getPendingOnboardingQuestionsMock.mockRejectedValue(new EmptyStateError("Minnet", "docs/moduler/minnet.md"));
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

describe("saveRemainingAnswer (Server Action)", () => {
  it("sparar ett svar på en återstående fråga via Profil och förnyar sidan", async () => {
    const { saveRemainingAnswer } = await import("./actions");
    const { revalidatePath } = await import("next/cache");
    saveOnboardingAnswerMock.mockResolvedValue({ answer: "yes", answeredOn: "2026-10-03" });
    expect(await saveRemainingAnswer("knowsOwner", "yes")).toEqual({ ok: true, answeredOn: "2026-10-03" });
    expect(saveOnboardingAnswerMock).toHaveBeenCalledWith({ questionId: "knowsOwner", answer: "yes" });
    expect(revalidatePath).toHaveBeenCalledWith("/app/minnet");
  });

  it("vägrar fel form utan att nå adaptern", async () => {
    const { saveRemainingAnswer } = await import("./actions");
    expect(await saveRemainingAnswer("knowsOwner", "kanske")).toEqual({ ok: false, reason: "invalid" });
    expect(await saveRemainingAnswer("role", "Säljare")).toEqual({ ok: false, reason: "invalid" });
    expect(await saveRemainingAnswer(["time"], "h3to6")).toEqual({ ok: false, reason: "invalid" });
    expect(await saveRemainingAnswer("frustration", 7)).toEqual({ ok: false, reason: "invalid" });
    expect(saveOnboardingAnswerMock).not.toHaveBeenCalled();
  });

  it("databasens avslag blir ett svar: fel ingång och redan besvarad", async () => {
    const { saveRemainingAnswer } = await import("./actions");
    saveOnboardingAnswerMock.mockRejectedValueOnce(new OnboardingAnswerInvalidError());
    expect(await saveRemainingAnswer("payer", "business")).toEqual({ ok: false, reason: "invalid" });
    saveOnboardingAnswerMock.mockRejectedValueOnce(new OnboardingAnswerLockedError());
    expect(await saveRemainingAnswer("time", "h3to6")).toEqual({ ok: false, reason: "locked" });
  });

  it("ett riktigt fel kastas vidare", async () => {
    const { saveRemainingAnswer } = await import("./actions");
    saveOnboardingAnswerMock.mockRejectedValueOnce(new Error("databasen svarar inte"));
    await expect(saveRemainingAnswer("time", "h3to6")).rejects.toThrow("databasen svarar inte");
  });
});
