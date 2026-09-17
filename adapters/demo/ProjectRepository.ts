import type { ProjectRepository } from "@/ports/ProjectRepository";

// Ingen skärm använder den här porten än — Session 3 bygger idévalet (steg 02).
export const demoProjectRepository: ProjectRepository = {
  async getProject() {
    return {
      id: "kvittojakten",
      name: "Kvittojakten",
      oneLiner: "Automatisk insamling av kvittounderlag åt redovisningsbyråer.",
    };
  },
};
