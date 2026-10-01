import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmptyStateError, OnboardingAlreadyCompletedError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER_ID = "user-1";

describe("liveProfileRepository.getProfile", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar namn och initialer för en komplett profil", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: [{ user_id: USER_ID, name: "Sara Lindqvist", initials: "SL" }],
      }),
      userId: USER_ID,
    });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect(await liveProfileRepository.getProfile()).toEqual({ name: "Sara Lindqvist", initials: "SL" });
  });

  it("kastar EmptyStateError när profilraden saknas (ingen 01 Om dig gjord)", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    await expect(liveProfileRepository.getProfile()).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("kastar EmptyStateError när namnet är tomt (raden finns men 01 Om dig inte klar)", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ user_id: USER_ID, name: "", initials: "" }] }),
      userId: USER_ID,
    });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    await expect(liveProfileRepository.getProfile()).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("läser bara den inloggade användarens egen rad ur underlaget, inte en annans", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: [
          { user_id: "another-user", name: "Jonas Ek", initials: "JE" },
          { user_id: USER_ID, name: "Sara Lindqvist", initials: "SL" },
        ],
      }),
      userId: USER_ID,
    });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect((await liveProfileRepository.getProfile()).name).toBe("Sara Lindqvist");
  });
});

describe("liveProfileRepository.getOnboardingScript", () => {
  it("ingång A får fem frågor ur i18n i ordning, utan svarsförslag", async () => {
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    const { sv } = await import("@/i18n/sv");
    const script = await liveProfileRepository.getOnboardingScript("noIdea", "sv");
    expect(script.questions.map((q) => q.id)).toEqual(["role", "bio", "time", "money", "risk"]);
    expect(script.questions[0].cofounderText).toBe(sv.onboarding.profileQuestions.noIdea.role);
    expect(script.questions.every((q) => q.suggestedAnswer === null)).toBe(true);
    expect(script.closingMessage).toBe(sv.onboarding.profileQuestions.noIdea.closingMessage);
  });

  it("ingång B får tre frågor, på engelska när locale är en", async () => {
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    const { en } = await import("@/i18n/en");
    const script = await liveProfileRepository.getOnboardingScript("hasIdea", "en");
    expect(script.questions.map((q) => q.id)).toEqual(["role", "time", "money"]);
    expect(script.questions[1].cofounderText).toBe(en.onboarding.profileQuestions.hasIdea.time);
  });
});

describe("liveProfileRepository.getOnboardingStatus", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("en ny profil är inte klar och har ingen ingång", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ user_id: USER_ID, onboarding_entry: null, onboarding_completed_at: null }] }),
      userId: USER_ID,
    });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect(await liveProfileRepository.getOnboardingStatus()).toEqual({ entry: null, completed: false });
  });

  it("en klar onboarding ger ingången", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: [{ user_id: USER_ID, onboarding_entry: "hasIdea", onboarding_completed_at: "2026-10-01T08:00:00Z" }],
      }),
      userId: USER_ID,
    });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect(await liveProfileRepository.getOnboardingStatus()).toEqual({ entry: "hasIdea", completed: true });
  });

  it("en ingång utan klar-tid räknas inte (porten: entry är null tills den är klar)", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ user_id: USER_ID, onboarding_entry: "noIdea", onboarding_completed_at: null }] }),
      userId: USER_ID,
    });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect(await liveProfileRepository.getOnboardingStatus()).toEqual({ entry: null, completed: false });
  });

  it("en saknad profilrad är samma sak som en ny användare", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect(await liveProfileRepository.getOnboardingStatus()).toEqual({ entry: null, completed: false });
  });
});

