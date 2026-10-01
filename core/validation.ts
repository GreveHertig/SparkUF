import type { CampaignRow } from "@/ports/OutreachProvider";

export type OutreachStats = {
  /** Alla rader utom utkast. */
  contacted: number;
  responded: number;
  /** Heltal i procent, `null` när ingen är kontaktad än (aldrig en nolla). */
  responseRate: number | null;
};

/**
 * Valideringens nyckeltal ur kontaktlistan (PR 7, docs/plan-en-design.md:
 * logik i sidorna flyttas till core/ så att demot och appen räknar likadant).
 */
export function outreachStats(rows: CampaignRow[]): OutreachStats {
  const contacted = rows.filter((row) => row.status !== "draft").length;
  const responded = rows.filter((row) => row.status === "responded").length;
  const responseRate = contacted > 0 ? Math.round((responded / contacted) * 100) : null;
  return { contacted, responded, responseRate };
}
