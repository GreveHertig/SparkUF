import { expect } from "vitest";
import { UnknownMarketingActivityError, type MarketingProvider } from "./MarketingProvider";
import { demoMarketingProvider } from "@/adapters/demo/MarketingProvider";
import { liveMarketingProvider } from "@/adapters/live/MarketingProvider";
import { describeContract, contractIt } from "./testContract";

describeContract<MarketingProvider>(
  "MarketingProvider",
  { demo: demoMarketingProvider, live: liveMarketingProvider },
  (marketing) => {
    contractIt("varje budskap har en källa (Datalöftet)", async () => {
      const plan = await marketing.getPlan("sv");
      for (const message of [plan.headline, ...plan.supporting]) {
        expect(message.text).toBeTruthy();
        expect(message.source.namn).toBeTruthy();
        expect(message.source.hämtad).toBeTruthy();
      }
    });

    contractIt("högst två rekommenderade startkanaler, var och en motiverad", async () => {
      const plan = await marketing.getPlan("sv");
      const recommended = plan.channels.filter((channel) => channel.verdict === "recommended");
      expect(recommended.length).toBeGreaterThanOrEqual(1);
      expect(recommended.length).toBeLessThanOrEqual(2);
      for (const channel of plan.channels) expect(channel.why).toBeTruthy();
    });

    contractIt("varje aktivitet hör till en kanal i planen", async () => {
      const plan = await marketing.getPlan("sv");
      const channelIds = new Set(plan.channels.map((channel) => channel.id));
      const activities = plan.weeks.flatMap((week) => week.activities);
      expect(activities.length).toBeGreaterThan(0);
      for (const activity of activities) expect(channelIds.has(activity.channelId)).toBe(true);
    });

    contractIt("varje utkast bygger på minst ett bevis", async () => {
      const plan = await marketing.getPlan("sv");
      for (const activity of plan.weeks.flatMap((week) => week.activities)) {
        const draft = await marketing.draftContent(activity.id, "sv");
        expect(draft.activityId).toBe(activity.id);
        expect(draft.channelId).toBe(activity.channelId);
        expect(draft.text).toBeTruthy();
        expect(draft.basedOn.length).toBeGreaterThan(0);
      }
    });

    contractIt("okänd aktivitet ger UnknownMarketingActivityError", async () => {
      // Hämtar planen först så att testet skippas, inte felar, mot en stubbe.
      await marketing.getPlan("sv");
      await expect(marketing.draftContent("finns-inte", "sv")).rejects.toBeInstanceOf(UnknownMarketingActivityError);
    });
  },
);
