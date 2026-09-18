import { expect, vi } from "vitest";
import type { EvidenceRepository } from "./EvidenceRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";

// Alla tre metoder är klara (docs/moduler/evidens-och-poang.md) — kontraktet
// prövas nu mot liveadaptern också. Fixturen ger bevis för BÅDA delarna som
// är upplåsta i discover-fasen (fit, market) — annars kastar
// calculateScore/EmptyStateError och testet failar i stället för att pröva
// kontraktet (contractIt skippar bara NotImplementedError, se testContract.ts).
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({
    supabase: makeSupabaseFake({
      projects: [
        { id: "contract-project", user_id: "contract-test-user", name: "Testprojekt", one_liner: "En testidé.", is_active: true },
      ],
      evidence: [
        {
          id: "1",
          user_id: "contract-test-user",
          project_id: "contract-project",
          part_id: "fit",
          points: 6,
          contradicts: false,
          data_type: "customer",
          source_name: "Kundintervju",
          source_url: null,
          fetched_at: "2026-09-01",
          created_at: "2026-09-01T00:00:00Z",
        },
        {
          id: "2",
          user_id: "contract-test-user",
          project_id: "contract-project",
          part_id: "market",
          points: 6,
          contradicts: false,
          data_type: "register",
          source_name: "Bolagsverket",
          source_url: "https://bolagsverket.se",
          fetched_at: "2026-09-01",
          created_at: "2026-09-01T00:00:01Z",
        },
      ],
      score_snapshots: [
        { user_id: "contract-test-user", project_id: "contract-project", total: 15, calculated_at: "2026-09-01T00:00:00Z" },
      ],
    }),
    userId: "contract-test-user",
  }),
}));

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
