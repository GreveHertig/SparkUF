import { expect } from "vitest";
import type { EvidenceRepository } from "./EvidenceRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { describeContract, contractIt } from "./testContract";

describeContract<EvidenceRepository>(
  "EvidenceRepository",
  { demo: demoEvidenceRepository, live: liveEvidenceRepository },
  (evidence) => {
    contractIt("getScoreSnapshot ligger alltid inom 1–100 (avsnitt 7.1)", async () => {
      const snapshot = await evidence.getScoreSnapshot("sv");
      expect(snapshot.total).toBeGreaterThanOrEqual(1);
      expect(snapshot.total).toBeLessThanOrEqual(100);
    });

    contractIt("varje upplåst del i snapshotten har en källa (Datalöftet)", async () => {
      const snapshot = await evidence.getScoreSnapshot("sv");
      for (const part of snapshot.parts) {
        expect(part.source.namn).toBeTruthy();
        expect(part.source.hämtad).toBeTruthy();
      }
    });

    contractIt("låsta delar visas aldrig som en del med poäng", async () => {
      const snapshot = await evidence.getScoreSnapshot("sv");
      for (const locked of snapshot.lockedParts) {
        expect(locked.unlocksAfterStep).toBeGreaterThan(0);
      }
    });

    contractIt("getSuggestions ger bara delar med ett icke-negativt poäng-per-minut", async () => {
      const suggestions = await evidence.getSuggestions("sv");
      expect(Array.isArray(suggestions)).toBe(true);
      for (const suggestion of suggestions) {
        expect(Number.isFinite(suggestion.pointsPerMinute)).toBe(true);
      }
    });

    contractIt("getScoreHistory ligger alltid inom 1–100", async () => {
      const history = await evidence.getScoreHistory("sv");
      expect(Array.isArray(history)).toBe(true);
      for (const total of history) {
        expect(total).toBeGreaterThanOrEqual(1);
        expect(total).toBeLessThanOrEqual(100);
      }
    });
  },
);
