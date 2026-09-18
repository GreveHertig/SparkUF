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

  it("kastar EmptyStateError när bara delar av bakgrunden är ifylld", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        profiles: [{ ...completeProfileRow(), bio: null, risk_appetite: null }],
      }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    await expect(liveMemoryRepository.getProfileSummary("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("returnerar alla sex fält när profilen är komplett", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ profiles: [completeProfileRow()] }),
      userId: USER_ID,
    });
    const { liveMemoryRepository } = await import("@/adapters/live/MemoryRepository");
    expect(await liveMemoryRepository.getProfileSummary("sv")).toEqual({
      name: "Sara Lindqvist",
      role: "Redovisningskonsult",
      bio: "Jobbat med bokföring i tio år.",
      time: "Kvällar och helger",
      money: "20 000 kr",
      risk: "Låg",
    });
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
