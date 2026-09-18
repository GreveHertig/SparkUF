import { expect } from "vitest";
import type { ProjectRepository } from "./ProjectRepository";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { describeContract, contractIt } from "./testContract";

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
