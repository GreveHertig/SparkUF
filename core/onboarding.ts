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

export function isProfileQuestionFor(entry: OnboardingEntry, questionId: string): questionId is ProfileQuestionId {
  return (PROFILE_QUESTIONS_BY_ENTRY[entry] as readonly string[]).includes(questionId);
}
