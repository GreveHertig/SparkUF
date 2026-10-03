import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OnboardingAlreadyCompletedError,
  OnboardingAnswerInvalidError,
  OnboardingAnswerLockedError,
  ProjectExistsError,
} from "@/core/errors";
import { PROJECT_NAME_MAX_LENGTH } from "@/core/onboarding";

// Onboardingens Server Actions (onboarding live, PR 3). Adaptrarna är
// mockade: deras eget beteende testas i adapters/live/*.test.ts.

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const getProjectMock = vi.hoisted(() => vi.fn());
const createProjectMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ProjectRepository", () => ({
  liveProjectRepository: { getProject: getProjectMock, createProject: createProjectMock },
}));

const completeOnboardingMock = vi.hoisted(() => vi.fn());
const saveOnboardingAnswerMock = vi.hoisted(() => vi.fn());
const getOnboardingAnswersMock = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/live/ProfileRepository", () => ({
  liveProfileRepository: {
    completeOnboarding: completeOnboardingMock,
    saveOnboardingAnswer: saveOnboardingAnswerMock,
    getOnboardingAnswers: getOnboardingAnswersMock,
  },
}));

const IDLE = { invalid: false };

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  getProjectMock.mockResolvedValue(null);
  createProjectMock.mockResolvedValue({ id: "p1", name: "Padel", oneLiner: "Bokning." });
  completeOnboardingMock.mockResolvedValue(undefined);
  saveOnboardingAnswerMock.mockResolvedValue({ answer: "x", answeredOn: "2026-10-03" });
  getOnboardingAnswersMock.mockResolvedValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createProjectAction", () => {
  it("skapar projektet och går vidare till genomlysningen", async () => {
    const { createProjectAction } = await import("./actions");
    await expect(createProjectAction(IDLE, form({ name: " Padel ", oneLiner: "Bokning." }))).rejects.toThrow(
      "REDIRECT /start/ide",
    );
    expect(createProjectMock).toHaveBeenCalledWith({ name: " Padel ", oneLiner: "Bokning." });
  });

  it("tomt eller för långt avvisas utan att något sparas", async () => {
    const { createProjectAction } = await import("./actions");
    expect(await createProjectAction(IDLE, form({ name: "   ", oneLiner: "Bokning." }))).toEqual({ invalid: true });
    expect(
      await createProjectAction(IDLE, form({ name: "x".repeat(PROJECT_NAME_MAX_LENGTH + 1), oneLiner: "Bokning." })),
    ).toEqual({ invalid: true });
    expect(await createProjectAction(IDLE, form({ name: "Padel" }))).toEqual({ invalid: true });
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("ett befintligt aktivt projekt skrivs inte över, grundaren går vidare", async () => {
    createProjectMock.mockRejectedValue(new ProjectExistsError());
    const { createProjectAction } = await import("./actions");
    await expect(createProjectAction(IDLE, form({ name: "Padel", oneLiner: "Bokning." }))).rejects.toThrow(
      "REDIRECT /start/ide",
    );
  });

  it("ett riktigt fel kastas vidare", async () => {
    createProjectMock.mockRejectedValue(new Error("databasen svarar inte"));
    const { createProjectAction } = await import("./actions");
    await expect(createProjectAction(IDLE, form({ name: "Padel", oneLiner: "Bokning." }))).rejects.toThrow(
      "databasen svarar inte",
    );
  });
});

