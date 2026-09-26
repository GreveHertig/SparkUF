import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOUR_STEPS } from "@/adapters/demo/tourSteps";
import { FONDA_DEMO_BASE, FONDA_DEMO_PATHS, toFondaPath } from "./paths";

const demoDir = join(import.meta.dirname, "..");

/** Sidfilen som en av demots rutter motsvarar, med hänsyn till route-grupperna. */
function pageFileFor(path: string): string {
  const rest = path.slice(FONDA_DEMO_BASE.length).replace(/^\//, "");
  if (rest.startsWith("start")) return join(demoDir, rest, "page.tsx");
  if (/^resan\/\d+$/.test(rest)) return join(demoDir, "(app)", "resan", "[steg]", "page.tsx");
  return join(demoDir, "(app)", rest, "page.tsx");
}

describe("demots rutter", () => {
  it("varje rundturstopp pekar på en sida som finns i demot", () => {
    for (const step of TOUR_STEPS) {
      const path = toFondaPath(step.route);
      expect(path.startsWith(FONDA_DEMO_BASE)).toBe(true);
      expect(existsSync(pageFileFor(path)), `${step.id} → ${path}`).toBe(true);
    }
  });

  it("varje menyrutt har en sida", () => {
    for (const path of Object.values(FONDA_DEMO_PATHS)) {
      expect(existsSync(pageFileFor(path)), path).toBe(true);
    }
  });
});
