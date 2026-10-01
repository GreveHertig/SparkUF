import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER_ID = "user-1";
const PROJECT_ID = "proj-1";

function profileFixture(entry: "noIdea" | "hasIdea" | null) {
  return [
    {
      user_id: USER_ID,
      onboarding_entry: entry,
      onboarding_completed_at: entry ? "2026-10-01T08:00:00Z" : null,
    },
  ];
}

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

describe("liveJourneyRepository: onboardingen (steg 1 klart enligt profilen)", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("ingång A utan projekt: steg 1 klart, steg 2 Möjligheter aktuellt", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: profileFixture("noIdea") }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const steps = await liveJourneyRepository.getSteps("sv");
    expect(steps[0].status).toBe("done");
    expect(steps[1]).toMatchObject({ status: "current", title: "Möjligheter" });
  });

  it("ingång B med projekt: steg 2 heter Genomlys din idé, på båda språken", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: profileFixture("hasIdea"), projects: projectFixture() }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const [svSteps, enSteps] = await Promise.all([
      liveJourneyRepository.getSteps("sv"),
      liveJourneyRepository.getSteps("en"),
    ]);
    expect(svSteps[1]).toMatchObject({ status: "current", title: "Genomlys din idé" });
    expect(enSteps[1].title).toBe("Screen your idea");
    expect((await liveJourneyRepository.getStepDetail(2, "sv"))?.title).toBe("Genomlys din idé");
  });

  it("en ej klar onboarding lämnar steg 1 aktuellt", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: profileFixture(null) }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    expect((await liveJourneyRepository.getSteps("sv"))[0].status).toBe("current");
  });
});

describe("liveJourneyRepository.getHomeSummary", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("ett nytt konto: handlingskortet är steg 1 med ingress, maxpoäng och standardknapp, och inget 'sedan sist'", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const { sv } = await import("@/i18n/sv");
    const summary = await liveJourneyRepository.getHomeSummary("sv");
    expect(summary.todayIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(summary.nextStep).toEqual({
      eyebrow: "STEG 01 · OM DIG",
      title: "Om dig",
      why: sv.journeySteps.step1.oneLiner,
      maxPoints: 10,
      estimatedTime: "",
      doneItems: [],
      actionLabel: "Öppna steg 01",
    });
    expect(summary.sinceLastTime).toBeNull();
  });

  it("efter onboardingen (ingång B) pekar kortet på steg 2, Genomlys din idé, på engelska när locale är en", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: profileFixture("hasIdea"), projects: projectFixture() }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const summary = await liveJourneyRepository.getHomeSummary("en");
    expect(summary.nextStep).toMatchObject({
      eyebrow: "STEP 02 · SCREEN YOUR IDEA",
      title: "Screen your idea",
      maxPoints: 12,
      actionLabel: "Open step 02",
    });
  });

  it("använder stegets egen text ur journey_steps när den finns", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: profileFixture("noIdea"),
        projects: projectFixture(),
        journey_steps: [
          {
            user_id: USER_ID,
            project_id: PROJECT_ID,
            step_number: 2,
            completed_at: null,
            why: "Tre idéer väntar på dig.",
            done_items: ["Profilen klar"],
            highlights: [],
            action_label: "Se idéerna",
          },
        ],
      }),
      userId: USER_ID,
    });
    const { liveJourneyRepository } = await import("@/adapters/live/JourneyRepository");
    const summary = await liveJourneyRepository.getHomeSummary("sv");
    expect(summary.nextStep).toMatchObject({
      eyebrow: "STEG 02 · MÖJLIGHETER",
      why: "Tre idéer väntar på dig.",
      doneItems: ["Profilen klar"],
      actionLabel: "Se idéerna",
    });
  });
});
