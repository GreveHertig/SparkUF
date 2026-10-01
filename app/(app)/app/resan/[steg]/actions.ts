"use server";

import { revalidatePath } from "next/cache";
import { liveJourneyProgress, JourneyStepBlockedError } from "@/adapters/live/JourneyProgress";
import { EmptyStateError } from "@/core/errors";

export type CompleteStepActionResult = { ok: true; total: number } | { ok: false };

/**
 * Markerar ett steg i resan som klart (beslut 2026-10-01, docs/beslut.md).
 * Tar bara emot stegnumret. Kraven prövas av public.complete_journey_step i
 * databasen, som är den bindande spärren. Fasen räknas ur högsta avklarade
 * steg, så poängen räknas om med det nya taket, och skalets poäng och steg
 * uppdateras med revalidatePath utan att sidan laddas om.
 */
export async function completeJourneyStep(stepNumber: unknown): Promise<CompleteStepActionResult> {
  if (typeof stepNumber !== "number" || !Number.isInteger(stepNumber)) return { ok: false };
  try {
    const result = await liveJourneyProgress.completeStep(stepNumber, "sv");
    revalidatePath("/app", "layout");
    return { ok: true, total: result.snapshot.total };
  } catch (error) {
    if (error instanceof JourneyStepBlockedError || error instanceof EmptyStateError) return { ok: false };
    throw error;
  }
}
