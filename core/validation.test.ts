import { describe, expect, it } from "vitest";
import type { CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import { outreachStats } from "./validation";

function row(status: OutreachStatus, index: number): CampaignRow {
  return { companyName: `Bolag ${index}`, sniCode: "69.201", employees: 8, revenueKsek: 4000, status };
}

describe("outreachStats", () => {
  it("räknar kontaktade utan utkast, svar och svarsfrekvens", () => {
    const rows = (["draft", "sent", "opened", "responded", "responded"] as const).map(row);
    expect(outreachStats(rows)).toEqual({ contacted: 4, responded: 2, responseRate: 50 });
  });

  it("avrundar svarsfrekvensen till heltal", () => {
    const rows = (["responded", "sent", "sent"] as const).map(row);
    expect(outreachStats(rows).responseRate).toBe(33);
  });

  it("ger ingen svarsfrekvens när ingen är kontaktad än, aldrig en nolla", () => {
    expect(outreachStats([row("draft", 0)])).toEqual({ contacted: 0, responded: 0, responseRate: null });
    expect(outreachStats([])).toEqual({ contacted: 0, responded: 0, responseRate: null });
  });
});
