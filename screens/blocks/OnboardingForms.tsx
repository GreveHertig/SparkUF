"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { PROJECT_NAME_MAX_LENGTH, PROJECT_ONE_LINER_MAX_LENGTH } from "@/core/onboarding";

/**
 * Plattformens formulär i onboardingen (/start/ide, och knappen "Till appen"
 * i /start/profil). Demot använder dem aldrig: där visas färdiga svar ur
 * personan. Profilsamtalets frågor ligger i OnboardingQuestion.tsx. Skärmen vet inte
 * vad som händer med svaren, den får en Server Action av routen och visar
 * bara om indatan avvisades. Ett riktigt fel kastas av actionen och når
 * Nexts felsida, aldrig ett tyst tomläge.
 */
export type OnboardingFormState = { invalid: boolean };
export type OnboardingFormAction = (state: OnboardingFormState, formData: FormData) => Promise<OnboardingFormState>;

const INITIAL_STATE: OnboardingFormState = { invalid: false };

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
