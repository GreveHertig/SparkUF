import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateScore, ALL_PART_IDS, type EvidenceItem, type PartEvidence } from "@/core/score";
import { EVIDENCE_KINDS, type EvidenceKind } from "@/core/evidenceKinds";
import { EvidenceIntegrityError } from "@/core/evidenceInput";
import { EmptyStateError } from "@/core/errors";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { sv } from "@/i18n/sv";

const requireSupabaseUserMock = vi.fn();
vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: () => requireSupabaseUserMock(),
}));

const USER_ID = "user-1";
const PROJECT_ID = "proj-1";

function projectFixture() {
  return [{ id: PROJECT_ID, user_id: USER_ID, name: "Test", one_liner: "En testidé.", is_active: true }];
}

/** En rad som databasen skulle ha skrivit den: del, datatyp, motsäger och
 * poäng ur sorten (supabase/migrations/20261001120000_evidence_write_path.sql). */
function evidenceRow(overrides: Partial<Record<string, unknown>> & { id: string; kind: EvidenceKind }) {
  const spec = EVIDENCE_KINDS[overrides.kind];
  return {
    user_id: USER_ID,
    project_id: PROJECT_ID,
    part_id: spec.partId,
    points: spec.basePoints,
    contradicts: spec.contradicts,
    data_type: spec.dataType,
    entered_by: "system",
    source_name: "Testkälla",
    source_url: null,
    fetched_at: "2026-09-01",
    quote: null,
    created_at: `2026-09-01T00:00:${overrides.id.padStart(2, "0")}Z`,
    retracted_at: null,
    ...overrides,
  };
}

function completedSteps(...steps: number[]) {
  return steps.map((n) => ({ user_id: USER_ID, project_id: PROJECT_ID, step_number: n, completed_at: "2026-09-01T00:00:00Z" }));
}

async function snapshotFor(tables: Record<string, Record<string, unknown>[]>) {
  requireSupabaseUserMock.mockResolvedValue({
    supabase: makeSupabaseFake({ projects: projectFixture(), ...tables }),
    userId: USER_ID,
  });
  const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
  return liveEvidenceRepository.getScoreSnapshot("sv");
}

