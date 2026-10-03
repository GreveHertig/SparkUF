import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { EVIDENCE_KINDS } from "@/core/evidenceKinds";
import type { MarketOverview } from "@/ports/RegistryProvider";
import type { SystemEvidenceWrite } from "@/lib/server/systemEvidence";

// "Det här är min bransch" (steg 03): registerbevis skrivs av servern med
// service role. I testet hamnar de i samma fejkade tabell som läsvägen läser,
// med samma unika index och samma poäng ur sorten som triggern sätter.

const USER = "00000000-0000-4000-8000-0000000000b1";
const PROJECT = "00000000-0000-4000-8000-0000000000b2";
let fake: ReturnType<typeof makeSupabaseFake>;
let tick = 0;

vi.mock("@/lib/server/session", () => ({
  requireSupabaseUser: async () => ({ supabase: fake, userId: USER }),
}));
const writeScoreSnapshot = vi.fn(async () => {});
vi.mock("@/lib/server/scoreSnapshots", () => ({ writeScoreSnapshot: () => writeScoreSnapshot() }));

const writeSystemEvidence = vi.fn(async (input: SystemEvidenceWrite) => {
  const rows = (fake.tables.evidence ??= []);
  const taken = rows.some(
    (row) => row.project_id === input.projectId && row.kind === input.kind && row.subject_ref === input.subjectRef && row.retracted_at === null,
  );
  if (taken) return "duplicate" as const;
  const spec = EVIDENCE_KINDS[input.kind];
  rows.push({
    id: `00000000-0000-4000-8000-${String(rows.length + 1).padStart(12, "0")}`,
    user_id: input.userId,
    project_id: input.projectId,
    kind: input.kind,
    part_id: spec.partId,
    data_type: spec.dataType,
    contradicts: spec.contradicts,
    points: spec.basePoints,
    entered_by: "system",
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    fetched_at: input.fetchedAt,
    quote: input.quote,
    subject_ref: input.subjectRef,
    created_at: new Date(Date.UTC(2026, 9, 4, 0, 0, tick++)).toISOString(),
    retracted_at: null,
  });
  return "recorded" as const;
});
const retractSystemEvidence = vi.fn(async (input: { evidenceId: string; reason: string }) => {
  const row = fake.tables.evidence?.find((candidate) => candidate.id === input.evidenceId);
  if (row) row.retracted_at = new Date().toISOString();
});
vi.mock("@/lib/server/systemEvidence", () => ({
  writeSystemEvidence: (input: SystemEvidenceWrite) => writeSystemEvidence(input),
  retractSystemEvidence: (input: { evidenceId: string; reason: string }) => retractSystemEvidence(input),
}));

const { recordMarketEvidence, EvidenceInputError } = await import("./EvidenceRecorder");

const today = new Date().toISOString().slice(0, 10);
function overview(companyCount: number, competitors: string[] = []): MarketOverview {
  return {
    companyCount,
    medianRevenueKsek: 0,
    growthSharePercent: 0,
    regionSharePercent: 0,
    source: { namn: "SCB:s företagsregister", hämtad: today, url: "https://www.scb.se/vara-tjanster/foretagsregistret/" },
    competitors: competitors.map((name) => ({ name, description: "Gör något liknande." })),
    basis: { medianRevenueCompanies: 0, growthCompanies: 0, regionCompanies: 0 },
  };
}

function setup(evidence: Record<string, unknown>[] = []) {
  tick = 0;
  writeScoreSnapshot.mockClear();
  writeSystemEvidence.mockClear();
  retractSystemEvidence.mockClear();
  fake = makeSupabaseFake({
    projects: [{ id: PROJECT, user_id: USER, name: "Laddkollen", one_liner: "Laddboxar.", is_active: true }],
    evidence,
  });
}

const active = () => (fake.tables.evidence ?? []).filter((row) => row.retracted_at === null);

