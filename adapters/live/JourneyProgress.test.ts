import { describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { evidenceRpcFake, storedEvidenceRow } from "@/test/stubs/evidenceRpcFake";
import { journeyRpcFake } from "@/test/stubs/journeyRpcFake";
import { FIT_QUESTION_IDS, fitSubjectRef } from "@/core/fitQuestions";
import type { ScoreSnapshotWrite } from "@/lib/server/scoreSnapshots";

const USER = "00000000-0000-4000-8000-0000000000e1";
const PROJECT = "00000000-0000-4000-8000-0000000000e2";
const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

let fake: ReturnType<typeof makeSupabaseFake>;
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: fake, userId: USER }),
}));
const writeScoreSnapshot = vi.fn(async (input: ScoreSnapshotWrite) => {
  (fake.tables.score_snapshots ??= []).push({
    user_id: input.userId,
    project_id: input.projectId,
    total: input.total,
    phase: input.phase,
    delta: input.delta,
    delta_reason: input.deltaReason,
    calculated_at: new Date().toISOString(),
  });
});
vi.mock("@/lib/server/scoreSnapshots", () => ({ writeScoreSnapshot: (input: ScoreSnapshotWrite) => writeScoreSnapshot(input) }));

const { liveJourneyProgress, JourneyStepBlockedError } = await import("./JourneyProgress");
const { liveEvidenceRecorder } = await import("./EvidenceRecorder");
const { liveEvidenceRepository } = await import("./EvidenceRepository");

function setup(evidence: Record<string, unknown>[] = [], completedSteps: number[] = [], onboardingCompleted = false) {
  writeScoreSnapshot.mockClear();
  fake = makeSupabaseFake(
    {
      profiles: [
        {
          user_id: USER,
          onboarding_entry: onboardingCompleted ? "hasIdea" : null,
          onboarding_completed_at: onboardingCompleted ? "2026-09-01T00:00:00Z" : null,
        },
      ],
      projects: [{ id: PROJECT, user_id: USER, name: "Test", one_liner: "En idé.", is_active: true }],
      evidence,
      journey_steps: completedSteps.map((step_number) => ({
        user_id: USER,
        project_id: PROJECT,
        step_number,
        completed_at: "2026-09-01T00:00:00Z",
      })),
    },
    { ...evidenceRpcFake(USER, PROJECT), ...journeyRpcFake(USER, PROJECT, TODAY) },
  );
}

const system = (kind: "registerMarketCount" | "registerMarketRevenue" | "registerCompetitorSet") =>
  storedEvidenceRow(USER, PROJECT, { kind, fetched_at: TODAY });

describe("liveJourneyProgress", () => {
  it("visar att steg 01 väntar på onboardingen, och att steg 02 väntar på steg 01", async () => {
    setup();
    expect(await liveJourneyProgress.getStepCompletion(1, "sv")).toEqual({
      stepNumber: 1,
      status: "missing",
      missing: ["onboardingCompleted"],
      progress: [],
    });
    expect((await liveJourneyProgress.getStepCompletion(2, "sv")).status).toBe("previousNotDone");
    await expect(liveJourneyProgress.completeStep(2, "sv")).rejects.toBeInstanceOf(JourneyStepBlockedError);
  });

  it("fyra passformssvar klarar inte steg 01: bara onboardingen gör det", async () => {
    const fit = FIT_QUESTION_IDS.map((id) =>
      storedEvidenceRow(USER, PROJECT, { kind: "profileFitAnswer", subject_ref: fitSubjectRef(id), source_name: "spark:profile" }),
    );
    setup(fit, [1]);
    expect((await liveJourneyProgress.getStepCompletion(1, "sv")).status).toBe("missing");
    expect((await liveJourneyProgress.getStepCompletion(2, "sv")).status).toBe("previousNotDone");
  });

  it("hela vägen: klar onboarding är steg 01, fyra passformssvar höjer poängen, steg 02 klart, och fasen stannar i Upptäck", async () => {
    setup([], [], true);
    expect((await liveJourneyProgress.getStepCompletion(1, "sv")).status).toBe("done");
    let total = 1;
    for (const id of FIT_QUESTION_IDS) {
      const result = await liveEvidenceRecorder.recordEvidence(
        { kind: "profileFitAnswer", subjectRef: fitSubjectRef(id), source: { namn: "spark:profile", hämtad: TODAY }, quote: "Svar" },
        "sv",
      );
      expect(result.snapshot.total).toBeGreaterThanOrEqual(total);
      total = result.snapshot.total;
    }
    // 4 × 3 = 12, men Passform väger 10.
    expect(total).toBe(10);

    expect((await liveJourneyProgress.getStepCompletion(2, "sv")).status).toBe("completable");
    const two = await liveJourneyProgress.completeStep(2, "sv");
    expect(two.phaseAfter).toBe("discover");
    expect((await liveJourneyProgress.getStepCompletion(3, "sv"))).toMatchObject({ status: "missing", missing: ["marketCount"] });
    await expect(liveJourneyProgress.completeStep(3, "sv")).rejects.toBeInstanceOf(JourneyStepBlockedError);
  });

  it("taket följer med: steg 03 klart låser upp Pröva före samtal, och poängen passerar 18", async () => {
    const fit = FIT_QUESTION_IDS.map((id) =>
      storedEvidenceRow(USER, PROJECT, { kind: "profileFitAnswer", subject_ref: fitSubjectRef(id), source_name: "spark:profile" }),
    );
    setup([...fit, system("registerMarketCount"), system("registerMarketRevenue"), system("registerCompetitorSet")], [2], true);

    const before = await liveEvidenceRepository.getScoreSnapshot("sv");
    // Upptäck: Passform 10 + preliminär Marknad 6 (halva vikten).
    expect(before.total).toBe(16);

    const result = await liveJourneyProgress.completeStep(3, "sv");
    expect(result.phaseBefore).toBe("discover");
    expect(result.phaseAfter).toBe("tryBeforeCalls");
    // Pröva före samtal: Passform 10 + Marknad 7 + Konkurrens 3.
    expect(result.snapshot.total).toBe(20);
    expect(result.snapshot.delta).toBe(4);
    expect(writeScoreSnapshot).toHaveBeenCalledWith(expect.objectContaining({ total: 20, phase: "tryBeforeCalls", deltaReason: "unlocked" }));

    const after = await liveEvidenceRepository.getScoreSnapshot("sv");
    expect(after.total).toBe(20);
  });

  it("ett redan klart steg ändrar ingenting och skriver ingen snapshot", async () => {
    setup([], [2], true);
    for (const step of [1, 2]) {
      const result = await liveJourneyProgress.completeStep(step, "sv");
      expect(result.phaseAfter).toBe(result.phaseBefore);
    }
    expect(writeScoreSnapshot).not.toHaveBeenCalled();
    expect(fake.tables.journey_steps.map((row) => row.step_number)).toEqual([2]);
  });

  it("nekar ett okänt steg utan att anropa databasen", async () => {
    setup();
    await expect(liveJourneyProgress.completeStep(13, "sv")).rejects.toBeInstanceOf(JourneyStepBlockedError);
    await expect(liveJourneyProgress.completeStep(1.5, "sv")).rejects.toBeInstanceOf(JourneyStepBlockedError);
  });
});
