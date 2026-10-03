import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmptyStateError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER_ID = "user-1";

function completeProfileRow() {
  return {
    user_id: USER_ID,
    name: "Sara Lindqvist",
    initials: "SL",
    role: "Redovisningskonsult",
    bio: "Jobbat med bokföring i tio år.",
    time_available: "Kvällar och helger",
    money_available: "20 000 kr",
    risk_appetite: "Låg",
    frustrations: "Kvitton som försvinner.",
    customer_guess: null,
    onboarding_entry: "noIdea",
    onboarding_completed_at: "2026-10-01T08:00:00Z",
  };
}

/** Ingång B efter onboardingen: bara role, time och money är besvarade. */
function entryBProfileRow() {
  return {
    ...completeProfileRow(),
    bio: null,
    risk_appetite: null,
    frustrations: null,
    customer_guess: "Små redovisningsbyråer",
    onboarding_entry: "hasIdea",
  };
}

/** Klar med v4: bara onboarding_answers, inga fritextkolumner. */
function v4ProfileRow() {
  return {
    user_id: USER_ID,
    name: "Sara Lindqvist",
    initials: "SL",
    role: null,
    bio: null,
    time_available: null,
    money_available: null,
    risk_appetite: null,
    frustrations: null,
    customer_guess: null,
    onboarding_entry: "noIdea",
    onboarding_completed_at: "2026-10-03T08:00:00Z",
    onboarding_version: 2,
    // Som public.save_onboarding_answer sparar dem: svaret och tiden. 22:30
    // UTC är nästa dag i Stockholm. frustration saknar tid med flit.
    onboarding_answers: {
      frustration: { answer: "Kvitton som försvinner." },
      money: { answer: "none", answered_at: "2026-10-02T22:30:00Z" },
      situation: { answer: "employed", answered_at: "2026-10-02T08:00:00Z" },
      time: { answer: "h3to6", answered_at: "2026-10-02T08:00:00Z" },
      soldB2b: { answer: "no", answered_at: "2026-10-02T08:00:00Z" },
    },
  };
}

describe("liveMemoryRepository.getProfileSummary", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("kastar EmptyStateError när profilraden saknas", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await expect(liveMemoryRepository.getProfileSummary("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("kastar EmptyStateError när onboardingen inte är klar, även om fält finns", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: [{ ...completeProfileRow(), onboarding_entry: null, onboarding_completed_at: null }],
      }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await expect(liveMemoryRepository.getProfileSummary("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("ingång B: returnerar de besvarade fälten, kundgissningen, och null för bio, frustrationer och risk", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [entryBProfileRow()] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getProfileSummary("sv")).toEqual({
      entry: "hasIdea",
      name: "Sara Lindqvist",
      role: "Redovisningskonsult",
      bio: null,
      time: "Kvällar och helger",
      money: "20 000 kr",
      risk: null,
      frustrations: null,
      customer: "Små redovisningsbyråer",
      answers: [],
    });
  });

  it("tomma strängar (signupens standardvärde för name) blir null, aldrig ett svar", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ ...entryBProfileRow(), name: "", bio: "   " }] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const summary = await liveMemoryRepository.getProfileSummary("sv");
    expect(summary.name).toBeNull();
    expect(summary.bio).toBeNull();
  });

  it("returnerar alla sex fält när profilen är komplett", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [completeProfileRow()] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getProfileSummary("sv")).toEqual({
      entry: "noIdea",
      name: "Sara Lindqvist",
      role: "Redovisningskonsult",
      bio: "Jobbat med bokföring i tio år.",
      time: "Kvällar och helger",
      money: "20 000 kr",
      risk: "Låg",
      frustrations: "Kvitton som försvinner.",
      customer: null,
      answers: [],
    });
  });

  it("version 2: v4-svaren med frågan och valets etikett, i frågornas ordning, och fritextfälten tomma", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [v4ProfileRow()] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const { sv } = await import("@/i18n/sv");
    const summary = await liveMemoryRepository.getProfileSummary("sv");
    expect(summary).toMatchObject({ entry: "noIdea", role: null, time: null, money: null, risk: null });
    expect(summary.answers).toEqual([
      { questionId: "situation", question: sv.onboarding.v4Questions.noIdea.situation, answer: "Jobbar", answeredOn: "2026-10-02" },
      { questionId: "time", question: sv.onboarding.v4Questions.noIdea.time, answer: "3–6 timmar", answeredOn: "2026-10-02" },
      { questionId: "money", question: sv.onboarding.v4Questions.noIdea.money, answer: "Inget", answeredOn: "2026-10-03" },
      { questionId: "soldB2b", question: sv.onboarding.v4Questions.noIdea.soldB2b, answer: "Nej", answeredOn: "2026-10-02" },
      // Utan sparad tid: inget datum, aldrig dagens.
      {
        questionId: "frustration",
        question: sv.onboarding.v4Questions.noIdea.frustration,
        answer: "Kvitton som försvinner.",
        answeredOn: null,
      },
    ]);
  });

  it("version 1: fritextsvaren står kvar, och v4-svar som getts efteråt syns bredvid, på engelska när locale är en", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ ...completeProfileRow(), onboarding_answers: { archetype: { answer: "seller", answered_at: "2026-10-05T09:00:00Z" }, role: { answer: "Kapad" } } }] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const summary = await liveMemoryRepository.getProfileSummary("en");
    expect(summary).toMatchObject({ role: "Redovisningskonsult", time: "Kvällar och helger" });
    expect(summary.answers).toEqual([
      {
        questionId: "archetype",
        question: "Which of these three sounds most like you?",
        answer: "I would rather talk to people than sit alone with a task",
        answeredOn: "2026-10-05",
      },
    ]);
  });

  it("utan körd v4-migrering (kolumnen saknas) visas profilen som förut", async () => {
    const legacy = makeSupabaseFake({ profiles: [completeProfileRow()] });
    let calls = 0;
    const supabase = {
      from: (table: string) => {
        const builder = legacy.from(table);
        return {
          select: (columns: string) => {
            calls++;
            if (columns.includes("onboarding_answers")) {
              return { eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: "42703", message: "saknas" } }) }) };
            }
            return builder.select();
          },
        };
      },
    };
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const summary = await liveMemoryRepository.getProfileSummary("sv");
    expect(summary).toMatchObject({ role: "Redovisningskonsult", answers: [] });
    expect(calls).toBe(2);
  });

  it("ett annat fel kastas vidare", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: "57014", message: "timeout" } }) }) }),
      }),
    };
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await expect(liveMemoryRepository.getProfileSummary("sv")).rejects.toThrow(/timeout/);
  });
});

