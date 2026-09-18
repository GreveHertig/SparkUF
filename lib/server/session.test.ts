import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotAuthenticatedError } from "@/core/errors";

const getUserMock = vi.fn();

vi.mock("@/lib/server/supabase", () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser: getUserMock } }),
}));

// next/navigation:s riktiga redirect() avbryter renderingen genom att kasta
// ett internt NEXT_REDIRECT-fel — mocken speglar det så requireUser() ger
// samma "kastar i stället för att fortsätta"-beteende i testet.
const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("lib/server/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("returnerar null när Supabase inte har någon användare", async () => {
      getUserMock.mockResolvedValue({ data: { user: null }, error: null });
      const { getCurrentUser } = await import("@/lib/server/session");
      expect(await getCurrentUser()).toBeNull();
    });

    it("returnerar null när Supabase svarar med ett fel", async () => {
      getUserMock.mockResolvedValue({ data: { user: null }, error: new Error("nätverksfel") });
      const { getCurrentUser } = await import("@/lib/server/session");
      expect(await getCurrentUser()).toBeNull();
    });

    it("returnerar id och e-post för en inloggad användare", async () => {
      getUserMock.mockResolvedValue({
        data: { user: { id: "user-1", email: "sara@exempel.se" } },
        error: null,
      });
      const { getCurrentUser } = await import("@/lib/server/session");
      expect(await getCurrentUser()).toEqual({ id: "user-1", email: "sara@exempel.se" });
    });
  });

  describe("requireUser", () => {
    it("omdirigerar till /logga-in när ingen är inloggad", async () => {
      getUserMock.mockResolvedValue({ data: { user: null }, error: null });
      const { requireUser } = await import("@/lib/server/session");
      await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/logga-in");
      expect(redirectMock).toHaveBeenCalledWith("/logga-in");
    });

    it("returnerar användaren utan att omdirigera när sessionen finns", async () => {
      getUserMock.mockResolvedValue({
        data: { user: { id: "user-1", email: "sara@exempel.se" } },
        error: null,
      });
      const { requireUser } = await import("@/lib/server/session");
      await expect(requireUser()).resolves.toEqual({ id: "user-1", email: "sara@exempel.se" });
      expect(redirectMock).not.toHaveBeenCalled();
    });
  });

  describe("requireSupabaseUser", () => {
    it("kastar NotAuthenticatedError i stället för att omdirigera", async () => {
      getUserMock.mockResolvedValue({ data: { user: null }, error: null });
      const { requireSupabaseUser } = await import("@/lib/server/session");
      await expect(requireSupabaseUser()).rejects.toBeInstanceOf(NotAuthenticatedError);
      expect(redirectMock).not.toHaveBeenCalled();
    });

    it("returnerar en Supabase-klient och userId för en inloggad användare", async () => {
      getUserMock.mockResolvedValue({
        data: { user: { id: "user-1", email: "sara@exempel.se" } },
        error: null,
      });
      const { requireSupabaseUser } = await import("@/lib/server/session");
      const { supabase, userId } = await requireSupabaseUser();
      expect(userId).toBe("user-1");
      expect(supabase).toBeTruthy();
    });
  });
});
