import type { BuildProvider } from "@/ports/BuildProvider";

// Ingen skärm använder den här porten än — /app/bygg (Lovable-konceptet) byggs i en senare session.
export const demoBuildProvider: BuildProvider = {
  async startBuild() {
    return { status: "not_started" };
  },
  async getStatus() {
    return { status: "not_started" };
  },
};
