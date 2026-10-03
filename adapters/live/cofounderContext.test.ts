import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyStateError, NotImplementedError } from "@/core/errors";

const journey = vi.hoisted(() => ({ getSteps: vi.fn(), getStepDetail: vi.fn() }));
const memory = vi.hoisted(() => ({
  getKnownProfile: vi.fn(),
  getBrainNotes: vi.fn(),
  getTraceEvents: vi.fn(),
  getPendingOnboardingQuestions: vi.fn(),
}));
const project = vi.hoisted(() => ({ getProject: vi.fn() }));
vi.mock("@/adapters/live/JourneyRepository", () => ({ liveJourneyRepository: journey }));
vi.mock("@/adapters/live/MemoryRepository", () => ({ liveMemoryRepository: memory }));
vi.mock("@/adapters/live/ProjectRepository", () => ({ liveProjectRepository: project }));

import { loadCofounderContext } from "./cofounderContext";

function step(stepNumber: number, status: "done" | "current" | "locked") {
  return { stepNumber, journeyPhase: "discover", title: `Steg ${stepNumber}`, oneLiner: `Ingress ${stepNumber}`, maxPoints: 10, status };
}

beforeEach(() => {
  journey.getSteps.mockReset().mockResolvedValue([step(1, "done"), step(2, "current"), step(3, "locked")]);
  journey.getStepDetail.mockReset().mockResolvedValue({ why: "För att", doneItems: ["Profil"] });
  memory.getKnownProfile.mockReset().mockResolvedValue({ role: "Konsult" });
  memory.getBrainNotes.mockReset().mockResolvedValue("  Mina tankar  ");
  memory.getTraceEvents.mockReset().mockResolvedValue(
    Array.from({ length: 15 }, (_, i) => ({ id: `${i}`, timestampIso: "2026-10-01", description: `Post ${i}` })),
  );
  project.getProject.mockReset().mockResolvedValue(null);
  memory.getPendingOnboardingQuestions.mockReset().mockResolvedValue([]);
});

describe("loadCofounderContext", () => {
  it("läser aktuellt steg, profilen, Hjärnan och de tio senaste posterna i Spåret", async () => {
    const context = await loadCofounderContext("sv");
    expect(journey.getStepDetail).toHaveBeenCalledWith(2, "sv");
    expect(context.step).toEqual({ number: 2, title: "Steg 2", oneLiner: "Ingress 2", why: "För att", doneItems: ["Profil"] });
    expect(context.profile).toEqual({ role: "Konsult" });
    expect(context.brainNotes).toBe("Mina tankar");
    expect(context.trace?.map((event) => event.description)).toEqual(
      Array.from({ length: 10 }, (_, i) => `Post ${i + 5}`),
    );
    expect(context.project).toBeNull();
  });

  it("platshållare och tomma delar blir null, utan att stoppa de andra", async () => {
    journey.getSteps.mockRejectedValue(new EmptyStateError("Resan", "x"));
    memory.getKnownProfile.mockResolvedValue({});
    memory.getBrainNotes.mockResolvedValue("");
    memory.getTraceEvents.mockRejectedValue(new NotImplementedError("Minnet", "x"));
    memory.getPendingOnboardingQuestions.mockRejectedValue(new EmptyStateError("Minnet", "x"));
    project.getProject.mockResolvedValue({ id: "p", name: "Idé", oneLiner: "En idé" });
    expect(await loadCofounderContext("sv")).toEqual({
      step: null,
      profile: null,
      brainNotes: null,
      trace: null,
      project: { id: "p", name: "Idé", oneLiner: "En idé" },
      pendingQuestions: null,
    });
  });

  it("läser de återstående frågorna på samma språk, och en tom lista blir null", async () => {
    const question = {
      id: "stage",
      cofounderText: "Hur långt har du kommit?",
      suggestedAnswer: null,
      kind: "choice" as const,
      choices: [{ id: "idea", label: "Bara en idé" }],
    };
    memory.getPendingOnboardingQuestions.mockResolvedValue([question]);
    expect((await loadCofounderContext("sv")).pendingQuestions).toEqual([question]);
    expect(memory.getPendingOnboardingQuestions).toHaveBeenCalledWith("sv");
    memory.getPendingOnboardingQuestions.mockResolvedValue([]);
    expect((await loadCofounderContext("sv")).pendingQuestions).toBeNull();
  });

  it("är alla steg klara gäller det sista", async () => {
    journey.getSteps.mockResolvedValue([step(1, "done"), step(2, "done")]);
    expect((await loadCofounderContext("sv")).step?.number).toBe(2);
  });

  it("ett riktigt fel kastas vidare", async () => {
    memory.getBrainNotes.mockRejectedValue(new Error("nätverk"));
    await expect(loadCofounderContext("sv")).rejects.toThrow("nätverk");
  });
});
