import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmptyStateError, NotImplementedError } from "@/core/errors";
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
  it("kastar NotImplementedError — väntar på ett olöst designbeslut, se docs/moduler/profil.md", async () => {
    const { liveProfileRepository } = await import("@/adapters/live/ProfileRepository");
    await expect(liveProfileRepository.getOnboardingScript("noIdea", "sv")).rejects.toBeInstanceOf(
      NotImplementedError,
    );
  });
});
