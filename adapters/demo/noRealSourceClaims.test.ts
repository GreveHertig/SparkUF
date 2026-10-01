import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOUR_STEPS } from "./tourSteps";
import { demoTourCopy } from "@/app/demo/_lib/tourCopy";

// Demots innehåll är påhittat och märkt "Exempel". Texterna får därför inte
// lova en verklig källa: inga "riktiga siffror ur registret", ingen
// medgrundare som "hämtar från Bolagsverket" (pitchsäkringen 2026-10-01).
// Berättelsen om att Sara registrerar sin firma hos Bolagsverket är en
// händelse i scenariot, inte en källa, och omfattas inte.
const ROOT = join(__dirname, "..", "..");
const SCENARIO_FILES = [
  "adapters/demo/sara.ts",
  "adapters/demo/jonas.ts",
  "adapters/demo/cofounderScript.ts",
  "adapters/demo/jonasCofounderScript.ts",
];
const CLAIMS = [
  /ur registret/i,
  /from the registry/i,
  /riktiga siffror/i,
  /real numbers/i,
  /registerbild/i,
  /registry picture/i,
  /registerdata/i,
  /registry data/i,
  /hämtar från Bolagsverket/i,
  /fetching from Bolagsverket/i,
  /Bolagsverkets register/i,
];

describe("demots texter påstår ingen verklig källa", () => {
  it.each(SCENARIO_FILES)("%s", (file) => {
    const source = readFileSync(join(ROOT, file), "utf8");
    expect(CLAIMS.filter((claim) => claim.test(source)).map(String)).toEqual([]);
  });

  it("rundturens texter, som demot visar dem", () => {
    const shown = TOUR_STEPS.flatMap((step) =>
      (["sv", "en"] as const).flatMap((locale) => Object.values(demoTourCopy(step, locale))),
    );
    const offenders = shown.filter((text) => /Bolagsverket|SCB|ur registret|from the registry/.test(text));
    expect(offenders).toEqual([]);
  });
});
