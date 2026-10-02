import { describe, expect, it } from "vitest";
import {
  isOnboardingEntry,
  isProfileQuestionFor,
  isValidProfileAnswer,
  isValidProjectInput,
  PROFILE_QUESTION_IDS,
  PROFILE_QUESTIONS_BY_ENTRY,
} from "./onboarding";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

describe("core/onboarding", () => {
  it("ingång B:s frågor är en delmängd av ingång A:s", () => {
    for (const id of PROFILE_QUESTIONS_BY_ENTRY.hasIdea) {
      expect(PROFILE_QUESTIONS_BY_ENTRY.noIdea).toContain(id);
    }
    expect(PROFILE_QUESTIONS_BY_ENTRY.noIdea).toEqual([...PROFILE_QUESTION_IDS]);
  });

  it.each([
    ["sv", sv],
    ["en", en],
  ] as const)("i18n (%s) har text för exakt de frågor varje ingång ställer", (_, dict) => {
    for (const entry of ["noIdea", "hasIdea"] as const) {
      const keys = Object.keys(dict.onboarding.profileQuestions[entry]).filter((key) => key !== "closingMessage");
      expect(keys.sort()).toEqual([...PROFILE_QUESTIONS_BY_ENTRY[entry]].sort());
    }
  });

  it.each([
    ["sv", sv],
    ["en", en],
  ] as const)("avslutningsrepliken (%s) slutar med det steg som Hem visar efter att svaren sparats", (_, dict) => {
    // Efter onboardingen visar Hem i /app Resans aktuella steg, steg 2
    // (getHomeSummary i adapters/live/JourneyRepository.ts): Möjligheter för
    // ingång A och Genomlys din idé för B. Repliken får inte lova något annat.
    const { profileQuestions } = dict.onboarding;
    expect(profileQuestions.noIdea.closingMessage).toMatch(new RegExp(` ${dict.journeySteps.step2.title}\\.$`));
    expect(profileQuestions.hasIdea.closingMessage).toMatch(new RegExp(` ${dict.journeySteps.step2Idea.title}\\.$`));
  });

  it("isProfileQuestionFor avvisar frågor som ingången inte ställer och okända id:n", () => {
    expect(isProfileQuestionFor("noIdea", "risk")).toBe(true);
    expect(isProfileQuestionFor("hasIdea", "risk")).toBe(false);
    expect(isProfileQuestionFor("noIdea", "name")).toBe(false);
  });

  it("isValidProfileAnswer: 1–1000 tecken efter trim, räknat i tecken som char_length", () => {
    expect(isValidProfileAnswer("Ett svar.")).toBe(true);
    expect(isValidProfileAnswer("   ")).toBe(false);
    expect(isValidProfileAnswer("a".repeat(1000))).toBe(true);
    expect(isValidProfileAnswer("a".repeat(1001))).toBe(false);
    // 1000 emoji är 2000 UTF-16-enheter men 1000 tecken i Postgres.
    expect(isValidProfileAnswer("🙂".repeat(1000))).toBe(true);
  });

  it("isValidProjectInput: namn 1–80 och ingress 1–280 tecken efter trim", () => {
    expect(isValidProjectInput({ name: "Hallplan", oneLiner: "Prognoser." })).toBe(true);
    expect(isValidProjectInput({ name: " ", oneLiner: "Prognoser." })).toBe(false);
    expect(isValidProjectInput({ name: "a".repeat(81), oneLiner: "Prognoser." })).toBe(false);
    expect(isValidProjectInput({ name: "Hallplan", oneLiner: "a".repeat(280) })).toBe(true);
    expect(isValidProjectInput({ name: "Hallplan", oneLiner: "a".repeat(281) })).toBe(false);
  });

  it("isOnboardingEntry känner bara igen de två ingångarna", () => {
    expect(isOnboardingEntry("noIdea")).toBe(true);
    expect(isOnboardingEntry("hasIdea")).toBe(true);
    expect(isOnboardingEntry("annat")).toBe(false);
    expect(isOnboardingEntry(null)).toBe(false);
  });
});