describe("liveEvidenceRepository.getScoreSnapshot", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("kastar EmptyStateError utan ett aktivt projekt", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    await expect(liveEvidenceRepository.getScoreSnapshot("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("kastar EmptyStateError utan några bevis (ett nytt konto)", async () => {
    await expect(snapshotFor({})).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("räknar ALDRIG poäng själv — identiskt med ett direkt calculateScore-anrop på samma underlag", async () => {
    const evidenceRows = [
      evidenceRow({ id: "1", kind: "profileFitAnswer", entered_by: "founder" }),
      evidenceRow({ id: "2", kind: "registerMarketCount", source_name: "Bolagsverket", source_url: "https://bolagsverket.se" }),
    ];
    const result = await snapshotFor({ evidence: evidenceRows });

    const labels = sv.score.parts;
    const expectedParts: PartEvidence[] = ALL_PART_IDS.map((partId) => ({
      partId,
      label: labels[partId],
      items: evidenceRows
        .filter((row) => row.part_id === partId)
        .map(
          (row): EvidenceItem => ({
            points: row.points as number,
            contradicts: row.contradicts as boolean,
            dataType: row.data_type as EvidenceItem["dataType"],
            source: { namn: row.source_name as string, hämtad: row.fetched_at as string, url: (row.source_url as string | null) ?? undefined },
          }),
        ),
    }));
    // discover-fasen (inga avklarade steg): bara fit+market upplåsta.
    const expected = calculateScore({ phase: "discover", parts: expectedParts, calculatedAtIso: result.calculatedAtIso });

    expect(result).toEqual(expected);
  });

  it("en rad som inte stämmer med sin sort (till exempel en simulering) räknas aldrig — läsningen avvisar den", async () => {
    // Databasen tillåter inte raden (evidence_not_simulation och triggern).
    // Om den ändå fanns har någon skrivit förbi skrivvägen.
    await expect(
      snapshotFor({ evidence: [evidenceRow({ id: "1", kind: "profileFitAnswer", points: 999, data_type: "simulation" })] }),
    ).rejects.toBeInstanceOf(EvidenceIntegrityError);
  });

  it("motsägande bevis sänker delens poäng jämfört med ett samstämmigt — räknat av calculateScore", async () => {
    const base = [
      evidenceRow({ id: "1", kind: "profileFitAnswer", entered_by: "founder" }),
      evidenceRow({ id: "2", kind: "registerMarketCount" }),
      evidenceRow({ id: "3", kind: "registerCompetitorSet" }),
      evidenceRow({ id: "4", kind: "customerProblemConfirmed", subject_ref: "a" }),
      evidenceRow({ id: "5", kind: "customerPriceAccepted", subject_ref: "a" }),
      evidenceRow({ id: "6", kind: "customerPriceAccepted", subject_ref: "b" }),
    ];
    const steps = completedSteps(1, 2, 3, 4, 5);
    const agreeing = await snapshotFor({ evidence: [...base, evidenceRow({ id: "7", kind: "customerPriceAccepted", subject_ref: "c" })], journey_steps: steps });
    const contradicting = await snapshotFor({ evidence: [...base, evidenceRow({ id: "7", kind: "customerPriceDeclined", subject_ref: "c" })], journey_steps: steps });
    const points = (snapshot: typeof agreeing) =>
      snapshot.parts.find((p) => p.name === sv.score.parts.willingnessToPay)?.points ?? 0;
    expect(points(contradicting)).toBeLessThan(points(agreeing));
  });

  it("hämtar bevisen i kronologisk ordning (created_at), inte i svarets godtyckliga radordning", async () => {
    // Array-ordningen nedan är AVSIKTLIGT omvänd mot created_at.
    // core/score.ts's scorePart tar källan ur det SISTA elementet i items —
    // bara rätt om ordningen stämmer.
    const result = await snapshotFor({
      evidence: [
        { ...evidenceRow({ id: "2", kind: "profileFitAnswer", source_name: "Senaste källan" }), entered_by: "founder", created_at: "2026-09-05T00:00:00Z" },
        { ...evidenceRow({ id: "1", kind: "profileFitAnswer", source_name: "Äldsta källan" }), entered_by: "founder", created_at: "2026-09-01T00:00:00Z" },
        evidenceRow({ id: "3", kind: "registerMarketCount", source_name: "Bolagsverket" }),
      ],
    });
    const fitPart = result.parts.find((p) => p.name === sv.score.parts.fit);
    expect(fitPart?.source.namn).toBe("Senaste källan");
  });

  it("härleder fasen ur avklarade steg (journey_steps.completed_at), inte ur ett hårdkodat värde", async () => {
    // Steg 1-5 avklarade -> fasen tryAfterCalls, som låser upp
    // fit/market/competition/problem/willingnessToPay (core/score.ts).
    const result = await snapshotFor({
      evidence: [
        evidenceRow({ id: "1", kind: "profileFitAnswer", entered_by: "founder" }),
        evidenceRow({ id: "2", kind: "registerMarketCount" }),
        evidenceRow({ id: "3", kind: "registerCompetitorSet" }),
        evidenceRow({ id: "4", kind: "customerProblemConfirmed" }),
        evidenceRow({ id: "5", kind: "customerPriceAccepted" }),
      ],
      journey_steps: completedSteps(1, 2, 3, 4, 5),
    });
    const unlockedNames = result.parts.map((p) => p.name);
    expect(unlockedNames).toContain(sv.score.parts.problem);
    expect(unlockedNames).toContain(sv.score.parts.willingnessToPay);
    expect(result.lockedParts.map((p) => p.name)).toContain(sv.score.parts.product);
  });

  it("fel 4: Problem är låst medan steg 05 pågår — \"Låses upp efter steg 05\" gäller", async () => {
    const result = await snapshotFor({
      evidence: [evidenceRow({ id: "1", kind: "profileFitAnswer", entered_by: "founder" }), evidenceRow({ id: "2", kind: "registerMarketCount" })],
      journey_steps: completedSteps(1, 2, 3, 4),
    });
    expect(result.lockedParts).toContainEqual({ name: sv.score.parts.problem, unlocksAfterStep: 5 });
  });

  it("fel 2 (beslut B4): en upplåst del utan bevis kraschar inte, den visas som en lucka", async () => {
    // Steg 1-5 klara låser upp Problem och Betalningsvilja, men inga kundsvar finns.
    const result = await snapshotFor({
      evidence: [
        evidenceRow({ id: "1", kind: "profileFitAnswer", entered_by: "founder" }),
        evidenceRow({ id: "2", kind: "registerMarketCount" }),
      ],
      journey_steps: completedSteps(1, 2, 3, 4, 5),
    });
    expect(result.emptyParts?.map((p) => p.name)).toEqual([
      sv.score.parts.competition,
      sv.score.parts.problem,
      sv.score.parts.willingnessToPay,
    ]);
    expect(result.parts.map((p) => p.name)).not.toContain(sv.score.parts.problem);
  });

  it("återkallade och för gamla bevis räknas inte", async () => {
    const result = await snapshotFor({
      evidence: [
        evidenceRow({ id: "1", kind: "profileFitAnswer", entered_by: "founder" }),
        evidenceRow({ id: "2", kind: "profileFitAnswer", entered_by: "founder", subject_ref: "q2", retracted_at: "2026-09-02T00:00:00Z" }),
        evidenceRow({ id: "3", kind: "registerMarketCount", fetched_at: "2020-01-01" }),
      ],
    });
    expect(result.parts.find((p) => p.name === sv.score.parts.fit)?.points).toBe(3);
    expect(result.emptyParts?.map((p) => p.name)).toEqual([sv.score.parts.market]);
  });
});

describe("liveEvidenceRepository.getScoreHistory", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("returnerar en tom lista utan ett aktivt projekt — aldrig en påhittad punkt", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    expect(await liveEvidenceRepository.getScoreHistory("sv")).toEqual([]);
  });

  it("returnerar totalpoängen i kronologisk ordning", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({
        projects: projectFixture(),
        score_snapshots: [
          { user_id: USER_ID, project_id: PROJECT_ID, total: 40, calculated_at: "2026-09-03T00:00:00Z" },
          { user_id: USER_ID, project_id: PROJECT_ID, total: 20, calculated_at: "2026-09-01T00:00:00Z" },
          { user_id: USER_ID, project_id: PROJECT_ID, total: 30, calculated_at: "2026-09-02T00:00:00Z" },
        ],
      }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    expect(await liveEvidenceRepository.getScoreHistory("sv")).toEqual([20, 30, 40]);
  });
});

describe("liveEvidenceRepository.getSuggestions", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
  });

  it("kastar EmptyStateError utan ett aktivt projekt", async () => {
    requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake({}), userId: USER_ID });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    await expect(liveEvidenceRepository.getSuggestions("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("returnerar en tom lista (inget skrivet förslagsinnehåll än, se docs/moduler/evidens-och-poang.md)", async () => {
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture() }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    expect(await liveEvidenceRepository.getSuggestions("sv")).toEqual([]);
  });
});
