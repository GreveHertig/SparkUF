"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { OnboardingAlreadyCompletedError, ProjectExistsError } from "@/core/errors";
import { PROFILE_QUESTIONS_BY_ENTRY, isValidProfileAnswer, isValidProjectInput } from "@/core/onboarding";
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

const AnswerSchema = z.string().refine((answer) => isValidProfileAnswer(answer));

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

/** Sparar svaren och markerar onboardingen klar, sedan till /app. */
export async function completeOnboardingAction(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const entry = await resolveOnboardingEntry();
  const answers = [];
  for (const questionId of PROFILE_QUESTIONS_BY_ENTRY[entry]) {
    const parsed = AnswerSchema.safeParse(formData.get(questionId));
    if (!parsed.success) return { invalid: true };
    answers.push({ questionId, answer: parsed.data });
  }

  try {
    await liveProfileRepository.completeOnboarding({ entry, answers });
  } catch (error) {
    // Redan klar (ingen omgörning i v1): svaren skrivs inte över, /app gäller.
    if (!(error instanceof OnboardingAlreadyCompletedError)) throw error;
  }
  redirect("/app");
}
