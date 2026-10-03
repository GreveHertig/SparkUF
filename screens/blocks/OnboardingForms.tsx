"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import {
  PROFILE_ANSWER_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_ONE_LINER_MAX_LENGTH,
} from "@/core/onboarding";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import { ChatLine } from "./ChatBlocks";

/**
 * Plattformens formulär i onboardingen (/start/ide och /start/profil). Demot
 * använder dem aldrig: där visas färdiga svar ur personan. Skärmen vet inte
 * vad som händer med svaren, den får en Server Action av routen och visar
 * bara om indatan avvisades. Ett riktigt fel kastas av actionen och når
 * Nexts felsida, aldrig ett tyst tomläge.
 */
export type OnboardingFormState = { invalid: boolean };
export type OnboardingFormAction = (state: OnboardingFormState, formData: FormData) => Promise<OnboardingFormState>;

const INITIAL_STATE: OnboardingFormState = { invalid: false };

/** Ett fritextfält per fråga. Fältets namn är frågans id. Avslutningsrepliken
 * står efter sista frågan, före knappen: actionen skickar vidare till /app så
 * fort svaren är sparade, så efteråt finns ingen plats att visa den på. */
export function ProfileAnswerForm({
  questions,
  closingMessage,
  action,
}: {
  questions: OnboardingQuestion[];
  closingMessage: string;
  action: OnboardingFormAction;
}) {
  const { t } = useI18n();
  const copy = t.onboarding.profile;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="fdd-conversation">
      {questions.map((question) => {
        // Frågan är fältets etikett. ChatLine är ett block, så den kopplas med
        // aria-labelledby i stället för att ligga i en <label>.
        const questionId = `fdd-question-${question.id}`;
        return (
          <div key={question.id} className="fdd-conversation__pair">
            <div id={questionId}>
              <ChatLine role="cofounder" text={question.cofounderText} />
            </div>
            <textarea
              aria-labelledby={questionId}
              name={question.id}
              required
              maxLength={PROFILE_ANSWER_MAX_LENGTH}
              rows={3}
              className="fdd-textarea"
            />
          </div>
        );
      })}
      <ChatLine role="cofounder" text={closingMessage} />
      {state.invalid && (
        <p className="fdd-muted" role="alert">
          {fill(copy.invalidTemplate, { max: String(PROFILE_ANSWER_MAX_LENGTH) })}
        </p>
      )}
      <button type="submit" disabled={pending} className="fd-btn fd-btn--primary fdd-self-start">
        {pending ? copy.submittingCta : copy.submitCta}
      </button>
    </form>
  );
}

/** Idéns namn och ingress (ingång B). Blir grundarens aktiva projekt. */
export function IdeaForm({ action }: { action: OnboardingFormAction }) {
  const { t } = useI18n();
  const copy = t.onboarding.idea;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="fdd-block">
      <label htmlFor="fdd-idea-name" className="fdd-label">
        {copy.nameLabel}
      </label>
      <input
        id="fdd-idea-name"
        name="name"
        required
        maxLength={PROJECT_NAME_MAX_LENGTH}
        className="fdd-input"
      />
      <label htmlFor="fdd-idea-one-liner" className="fdd-label">
        {copy.oneLinerLabel}
      </label>
      <textarea
        id="fdd-idea-one-liner"
        name="oneLiner"
        required
        maxLength={PROJECT_ONE_LINER_MAX_LENGTH}
        rows={2}
        className="fdd-textarea"
      />
      {state.invalid && (
        <p className="fdd-muted" role="alert">
          {fill(copy.invalidTemplate, {
            nameMax: String(PROJECT_NAME_MAX_LENGTH),
            oneLinerMax: String(PROJECT_ONE_LINER_MAX_LENGTH),
          })}
        </p>
      )}
      <button type="submit" disabled={pending} className="fd-btn fd-btn--primary fdd-self-start">
        {pending ? copy.submittingCta : copy.submitCta}
      </button>
    </form>
  );
}
