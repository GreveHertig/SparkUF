import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  EmptyStateError,
  NotImplementedError,
  OnboardingAlreadyCompletedError,
  OnboardingAnswerInvalidError,
  OnboardingAnswerLockedError,
} from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { onboardingRpcFake } from "@/test/stubs/onboardingRpcFake";

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
  it("ingång A får de fyra kärnfrågorna ur i18n i ordning, med val och utan svarsförslag", async () => {
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    const { sv } = await import("@/i18n/sv");
    const script = await liveProfileRepository.getOnboardingScript("noIdea", "sv");
    expect(script.questions.map((q) => q.id)).toEqual(["situation", "time", "money", "soldB2b"]);
    expect(script.questions[1]).toEqual({
      id: "time",
      cofounderText: sv.onboarding.v4Questions.noIdea.time,
      suggestedAnswer: null,
      kind: "choice",
      choices: [
        { id: "under3", label: "Under 3 timmar" },
        { id: "h3to6", label: "3–6 timmar" },
        { id: "h6to10", label: "6–10 timmar" },
        { id: "over10", label: "Mer än 10 timmar" },
      ],
    });
    expect(script.questions.every((q) => q.suggestedAnswer === null)).toBe(true);
  });

  it("ingång B får sina kärnfrågor, med kundgissningen som fritext, på engelska när locale är en", async () => {
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    const { en } = await import("@/i18n/en");
    const script = await liveProfileRepository.getOnboardingScript("hasIdea", "en");
    expect(script.questions.map((q) => q.id)).toEqual(["situation", "payer", "customer", "talkedTo"]);
    expect(script.questions[2]).toEqual({
      id: "customer",
      cofounderText: en.onboarding.v4Questions.hasIdea.customer,
      suggestedAnswer: null,
      kind: "text",
    });
    expect(script.questions[1].choices?.map((c) => c.label)).toEqual([
      "Businesses",
      "Private individuals",
      "Municipality, region or school",
      "Don't know yet",
    ]);
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

describe("liveProfileRepository.saveOnboardingAnswer och getOnboardingAnswers", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  function fake(row: Record<string, unknown> = {}, tables: Record<string, Record<string, unknown>[]> = {}) {
    return makeSupabaseFake(
      {
        profiles: [
          { user_id: "another-user", onboarding_answers: {}, onboarding_completed_at: null },
          { user_id: USER_ID, onboarding_entry: null, onboarding_completed_at: null, onboarding_answers: {}, ...row },
        ],
        ...tables,
      },
      // 22:30 UTC är 00:30 nästa dag i Stockholm: dagen räknas i svensk tid.
      onboardingRpcFake(USER_ID, () => new Date("2026-10-02T22:30:00Z")),
    );
  }

  it("sparar ett svar i taget, trimmat, bara på den egna raden, och läser tillbaka dem med dagen de gavs", async () => {
    const supabase = fake({}, { projects: [{ user_id: USER_ID, is_active: true }] });
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    expect(await liveProfileRepository.saveOnboardingAnswer({ questionId: "situation", answer: "employed" })).toEqual({
      answer: "employed",
      answeredOn: "2026-10-03",
    });
    await liveProfileRepository.saveOnboardingAnswer({ questionId: "customer", answer: "  Padelhallar " });
    expect(await liveProfileRepository.getOnboardingAnswers()).toEqual({
      situation: { answer: "employed", answeredOn: "2026-10-03" },
      customer: { answer: "Padelhallar", answeredOn: "2026-10-03" },
    });
    expect(supabase.tables.profiles.find((r) => r.user_id === "another-user")?.onboarding_answers).toEqual({});
  });

  it("ett ogiltigt svar avvisas redan i adaptern, utan anrop", async () => {
    const supabase = fake();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    for (const input of [
      { questionId: "time", answer: "massor" },
      { questionId: "role", answer: "Säljare" },
      { questionId: "frustration", answer: " " },
    ]) {
      await expect(liveProfileRepository.saveOnboardingAnswer(input)).rejects.toThrow(/ogiltigt/);
    }
    expect(requireSupabaseUserMock).not.toHaveBeenCalled();
  });

  it("databasens avslag blir egna fel: fel ingång (22023) och redan besvarad efteråt (55000)", async () => {
    const supabase = fake({ onboarding_entry: "noIdea", onboarding_completed_at: "2026-10-01T10:00:00Z", onboarding_answers: { archetype: "seller" } });
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    await expect(liveProfileRepository.saveOnboardingAnswer({ questionId: "payer", answer: "business" })).rejects.toBeInstanceOf(
      OnboardingAnswerInvalidError,
    );
    await expect(liveProfileRepository.saveOnboardingAnswer({ questionId: "archetype", answer: "builder" })).rejects.toBeInstanceOf(
      OnboardingAnswerLockedError,
    );
    await liveProfileRepository.saveOnboardingAnswer({ questionId: "knowsOwner", answer: "yes" });
    // Ett svar utan tid (archetype) får inget datum, aldrig dagens.
    expect(await liveProfileRepository.getOnboardingAnswers()).toEqual({
      archetype: { answer: "seller", answeredOn: null },
      knowsOwner: { answer: "yes", answeredOn: "2026-10-03" },
    });
  });

  it("getOnboardingAnswers tar bort okända id:n och val, och gissar aldrig", async () => {
    const supabase = fake({
      onboarding_answers: {
        situation: { answer: "employed", answered_at: "2026-10-01T08:00:00Z" },
        time: { answer: "massor", answered_at: "2026-10-01T08:00:00Z" },
        role: { answer: "Säljare" },
        money: { answer: 5 },
        soldB2b: { answer: "no", answered_at: "inte en tid" },
      },
    });
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    expect(await liveProfileRepository.getOnboardingAnswers()).toEqual({
      situation: { answer: "employed", answeredOn: "2026-10-01" },
      soldB2b: { answer: "no", answeredOn: null },
    });
  });

  it("utan körd migrering (kolumnen saknas) blir det ett platshållarfel, inte en krasch", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: "42703", message: "column does not exist" } }) }),
        }),
      }),
      rpc: async () => ({ data: null, error: { code: "PGRST202", message: "function not found" } }),
    };
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    await expect(liveProfileRepository.getOnboardingAnswers()).rejects.toBeInstanceOf(NotImplementedError);
    await expect(liveProfileRepository.saveOnboardingAnswer({ questionId: "time", answer: "h3to6" })).rejects.toBeInstanceOf(
      NotImplementedError,
    );
  });
});

