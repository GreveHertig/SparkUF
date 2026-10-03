import { describe, expect, it } from "vitest";
import type { PulseSignal } from "@/core/domain";
import { pickWeekPulse } from "./weekPulse";

const signal = (headline: string, hämtad: string, extra: Partial<PulseSignal> = {}): PulseSignal => ({
  headline,
  category: "",
  whyItMatters: "",
  timestamp: "",
  source: { namn: "a.se", hämtad },
  ...extra,
});

describe("pickWeekPulse", () => {
  it("risker och möjligheter först, bara den senaste veckan, högst två", () => {
    const picked = pickWeekPulse(
      [
        signal("Nyhet", "2026-10-03"),
        signal("Gammal risk", "2026-09-20", { risk: { area: "costs", actions: [] } }),
        signal("Möjlighet", "2026-10-02", { opportunity: { area: "funding", actions: [] } }),
        signal("Risk", "2026-10-04", { risk: { area: "finance", actions: [] } }),
      ],
      "2026-10-04",
    );
    expect(picked.map((item) => item.headline)).toEqual(["Möjlighet", "Risk"]);
  });

  it("bara nyheter, eller inget alls, går också", () => {
    expect(pickWeekPulse([signal("Nyhet", "2026-10-03")], "2026-10-04").map((item) => item.headline)).toEqual(["Nyhet"]);
    expect(pickWeekPulse([], "2026-10-04")).toEqual([]);
  });
});
