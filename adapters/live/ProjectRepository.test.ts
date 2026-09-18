import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotImplementedError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER_ID = "user-1";

describe("liveProjectRepository.getProject", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar null när användaren inte har något aktivt projekt — ett giltigt svar", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    expect(await liveProjectRepository.getProject()).toBeNull();
  });

  it("returnerar det aktiva projektet med id, name och oneLiner ifyllda", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        projects: [
          {
            id: "proj-1",
            user_id: USER_ID,
            name: "Kvittojakten",
            one_liner: "Automatisk insamling av kvittounderlag.",
            is_active: true,
          },
        ],
      }),
      userId: USER_ID,
    });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    expect(await liveProjectRepository.getProject()).toEqual({
      id: "proj-1",
      name: "Kvittojakten",
      oneLiner: "Automatisk insamling av kvittounderlag.",
    });
  });

  it("ignorerar ett inaktivt (avslutat) projekt och andra användares rader", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        projects: [
          { id: "old", user_id: USER_ID, name: "Gammal idé", one_liner: "…", is_active: false },
          { id: "other", user_id: "another-user", name: "Padelhall", one_liner: "…", is_active: true },
        ],
      }),
      userId: USER_ID,
    });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    expect(await liveProjectRepository.getProject()).toBeNull();
  });
});

describe("liveProjectRepository.getIdeaScreening", () => {
  it("kastar NotImplementedError — porten saknar fortfarande en skrivmetod, se docs/moduler/projekt-och-ide.md", async () => {
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    await expect(liveProjectRepository.getIdeaScreening("sv")).rejects.toBeInstanceOf(NotImplementedError);
  });
});
