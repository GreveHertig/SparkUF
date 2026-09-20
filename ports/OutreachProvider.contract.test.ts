import { expect } from "vitest";
import type { OutreachProvider, OutreachStatus } from "./OutreachProvider";
import { demoOutreachProvider } from "@/adapters/demo/OutreachProvider";
import { liveOutreachProvider } from "@/adapters/live/OutreachProvider";
import { describeContract, contractIt } from "./testContract";

const VALID_STATUSES: OutreachStatus[] = ["draft", "sent", "opened", "responded"];

describeContract<OutreachProvider>(
  "OutreachProvider",
  { demo: demoOutreachProvider, live: liveOutreachProvider },
  (outreach) => {
    contractIt("send tar emot en tom lista utan att kasta (en ConfirmedOutreach kan inte skapas i testkod)", async () => {
      await outreach.send([]);
    });

    contractIt("getStatuses returnerar en uppslagsbar tabell", async () => {
      const statuses = await outreach.getStatuses();
      expect(typeof statuses).toBe("object");
      for (const status of Object.values(statuses)) {
        expect(VALID_STATUSES).toContain(status);
      }
    });

    contractIt("getCampaign returnerar rader med giltig status", async () => {
      const rows = await outreach.getCampaign("sv");
      expect(Array.isArray(rows)).toBe(true);
      for (const row of rows) {
        expect(VALID_STATUSES).toContain(row.status);
        expect(row.companyName).toBeTruthy();
        if (row.quote !== undefined) {
          expect(typeof row.quote).toBe("string");
        }
      }
    });

    contractIt("getCampaign svarar på båda språken utan att kasta", async () => {
      await outreach.getCampaign("sv");
      await outreach.getCampaign("en");
    });
  },
);
