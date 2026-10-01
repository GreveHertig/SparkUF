import { expect, vi } from "vitest";
import type { EvidenceRecorder } from "./EvidenceRecorder";
import { demoEvidenceRecorder } from "@/adapters/demo/EvidenceRecorder";
import { liveEvidenceRecorder } from "@/adapters/live/EvidenceRecorder";
import { describeContract, contractIt } from "./testContract";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { evidenceRpcFake, storedEvidenceRow } from "@/test/stubs/evidenceRpcFake";

const USER = "00000000-0000-4000-8000-0000000000c1";
const PROJECT = "00000000-0000-4000-8000-0000000000c2";

// Liveadaptern mot en fejkad Supabase-klient med fejkade databasfunktioner.
// Databasens egna regler prövas mot Postgres i
// supabase/migrations/evidenceWritePath.pg.test.ts.
// En fejk per testfil, skapad vid första anropet: listEvidence och
// retractEvidence måste se samma rader.
let fake: ReturnType<typeof makeSupabaseFake> | null = null;
function sharedFake() {
  fake ??= makeSupabaseFake(
    {
      projects: [{ id: PROJECT, user_id: USER, name: "Testprojekt", one_liner: "En testidé.", is_active: true }],
      evidence: [
        storedEvidenceRow(USER, PROJECT, { kind: "profileFitAnswer", subject_ref: "q-skills", source_name: "spark:profile" }),
        storedEvidenceRow(USER, PROJECT, { kind: "registerMarketCount", source_name: "SCB" }),
      ],
    },
    evidenceRpcFake(USER, PROJECT),
  );
  return fake;
}

vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: sharedFake(), userId: USER }),
}));
vi.mock("@/lib/server/scoreSnapshots", () => ({ writeScoreSnapshot: vi.fn(async () => undefined) }));

describeContract<EvidenceRecorder>(
  "EvidenceRecorder",
  { demo: demoEvidenceRecorder, live: liveEvidenceRecorder },
  (recorder) => {
    contractIt("recordEvidence ger en snapshot inom 1–100 (7.1)", async () => {
      const result = await recorder.recordEvidence(
        { kind: "profileFitAnswer", subjectRef: "q-time", source: { namn: "spark:profile", hämtad: "2026-09-02" } },
        "sv",
      );
      expect(["recorded", "duplicate", "replaced"]).toContain(result.status);
      expect(result.evidenceId).toBeTruthy();
      expect(result.snapshot.total).toBeGreaterThanOrEqual(1);
      expect(result.snapshot.total).toBeLessThanOrEqual(100);
    });

    contractIt("listEvidence ger bara bevis för den efterfrågade delen, alla med källa och datum", async () => {
      const views = await recorder.listEvidence("fit", "sv");
      expect(Array.isArray(views)).toBe(true);
      for (const view of views) {
        expect(view.partId).toBe("fit");
        expect(view.source.namn).toBeTruthy();
        expect(view.source.hämtad).toBeTruthy();
        expect(view.kindLabel).toBeTruthy();
      }
    });

    contractIt("ett systembevis kan aldrig återkallas av grundaren (7.7)", async () => {
      const views = await recorder.listEvidence("market", "sv");
      for (const view of views.filter((candidate) => candidate.enteredBy === "system")) {
        expect(view.canRetract).toBe(false);
      }
    });

    contractIt("retractEvidence på ett återkallbart bevis ger en snapshot inom 1–100", async () => {
      const retractable = (await recorder.listEvidence("fit", "sv")).find((view) => view.canRetract);
      if (!retractable) return; // demot har inga återkallbara bevis
      const snapshot = await recorder.retractEvidence(retractable.id, "Fel svar", "sv");
      expect(snapshot.total).toBeGreaterThanOrEqual(1);
      expect(snapshot.total).toBeLessThanOrEqual(100);
    });
  },
);
