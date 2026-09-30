import { beforeEach, describe, expect, it } from "vitest";
import { useDemoStore } from "./demoStore";
import { saraEngine } from "./sara";
import { jonasBeats } from "./jonas";
import { getBusinessPlan } from "./businessPlan";
import { demoJourneyRepository } from "./JourneyRepository";
import { demoEvidenceRepository } from "./EvidenceRepository";
import { demoProjectRepository } from "./ProjectRepository";
import { demoRegistryProvider } from "./RegistryProvider";
import type { BusinessPlan, BusinessPlanClaim } from "@/core/businessPlan";

function allClaims(plan: BusinessPlan): BusinessPlanClaim[] {
  return plan.sections.flatMap((section) => [
    ...section.claims,
    ...section.contradictions.flatMap((contradiction) => [contradiction.a, contradiction.b]),
  ]);
}

/** Texter som saknar egen källa i sina portar och därför aldrig får bli påståenden (PR 10). */
async function unsourcedTexts(): Promise<Set<string>> {
  const texts = new Set<string>();
  for (let step = 1; step <= 12; step++) {
    const detail = await demoJourneyRepository.getStepDetail(step, "sv");
    detail?.highlights.forEach((text) => texts.add(text));
  }
  (await demoEvidenceRepository.getSuggestions("sv")).forEach((s) => texts.add(s.explanation));
  return texts;
}

beforeEach(() => {
  useDemoStore.setState({ beatIndex: 0, entry: "noIdea" });
});

describe("demots affärsplan: källregeln (PR 10)", () => {
  for (const scenario of [
    { entry: "noIdea" as const, beats: saraEngine.beats.length },
    { entry: "hasIdea" as const, beats: jonasBeats.length },
  ]) {
    it(`${scenario.entry}: ingen höjdpunkt eller förslagstext visas med en lånad källa, i något moment`, async () => {
      useDemoStore.setState({ entry: scenario.entry });
      const borrowed: string[] = [];
      for (let beat = 0; beat < scenario.beats; beat++) {
        useDemoStore.setState({ beatIndex: beat });
        const forbidden = await unsourcedTexts();
        for (const claim of allClaims(await getBusinessPlan("sv"))) {
          if (forbidden.has(claim.text)) borrowed.push(`beat ${beat}: ${claim.text}`);
        }
      }
      expect(borrowed).toEqual([]);
    });
  }

  it("Jonas antaganden och den skarpare idéns motivering visas inte med registrets källa", async () => {
    useDemoStore.setState({ entry: "hasIdea", beatIndex: jonasBeats.length - 1 });
    const screening = await demoProjectRepository.getIdeaScreening("sv");
    const texts = allClaims(await getBusinessPlan("sv")).map((claim) => claim.text);
    for (const assumption of screening.assumptions) expect(texts).not.toContain(assumption.text);
    expect(texts).not.toContain(screening.sharperIdea.why);
    // Registerfakta med egen källa står kvar.
    expect(texts).toContain(screening.registerFacts[0].label);
  });

  it("konkurrenternas beskrivningar visas inte med registrets källa", async () => {
    useDemoStore.setState({ entry: "noIdea", beatIndex: saraEngine.beats.length - 1 });
    const market = await demoRegistryProvider.getMarketOverview("sv");
    const texts = allClaims(await getBusinessPlan("sv")).map((claim) => claim.text);
    for (const competitor of market.competitors) expect(texts).not.toContain(competitor.description);
    const competition = (await getBusinessPlan("sv")).sections.find((s) => s.id === "competition")!;
    expect(competition.status).toBe("missing");
  });

  it("andelarna bär %, och urvalet anger varje andels underlag av helheten", async () => {
    useDemoStore.setState({ entry: "noIdea", beatIndex: saraEngine.beats.length - 1 });
    const market = (await getBusinessPlan("sv")).sections.find((s) => s.id === "market")!;
    const values = market.claims.map((claim) => claim.value);
    expect(values).toContain("18 %");
    expect(values).toContain("31 %");
    expect(values).toContain("tillväxt: 171 av 312, region: 308 av 312");
    expect(values).not.toContain("171/308");

    const en = (await getBusinessPlan("en")).sections.find((s) => s.id === "market")!;
    expect(en.claims.map((claim) => claim.value)).toContain("growth: 171 of 312, region: 308 of 312");
  });
});
