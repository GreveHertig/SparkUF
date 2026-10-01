// Onboardingens fasta profilfrågor och gränserna för det grundaren skriver
// (uppdrag 2.1, 6; docs/moduler/profil.md). Delas av liveadaptern, server
// actions (zod) och migreringen, så att samma gräns gäller i alla tre lagren.
// Frågornas text ligger i i18n (`onboarding.profileQuestions`), inte här.
import type { OnboardingEntry } from "@/core/domain";

/** En profilfråga = ett fält i profilen. Samma fält som Minnets Profilen-flik
 * läser (docs/moduler/minnet.md), så svaren syns där utan en egen tabell. En
 * framtida Gemini-version av samtalet fyller samma fält. */
export const PROFILE_QUESTION_IDS = ["role", "bio", "time", "money", "risk"] as const;
export type ProfileQuestionId = (typeof PROFILE_QUESTION_IDS)[number];

/** Ingång A får hela samtalet, ingång B det kortare passform-samtalet
 * (uppdrag 2.1). Ordningen är ordningen frågorna ställs i. */
export const PROFILE_QUESTIONS_BY_ENTRY: Record<OnboardingEntry, readonly ProfileQuestionId[]> = {
  noIdea: ["role", "bio", "time", "money", "risk"],
  hasIdea: ["role", "time", "money"],
};

/** Speglas av check-villkoren i
 * supabase/migrations/20260930120000_onboarding.sql (vaktat av
 * supabase/migrations/onboarding.test.ts). */
export const PROFILE_ANSWER_MAX_LENGTH = 1000;
export const PROJECT_NAME_MAX_LENGTH = 80;
export const PROJECT_ONE_LINER_MAX_LENGTH = 280;

/** Längden räknas i tecken (kodpunkter), som `char_length` i Postgres, inte
 * i UTF-16-enheter som `string.length`. Annars skulle en emoji räknas dubbelt
 * här men enkelt i databasen. */
function charLength(value: string): number {
  return [...value].length;
}

/** Ett trimmat svar på 1–PROFILE_ANSWER_MAX_LENGTH tecken. */
export function isValidProfileAnswer(answer: string): boolean {
  const length = charLength(answer.trim());
  return length >= 1 && length <= PROFILE_ANSWER_MAX_LENGTH;
}

/** Trimmat namn på 1–80 och ingress på 1–280 tecken (samma som
 * check-villkoren projects_name_langd och projects_one_liner_langd). */
export function isValidProjectInput(input: { name: string; oneLiner: string }): boolean {
  const name = charLength(input.name.trim());
  const oneLiner = charLength(input.oneLiner.trim());
  return name >= 1 && name <= PROJECT_NAME_MAX_LENGTH && oneLiner >= 1 && oneLiner <= PROJECT_ONE_LINER_MAX_LENGTH;
}

export function isOnboardingEntry(value: unknown): value is OnboardingEntry {
  return value === "noIdea" || value === "hasIdea";
}

export function isProfileQuestionFor(entry: OnboardingEntry, questionId: string): questionId is ProfileQuestionId {
  return (PROFILE_QUESTIONS_BY_ENTRY[entry] as readonly string[]).includes(questionId);
}
