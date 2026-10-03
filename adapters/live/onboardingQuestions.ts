import type { OnboardingEntry } from "@/core/domain";
import type { Locale } from "@/i18n/context";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import type { ProfileAnswerView } from "@/ports/MemoryRepository";
import {
  ONBOARDING_CHOICES,
  isChoiceQuestion,
  onboardingQuestionsFor,
  type OnboardingAnswers,
  type OnboardingQuestionId,
} from "@/core/onboarding";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

/**
 * Onboardingens v4-frågor (core/onboarding.ts) med text och val ur i18n, som
 * Profil (/start/profil) och Minnet (Återstår, Dina svar) visar dem. Delad av
 * de två liveadaptrarna så att frågan och etiketterna alltid är desamma.
 */

const dictionaries = { sv, en };

export function toOnboardingQuestion(entry: OnboardingEntry, id: OnboardingQuestionId, locale: Locale): OnboardingQuestion {
  const copy = dictionaries[locale].onboarding.v4Questions;
  const texts: Partial<Record<OnboardingQuestionId, string>> = copy[entry];
  if (!isChoiceQuestion(id)) {
    return { id, cofounderText: texts[id] ?? "", suggestedAnswer: null, kind: "text" };
  }
  const labels: Record<string, string> = copy.choices[id];
  return {
    id,
    cofounderText: texts[id] ?? "",
    suggestedAnswer: null,
    kind: "choice",
    choices: ONBOARDING_CHOICES[id].map((choice) => ({ id: choice, label: labels[choice] })),
  };
}

/** Svaret som text: ett val med sin etikett, fritext som den skrevs. */
export function answerLabel(id: OnboardingQuestionId, answer: string, locale: Locale): string {
  if (!isChoiceQuestion(id)) return answer;
  const labels: Record<string, string> = dictionaries[locale].onboarding.v4Questions.choices[id];
  return labels[answer] ?? answer;
}

/** De givna svaren på ingångens frågor, i frågornas ordning. */
export function toAnswerViews(entry: OnboardingEntry, answers: OnboardingAnswers, locale: Locale): ProfileAnswerView[] {
  const texts: Partial<Record<OnboardingQuestionId, string>> = dictionaries[locale].onboarding.v4Questions[entry];
  return onboardingQuestionsFor(entry).flatMap((id) => {
    const answer = answers[id];
    return answer ? [{ questionId: id, question: texts[id] ?? "", answer: answerLabel(id, answer, locale) }] : [];
  });
}
