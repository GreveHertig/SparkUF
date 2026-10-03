import { describe, expect, it } from "vitest";
import { toKnownItems } from "./knownItems";

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
    );
    expect(items.map((item) => item.text)).toEqual([
      "Idé: Cykelhjälpen. Lagar cyklar på skolan.",
      "Roll: Elev",
      "Risk: Låg",
      "Hjärnan: Gillar att skruva.",
    ]);
    expect(items.every((item) => item.source === undefined)).toBe(true);
  });

  it("en siffra ur ett fritextsvar utan tid får grundarens egen uppgift som källa, utan datum", () => {
    const [time] = toKnownItems(
      { step: null, project: null, profile: { time: "10 timmar i veckan" }, brainNotes: null, trace: null },
      "sv",
    );
    expect(time.source).toEqual({ source: { namn: "Profilsamtalet", hämtad: "" }, dataType: "user" });
  });

  it("en siffra ur ett v4-svar får dagen svaret gavs, aldrig dagens datum", () => {
    const items = toKnownItems(
      {
        step: null,
        project: null,
        profile: {
          time: "5–10 timmar i veckan",
          money: "Under 1 000 kr",
          answers: [
            { questionId: "time", question: "Tid?", answer: "5–10 timmar i veckan", answeredOn: "2026-09-28" },
            { questionId: "money", question: "Pengar?", answer: "Under 1 000 kr", answeredOn: null },
          ],
        },
        brainNotes: null,
        trace: null,
      },
      "sv",
    );
    expect(items.map((item) => item.source?.source.hämtad)).toEqual(["2026-09-28", ""]);
  });

  it("ett fritextsvar från före v4 går före v4-svaret och får då inget datum", () => {
    const [time] = toKnownItems(
      {
        step: null,
        project: null,
        profile: {
          time: "Typ 3 kvällar",
          answers: [{ questionId: "time", question: "Tid?", answer: "5–10 timmar i veckan", answeredOn: "2026-09-28" }],
        },
        brainNotes: null,
        trace: null,
      },
      "sv",
    );
    expect(time.source?.source.hämtad).toBe("");
  });

  it("Hjärnan har ingen tid, så en siffra där visas utan datum", () => {
    const [brain] = toKnownItems(
      { step: null, project: null, profile: null, brainNotes: "Har 2 000 kr sparat.", trace: null },
      "sv",
    );
    expect(brain.source).toEqual({ source: { namn: "Hjärnan", hämtad: "" }, dataType: "user" });
  });

  it("de tre senaste posterna i Spåret, senast först, med postens datum", () => {
    const trace = Array.from({ length: 5 }, (_, i) => ({
      id: `${i}`,
      timestampIso: `2026-10-0${i + 1}T08:00:00Z`,
      description: `Post ${i}`,
    }));
    const items = toKnownItems({ step: null, project: null, profile: null, brainNotes: null, trace }, "en");
    expect(items.map((item) => item.text)).toEqual(["Trace: Post 4", "Trace: Post 3", "Trace: Post 2"]);
    expect(items[0].source).toEqual({ source: { namn: "Trace", hämtad: "2026-10-05" }, dataType: "user" });
  });

  it("långa texter kortas till en rad", () => {
    const [brain] = toKnownItems(
      { step: null, project: null, profile: null, brainNotes: "ord ".repeat(200), trace: null },
      "sv",
    );
    expect(brain.text.length).toBeLessThanOrEqual(250);
    expect(brain.text.endsWith("…")).toBe(true);
  });
});
