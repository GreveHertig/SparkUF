"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import {
  OnboardingAlreadyCompletedError,
  OnboardingAnswerInvalidError,
  OnboardingAnswerLockedError,
  ProjectExistsError,
} from "@/core/errors";
import {
  coreQuestionsAnswered,
  isOnboardingQuestionFor,
  isValidOnboardingAnswer,
  isValidProjectInput,
} from "@/core/onboarding";
import { resolveOnboardingEntry } from "./_lib/entry";
import type { OnboardingFormState } from "@/screens/blocks/OnboardingForms";

/**
 * Onboardingens Server Actions (/start, PR 3 av onboarding live). Användaren
 * tas alltid ur sessionen i adaptern (`requireSupabaseUser`), aldrig ur
 * indata, och RLS på `profiles` och `projects` är den bindande spärren.
 * Gränserna är desamma som i core/onboarding.ts, adaptern och databasen.
 * Svaren är data, aldrig instruktion (CLAUDE.md, Säkerhet).
 *
 * Ogiltig indata ger `{ invalid: true }` och formuläret visar det. Ett riktigt
 * fel (Supabase nere, ingen session) kastas vidare och når Nexts felsida.
 */

const ProjectSchema = z
  .object({ name: z.string(), oneLiner: z.string() })
  .refine((input) => isValidProjectInput(input));

const AnswerInputSchema = z.object({ questionId: z.string(), answer: z.string() });

export type SaveOnboardingAnswerResult =
  | { ok: true; answeredOn: string | null }
  | { ok: false; reason: "invalid" | "locked" };

/** Ingång B: idén blir grundarens aktiva projekt (`is_active: true` i adaptern). */
export async function createProjectAction(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const parsed = ProjectSchema.safeParse({ name: formData.get("name"), oneLiner: formData.get("oneLiner") });
  if (!parsed.success) return { invalid: true };

  try {
    await liveProjectRepository.createProject(parsed.data);
  } catch (error) {
    // Ett aktivt projekt finns redan, till exempel efter ett dubbelklick.
    // Det skrivs aldrig över; grundaren går vidare med det som finns.
    if (!(error instanceof ProjectExistsError)) throw error;
  }
  redirect("/start/ide");
}

/**
 * Sparar ett svar i profilsamtalet (spec v4 §4: ett svar i taget, så att
 * samtalet kan avbrytas och fortsätta). Frågan måste höra till grundarens
 * ingång, som härleds på servern, och svaret ha rätt form. Databasen
 * (public.save_onboarding_answer) prövar samma sak igen och är den bindande.
 */
export async function saveOnboardingAnswerAction(questionId: unknown, answer: unknown): Promise<SaveOnboardingAnswerResult> {
  const parsed = AnswerInputSchema.safeParse({ questionId, answer });
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const entry = await resolveOnboardingEntry();
  const input = parsed.data;
  if (!isOnboardingQuestionFor(entry, input.questionId) || !isValidOnboardingAnswer(input.questionId, input.answer)) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const saved = await liveProfileRepository.saveOnboardingAnswer(input);
    return { ok: true, answeredOn: saved.answeredOn };
  } catch (error) {
    if (error instanceof OnboardingAnswerInvalidError) return { ok: false, reason: "invalid" };
    if (error instanceof OnboardingAnswerLockedError) return { ok: false, reason: "locked" };
    throw error;
  }
}

/**
 * "Till appen" på startkortet: markerar onboardingen klar, sedan till /app.
 * Svaren är redan sparade, ett i taget. Saknas en kärnfråga (till exempel
 * efter ett byte av ingång) blir det `{ invalid: true }`, aldrig en klar
 * onboarding. Resten av frågorna återstår och syns i Minnet (spec v4 §3.2).
 */
export async function completeOnboardingAction(): Promise<OnboardingFormState> {
  const entry = await resolveOnboardingEntry();
  const saved = await liveProfileRepository.getOnboardingAnswers();
  const answers = Object.fromEntries(Object.entries(saved).map(([id, { answer }]) => [id, answer]));
  if (!coreQuestionsAnswered(entry, answers)) return { invalid: true };

  try {
    await liveProfileRepository.completeOnboarding({ entry, answers: [] });
  } catch (error) {
    // Redan klar (ingen omgörning): /app gäller.
    if (!(error instanceof OnboardingAlreadyCompletedError)) throw error;
  }
  redirect("/app");
}
