import type { OnboardingEntry } from "@/core/domain";
import type { Locale } from "@/i18n/context";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import type { ProfileAnswerView } from "@/ports/MemoryRepository";
import {
  ONBOARDING_CHOICES,
  isChoiceQuestion,
  onboardingQuestionsFor,
  type OnboardingAnswerRecords,
  type OnboardingQuestionId,
} from "@/core/onboarding";
import { stockholmToday } from "@/adapters/live/evidenceScore";
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

/** Dagen (ÅÅÅÅ-MM-DD, Stockholm) då svaret gavs, ur tiden databasen satte.
 * Saknas tiden blir det `null`, aldrig dagens datum. */
export function answeredOn(answeredAt: string | null): string | null {
  return answeredAt ? stockholmToday(new Date(answeredAt)) : null;
}

/** De givna svaren på ingångens frågor, i frågornas ordning, med dagen de gavs. */
export function toAnswerViews(entry: OnboardingEntry, records: OnboardingAnswerRecords, locale: Locale): ProfileAnswerView[] {
  const texts: Partial<Record<OnboardingQuestionId, string>> = dictionaries[locale].onboarding.v4Questions[entry];
  return onboardingQuestionsFor(entry).flatMap((id) => {
    const record = records[id];
    if (!record) return [];
    return [
      {
        questionId: id,
        question: texts[id] ?? "",
        answer: answerLabel(id, record.answer, locale),
        answeredOn: answeredOn(record.answeredAt),
      },
    ];
  });
}
