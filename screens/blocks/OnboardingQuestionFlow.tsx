"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import type { OnboardingEntry } from "@/core/domain";
import { remainingOnboardingQuestions, type OnboardingAnswers } from "@/core/onboarding";
import type { Källa } from "@/core/domain";
import { buildStartFrame } from "@/core/startFrame";
import type { OnboardingQuestion, SavedOnboardingAnswer } from "@/ports/ProfileRepository";
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
}: {
  entry: OnboardingEntry;
  /** Kärnfrågorna, i ordning. */
  questions: OnboardingQuestion[];
  /** De sparade svaren, med dagen de gavs (källans datum). */
  initialAnswers: Record<string, SavedOnboardingAnswer>;
  saveAnswer: SaveOnboardingAnswer;
  completeAction: OnboardingFormAction;
}) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;
  const [answers, setAnswers] = useState(initialAnswers);
  const [editing, setEditing] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(completeAction, INITIAL_STATE);
  // Källan "Din uppgift" med dagen svaret gavs. Saknas tiden visas inget
  // datum (tomt `hämtad`), aldrig dagens.
  const sourceFor = (questionId: string): Källa => ({
    namn: t.evidence.internalSources.profile,
    hämtad: answers[questionId]?.answeredOn ?? "",
  });
  const plainAnswers: OnboardingAnswers = Object.fromEntries(
    Object.entries(answers).map(([id, saved]) => [id, saved.answer]),
  );

  const active = questions.find((question) => question.id === editing) ?? (editing ? undefined : questions.find((question) => !answers[question.id]));
  const coreDone = questions.every((question) => answers[question.id]);

  function saved(questionId: string, answer: string, answeredOn: string | null) {
    setAnswers((current) => ({ ...current, [questionId]: { answer, answeredOn } }));
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
                  selected={answers[question.id]?.answer}
                  onSave={saveAnswer}
                  onSaved={(answer, answeredOn) => saved(question.id, answer, answeredOn)}
                />
              </div>
            );
          }
          const answer = answers[question.id]?.answer;
          if (!answer) return null;
          return (
            <div key={question.id} className="fdd-conversation__pair">
              <ChatLine role="cofounder" text={question.cofounderText} />
              <AnswerLine text={answerText(question, answer)} source={sourceFor(question.id)} />
              <button type="button" className="fdd-link fdd-self-start" onClick={() => setEditing(question.id)}>
                {copy.changeCta}
              </button>
            </div>
          );
        })}
      </div>

      {coreDone && !active && (
        <StartFrameCard
          frame={buildStartFrame(entry, plainAnswers)}
          remainingCount={remainingOnboardingQuestions(entry, plainAnswers).length}
          sourceFor={sourceFor}
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
