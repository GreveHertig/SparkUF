import { describe, expect, it } from "vitest";
import {
  ONBOARDING_CHOICES,
  ONBOARDING_QUESTIONS_BY_ENTRY,
  ONBOARDING_TEXT_MAX_LENGTH,
  coreQuestionsAnswered,
  isChoiceQuestion,
  isOnboardingQuestionFor,
  isValidOnboardingAnswer,
  onboardingQuestionsFor,
  parseOnboardingAnswers,
  remainingOnboardingQuestions,
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
  it("ingång B:s frågor är ingång A:s utom kundgissningen, som bara passar den som har en idé", () => {
    // Beslut 2026-10-02 (Theodor, Bruno): "customer" ("Vem tror du skulle köpa?")
    // ställs bara i ingång B. Ingång A har ingen idé att gissa en kund till.
    for (const id of PROFILE_QUESTIONS_BY_ENTRY.hasIdea.filter((id) => id !== "customer")) {
      expect(PROFILE_QUESTIONS_BY_ENTRY.noIdea).toContain(id);
    }
    expect(PROFILE_QUESTIONS_BY_ENTRY.noIdea).not.toContain("customer");
    const used = new Set([...PROFILE_QUESTIONS_BY_ENTRY.noIdea, ...PROFILE_QUESTIONS_BY_ENTRY.hasIdea]);
    expect([...used].sort()).toEqual([...PROFILE_QUESTION_IDS].sort());
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
    // Jämförs som text, inte som reguljärt uttryck, så att tecken i en
    // stegtitel aldrig tolkas som mönster.
    expect(profileQuestions.noIdea.closingMessage.endsWith(` ${dict.journeySteps.step2.title}.`)).toBe(true);
    expect(profileQuestions.hasIdea.closingMessage.endsWith(` ${dict.journeySteps.step2Idea.title}.`)).toBe(true);
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

describe("core/onboarding, version 2 (spec v4 §4)", () => {
  it("varje ingång har fyra kärnfrågor före startkortet och högst en fritext", () => {
    for (const entry of ["noIdea", "hasIdea"] as const) {
      expect(ONBOARDING_QUESTIONS_BY_ENTRY[entry].core).toHaveLength(4);
      expect(onboardingQuestionsFor(entry).filter((id) => !isChoiceQuestion(id)).length).toBeLessThanOrEqual(1);
      expect(new Set(onboardingQuestionsFor(entry)).size).toBe(onboardingQuestionsFor(entry).length);
    }
  });

  it.each([
    ["sv", sv],
    ["en", en],
  ] as const)("i18n (%s) har text för varje fråga och etikett för varje val", (_, dict) => {
    const copy = dict.onboarding.v4Questions;
    for (const entry of ["noIdea", "hasIdea"] as const) {
      expect(Object.keys(copy[entry]).sort()).toEqual([...onboardingQuestionsFor(entry)].sort());
    }
    for (const [id, choices] of Object.entries(ONBOARDING_CHOICES)) {
      expect(Object.keys(copy.choices[id as keyof typeof copy.choices]).sort(), id).toEqual([...choices].sort());
    }
  });

  it("ingen självskattning: de gamla frågorna om förmåga och risk ställs inte längre", () => {
    for (const entry of ["noIdea", "hasIdea"] as const) {
      for (const old of ["bio", "risk", "role"]) expect(isOnboardingQuestionFor(entry, old)).toBe(false);
    }
  });

  it("isValidOnboardingAnswer: ett val måste vara ett av frågans id:n, fritext 1–280 tecken efter trim", () => {
    expect(isValidOnboardingAnswer("time", "h3to6")).toBe(true);
    expect(isValidOnboardingAnswer("time", "yes")).toBe(false);
    expect(isValidOnboardingAnswer("time", " h3to6")).toBe(false);
    expect(isValidOnboardingAnswer("frustration", "  Köer  ")).toBe(true);
    expect(isValidOnboardingAnswer("frustration", "   ")).toBe(false);
    expect(isValidOnboardingAnswer("customer", "a".repeat(ONBOARDING_TEXT_MAX_LENGTH))).toBe(true);
    expect(isValidOnboardingAnswer("customer", "a".repeat(ONBOARDING_TEXT_MAX_LENGTH + 1))).toBe(false);
    expect(isValidOnboardingAnswer("customer", "😀".repeat(ONBOARDING_TEXT_MAX_LENGTH))).toBe(true);
  });

  it("återstående frågor härleds: ingångens frågor minus de besvarade, i ordning", () => {
    expect(remainingOnboardingQuestions("noIdea", {})).toEqual([...onboardingQuestionsFor("noIdea")]);
    expect(remainingOnboardingQuestions("noIdea", { situation: "employed", time: "h3to6", money: "none", soldB2b: "no" })).toEqual([
      "archetype",
      "knowsOwner",
      "frustration",
    ]);
    // Ett svar som ingången inte ställer räknas inte.
    expect(remainingOnboardingQuestions("hasIdea", { archetype: "seller" })).toHaveLength(7);
  });

  it("kärnfrågorna avgör om onboardingen kan bli klar, oavsett de återstående", () => {
    expect(coreQuestionsAnswered("hasIdea", { situation: "employed", payer: "unsure", customer: "Byråer", talkedTo: "none" })).toBe(true);
    expect(coreQuestionsAnswered("hasIdea", { situation: "employed", payer: "unsure", talkedTo: "none", time: "h3to6" })).toBe(false);
  });

  it("parseOnboardingAnswers behåller bara giltiga svar och gissar aldrig", () => {
    expect(parseOnboardingAnswers(null)).toEqual({});
    expect(parseOnboardingAnswers(["employed"])).toEqual({});
    expect(
      parseOnboardingAnswers({ situation: "employed", time: "10 timmar", role: "Säljare", money: 5, customer: "  Byråer " }),
    ).toEqual({ situation: "employed", customer: "Byråer" });
  });
});
