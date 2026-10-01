import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { PhaseId } from "@/core/score";
import type { RequirementGroup, StepCompletion } from "@/core/journeyRequirements";

/** Kan steget markeras klart, och vad saknas annars? */
export type StepCompletionView = {
  stepNumber: number;
  status: StepCompletion["status"];
  /** Kraven som saknas, i den ordning de står i core/journeyRequirements.ts.
   * Tom utom vid status "missing". Texten slås upp i i18n (`stepCompletion.requirements`). */
  missing: RequirementGroup[];
};

export type CompleteStepResult = {
  /** Poängen direkt efter, räknad av calculateScore i den nya fasen. */
  snapshot: ScoreSnapshot;
  phaseBefore: PhaseId;
  phaseAfter: PhaseId;
};

/**
 * Modul: Resan, skrivvägen (beslut 2026-10-01, docs/beslut.md). En egen port
 * bredvid JourneyRepository, av samma skäl som EvidenceRecorder: typsystemet
 * visar vilka moduler som kan påverka fasen och därmed poängens tak.
 * Liveadaptern bygger på public.complete_journey_step, som är den bindande
 * spärren. Demots resa är manusstyrd per moment, så demoadaptern sparar
 * ingenting.
 */
export interface JourneyProgress {
  getStepCompletion(stepNumber: number, locale: Locale): Promise<StepCompletionView>;
  /** Markerar steget som klart om kraven är uppfyllda. Idempotent: ett redan
   * klart steg ger poängen oförändrad. Kastar annars, utan att ändra något. */
  completeStep(stepNumber: number, locale: Locale): Promise<CompleteStepResult>;
}
