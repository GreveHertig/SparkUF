import { expect } from "vitest";
import type { VerdictProvider } from "./VerdictProvider";
import { demoVerdictProvider } from "@/adapters/demo/VerdictProvider";
import { liveVerdictProvider } from "@/adapters/live/VerdictProvider";
import { describeContract, contractIt } from "./testContract";

describeContract<VerdictProvider>(
  "VerdictProvider",
  { demo: demoVerdictProvider, live: liveVerdictProvider },
  (provider) => {
    contractIt("getVerdictInput är null eller ett underlag med svar som bär källa", async () => {
      const input = await provider.getVerdictInput("sv");
      if (input === null) return;
      expect(input.contacted).toBeGreaterThanOrEqual(input.responses.length);
      for (const r of input.responses) {
        expect(r.source.namn).toBeTruthy();
        expect(r.source.hämtad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    contractIt("getVerdictReport är null eller en dom med text, siffror och citat med källa", async () => {
      const report = await provider.getVerdictReport("sv");
      if (report === null) return;
      expect(["run", "refine", "pivot", "insufficient"]).toContain(report.verdict.decision);
      expect(report.presentation.headline).toBeTruthy();
      expect(report.presentation.reasoning).toBeTruthy();
      for (const q of report.quotes) {
        expect(q.source.namn).toBeTruthy();
        expect(q.quote).toBeTruthy();
      }
      // En pivot ger en Spår-post, annars ingen.
      expect(report.pivotTraceEvent !== null).toBe(report.verdict.decision === "pivot");
    });

    contractIt("getVerdictReport svarar på båda språken utan att kasta", async () => {
      await provider.getVerdictReport("sv");
      await provider.getVerdictReport("en");
    });

    contractIt("rapporten innehåller inga poängfält", async () => {
      const report = await provider.getVerdictReport("sv");
      if (report === null) return;
      expect(JSON.stringify(report)).not.toMatch(/"(score|points|poäng|delta)"/i);
    });
  },
);
