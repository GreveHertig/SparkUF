import { describe, expect, it } from "vitest";
import { buildStartFrame, startFrameHours } from "./startFrame";
import { ONBOARDING_CHOICES } from "./onboarding";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

describe("core/startFrame", () => {
  it("tiden räknas på 13 veckor ur tidsvalet", () => {
    expect(startFrameHours("under3")).toEqual({ kind: "under", max: 39 });
    expect(startFrameHours("h3to6")).toEqual({ kind: "range", min: 39, max: 78 });
    expect(startFrameHours("h6to10")).toEqual({ kind: "range", min: 78, max: 130 });
    expect(startFrameHours("over10")).toEqual({ kind: "over", min: 130 });
    expect(startFrameHours(undefined)).toBeNull();
    expect(startFrameHours("okänt")).toBeNull();
  });

  it("varje tidsval har en tidsram", () => {
    for (const choice of ONBOARDING_CHOICES.time) expect(startFrameHours(choice)).not.toBeNull();
  });

  it("ingång A: bedömningen och uppgiften följer svaren, inget annat", () => {
    expect(buildStartFrame("noIdea", { situation: "employed", time: "h3to6", money: "none", soldB2b: "no" })).toEqual({
      entry: "noIdea",
      hours: { kind: "range", min: 39, max: 78 },
      money: "none",
      lines: ["moneyOwnTime"],
      task: "askThreeAdults",
      customer: null,
    });
    expect(buildStartFrame("noIdea", { time: "under3", money: "over5000", soldB2b: "yes" })).toMatchObject({
      lines: ["moneySmallTest", "timeSmall", "soldB2bYes"],
      task: "callPastBuyer",
    });
  });

  it("ingång B: vem som betalar och hur många samtal styr uppgiften, och kundgissningen följer med ordagrant", () => {
    expect(buildStartFrame("hasIdea", { payer: "consumer", customer: "  Föräldrar i Umeå ", talkedTo: "few" })).toEqual({
      entry: "hasIdea",
      hours: null,
      money: null,
      lines: ["payerConsumer", "talkedFew"],
      task: "talkToFive",
      customer: "Föräldrar i Umeå",
    });
    expect(buildStartFrame("hasIdea", { payer: "unsure", talkedTo: "many" }).task).toBe("findPayer");
    expect(buildStartFrame("hasIdea", { payer: "public", talkedTo: "many" }).task).toBe("writeDownPattern");
  });

  it("samma svar ger alltid samma kort", () => {
    const answers = { situation: "between", time: "over10", money: "k1to5", soldB2b: "yes" } as const;
    expect(buildStartFrame("noIdea", answers)).toEqual(buildStartFrame("noIdea", answers));
  });

  it.each([
    ["sv", sv],
    ["en", en],
  ] as const)("i18n (%s): uppgifterna lovar inget om siffror som grundaren inte gett", (_, dict) => {
    // Datalöftet: inga siffror i bedömning eller uppgift, bara i grundarens egna svar.
    for (const text of [...Object.values(dict.onboarding.startFrame.lines), ...Object.values(dict.onboarding.startFrame.tasks)]) {
      expect(text, text).not.toMatch(/\d/);
    }
  });
});