describe("liveProfileRepository.completeOnboarding", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  function freshProfiles() {
    return makeSupabaseFake({
      profiles: [
        { user_id: "another-user", role: "Orörd", onboarding_entry: null, onboarding_completed_at: null },
        { user_id: USER_ID, name: "Sara", initials: "S", onboarding_entry: null, onboarding_completed_at: null },
      ],
    });
  }

  const answersA = [
    { questionId: "role", answer: "  Redovisningskonsult  " },
    { questionId: "bio", answer: "Tio år på byrå." },
    { questionId: "time", answer: "10 timmar" },
    { questionId: "money", answer: "20 000 kr" },
    { questionId: "risk", answer: "Låg" },
  ];

  it("skriver svaren till profilens kolumner, trimmade, och markerar onboardingen klar i samma rad", async () => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await liveProfileRepository.completeOnboarding({ entry: "noIdea", answers: answersA });

    const row = supabase.tables.profiles.find((r) => r.user_id === USER_ID)!;
    expect(row).toMatchObject({
      role: "Redovisningskonsult",
      bio: "Tio år på byrå.",
      time_available: "10 timmar",
      money_available: "20 000 kr",
      risk_appetite: "Låg",
      onboarding_entry: "noIdea",
      name: "Sara",
    });
    expect(row.onboarding_completed_at).toEqual(expect.any(String));
    expect(supabase.tables.profiles.find((r) => r.user_id === "another-user")).toMatchObject({
      role: "Orörd",
      onboarding_completed_at: null,
    });
  });

  it("ingång B skriver bara sina tre fält", async () => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await liveProfileRepository.completeOnboarding({
      entry: "hasIdea",
      answers: [
        { questionId: "role", answer: "Säljare" },
        { questionId: "time", answer: "5 timmar" },
        { questionId: "money", answer: "Inget" },
      ],
    });

    const row = supabase.tables.profiles.find((r) => r.user_id === USER_ID)!;
    expect(row).toMatchObject({ role: "Säljare", onboarding_entry: "hasIdea" });
    expect(row).not.toHaveProperty("bio");
    expect(row).not.toHaveProperty("risk_appetite");
  });

  // Varje fall är ett komplett svar för ingång B med ett fel i.
  const time = { questionId: "time", answer: "5 timmar" };
  const money = { questionId: "money", answer: "Inget" };
  const role = { questionId: "role", answer: "Säljare" };
  it.each([
    ["en fråga ingången inte ställer", [role, time, money, { questionId: "risk", answer: "Låg" }]],
    ["ett okänt fält", [role, time, money, { questionId: "name", answer: "Kapad" }]],
    ["en fråga två gånger", [role, time, money, { questionId: "role", answer: "Igen" }]],
    ["ett tomt svar", [{ questionId: "role", answer: "   " }, time, money]],
    ["ett för långt svar", [{ questionId: "role", answer: "a".repeat(1001) }, time, money]],
    ["saknade svar", [role, time]],
  ])("avvisar %s utan att skriva något", async (_, answers) => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await expect(liveProfileRepository.completeOnboarding({ entry: "hasIdea", answers })).rejects.toThrow();
    expect(supabase.tables.profiles.find((r) => r.user_id === USER_ID)?.onboarding_completed_at).toBeNull();
  });

  it("ett andra anrop kastar OnboardingAlreadyCompletedError och skriver inte över svaren", async () => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await liveProfileRepository.completeOnboarding({ entry: "noIdea", answers: answersA });
    const first = { ...supabase.tables.profiles.find((r) => r.user_id === USER_ID)! };

    await expect(
      liveProfileRepository.completeOnboarding({
        entry: "hasIdea",
        answers: [
          { questionId: "role", answer: "Nytt" },
          { questionId: "time", answer: "Nytt" },
          { questionId: "money", answer: "Nytt" },
        ],
      }),
    ).rejects.toBeInstanceOf(OnboardingAlreadyCompletedError);
    expect(supabase.tables.profiles.find((r) => r.user_id === USER_ID)).toEqual(first);
  });

  it("kastar ett vanligt fel, inte OnboardingAlreadyCompletedError, när profilraden saknas", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    const error = await liveProfileRepository
      .completeOnboarding({ entry: "noIdea", answers: answersA })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(OnboardingAlreadyCompletedError);
  });
});