describe("liveMemoryRepository.getBrainNotes / setBrainNotes", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar en tom sträng när grundaren inte skrivit något än", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getBrainNotes()).toBe("");
  });

  it("skriv-läs-rundtur: setBrainNotes följt av getBrainNotes ger samma text tillbaka", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");

    await liveMemoryRepository.setBrainNotes("Jag vill bygga något för småföretagare.");
    expect(await liveMemoryRepository.getBrainNotes()).toBe("Jag vill bygga något för småföretagare.");
  });

  it("trimmar whitespace och skriver över en tidigare anteckning (upsert, inte en ny rad)", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");

    await liveMemoryRepository.setBrainNotes("Första tanken.");
    await liveMemoryRepository.setBrainNotes("  Andra, uppdaterade tanken.  ");
    expect(await liveMemoryRepository.getBrainNotes()).toBe("Andra, uppdaterade tanken.");
  });

  it("kastar ett fel över längdgränsen, skriver inget", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");

    await expect(liveMemoryRepository.setBrainNotes("x".repeat(20001))).rejects.toThrow();
    expect(await liveMemoryRepository.getBrainNotes()).toBe("");
  });
});

describe("liveMemoryRepository.getTraceEvents", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar en tom lista utan några händelser", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getTraceEvents("sv")).toEqual([]);
  });

  it("returnerar händelserna i kronologisk ordning, äldst först", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        trace_events: [
          { id: "e2", user_id: USER_ID, occurred_at: "2026-09-03T00:00:00Z", description: "Utskick skickat" },
          { id: "e1", user_id: USER_ID, occurred_at: "2026-09-01T00:00:00Z", description: "Konto skapat" },
        ],
      }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const events = await liveMemoryRepository.getTraceEvents("sv");
    expect(events.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(events[0]).toEqual({ id: "e1", timestampIso: "2026-09-01T00:00:00Z", description: "Konto skapat" });
  });
});

