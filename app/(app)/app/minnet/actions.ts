"use server";

import { revalidatePath } from "next/cache";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { liveEvidenceRecorder, EvidenceInputError } from "@/adapters/live/EvidenceRecorder";
import { stockholmToday } from "@/adapters/live/evidenceScore";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { EmptyStateError, OnboardingAnswerInvalidError, OnboardingAnswerLockedError } from "@/core/errors";
import { FIT_ANSWER_MAX, fitSubjectRef, isFitQuestionId } from "@/core/fitQuestions";
import { isOnboardingQuestionFor, isValidOnboardingAnswer } from "@/core/onboarding";

/**
 * Sparar Hjärnan för den inloggade användaren (/app/minnet). Användaren tas
 * ur sessionen i adaptern (`requireSupabaseUser`), aldrig ur indata, och RLS
 * på `brain_notes` är den bindande spärren. Längdgränsen ligger i adaptern och
 * i databasen. Texten är data, aldrig instruktion (CLAUDE.md, Säkerhet).
 */
export async function saveBrainNotes(notes: unknown): Promise<void> {
  if (typeof notes !== "string") {
    throw new Error("Minnet: Hjärnan måste vara text.");
  }
  await liveMemoryRepository.setBrainNotes(notes);
}

export type SaveFitAnswerResult = { ok: true; total: number; delta: number } | { ok: false };

/**
 * Passform från profilen (docs/bevislagring.md 5.1, byggordning punkt 5).
 * Sparar ett svar på en av de fyra passformsfrågorna som ett bevis av sorten
 * profileFitAnswer, med Sparks egen källa "Profilsamtalet" och dagens datum.
 * Grundaren är själv källan, så svaret är inte självrapporterat i B6:s mening
 * och räknas fullt (docs/bevislagring.md 11.1).
 *
 * Bara frågans id och svaret tas emot. Sort, källa, datum, användare och
 * projekt sätts här och i databasen (public.record_evidence), aldrig ur
 * indata. Poängen räknas om på servern, och sidhuvudets poäng uppdateras med
 * revalidatePath utan att sidan laddas om. Svaret är data, aldrig instruktion.
 */
export async function saveFitAnswer(questionId: unknown, answer: unknown): Promise<SaveFitAnswerResult> {
  if (!isFitQuestionId(questionId) || typeof answer !== "string") return { ok: false };
  const text = answer.trim();
  if (!text || text.length > FIT_ANSWER_MAX) return { ok: false };

  try {
    const result = await liveEvidenceRecorder.recordEvidence(
      {
        kind: "profileFitAnswer",
        subjectRef: fitSubjectRef(questionId),
        source: { namn: "spark:profile", hämtad: stockholmToday() },
        quote: text,
        stepNumber: 1,
      },
      "sv",
    );
    revalidatePath("/app", "layout");
    return { ok: true, total: result.snapshot.total, delta: result.snapshot.delta };
  } catch (error) {
    if (error instanceof EvidenceInputError || error instanceof EmptyStateError) return { ok: false };
    throw error;
  }
}

export type SaveRemainingAnswerResult =
  | { ok: true; answeredOn: string | null }
  | { ok: false; reason: "invalid" | "locked" };

/**
 * Svar på en fråga som återstår från profilsamtalet (spec v4 §3.2), under
 * Återstår i Minnet. Bara frågor utan svar kan besvaras när onboardingen är
 * klar, och bara de som grundarens ingång ställer: databasen
 * (public.save_onboarding_answer) prövar det med den sparade ingången. Här
 * bara formen. Svaret är data, aldrig instruktion. Ger inga bevis och ingen
 * poäng (onboardingen skapar aldrig passformsbevis, beslut 2026-10-02).
 */
export async function saveRemainingAnswer(questionId: unknown, answer: unknown): Promise<SaveRemainingAnswerResult> {
  if (typeof questionId !== "string" || typeof answer !== "string") return { ok: false, reason: "invalid" };
  const known = isOnboardingQuestionFor("noIdea", questionId) || isOnboardingQuestionFor("hasIdea", questionId);
  if (!known || !isValidOnboardingAnswer(questionId, answer)) return { ok: false, reason: "invalid" };

  let saved;
  try {
    saved = await liveProfileRepository.saveOnboardingAnswer({ questionId, answer });
  } catch (error) {
    if (error instanceof OnboardingAnswerInvalidError) return { ok: false, reason: "invalid" };
    if (error instanceof OnboardingAnswerLockedError) return { ok: false, reason: "locked" };
    throw error;
  }
  revalidatePath("/app/minnet");
  return { ok: true, answeredOn: saved.answeredOn };
}