describe("saveOnboardingAnswerAction", () => {
  it("ingång A: sparar ett val på en kärnfråga", async () => {
    const { saveOnboardingAnswerAction } = await import("./actions");
    // Dagen svaret sparades följer med, för källans datum.
    expect(await saveOnboardingAnswerAction("time", "h3to6")).toEqual({ ok: true, answeredOn: "2026-10-03" });
    expect(saveOnboardingAnswerMock).toHaveBeenCalledWith({ questionId: "time", answer: "h3to6" });
  });

  it("ingång B (aktivt projekt): fritext på kundfrågan sparas", async () => {
    getProjectMock.mockResolvedValue({ id: "p1", name: "Padel", oneLiner: "Bokning." });
    const { saveOnboardingAnswerAction } = await import("./actions");
    expect(await saveOnboardingAnswerAction("customer", " Padelhallar ")).toEqual({ ok: true, answeredOn: "2026-10-03" });
    expect(saveOnboardingAnswerMock).toHaveBeenCalledWith({ questionId: "customer", answer: " Padelhallar " });
  });

  it.each([
    ["en fråga som ingången inte ställer", "payer", "business"],
    ["en fråga från före v4", "role", "Säljare"],
    ["ett okänt val", "time", "massor"],
    ["ett svar som inte är text", "time", 5],
    ["ett fråge-id som inte är text", { id: "time" }, "h3to6"],
    ["en tom fritext", "frustration", "  "],
  ])("avvisar %s utan att något sparas", async (_, questionId, answer) => {
    const { saveOnboardingAnswerAction } = await import("./actions");
    expect(await saveOnboardingAnswerAction(questionId, answer)).toEqual({ ok: false, reason: "invalid" });
    expect(saveOnboardingAnswerMock).not.toHaveBeenCalled();
  });

  it("databasens avslag blir ett svar, inte ett fel", async () => {
    const { saveOnboardingAnswerAction } = await import("./actions");
    saveOnboardingAnswerMock.mockRejectedValueOnce(new OnboardingAnswerInvalidError());
    expect(await saveOnboardingAnswerAction("time", "h3to6")).toEqual({ ok: false, reason: "invalid" });
    saveOnboardingAnswerMock.mockRejectedValueOnce(new OnboardingAnswerLockedError());
    expect(await saveOnboardingAnswerAction("time", "h3to6")).toEqual({ ok: false, reason: "locked" });
  });

  it("ett riktigt fel kastas vidare", async () => {
    saveOnboardingAnswerMock.mockRejectedValue(new Error("databasen svarar inte"));
    const { saveOnboardingAnswerAction } = await import("./actions");
    await expect(saveOnboardingAnswerAction("time", "h3to6")).rejects.toThrow("databasen svarar inte");
  });
});

describe("completeOnboardingAction", () => {
  /** Som getOnboardingAnswers ger dem: svaret och dagen det gavs. */
  function saved(answers: Record<string, string>) {
    return Object.fromEntries(Object.entries(answers).map(([id, answer]) => [id, { answer, answeredOn: "2026-10-03" }]));
  }
  const CORE_A = saved({ situation: "employed", time: "h3to6", money: "none", soldB2b: "no" });

  it("ingång A: med kärnfrågorna besvarade blir onboardingen klar, sedan /app", async () => {
    getOnboardingAnswersMock.mockResolvedValue(CORE_A);
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction()).rejects.toThrow("REDIRECT /app");
    expect(completeOnboardingMock).toHaveBeenCalledWith({ entry: "noIdea", answers: [] });
  });

  it("ingång B: ingången härleds ur projektet, inte ur indata", async () => {
    getProjectMock.mockResolvedValue({ id: "p1", name: "Padel", oneLiner: "Bokning." });
    getOnboardingAnswersMock.mockResolvedValue(saved({ situation: "employed", payer: "business", customer: "Hallar", talkedTo: "none" }));
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction()).rejects.toThrow("REDIRECT /app");
    expect(completeOnboardingMock).toHaveBeenCalledWith({ entry: "hasIdea", answers: [] });
  });

  it("en saknad kärnfråga ger invalid, och onboardingen blir inte klar", async () => {
    getOnboardingAnswersMock.mockResolvedValue(saved({ situation: "employed", time: "h3to6", money: "none" }));
    const { completeOnboardingAction } = await import("./actions");
    expect(await completeOnboardingAction()).toEqual({ invalid: true });
    // Ingång A:s svar räcker inte för ingång B.
    getProjectMock.mockResolvedValue({ id: "p1", name: "Padel", oneLiner: "Bokning." });
    getOnboardingAnswersMock.mockResolvedValue(CORE_A);
    expect(await completeOnboardingAction()).toEqual({ invalid: true });
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it("redan klar: inget skrivs över, grundaren går till /app", async () => {
    getOnboardingAnswersMock.mockResolvedValue(CORE_A);
    completeOnboardingMock.mockRejectedValue(new OnboardingAlreadyCompletedError());
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction()).rejects.toThrow("REDIRECT /app");
  });

  it("ett riktigt fel kastas vidare", async () => {
    getOnboardingAnswersMock.mockResolvedValue(CORE_A);
    completeOnboardingMock.mockRejectedValue(new Error("databasen svarar inte"));
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction()).rejects.toThrow("databasen svarar inte");
  });
});