describe("liveMemoryRepository.recordTraceEvent", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  const event = { module: "Domen", description: "Domen blev pivot.", occurredAtIso: "2026-01-20" };

  it("sparar en post som sedan syns i getTraceEvents, med användaren ur sessionen", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await liveMemoryRepository.recordTraceEvent(event);
    const events = await liveMemoryRepository.getTraceEvents("sv");
    expect(events).toHaveLength(1);
    expect(events[0].description).toBe("Domen blev pivot.");
    expect(events[0].timestampIso).toBe("2026-01-20T00:00:00.000Z");
  });

  it("är idempotent: samma händelse sparas inte två gånger", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await liveMemoryRepository.recordTraceEvent(event);
    await liveMemoryRepository.recordTraceEvent(event);
    expect(await liveMemoryRepository.getTraceEvents("sv")).toHaveLength(1);
  });

  it("rensar styr-/nollbreddstecken och kortar beskrivningen", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await liveMemoryRepository.recordTraceEvent({ ...event, description: `A\u200b\u0000B${"x".repeat(600)}` });
    const [saved] = await liveMemoryRepository.getTraceEvents("sv");
    expect(saved.description.startsWith("A B")).toBe(true);
    expect(Array.from(saved.description).length).toBeLessThanOrEqual(500);
  });

  it("kastar vid tom modul/beskrivning eller ogiltig tid, utan att spara något", async () => {
    const supabase = makeSupabaseFake({});
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await expect(liveMemoryRepository.recordTraceEvent({ ...event, module: " " })).rejects.toThrow();
    await expect(liveMemoryRepository.recordTraceEvent({ ...event, description: "" })).rejects.toThrow();
    await expect(liveMemoryRepository.recordTraceEvent({ ...event, occurredAtIso: "inte ett datum" })).rejects.toThrow();
    expect(await liveMemoryRepository.getTraceEvents("sv")).toEqual([]);
  });
});

describe("liveMemoryRepository.getKnownProfile", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("ger en tom profil när raden saknas, utan att kasta", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getKnownProfile!()).toEqual({});
  });

  it("ger bara de fält som är ifyllda (ingång B: tre svar)", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: [{ ...completeProfileRow(), bio: null, risk_appetite: "   " }],
      }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getKnownProfile!()).toEqual({
      name: "Sara Lindqvist",
      role: "Redovisningskonsult",
      time: "Kvällar och helger",
      money: "20 000 kr",
      frustrations: "Kvitton som försvinner.",
    });
  });

  it("version 2: v4-svaren fyller roll, tid, pengar och frustration med etiketter på svenska, och följer med som answers", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({ profiles: [v4ProfileRow()] }), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const known = await liveMemoryRepository.getKnownProfile!();
    expect(known).toMatchObject({
      name: "Sara Lindqvist",
      role: "Jobbar",
      time: "3–6 timmar",
      money: "Inget",
      frustrations: "Kvitton som försvinner.",
    });
    expect(known.answers?.map((a) => a.questionId)).toEqual(["situation", "time", "money", "soldB2b", "frustration"]);
  });

  it("ett fritextsvar från före v4 går före v4-svaret för samma sak", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ ...completeProfileRow(), onboarding_answers: { time: { answer: "over10", answered_at: "2026-10-05T09:00:00Z" } } }] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect((await liveMemoryRepository.getKnownProfile!()).time).toBe("Kvällar och helger");
  });
});

describe("liveMemoryRepository.getPendingOnboardingQuestions", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("version 2: ingångens obesvarade frågor, i ordning, med val ur i18n", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({ profiles: [v4ProfileRow()] }), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const pending = await liveMemoryRepository.getPendingOnboardingQuestions("sv");
    expect(pending.map((q) => q.id)).toEqual(["archetype", "knowsOwner"]);
    expect(pending[1]).toMatchObject({ kind: "choice", choices: [{ id: "yes", label: "Ja" }, { id: "no", label: "Nej" }] });
  });

  it("version 1: alla v4-frågor för ingången återstår, de gamla fritextsvaren räknas inte om", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({ profiles: [entryBProfileRow()] }), userId: USER_ID });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    const pending = await liveMemoryRepository.getPendingOnboardingQuestions("sv");
    expect(pending.map((q) => q.id)).toEqual(["situation", "payer", "customer", "talkedTo", "soldB2b", "time", "money"]);
  });

  it("allt besvarat ger en tom lista", async () => {
    const row = v4ProfileRow();
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ ...row, onboarding_answers: { ...row.onboarding_answers, archetype: { answer: "builder" }, knowsOwner: { answer: "no" } } }] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getPendingOnboardingQuestions("sv")).toEqual([]);
  });

  it("innan onboardingen är klar: tomt tillstånd", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [{ ...v4ProfileRow(), onboarding_completed_at: null }] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await expect(liveMemoryRepository.getPendingOnboardingQuestions("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });
});
