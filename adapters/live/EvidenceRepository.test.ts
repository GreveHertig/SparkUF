import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateScore, ALL_PART_IDS, type EvidenceItem, type PartEvidence } from "@/core/score";
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

function evidenceRow(overrides: Partial<Record<string, unknown>> & { id: string; part_id: string; points: number }) {
  return {
    user_id: USER_ID,
    project_id: PROJECT_ID,
    contradicts: false,
    data_type: "customer",
    source_name: "Kundintervju",
    source_url: null,
    fetched_at: "2026-09-01",
    created_at: `2026-09-01T00:00:${overrides.id.padStart(2, "0")}Z`,
    ...overrides,
  };
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
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture() }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    await expect(liveEvidenceRepository.getScoreSnapshot("sv")).rejects.toBeInstanceOf(EmptyStateError);
  });

  it("räknar ALDRIG poäng själv — identiskt med ett direkt calculateScore-anrop på samma underlag", async () => {
    const evidenceRows = [
      evidenceRow({ id: "1", part_id: "fit", points: 5 }),
      evidenceRow({
        id: "2",
        part_id: "market",
        points: 6,
        data_type: "register",
        source_name: "Bolagsverket",
        source_url: "https://bolagsverket.se",
      }),
    ];
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture(), evidence: evidenceRows }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    const result = await liveEvidenceRepository.getScoreSnapshot("sv");

    const labels = sv.score.parts;
    const expectedParts: PartEvidence[] = ALL_PART_IDS.map((partId) => ({
      partId,
      label: labels[partId],
      items: evidenceRows
        .filter((row) => row.part_id === partId)
        .map(
          (row): EvidenceItem => ({
            points: row.points,
            contradicts: row.contradicts,
            dataType: row.data_type as EvidenceItem["dataType"],
            source: { namn: row.source_name, hämtad: row.fetched_at, url: row.source_url ?? undefined },
          }),
        ),
    }));
    // discover-fasen (inga avklarade steg): bara fit+market upplåsta.
    const expected = calculateScore({ phase: "discover", parts: expectedParts, calculatedAtIso: result.calculatedAtIso });

    expect(result).toEqual(expected);
  });

  it("simuleringsbevis ger 0 poäng (7.4) — beräknat av calculateScore, inte adaptern", async () => {
    const evidenceRows = [
      evidenceRow({ id: "1", part_id: "fit", points: 999, data_type: "simulation", source_name: "Hiasynth" }),
      evidenceRow({ id: "2", part_id: "market", points: 6, data_type: "register", source_name: "Bolagsverket" }),
    ];
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture(), evidence: evidenceRows }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    const result = await liveEvidenceRepository.getScoreSnapshot("sv");
    const fitPart = result.parts.find((p) => p.name === sv.score.parts.fit);
    expect(fitPart?.points).toBe(0);
  });

  it("motsägande bevis (negativa poäng) sänker delens poäng, sänker inte adaptern", async () => {
    const evidenceRows = [
      evidenceRow({ id: "1", part_id: "fit", points: 8 }),
      evidenceRow({ id: "2", part_id: "fit", points: -4, contradicts: true }),
      evidenceRow({ id: "3", part_id: "market", points: 6, data_type: "register", source_name: "Bolagsverket" }),
    ];
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture(), evidence: evidenceRows }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    const result = await liveEvidenceRepository.getScoreSnapshot("sv");
    const fitPart = result.parts.find((p) => p.name === sv.score.parts.fit);
    expect(fitPart?.points).toBeLessThan(8);
  });

  it("hämtar bevisen i kronologisk ordning (created_at), inte i svarets godtyckliga radordning", async () => {
    // Array-ordningen nedan är AVSIKTLIGT omvänd mot created_at, för att
    // avslöja om adaptern skulle glömma .order("created_at") och råka lita
    // på svarets egen ordning i stället. core/score.ts's scorePart tar
    // källan ur det SISTA elementet i items — bara rätt om ordern stämmer.
    const evidenceRows = [
      { ...evidenceRow({ id: "2", part_id: "fit", points: 5, source_name: "Senaste källan" }), created_at: "2026-09-05T00:00:00Z" },
      { ...evidenceRow({ id: "1", part_id: "fit", points: 5, source_name: "Äldsta källan" }), created_at: "2026-09-01T00:00:00Z" },
      evidenceRow({ id: "3", part_id: "market", points: 6, data_type: "register", source_name: "Bolagsverket" }),
    ];
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture(), evidence: evidenceRows }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    const result = await liveEvidenceRepository.getScoreSnapshot("sv");
    const fitPart = result.parts.find((p) => p.name === sv.score.parts.fit);
    expect(fitPart?.source.namn).toBe("Senaste källan");
  });

  it("härleder fasen ur avklarade steg (journey_steps.completed_at), inte ur ett hårdkodat värde", async () => {
    // Steg 1-5 avklarade -> aktuellt steg 6 -> fasen tryAfterCalls, som låser
    // upp fit/market/competition/problem/willingnessToPay (core/score.ts).
    const journeySteps = [1, 2, 3, 4, 5].map((n) => ({
      user_id: USER_ID,
      project_id: PROJECT_ID,
      step_number: n,
      completed_at: "2026-09-01T00:00:00Z",
    }));
    const evidenceRows = [
      evidenceRow({ id: "1", part_id: "fit", points: 5 }),
      evidenceRow({ id: "2", part_id: "market", points: 5, data_type: "register", source_name: "Bolagsverket" }),
      evidenceRow({ id: "3", part_id: "competition", points: 4, data_type: "register", source_name: "Bolagsverket" }),
      evidenceRow({ id: "4", part_id: "problem", points: 6 }),
      evidenceRow({ id: "5", part_id: "willingnessToPay", points: 6 }),
    ];
    requireSupabaseUserMock.mockResolvedValue({
      supabase: makeSupabaseFake({ projects: projectFixture(), evidence: evidenceRows, journey_steps: journeySteps }),
      userId: USER_ID,
    });
    const { liveEvidenceRepository } = await import("@/adapters/live/EvidenceRepository");
    const result = await liveEvidenceRepository.getScoreSnapshot("sv");
    const unlockedNames = result.parts.map((p) => p.name);
    expect(unlockedNames).toContain(sv.score.parts.problem);
    expect(unlockedNames).toContain(sv.score.parts.willingnessToPay);
    expect(result.lockedParts.map((p) => p.name)).toContain(sv.score.parts.product);
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
