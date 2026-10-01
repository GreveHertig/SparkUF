import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { evidenceRpcFake, storedEvidenceRow } from "@/test/stubs/evidenceRpcFake";
import { EmptyStateError } from "@/core/errors";
import { sv } from "@/i18n/sv";
import type { ScoreSnapshotWrite } from "@/lib/server/scoreSnapshots";

const USER = "00000000-0000-4000-8000-0000000000a1";
const PROJECT = "00000000-0000-4000-8000-0000000000a2";

let fake: ReturnType<typeof makeSupabaseFake>;
let tick = 0;
const clock = () => new Date(Date.UTC(2026, 8, 20, 0, 0, tick++)).toISOString();

vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: fake, userId: USER }),
}));

// Servern skriver snapshots med service role. I testet hamnar de i samma
// fejkade tabell som läsvägen läser, så att fel 3 (previousTotal) prövas hela vägen.
const writeScoreSnapshot = vi.fn(async (input: ScoreSnapshotWrite) => {
  (fake.tables.score_snapshots ??= []).push({
    user_id: input.userId,
    project_id: input.projectId,
    total: input.total,
    phase: input.phase,
    delta: input.delta,
    delta_reason: input.deltaReason,
    calculated_at: clock(),
  });
});
vi.mock("@/lib/server/scoreSnapshots", () => ({ writeScoreSnapshot: (input: ScoreSnapshotWrite) => writeScoreSnapshot(input) }));

const { liveEvidenceRecorder, validateRecordInput, EvidenceInputError } = await import("./EvidenceRecorder");
const { liveEvidenceRepository } = await import("./EvidenceRepository");

function setup(evidence: Record<string, unknown>[] = [], completedSteps: number[] = []) {
  tick = 0;
  writeScoreSnapshot.mockClear();
  fake = makeSupabaseFake(
    {
      projects: [{ id: PROJECT, user_id: USER, name: "Test", one_liner: "En idé.", is_active: true }],
      evidence,
      journey_steps: completedSteps.map((step_number) => ({
        user_id: USER,
        project_id: PROJECT,
        step_number,
        completed_at: "2026-09-01T00:00:00Z",
      })),
    },
    evidenceRpcFake(USER, PROJECT, clock),
  );
}

const fitAnswer = (subjectRef: string) => ({
  kind: "profileFitAnswer" as const,
  subjectRef,
  source: { namn: "spark:profile", hämtad: "2026-09-02" },
});

describe("validateRecordInput: indata kontrolleras innan något skrivs", () => {
  const today = "2026-10-01";
  const valid = { kind: "customerProblemConfirmed", subjectRef: "bolag-1", source: { namn: "Bolag AB", hämtad: "2026-09-01" } };

  it("ett försök att skicka med egna points, del eller användare avvisas", () => {
    expect(() => validateRecordInput({ ...valid, points: 99 }, today)).toThrow(EvidenceInputError);
    expect(() => validateRecordInput({ ...valid, partId: "traction" }, today)).toThrow(EvidenceInputError);
    expect(() => validateRecordInput({ ...valid, userId: "someone-else" }, today)).toThrow(EvidenceInputError);
    expect(() => validateRecordInput({ ...valid, source: { ...valid.source, points: 99 } }, today)).toThrow(
      EvidenceInputError,
    );
  });

  it("nekar okänd sort och registerdata", () => {
    expect(() => validateRecordInput({ ...valid, kind: "madeUp" }, today)).toThrow(/Okänd/);
    expect(() => validateRecordInput({ ...valid, kind: "registerMarketCount" }, today)).toThrow(/systemet/);
  });

  it("Datalöftet: nekar ett bevis utan källa eller datum", () => {
    expect(() => validateRecordInput({ ...valid, source: { namn: "   ", hämtad: "2026-09-01" } }, today)).toThrow(/källa/);
    expect(() => validateRecordInput({ ...valid, source: { namn: "Bolag AB" } }, today)).toThrow(EvidenceInputError);
    expect(() => validateRecordInput({ ...valid, subjectRef: "" }, today)).toThrow(EvidenceInputError);
  });

  it("nekar ett datum i framtiden (7.3b)", () => {
    expect(() => validateRecordInput({ ...valid, source: { namn: "Bolag AB", hämtad: "2026-10-02" } }, today)).toThrow(
      /framtiden/,
    );
  });

  it("nekar en länk som inte är http(s)", () => {
    expect(() =>
      validateRecordInput({ ...valid, source: { ...valid.source, url: "javascript:alert(1)" } }, today),
    ).toThrow(EvidenceInputError);
  });

  it("nekar Sparks egna källor på ett påstående om en kund (7.12)", () => {
    expect(() => validateRecordInput({ ...valid, source: { namn: "spark:profile", hämtad: "2026-09-01" } }, today)).toThrow(
      /Sparks egna/,
    );
  });

  it("rensar citatet till ren text", () => {
    const result = validateRecordInput({ ...valid, quote: "Ja​, vi\nbetalar" }, today);
    expect(result.quote).toBe("Ja , vi betalar");
  });
});

