// Onboardingens fasta profilfrågor och gränserna för det grundaren skriver
// (uppdrag 2.1, 6; spec v4 §4; docs/moduler/profil.md). Delas av
// liveadaptrarna, server actions (zod) och migreringen, så att samma gräns
// gäller i alla tre lagren. Frågornas text ligger i i18n, inte här.
import type { OnboardingEntry } from "@/core/domain";

/*
 * Version 1: fritextfrågorna före spec v4. De ställs inte längre, men svaren
 * finns kvar i profilens kolumner för konton som blev klara med dem
 * (`onboarding_version = 1`) och visas i Minnet med frågans text ur
 * `onboarding.profileQuestions`. Demot använder samma id:n.
 */

/** En profilfråga (version 1) = ett fält i profilen. Samma fält som Minnets
 * Profilen-flik läser (docs/moduler/minnet.md). */
export const PROFILE_QUESTION_IDS = ["role", "bio", "frustrations", "customer", "time", "money", "risk"] as const;
export type ProfileQuestionId = (typeof PROFILE_QUESTION_IDS)[number];

/** Version 1: ingång A fick hela samtalet, ingång B det kortare
 * passform-samtalet (uppdrag 2.1). */
export const PROFILE_QUESTIONS_BY_ENTRY: Record<OnboardingEntry, readonly ProfileQuestionId[]> = {
  noIdea: ["role", "bio", "frustrations", "time", "money", "risk"],
  hasIdea: ["role", "customer", "time", "money"],
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

/*
 * Version 2 (spec v4 §4): konkreta frågor utan självskattning, val där det
 * går och högst en fritext per ingång. Svaren lagras som {frågans id: svar}
 * i `profiles.onboarding_answers`, där ett val lagras som sitt stabila id.
 * Kärnfrågorna ställs i /start och leder fram till startkortet
 * (core/startFrame.ts); när de är besvarade kan onboardingen bli klar. De
 * övriga är återstående frågor som Minnet håller reda på (spec v4 §3.2).
 *
 * Speglas av public.onboarding_v4_questions() i
 * supabase/migrations/20261003150000_onboarding_v4.sql (vaktat av
 * supabase/migrations/onboardingWrite.pg.test.ts). Ett id byts aldrig: det
 * står i databasen.
 */

/** Valfrågorna och deras svar, i den ordning de visas. */
export const ONBOARDING_CHOICES = {
  situation: ["upperSecondary", "university", "employed", "between"],
  time: ["under3", "h3to6", "h6to10", "over10"],
  money: ["none", "under1000", "k1to5", "over5000"],
  soldB2b: ["yes", "no"],
  archetype: ["builder", "seller", "organizer"],
  knowsOwner: ["yes", "no"],
  payer: ["business", "consumer", "public", "unsure"],
  talkedTo: ["none", "few", "many"],
} as const;

/** Fritextfrågorna. Högst en per ingång. */
export const ONBOARDING_TEXT_QUESTION_IDS = ["frustration", "customer"] as const;

export type OnboardingChoiceQuestionId = keyof typeof ONBOARDING_CHOICES;
export type OnboardingQuestionId = OnboardingChoiceQuestionId | (typeof ONBOARDING_TEXT_QUESTION_IDS)[number];
export type OnboardingChoiceId<Q extends OnboardingChoiceQuestionId = OnboardingChoiceQuestionId> =
  (typeof ONBOARDING_CHOICES)[Q][number];

/** Grundarens svar på version 2-frågorna: {frågans id: val-id eller text}. */
export type OnboardingAnswers = Partial<Record<OnboardingQuestionId, string>>;

/** Kärnfrågorna före startkortet och de återstående efter, per ingång. */
export const ONBOARDING_QUESTIONS_BY_ENTRY: Record<
  OnboardingEntry,
  { core: readonly OnboardingQuestionId[]; later: readonly OnboardingQuestionId[] }
> = {
  noIdea: { core: ["situation", "time", "money", "soldB2b"], later: ["archetype", "knowsOwner", "frustration"] },
  hasIdea: { core: ["situation", "payer", "customer", "talkedTo"], later: ["soldB2b", "time", "money"] },
};

/** Fritext i version 2: 1–280 tecken efter trim (samma som i SQL). */
export const ONBOARDING_TEXT_MAX_LENGTH = 280;

/** Alla ingångens frågor, kärnfrågorna först. */
export function onboardingQuestionsFor(entry: OnboardingEntry): readonly OnboardingQuestionId[] {
  const { core, later } = ONBOARDING_QUESTIONS_BY_ENTRY[entry];
  return [...core, ...later];
}

export function isOnboardingQuestionFor(entry: OnboardingEntry, questionId: string): questionId is OnboardingQuestionId {
  return (onboardingQuestionsFor(entry) as readonly string[]).includes(questionId);
}

export function isChoiceQuestion(questionId: OnboardingQuestionId): questionId is OnboardingChoiceQuestionId {
  return questionId in ONBOARDING_CHOICES;
}

/** Ett val måste vara ett av frågans id:n. Fritext trimmas och ska vara
 * 1–ONBOARDING_TEXT_MAX_LENGTH tecken. */
export function isValidOnboardingAnswer(questionId: OnboardingQuestionId, answer: string): boolean {
  if (isChoiceQuestion(questionId)) {
    return (ONBOARDING_CHOICES[questionId] as readonly string[]).includes(answer);
  }
  const length = charLength(answer.trim());
  return length >= 1 && length <= ONBOARDING_TEXT_MAX_LENGTH;
}

/** Ingångens frågor som saknar svar, i ordning. Svar på frågor som ingången
 * inte ställer (till exempel efter ett byte av ingång) räknas inte. */
export function remainingOnboardingQuestions(
  entry: OnboardingEntry,
  answers: OnboardingAnswers,
): OnboardingQuestionId[] {
  return onboardingQuestionsFor(entry).filter((id) => !answers[id]);
}

/** Sant när alla kärnfrågor har svar, alltså när startkortet kan visas och
 * onboardingen kan bli klar. */
export function coreQuestionsAnswered(entry: OnboardingEntry, answers: OnboardingAnswers): boolean {
  return ONBOARDING_QUESTIONS_BY_ENTRY[entry].core.every((id) => Boolean(answers[id]));
}

/** De svar i ett okänt objekt (till exempel jsonb ur databasen) som är giltiga
 * för någon version 2-fråga. Allt annat tas bort, aldrig gissat. */
export function parseOnboardingAnswers(value: unknown): OnboardingAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: OnboardingAnswers = {};
  for (const [id, answer] of Object.entries(value as Record<string, unknown>)) {
    if (!isKnownOnboardingQuestion(id) || typeof answer !== "string") continue;
    if (isValidOnboardingAnswer(id, answer)) result[id] = isChoiceQuestion(id) ? answer : answer.trim();
  }
  return result;
}

function isKnownOnboardingQuestion(id: string): id is OnboardingQuestionId {
  return id in ONBOARDING_CHOICES || (ONBOARDING_TEXT_QUESTION_IDS as readonly string[]).includes(id);
}
