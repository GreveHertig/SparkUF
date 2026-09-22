import { describe, it, expect } from "vitest";
import { demoSimulationProvider } from "./SimulationProvider";
import { simulationQuestions } from "./SimulationProvider";

// Bugg fixad den här sessionen (poleringssessionen, docs/status.md):
// `kindFor` matchade tidigare den engelska toleransfrågan ("... willing to
// pay?") mot en regex som bara kände igen "betal"/"willingness"/"tolerance"
// — ingen av dem finns i den engelska frågan, så svaret föll tyst igenom
// till "time"-simuleringens innehåll (timmar/kvitton) under toleransfrågans
// egen rubrik. De här testerna bevisar att alla tre kanoniska simuleringar
// ger samma SORTS innehåll (samma populationsstorlek, samma frågetema) på
// båda språken — inte bara att strukturen (`populationSize`/`source`/
// `uncertaintyRangeLabel`) finns.
describe("demoSimulationProvider (avsnitt 2.2)", () => {
  const kinds = ["time", "tolerance", "price"] as const;

  for (const kind of kinds) {
    it(`"${kind}"-simuleringen ger samma population och källdatum på sv och en`, async () => {
      const sv = await demoSimulationProvider.simulate(simulationQuestions[kind].sv, "sv");
      const en = await demoSimulationProvider.simulate(simulationQuestions[kind].en, "en");

      expect(en.populationSize).toBe(sv.populationSize);
      expect(en.source.hämtad).toBe(sv.source.hämtad);
      expect(en.question).toBe(simulationQuestions[kind].en);
      expect(sv.question).toBe(simulationQuestions[kind].sv);
    });
  }

  it("toleransfrågan (kr/mån) ger inte tidssimuleringens innehåll (timmar) på engelska", async () => {
    const result = await demoSimulationProvider.simulate(simulationQuestions.tolerance.en, "en");
    expect(result.result).not.toMatch(/hours?/i);
    expect(result.result).toMatch(/SEK|month/i);
  });

  it("prisfrågan ger inte tidssimuleringens innehåll (timmar) på engelska", async () => {
    const result = await demoSimulationProvider.simulate(simulationQuestions.price.en, "en");
    expect(result.result).not.toMatch(/hours?/i);
  });
});
