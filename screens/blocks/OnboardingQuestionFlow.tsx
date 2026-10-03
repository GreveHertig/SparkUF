"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import type { OnboardingEntry } from "@/core/domain";
import { remainingOnboardingQuestions, type OnboardingAnswers } from "@/core/onboarding";
import { buildStartFrame } from "@/core/startFrame";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import { ChatLine } from "./ChatBlocks";
import type { OnboardingFormAction, OnboardingFormState } from "./OnboardingForms";
import { AnswerLine, OnboardingQuestionCard, answerText, type SaveOnboardingAnswer } from "./OnboardingQuestion";
import { StartFrameCard } from "./StartFrameCard";

const INITIAL_STATE: OnboardingFormState = { invalid: false };

/**
 * Plattformens profilsamtal (/start/profil, spec v4 §4). Kärnfrågorna ställs
 * en i taget, och varje svar sparas direkt, så att samtalet kan avbrytas och
 * fortsätta vid första obesvarade fråga. Ett givet svar går att ändra tills
 * onboardingen är klar. När kärnfrågorna är besvarade visas startkortet, och
 * först "Till appen" gör onboardingen klar (completeAction) och öppnar /app.
 */
export function OnboardingQuestionFlow({
  entry,
  questions,
  initialAnswers,
  saveAnswer,
  completeAction,
  todayIso,
}: {
  entry: OnboardingEntry;
  /** Kärnfrågorna, i ordning. */
  questions: OnboardingQuestion[];
  initialAnswers: Record<string, string>;
  saveAnswer: SaveOnboardingAnswer;
  completeAction: OnboardingFormAction;
  /** Dagens datum (ÅÅÅÅ-MM-DD), för källan "Din uppgift". */
  todayIso: string;
}) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;
  const [answers, setAnswers] = useState(initialAnswers);
  const [editing, setEditing] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(completeAction, INITIAL_STATE);
  const source = { namn: t.evidence.internalSources.profile, hämtad: todayIso };

  const active = questions.find((question) => question.id === editing) ?? (editing ? undefined : questions.find((question) => !answers[question.id]));
  const coreDone = questions.every((question) => answers[question.id]);

  function saved(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    setEditing(null);
  }

  return (
    <div className="fdd-stack">
      <div className="fdd-conversation" aria-live="polite">
        {questions.map((question, index) => {
          if (question === active) {
            return (
              <div key={question.id}>
                <p className="fdd-muted">{fill(copy.progressTemplate, { current: index + 1, total: questions.length })}</p>
                <OnboardingQuestionCard
                  question={question}
                  selected={answers[question.id]}
                  onSave={saveAnswer}
                  onSaved={(answer) => saved(question.id, answer)}
                />
              </div>
            );
          }
          const answer = answers[question.id];
          if (!answer) return null;
          return (
            <div key={question.id} className="fdd-conversation__pair">
              <ChatLine role="cofounder" text={question.cofounderText} />
              <AnswerLine text={answerText(question, answer)} source={source} />
              <button type="button" className="fdd-link fdd-self-start" onClick={() => setEditing(question.id)}>
                {copy.changeCta}
              </button>
            </div>
          );
        })}
      </div>

      {coreDone && !active && (
        <StartFrameCard
          frame={buildStartFrame(entry, answers as OnboardingAnswers)}
          remainingCount={remainingOnboardingQuestions(entry, answers as OnboardingAnswers).length}
          source={source}
        >
          <form action={formAction}>
            {state.invalid && (
              <p className="fdd-muted" role="alert">
                {copy.saveFailed}
              </p>
            )}
            <button type="submit" disabled={pending} className="fd-btn fd-btn--primary">
              {pending ? t.onboarding.startFrame.continuingCta : t.onboarding.startFrame.continueCta}
            </button>
          </form>
        </StartFrameCard>
      )}
    </div>
  );
}
