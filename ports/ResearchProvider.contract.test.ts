import { expect } from "vitest";
import type { ResearchProvider } from "./ResearchProvider";
import { demoResearchProvider } from "@/adapters/demo/ResearchProvider";
import { liveResearchProvider } from "@/adapters/live/ResearchProvider";
import { describeContract, contractIt } from "./testContract";

describeContract<ResearchProvider>(
  "ResearchProvider",
  { demo: demoResearchProvider, live: liveResearchProvider },
  (research) => {
    contractIt("search returnerar en lista med källa och hämtningstid per resultat", async () => {
      const results = await research.search("redovisningsbyråer Sverige");
      expect(Array.isArray(results)).toBe(true);
      for (const result of results) {
        expect(result.title).toBeTruthy();
        expect(result.url).toBeTruthy();
        expect(result.fetchedAtIso).toBeTruthy();
      }
    });
  },
);