describe("liveProfileRepository.completeOnboarding", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  function freshProfiles(projects: Record<string, unknown>[] = []) {
    return makeSupabaseFake(
      {
        profiles: [
          { user_id: "another-user", role: "Orörd", onboarding_entry: null, onboarding_completed_at: null, onboarding_answers: {} },
          { user_id: USER_ID, name: "Sara", initials: "S", onboarding_entry: null, onboarding_completed_at: null, onboarding_answers: {} },
        ],
        projects,
      },
      onboardingRpcFake(USER_ID),
    );
  }

  const coreA = [
    { questionId: "situation", answer: "employed" },
    { questionId: "time", answer: "h3to6" },
    { questionId: "money", answer: "none" },
    { questionId: "soldB2b", answer: "no" },
  ];

  it("med kärnfrågornas svar markeras onboardingen klar, med ingång och version", async () => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await liveProfileRepository.completeOnboarding({ entry: "noIdea", answers: coreA });

    const row = supabase.tables.profiles.find((r) => r.user_id === USER_ID)!;
    const stored = row.onboarding_answers as Record<string, { answer: string; answered_at: string }>;
    expect(Object.fromEntries(Object.entries(stored).map(([id, saved]) => [id, saved.answer]))).toEqual({
      situation: "employed",
      time: "h3to6",
      money: "none",
      soldB2b: "no",
    });
    expect(stored.time.answered_at).toEqual(expect.any(String));
    expect(row).toMatchObject({
      onboarding_entry: "noIdea",
      onboarding_version: 2,
      name: "Sara",
    });
    expect(row.onboarding_completed_at).toEqual(expect.any(String));
    expect(supabase.tables.profiles.find((r) => r.user_id === "another-user")).toMatchObject({
      role: "Orörd",
      onboarding_completed_at: null,
    });
  });

  it("svar som redan sparats räcker: answers får vara tom", async () => {
    const supabase = freshProfiles([{ user_id: USER_ID, is_active: true }]);
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    for (const [questionId, answer] of [["situation", "employed"], ["payer", "business"], ["customer", "Byråer"], ["talkedTo", "none"]]) {
      await liveProfileRepository.saveOnboardingAnswer({ questionId, answer });
    }
    await liveProfileRepository.completeOnboarding({ entry: "hasIdea", answers: [] });
    expect(supabase.tables.profiles.find((r) => r.user_id === USER_ID)).toMatchObject({ onboarding_entry: "hasIdea" });
  });

  const [situation, time, money, soldB2b] = coreA;
  it.each([
    ["en fråga ingången inte ställer", [...coreA, { questionId: "payer", answer: "business" }]],
    ["en fråga från före v4", [...coreA, { questionId: "role", answer: "Säljare" }]],
    ["ett okänt fält", [...coreA, { questionId: "name", answer: "Kapad" }]],
    ["en fråga två gånger", [...coreA, { questionId: "time", answer: "over10" }]],
    ["ett okänt val", [situation, { questionId: "time", answer: "10 timmar" }, money, soldB2b]],
    ["en saknad kärnfråga", [situation, time, money]],
  ])("avvisar %s utan att skriva något", async (_, answers) => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await expect(liveProfileRepository.completeOnboarding({ entry: "noIdea", answers })).rejects.toThrow();
    expect(supabase.tables.profiles.find((r) => r.user_id === USER_ID)?.onboarding_completed_at).toBeNull();
  });

  it("ett andra anrop kastar OnboardingAlreadyCompletedError och skriver inte över svaren", async () => {
    const supabase = freshProfiles();
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");

    await liveProfileRepository.completeOnboarding({ entry: "noIdea", answers: coreA });
    const first = structuredClone(supabase.tables.profiles.find((r) => r.user_id === USER_ID)!);

    await expect(
      liveProfileRepository.completeOnboarding({ entry: "noIdea", answers: [{ questionId: "time", answer: "over10" }] }),
    ).rejects.toBeInstanceOf(OnboardingAlreadyCompletedError);
    expect(supabase.tables.profiles.find((r) => r.user_id === USER_ID)).toEqual(first);
  });

  it("kastar ett vanligt fel, inte OnboardingAlreadyCompletedError, när profilraden saknas", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}, onboardingRpcFake(USER_ID)), userId: USER_ID });
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    const error = await liveProfileRepository.completeOnboarding({ entry: "noIdea", answers: coreA }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(OnboardingAlreadyCompletedError);
  });
});
