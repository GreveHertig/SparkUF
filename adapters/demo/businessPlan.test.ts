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

/** Texter som saknar egen källa i sina portar: de får bara visas som
 * exempeldata med en exempelkälla (PR 11), aldrig med en lånad (PR 10). */
async function exampleTexts(): Promise<Set<string>> {
  const texts = new Set<string>();
  for (let step = 1; step <= 12; step++) {
    const detail = await demoJourneyRepository.getStepDetail(step, "sv");
    detail?.highlights.forEach((text) => texts.add(text));
    if (detail?.verdict) texts.add(detail.verdict.reasoning);
  }
  (await demoEvidenceRepository.getSuggestions("sv")).forEach((s) => texts.add(s.explanation));
  return texts;
}

/** Alla källor som hör till något annat än exempeldatan: registrets och poängdelarnas. */
async function borrowableSourceNames(entry: "noIdea" | "hasIdea"): Promise<Set<string>> {
  const names = new Set<string>();
  const snapshot = await demoEvidenceRepository.getScoreSnapshot("sv");
  snapshot.parts.forEach((part) => names.add(part.source.namn));
  if (entry === "noIdea") names.add((await demoRegistryProvider.getMarketOverview("sv")).source.namn);
  else (await demoProjectRepository.getIdeaScreening("sv")).registerFacts.forEach((fact) => names.add(fact.source.namn));
  return names;
}

const EXAMPLE_SOURCE = /^Påhittad data, /;

beforeEach(() => {
  useDemoStore.setState({ beatIndex: 0, entry: "noIdea" });
});

describe("demots affärsplan: källregeln (PR 10 och 11)", () => {
  for (const scenario of [
    { entry: "noIdea" as const, beats: saraEngine.beats.length },
    { entry: "hasIdea" as const, beats: jonasBeats.length },
  ]) {
    it(`${scenario.entry}: höjdpunkter, domar och förslagstexter visas bara som exempel med exempelkälla, i varje moment`, async () => {
      useDemoStore.setState({ entry: scenario.entry });
      const wrong: string[] = [];
      for (let beat = 0; beat < scenario.beats; beat++) {
        useDemoStore.setState({ beatIndex: beat });
        const examples = await exampleTexts();
        for (const claim of allClaims(await getBusinessPlan("sv"))) {
          if (examples.has(claim.text) && (claim.dataType !== "example" || !EXAMPLE_SOURCE.test(claim.source.namn))) {
            wrong.push(`beat ${beat}: ${claim.text} (${claim.dataType}, ${claim.source.namn})`);
          }
        }
      }
      expect(wrong).toEqual([]);
    });

    it(`${scenario.entry}: ett exempel lånar aldrig registrets eller en poängdels källa, och en exempelkälla bär aldrig en annan datatyp`, async () => {
      useDemoStore.setState({ entry: scenario.entry });
      const wrong: string[] = [];
      for (let beat = 0; beat < scenario.beats; beat++) {
        useDemoStore.setState({ beatIndex: beat });
        const borrowable = await borrowableSourceNames(scenario.entry);
        for (const claim of allClaims(await getBusinessPlan("sv"))) {
          if (claim.dataType === "example" && borrowable.has(claim.source.namn)) wrong.push(`beat ${beat}: ${claim.text}`);
          if (claim.dataType === "example" && !EXAMPLE_SOURCE.test(claim.source.namn)) wrong.push(`beat ${beat}: ${claim.source.namn}`);
          if (claim.dataType !== "example" && EXAMPLE_SOURCE.test(claim.source.namn)) wrong.push(`beat ${beat}: ${claim.text}`);
        }
      }
      expect(wrong).toEqual([]);
    });
  }

  it("färdighetsgraden är tillbaka: Sara 8/9 och Jonas 4/9 i sista momentet", async () => {
    useDemoStore.setState({ entry: "noIdea", beatIndex: saraEngine.beats.length - 1 });
    expect((await getBusinessPlan("sv")).maturity.solidCount).toBe(8);
    useDemoStore.setState({ entry: "hasIdea", beatIndex: jonasBeats.length - 1 });
    expect((await getBusinessPlan("sv")).maturity.solidCount).toBe(4);
  });

  it("Jonas antaganden och den skarpare idéns motivering är exempel från idégenomlysningen", async () => {
    useDemoStore.setState({ entry: "hasIdea", beatIndex: jonasBeats.length - 1 });
    const screening = await demoProjectRepository.getIdeaScreening("sv");
    const claims = allClaims(await getBusinessPlan("sv"));
    const byText = (text: string) => claims.find((claim) => claim.text === text);
    for (const text of [...screening.assumptions.map((a) => a.text), screening.sharperIdea.why]) {
      expect(byText(text)?.dataType).toBe("example");
      expect(byText(text)?.source.namn).toBe("Påhittad data, idégenomlysningen");
    }
    // Registerfakta står kvar med sin egen källa.
    expect(byText(screening.registerFacts[0].label)?.source).toEqual(screening.registerFacts[0].source);
  });

  it("konkurrenternas beskrivningar är exempel från steg 03, aldrig registrets", async () => {
    useDemoStore.setState({ entry: "noIdea", beatIndex: saraEngine.beats.length - 1 });
    const market = await demoRegistryProvider.getMarketOverview("sv");
    const competition = (await getBusinessPlan("sv")).sections.find((s) => s.id === "competition")!;
    expect(competition.claims.map((claim) => claim.text)).toEqual(market.competitors.map((c) => c.description));
    for (const claim of competition.claims) {
      expect(claim.dataType).toBe("example");
      expect(claim.source.namn).toBe("Påhittad data, steg 03");
      expect(claim.source.namn).not.toBe(market.source.namn);
    }
  });

  it("exempelkällan är på engelska i den engelska planen", async () => {
    useDemoStore.setState({ entry: "noIdea", beatIndex: saraEngine.beats.length - 1 });
    const names = allClaims(await getBusinessPlan("en"))
      .filter((claim) => claim.dataType === "example")
      .map((claim) => claim.source.namn);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name).toMatch(/^Made-up data, /);
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
