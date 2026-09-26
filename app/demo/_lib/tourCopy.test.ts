import { describe, expect, it } from "vitest";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { FONDA_TOUR_BODIES, FONDA_TOUR_TITLES, fondaTourCopy } from "./tourCopy";

const ids = new Set(TOUR_STEPS.map((step) => step.id));

describe("demots rubriker på rundturen", () => {
  it("behåller originalets rubrik på stopp 1 och har egna på de övriga 19", () => {
    expect(fondaTourCopy(TOUR_STEPS[0], "sv").title).toBe("Välkommen till Spark");
    expect(fondaTourCopy(TOUR_STEPS[0], "en").title).toBe("Welcome to Spark");
    for (const step of TOUR_STEPS.slice(1)) expect(FONDA_TOUR_TITLES[step.id]).toBeDefined();
  });

  it("pekar bara på stopp som finns", () => {
    for (const id of [...Object.keys(FONDA_TOUR_TITLES), ...Object.keys(FONDA_TOUR_BODIES)]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("håller rubrikerna korta och utan förbjudna ord eller tankstreck", () => {
    for (const copy of Object.values(FONDA_TOUR_TITLES)) {
      // Cirka sex ord; engelskan blir några ord längre av "out of" och "the".
      expect(copy.sv.split(/\s+/).length).toBeLessThanOrEqual(7);
      expect(copy.en.split(/\s+/).length).toBeLessThanOrEqual(9);
      for (const text of [copy.sv, copy.en]) {
        expect(text).not.toMatch(/resa|journey|magi|magic|superkraft|superpower|—|–/i);
      }
    }
  });

  it("använder originalets brödtext där demot inte har en egen", () => {
    const step = TOUR_STEPS.find((s) => s.id === "domen")!;
    expect(fondaTourCopy(step, "sv").body).toBe(step.body.sv);
    const replies = TOUR_STEPS.find((s) => s.id === "svarsdata-forsvarsvall")!;
    expect(fondaTourCopy(replies, "sv").body).not.toContain("4 %");
  });
});
