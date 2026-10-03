import { beforeEach, describe, expect, it, vi } from "vitest";
import { EVIDENCE_KINDS, type EvidenceKind } from "@/core/evidenceKinds";
import { NotImplementedError } from "@/core/errors";
import type { BusinessPlan, BusinessPlanSectionId } from "@/core/businessPlan";
import { makeSupabaseFake } from "@/test/stubs/supabaseFake";
import { sv } from "@/i18n/sv";

const requireSupabaseUserMock = vi.fn();
const getOnboardingAnswersMock = vi.fn();
vi.mock("@/lib/server/session", () => ({ requireSupabaseUser: () => requireSupabaseUserMock() }));
vi.mock("@/adapters/live/ProfileRepository", () => ({
  liveProfileRepository: { getOnboardingAnswers: () => getOnboardingAnswersMock() },
}));

const USER_ID = "user-1";
const PROJECT_ID = "proj-1";
const project = { id: PROJECT_ID, user_id: USER_ID, name: "Kvittojakt", one_liner: "Påminnelser till byråers kunder", is_active: true, created_at: "2026-09-20T10:00:00Z" };

/** En rad som databasen skulle ha skrivit den (samma form som i EvidenceRepository.test.ts). */
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
    // Dagens datum, så att inget bevis hinner bli för gammalt i testet.
    fetched_at: new Date().toISOString().slice(0, 10),
    quote: null,
    subject_ref: `ref-${overrides.id}`,
    created_at: `2026-09-01T00:00:${overrides.id.padStart(2, "0")}Z`,
    retracted_at: null,
    ...overrides,
  };
}

async function planFor(tables: Record<string, Record<string, unknown>[]>): Promise<BusinessPlan> {
  requireSupabaseUserMock.mockResolvedValue({ supabase: makeSupabaseFake(tables), userId: USER_ID });
  const { getLiveBusinessPlan } = await import("./businessPlan");
  return getLiveBusinessPlan("sv");
}

const section = (plan: BusinessPlan, id: BusinessPlanSectionId) => plan.sections.find((s) => s.id === id)!;
const allClaims = (plan: BusinessPlan) => plan.sections.flatMap((s) => [...s.claims, ...s.contradictions.flatMap((c) => [c.a, c.b])]);

describe("getLiveBusinessPlan", () => {
  beforeEach(() => {
    requireSupabaseUserMock.mockReset();
    getOnboardingAnswersMock.mockReset();
    getOnboardingAnswersMock.mockResolvedValue({});
  });

  it("ett nytt konto utan projekt: alla nio avsnitt finns, inget påstående hittas på, luckorna pekar på stegen", async () => {
    const plan = await planFor({});
    expect(plan.sections).toHaveLength(9);
    expect(allClaims(plan)).toEqual([]);
    expect(plan.maturity.solidCount).toBe(0);
    expect(section(plan, "idea").gaps).toEqual([{ requiredStepNumber: 2 }]);
    // De låsta delarna räknas av calculateScore även utan projekt.
    expect(section(plan, "risks").lockedParts.length).toBeGreaterThan(0);
  });

  it("projektet blir affärsidén med grundaren som källa och dagen projektet skapades", async () => {
    const plan = await planFor({ projects: [project] });
    const idea = section(plan, "idea");
    expect(idea.status).toBe("solid");
    expect(idea.claims).toEqual([
      {
        text: "Kvittojakt: Påminnelser till byråers kunder",
        source: { namn: sv.businessPlanPage.liveClaims.projectSource, hämtad: "2026-09-20" },
        dataType: "user",
      },
    ]);
  });

  it("onboardingsvaren om kunden blir påståenden i Kunden och problemet; 'Vet inte än' blir inget", async () => {
    getOnboardingAnswersMock.mockResolvedValue({
      customer: { answer: "Redovisningsbyråer i Malmö", answeredOn: "2026-09-21" },
      payer: { answer: "unsure", answeredOn: "2026-09-21" },
    });
    const plan = await planFor({ projects: [project] });
    const claims = section(plan, "customerAndProblem").claims;
    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({
      text: "Redovisningsbyråer i Malmö",
      value: sv.businessPlanPage.liveClaims.targetCustomer,
      source: { namn: sv.evidence.internalSources.profile, hämtad: "2026-09-21" },
      dataType: "user",
    });
  });

  it("onboardingen utan kolumnen än (NotImplementedError) ger inga svar, inget fel", async () => {
    getOnboardingAnswersMock.mockRejectedValue(new NotImplementedError("Profil", "docs/moduler/profil.md"));
    const plan = await planFor({ projects: [project] });
    expect(section(plan, "customerAndProblem").claims).toEqual([]);
  });

  it("bevisen hamnar i rätt avsnitt med sin egen källa; citatet är påståendet", async () => {
    const plan = await planFor({
      projects: [project],
      evidence: [
        evidenceRow({ id: "1", kind: "registerMarketCount", source_name: "Bolagsverket", source_url: "https://bolagsverket.se" }),
        evidenceRow({ id: "2", kind: "customerProblemConfirmed", quote: "Vi jagar kvitton varje månad.", entered_by: "founder" }),
        evidenceRow({ id: "3", kind: "customerPriceDeclined", quote: "För dyrt för oss.", entered_by: "founder" }),
        evidenceRow({ id: "4", kind: "priceDecided", quote: "499 kr/mån", entered_by: "founder" }),
      ],
    });

    const market = section(plan, "market");
    expect(market.claims).toEqual([
      {
        text: sv.evidence.kinds.registerMarketCount,
        source: { namn: "Bolagsverket", hämtad: expect.any(String), url: "https://bolagsverket.se" },
        dataType: "register",
      },
    ]);
    // Intäkten saknas: tunt underlag, och luckan pekar på steg 3.
    expect(market.status).toBe("thin");

    const problem = section(plan, "customerAndProblem").claims;
    expect(problem).toEqual([
      expect.objectContaining({ text: "”Vi jagar kvitton varje månad.”", value: sv.evidence.kinds.customerProblemConfirmed, dataType: "user" }),
    ]);

    // Priset: grundarens beslut (steg 7) och kundens nej (steg 5) står båda kvar.
    expect(section(plan, "offerAndPrice").status).toBe("solid");
    // Kundens nej är motsägande underlag och syns även bland riskerna.
    expect(section(plan, "risks").claims).toEqual([expect.objectContaining({ text: "”För dyrt för oss.”" })]);
    expect(section(plan, "economy").claims).toEqual([expect.objectContaining({ text: "”499 kr/mån”" })]);
  });

  it("återkallade och för gamla bevis tas aldrig med", async () => {
    const plan = await planFor({
      projects: [project],
      evidence: [
        evidenceRow({ id: "1", kind: "registerMarketCount", retracted_at: "2026-09-02T00:00:00Z" }),
        evidenceRow({ id: "2", kind: "registerCompetitorSet", fetched_at: "2020-01-01" }),
      ],
    });
    expect(section(plan, "market").claims).toEqual([]);
    expect(section(plan, "competition").claims).toEqual([]);
  });

  it("domen och bygget har ingen liveadapter: Beviset är alltid en lucka, aldrig exempeldata", async () => {
    const plan = await planFor({ projects: [project] });
    expect(section(plan, "evidence")).toMatchObject({ status: "missing", claims: [], gaps: [{ requiredStepNumber: 6 }] });
    for (const claim of allClaims(plan)) expect(claim.dataType).not.toBe("example");
  });
});
