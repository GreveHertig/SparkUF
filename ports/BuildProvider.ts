import type { Locale } from "@/i18n/context";
import type { ByggBrief } from "@/core/domain";

export type BuildStatus = "not_started" | "building" | "published";

/** Modul: Bygg (avsnitt 14.3, 2.3). Liveadapter bygger på Lovable (koncept, alltid stub). */
export interface BuildProvider {
  startBuild(brief: ByggBrief): Promise<{ status: BuildStatus }>;
  /** `creditsUsed` (avsnitt 2.3: "Visa att bygget kostar credits") —
   * `undefined` innan bygget påbörjats. */
  getStatus(): Promise<{ status: BuildStatus; url?: string; creditsUsed?: number }>;
  /** Specen bygget vilar på (/app/bygg) — `null` innan den finns. */
  getSpec(locale: Locale): Promise<ByggBrief | null>;
}
