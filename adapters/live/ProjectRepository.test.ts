import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotImplementedError, ProjectExistsError } from "@/core/errors";
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

describe("liveProjectRepository.createProject", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  // Samma index som projects_ett_aktivt_per_user i migreringen.
  const options = {
    unique: {
      projects: [{ name: "projects_ett_aktivt_per_user", columns: ["user_id"], where: (row: Record<string, unknown>) => row.is_active === true }],
    },
    generatedIds: ["projects"],
  };

  it("skapar ett aktivt projekt med trimmad text och returnerar det med databasens id", async () => {
    const supabase = makeSupabaseFake({}, {}, options);
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");

    const created = await liveProjectRepository.createProject({ name: "  Hallplan ", oneLiner: " Prognoser för padelhallar. " });

    expect(created).toEqual({ id: expect.any(String), name: "Hallplan", oneLiner: "Prognoser för padelhallar." });
    expect(supabase.tables.projects).toEqual([
      { id: created.id, user_id: USER_ID, name: "Hallplan", one_liner: "Prognoser för padelhallar.", is_active: true },
    ]);
  });

  it("kastar ProjectExistsError när det redan finns ett aktivt projekt (23505) och skriver inte över det", async () => {
    const existing = { id: "proj-1", user_id: USER_ID, name: "Kvittojakten", one_liner: "Kvitton.", is_active: true };
    const supabase = makeSupabaseFake({ projects: [existing] }, {}, options);
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");

    await expect(
      liveProjectRepository.createProject({ name: "Hallplan", oneLiner: "Prognoser." }),
    ).rejects.toBeInstanceOf(ProjectExistsError);
    expect(supabase.tables.projects).toEqual([existing]);
  });

  it("ett inaktivt projekt hindrar inte ett nytt", async () => {
    const supabase = makeSupabaseFake(
      { projects: [{ id: "old", user_id: USER_ID, name: "Gammal", one_liner: "Gammal.", is_active: false }] },
      {},
      options,
    );
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    await liveProjectRepository.createProject({ name: "Hallplan", oneLiner: "Prognoser." });
    expect(supabase.tables.projects).toHaveLength(2);
  });

  it.each([
    ["tomt namn", { name: "  ", oneLiner: "Prognoser." }],
    ["för långt namn", { name: "a".repeat(81), oneLiner: "Prognoser." }],
    ["tom ingress", { name: "Hallplan", oneLiner: "" }],
    ["för lång ingress", { name: "Hallplan", oneLiner: "a".repeat(281) }],
  ])("avvisar %s utan att skriva", async (_, input) => {
    const supabase = makeSupabaseFake({}, {}, options);
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    await expect(liveProjectRepository.createProject(input)).rejects.toThrow();
    expect(supabase.tables.projects ?? []).toHaveLength(0);
  });

  it("ett annat databasfel blir inte ProjectExistsError", async () => {
    const supabase = makeSupabaseFake({}, {}, options);
    supabase.from = () =>
      ({
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { code: "23514", message: "check" } }) }) }),
      }) as never;
    requireSupabaseUserMock.mockResolvedValue({ supabase, userId: USER_ID });
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    const error = await liveProjectRepository.createProject({ name: "Hallplan", oneLiner: "Prognoser." }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ProjectExistsError);
  });
});

describe("liveProjectRepository.getIdeaScreening", () => {
  it("kastar NotImplementedError — porten saknar fortfarande en skrivmetod, se docs/moduler/projekt-och-ide.md", async () => {
    const { liveProjectRepository } = await import("@/adapters/live/ProjectRepository");
    await expect(liveProjectRepository.getIdeaScreening("sv")).rejects.toBeInstanceOf(NotImplementedError);
  });
});