describe("recordMarketEvidence", () => {
  beforeEach(() => setup());

  it("sparar antalet som ett systembevis för branschen, med källa, länk och steg 03, och räknar om poängen", async () => {
    const result = await recordMarketEvidence("43.210", overview(4210), "sv");
    expect(result.status).toBe("recorded");
    expect(writeSystemEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: USER,
        projectId: PROJECT,
        kind: "registerMarketCount",
        subjectRef: "sni:43.210",
        sourceName: "SCB:s företagsregister",
        sourceUrl: "https://www.scb.se/vara-tjanster/foretagsregistret/",
        fetchedAt: today,
        quote: "4210",
        module: "Marknad",
        stepNumber: 3,
      }),
    );
    expect(result.snapshot.parts.some((part) => part.points > 0)).toBe(true);
    expect(writeScoreSnapshot).toHaveBeenCalledTimes(1);
  });

  it("konkurrenterna blir ett eget bevis för steg 04, bara när registret har några", async () => {
    await recordMarketEvidence("43.210", overview(4210, ["Elbolaget AB", "Laddtjänst AB"]), "sv");
    expect(active().map((row) => row.kind).sort()).toEqual(["registerCompetitorSet", "registerMarketCount"]);
    expect(active().find((row) => row.kind === "registerCompetitorSet")?.quote).toBe("Elbolaget AB, Laddtjänst AB");
  });

  it("samma bransch två gånger ger duplicate, ingen ny rad och ingen ny snapshot", async () => {
    await recordMarketEvidence("43.210", overview(4210), "sv");
    writeScoreSnapshot.mockClear();
    const again = await recordMarketEvidence("43.210", overview(4210), "sv");
    expect(again.status).toBe("duplicate");
    expect(active()).toHaveLength(1);
    expect(writeScoreSnapshot).not.toHaveBeenCalled();
  });

  it("en ny bransch återkallar den gamla, så att två branscher aldrig räknas samtidigt", async () => {
    await recordMarketEvidence("43.210", overview(4210), "sv");
    await recordMarketEvidence("62.100", overview(31495), "sv");
    expect(retractSystemEvidence).toHaveBeenCalledWith(expect.objectContaining({ reason: expect.stringMatching(/annan bransch/) }));
    expect(active().map((row) => row.subject_ref)).toEqual(["sni:62.100"]);
  });

  it("grundarens egna bevis rörs aldrig av ett branschbyte", async () => {
    setup([
      {
        id: "00000000-0000-4000-8000-0000000000f1",
        user_id: USER,
        project_id: PROJECT,
        kind: "profileFitAnswer",
        part_id: "fit",
        data_type: "customer",
        contradicts: false,
        points: 3,
        entered_by: "founder",
        source_name: "spark:profile",
        source_url: null,
        fetched_at: "2026-10-01",
        quote: null,
        subject_ref: "skills",
        created_at: "2026-10-01T00:00:00Z",
        retracted_at: null,
      },
    ]);
    await recordMarketEvidence("43.210", overview(4210), "sv");
    await recordMarketEvidence("62.100", overview(31495), "sv");
    expect(active().some((row) => row.kind === "profileFitAnswer")).toBe(true);
  });

  it("0 bolag sparar ingenting", async () => {
    const result = await recordMarketEvidence("99.999", overview(0), "sv");
    expect(result.status).toBe("noData");
    expect(writeSystemEvidence).not.toHaveBeenCalled();
    expect(writeScoreSnapshot).not.toHaveBeenCalled();
  });

  it("nekar en ogiltig kod och en källa utan länk, innan något skrivs", async () => {
    await expect(recordMarketEvidence("43210", overview(10), "sv")).rejects.toBeInstanceOf(EvidenceInputError);
    const noUrl = overview(10);
    noUrl.source = { namn: "SCB", hämtad: today };
    await expect(recordMarketEvidence("43.210", noUrl, "sv")).rejects.toBeInstanceOf(EvidenceInputError);
    expect(writeSystemEvidence).not.toHaveBeenCalled();
  });
});