describe("liveEvidenceRecorder.recordEvidence", () => {
  beforeEach(() => setup());

  it("kastar EmptyStateError utan ett aktivt projekt", async () => {
    fake = makeSupabaseFake({}, evidenceRpcFake(USER, PROJECT));
    await expect(liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("sparar, räknar om poängen direkt och skriver en snapshot med förändring och orsak", async () => {
    const result = await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv");
    expect(result.status).toBe("recorded");
    expect(result.snapshot.total).toBe(3);
    expect(result.snapshot.delta).toBe(2); // från minsta poängen 1
    expect(result.snapshot.deltaReason).toBe("Bevis tillagt: Svar i profilen");
    expect(writeScoreSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER, projectId: PROJECT, total: 3, delta: 2, deltaReason: "recorded:profileFitAnswer" }),
    );
  });

  it("en dubblett ger duplicate, ingen ny rad och ingen snapshot", async () => {
    await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv");
    writeScoreSnapshot.mockClear();
    const second = await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv");
    expect(second.status).toBe("duplicate");
    expect(second.snapshot.delta).toBe(0);
    expect(writeScoreSnapshot).not.toHaveBeenCalled();
    expect(fake.tables.evidence).toHaveLength(1);
  });

  it("skriver ingen snapshot när totalen inte ändras (beslut B8)", async () => {
    // Passform väger 10: fyra svar à 3 fyller delen, det femte ändrar inget.
    for (const q of ["q-1", "q-2", "q-3", "q-4"]) await liveEvidenceRecorder.recordEvidence(fitAnswer(q), "sv");
    writeScoreSnapshot.mockClear();
    const fifth = await liveEvidenceRecorder.recordEvidence(fitAnswer("q-5"), "sv");
    expect(fifth.status).toBe("recorded");
    expect(fifth.snapshot.delta).toBe(0);
    expect(writeScoreSnapshot).not.toHaveBeenCalled();
  });

  it("skriver ett spår i Minnet", async () => {
    await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv");
    expect(fake.tables.trace_events?.[0]).toMatchObject({
      user_id: USER,
      description: "Bevis tillagt: Svar i profilen, Profilsamtalet",
    });
  });

  it("självrapporterade kundsvar lyfter Problem till högst halva vikten (beslut B6)", async () => {
    setup(
      [
        storedEvidenceRow(USER, PROJECT, { kind: "profileFitAnswer" }),
        storedEvidenceRow(USER, PROJECT, { kind: "registerMarketCount" }),
        storedEvidenceRow(USER, PROJECT, { kind: "registerCompetitorSet" }),
        storedEvidenceRow(USER, PROJECT, { kind: "customerPriceAccepted", entered_by: "system" }),
      ],
      [1, 2, 3, 4, 5],
    );
    for (let index = 1; index <= 10; index += 1) {
      await liveEvidenceRecorder.recordEvidence(
        { kind: "customerProblemConfirmed", subjectRef: `bolag-${index}`, source: { namn: `Bolag ${index} AB`, hämtad: "2026-09-01" } },
        "sv",
      );
    }
    const snapshot = await liveEvidenceRepository.getScoreSnapshot("sv");
    expect(snapshot.parts.find((part) => part.name === sv.score.parts.problem)?.points).toBe(9);
    const views = await liveEvidenceRecorder.listEvidence("problem", "sv");
    expect(views.every((view) => view.selfReported)).toBe(true);
    expect(views.some((view) => view.status === "capped")).toBe(true);
  });
});

describe("fel 3: previousTotal efter flera skrivningar (docs/bevislagring.md 3.4)", () => {
  beforeEach(() => setup());

  it("läsningen visar den senaste händelsens förändring, inte 0", async () => {
    await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv"); // 1 → 3
    await liveEvidenceRecorder.recordEvidence(fitAnswer("q-2"), "sv"); // 3 → 6
    const snapshot = await liveEvidenceRepository.getScoreSnapshot("sv");
    expect(snapshot.total).toBe(6);
    expect(snapshot.previousTotal).toBe(3);
    expect(snapshot.delta).toBe(3);
    expect(snapshot.deltaReason).toBe("Bevis tillagt: Svar i profilen");
  });

  it("har totalen ändrats sedan senaste snapshot jämförs mot den, med en förklarad orsak", async () => {
    setup([storedEvidenceRow(USER, PROJECT, { kind: "registerMarketCount", fetched_at: "2024-01-01" })]);
    fake.tables.score_snapshots = [
      { user_id: USER, project_id: PROJECT, total: 5, phase: "discover", delta: 4, delta_reason: "recorded:registerMarketCount", calculated_at: "2024-01-02T00:00:00Z" },
    ];
    // Registerbeviset är äldre än 365 dagar och räknas inte längre.
    const snapshot = await liveEvidenceRepository.getScoreSnapshot("sv");
    expect(snapshot.total).toBe(1);
    expect(snapshot.previousTotal).toBe(5);
    expect(snapshot.deltaReason).toBe(sv.evidence.deltaReason.stale);
    expect(snapshot.emptyParts?.map((part) => part.name)).toContain(sv.score.parts.market);
  });
});

describe("liveEvidenceRecorder.retractEvidence", () => {
  beforeEach(() => setup());

  it("återkallar ett eget bevis, poängen sjunker och beviset ligger kvar märkt", async () => {
    const { evidenceId } = await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv");
    await liveEvidenceRecorder.recordEvidence(fitAnswer("q-2"), "sv");
    const snapshot = await liveEvidenceRecorder.retractEvidence(evidenceId, "Fel svar", "sv");
    expect(snapshot.total).toBe(3);
    expect(snapshot.delta).toBe(-3);
    expect(snapshot.deltaReason).toBe("Bevis återkallat: Svar i profilen");
    const views = await liveEvidenceRecorder.listEvidence("fit", "sv");
    expect(views.find((view) => view.id === evidenceId)).toMatchObject({ status: "retracted", canRetract: false });
  });

  it("ett systembevis kan inte återkallas (7.7)", async () => {
    const system = storedEvidenceRow(USER, PROJECT, { kind: "registerMarketCount" });
    setup([system]);
    await expect(liveEvidenceRecorder.retractEvidence(system.id as string, "vill inte", "sv")).rejects.toBeInstanceOf(
      EvidenceInputError,
    );
  });

  it("kräver en anledning och ett giltigt id", async () => {
    const { evidenceId } = await liveEvidenceRecorder.recordEvidence(fitAnswer("q-1"), "sv");
    await expect(liveEvidenceRecorder.retractEvidence(evidenceId, "   ", "sv")).rejects.toThrow(/anledning/);
    await expect(liveEvidenceRecorder.retractEvidence("inte-ett-id", "x", "sv")).rejects.toThrow(/id/);
  });
});

describe("liveEvidenceRecorder.listEvidence", () => {
  it("visar bara den efterfrågade delens bevis, med källa, märkning och status", async () => {
    setup([
      storedEvidenceRow(USER, PROJECT, { kind: "profileFitAnswer", source_name: "spark:profile" }),
      storedEvidenceRow(USER, PROJECT, { kind: "registerMarketCount", source_name: "SCB", fetched_at: "2024-01-01" }),
    ]);
    const fit = await liveEvidenceRecorder.listEvidence("fit", "sv");
    expect(fit).toHaveLength(1);
    expect(fit[0]).toMatchObject({ kindLabel: "Svar i profilen", source: { namn: "Profilsamtalet" }, selfReported: false, canRetract: true });

    const market = await liveEvidenceRecorder.listEvidence("market", "sv");
    expect(market[0]).toMatchObject({ status: "stale", enteredBy: "system", canRetract: false });
  });
});
