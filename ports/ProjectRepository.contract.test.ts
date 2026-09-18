import { expect, vi } from "vitest";
import type { ProjectRepository } from "./ProjectRepository";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

// getProject() är klar (docs/moduler/projekt-och-ide.md) — kontraktet prövas
// nu på riktigt mot liveadaptern också, Supabase mockad bort. getIdeaScreening
// är fortfarande en medveten stub, se ports/stubStatus.test.ts's
// PARTIELLA_STUBBAR — inte kontraktstestad än.
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({
    supabase: makeSupabaseFake({
      projects: [
        {
          id: "contract-project",
          user_id: "contract-test-user",
          name: "Testprojekt",
          one_liner: "En testidé.",
          is_active: true,
        },
      ],
    }),
    userId: "contract-test-user",
  }),
}));

describeContract<ProjectRepository>(
  "ProjectRepository",
  { demo: demoProjectRepository, live: liveProjectRepository },
  (project) => {
    contractIt("getProject returnerar null eller ett komplett projekt", async () => {
      const result = await project.getProject();
      if (result === null) return;
      expect(result.id).toBeTruthy();
      expect(result.name).toBeTruthy();
      expect(result.oneLiner).toBeTruthy();
    });
  },
);
