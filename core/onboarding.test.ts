import { describe, expect, it } from "vitest";
import { isProfileQuestionFor, PROFILE_QUESTION_IDS, PROFILE_QUESTIONS_BY_ENTRY } from "./onboarding";
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

  it("isProfileQuestionFor avvisar frågor som ingången inte ställer och okända id:n", () => {
    expect(isProfileQuestionFor("noIdea", "risk")).toBe(true);
    expect(isProfileQuestionFor("hasIdea", "risk")).toBe(false);
    expect(isProfileQuestionFor("noIdea", "name")).toBe(false);
  });
});
