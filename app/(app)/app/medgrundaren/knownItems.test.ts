import { describe, expect, it } from "vitest";
import { toKnownItems } from "./knownItems";

const NOW = new Date("2026-10-03T10:00:00Z");

describe("toKnownItems", () => {
  it("en rad per känd del, i ordning, med etikett ur i18n", () => {
    const items = toKnownItems(
      {
        step: null,
        project: { id: "p", name: "Cykelhjälpen", oneLiner: "Lagar cyklar på skolan." },
        profile: { role: "Elev", risk: "Låg" },
        brainNotes: "Gillar att skruva.",
        trace: null,
      },
      "sv",
      NOW,
    );
    expect(items.map((item) => item.text)).toEqual([
      "Idé: Cykelhjälpen. Lagar cyklar på skolan.",
      "Roll: Elev",
      "Risk: Låg",
      "Hjärnan: Gillar att skruva.",
    ]);
    expect(items.every((item) => item.source === undefined)).toBe(true);
  });

  it("en siffra får grundarens egen uppgift som källa", () => {
    const [time] = toKnownItems(
      { step: null, project: null, profile: { time: "10 timmar i veckan" }, brainNotes: null, trace: null },
      "sv",
      NOW,
    );
    expect(time.source).toEqual({ source: { namn: "Profilsamtalet", hämtad: "2026-10-03" }, dataType: "user" });
  });

  it("de tre senaste posterna i Spåret, senast först, med postens datum", () => {
    const trace = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      timestampIso: `2026-10-0${i + 1}T08:00:00Z`,
      description: `Post ${i}`,
    }));
    const items = toKnownItems({ step: null, project: null, profile: null, brainNotes: null, trace }, "en", NOW);
    expect(items.map((item) => item.text)).toEqual(["Trace: Post 4", "Trace: Post 3", "Trace: Post 2"]);
    expect(items[0].source).toEqual({ source: { namn: "Trace", hämtad: "2026-10-05" }, dataType: "user" });
  });

  it("långa texter kortas till en rad", () => {
    const [brain] = toKnownItems(
      { step: null, project: null, profile: null, brainNotes: "ord ".repeat(200), trace: null },
      "sv",
      NOW,
    );
    expect(brain.text.length).toBeLessThanOrEqual(250);
    expect(brain.text.endsWith("…")).toBe(true);
  });
});
