import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotImplementedError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER_ID = "user-1";
const PROJECT_ID = "proj-1";

function projectFixture() {
  return [{ id: PROJECT_ID, user_id: USER_ID, name: "Test", one_liner: "En testidé.", is_active: true }];
}

describe("liveJourneyRepository.getSteps", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar alla 12 steg med steg 1 som 'current' för ett helt nytt konto (inget projekt än)", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const steps = await liveJourneyRepository.getSteps("sv");
    expect(steps).toHaveLength(12);
    expect(steps[0].status).toBe("current");
    expect(steps.slice(1).every((s) => s.status === "locked")).toBe(true);
  });

  it("markerar avklarade steg som 'done' och sätter nästa som 'current', ur journey_steps.completed_at", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        projects: projectFixture(),
        journey_steps: [1, 2, 3].map((n) => ({
          user_id: USER_ID,
          project_id: PROJECT_ID,
          step_number: n,
          completed_at: "2026-09-01T00:00:00Z",
        })),
      }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const steps = await liveJourneyRepository.getSteps("sv");
    expect(steps.filter((s) => s.status === "done").map((s) => s.stepNumber)).toEqual([1, 2, 3]);
    expect(steps.find((s) => s.stepNumber === 4)?.status).toBe("current");
  });

  it("hämtar svensk och engelsk titel ur i18n, inte hårdkodat", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const [svSteps, enSteps] = await Promise.all([
      liveJourneyRepository.getSteps("sv"),
      liveJourneyRepository.getSteps("en"),
    ]);
    expect(svSteps[0].title).toBe("Om dig");
    expect(enSteps[0].title).toBe("About you");
  });
});

describe("liveJourneyRepository.getStepDetail", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar null för ett okänt stegnummer, aldrig ett fel", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    expect(await liveJourneyRepository.getStepDetail(999, "sv")).toBeNull();
  });

  it("ger tomma why/doneItems/highlights/actionLabel för ett steg utan skrivet innehåll än", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture() }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const detail = await liveJourneyRepository.getStepDetail(1, "sv");
    expect(detail?.why).toBe("");
    expect(detail?.doneItems).toEqual([]);
    expect(detail?.status).toBe("current");
  });

  it("fyller why/doneItems/highlights/actionLabel ur journey_steps när raden finns", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        projects: projectFixture(),
        journey_steps: [
          {
            user_id: USER_ID,
            project_id: PROJECT_ID,
            step_number: 1,
            completed_at: null,
            why: "Du behöver förstå din egen utgångspunkt.",
            done_items: ["Profilsamtal genomfört"],
            highlights: ["10 år i redovisningsbranschen"],
            action_label: "Fortsätt till Möjligheter",
          },
        ],
      }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const detail = await liveJourneyRepository.getStepDetail(1, "sv");
    expect(detail?.why).toBe("Du behöver förstå din egen utgångspunkt.");
    expect(detail?.doneItems).toEqual(["Profilsamtal genomfört"]);
    expect(detail?.highlights).toEqual(["10 år i redovisningsbranschen"]);
    expect(detail?.actionLabel).toBe("Fortsätt till Möjligheter");
  });
});

describe("liveJourneyRepository.getHomeSummary", () => {
  it("kastar NotImplementedError — beror på Utskick och svar (SinceLastTime), inte byggd i P1", async () => {
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    await expect(liveJourneyRepository.getHomeSummary("sv")).rejects.toBeInstanceOf(NotImplementedError);
  });
});
