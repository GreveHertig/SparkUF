import type { ByggBrief } from "@/core/domain";

export type BuildStatus = "not_started" | "building" | "published";

/** Modul: Bygg (avsnitt 14.3, 2.3). Liveadapter bygger på Lovable (koncept, alltid stub). */
export interface BuildProvider {
  startBuild(brief: ByggBrief): Promise<{ status: BuildStatus }>;
  getStatus(): Promise<{ status: BuildStatus; url?: string }>;
}
