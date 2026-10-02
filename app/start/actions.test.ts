import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingAlreadyCompletedError, ProjectExistsError } from "@/core/errors";
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
vi.mock("@/adapters/live/ProfileRepository", () => ({
  liveProfileRepository: { completeOnboarding: completeOnboardingMock },
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

describe("completeOnboardingAction", () => {
  const ALL_A = { role: "Studerar.", bio: "Kan Excel.", time: "10 timmar.", money: "Inget.", risk: "Lite." };

  it("ingång A: sparar de fem svaren och går till /app", async () => {
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction(IDLE, form(ALL_A))).rejects.toThrow("REDIRECT /app");
    expect(completeOnboardingMock).toHaveBeenCalledWith({
      entry: "noIdea",
      answers: Object.entries(ALL_A).map(([questionId, answer]) => ({ questionId, answer })),
    });
  });

  it("ingång B (aktivt projekt): bara de tre frågorna, extra fält ignoreras", async () => {
    getProjectMock.mockResolvedValue({ id: "p1", name: "Padel", oneLiner: "Bokning." });
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction(IDLE, form({ ...ALL_A, entry: "noIdea" }))).rejects.toThrow(
      "REDIRECT /app",
    );
    expect(completeOnboardingMock).toHaveBeenCalledWith({
      entry: "hasIdea",
      answers: [
        { questionId: "role", answer: "Studerar." },
        { questionId: "time", answer: "10 timmar." },
        { questionId: "money", answer: "Inget." },
      ],
    });
  });

  it("ett saknat eller tomt svar avvisas utan att något sparas", async () => {
    const { completeOnboardingAction } = await import("./actions");
    expect(await completeOnboardingAction(IDLE, form({ ...ALL_A, risk: "  " }))).toEqual({ invalid: true });
    const withoutBio = form(ALL_A);
    withoutBio.delete("bio");
    expect(await completeOnboardingAction(IDLE, withoutBio)).toEqual({ invalid: true });
    expect(completeOnboardingMock).not.toHaveBeenCalled();
  });

  it("redan klar: inget skrivs över, grundaren går till /app", async () => {
    completeOnboardingMock.mockRejectedValue(new OnboardingAlreadyCompletedError());
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction(IDLE, form(ALL_A))).rejects.toThrow("REDIRECT /app");
  });

  it("ett riktigt fel kastas vidare", async () => {
    completeOnboardingMock.mockRejectedValue(new Error("databasen svarar inte"));
    const { completeOnboardingAction } = await import("./actions");
    await expect(completeOnboardingAction(IDLE, form(ALL_A))).rejects.toThrow("databasen svarar inte");
  });
});
