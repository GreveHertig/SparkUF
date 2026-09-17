import type { ProjectRepository } from "@/ports/ProjectRepository";
import { NotImplementedError } from "@/core/errors";

const DOC = "docs/moduler/projekt-och-ide.md";

export const liveProjectRepository: ProjectRepository = {
  async getProject() {
    throw new NotImplementedError("Projekt och idé", DOC);
  },
};
