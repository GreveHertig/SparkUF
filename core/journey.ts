// Resans upplåsningslogik och de 12 stegens metadata (uppdrag 1.5, 14.2:
// "resans upplåsning ... delas av båda lägena"). Bara för liveadaptern
// (adapters/live/JourneyRepository.ts) — grundaren bad uttryckligen att
// adapters/demo/JourneyRepository.ts inte rörs i den här sessionen, så dess
// lokala `statusFor` är MEDVETET kvar oförändrad och oberoende av den här
// filen (docs/status.md, Session P1, flaggar dubbleringen som ett känt,
// godkänt avsteg — se docs/moduler/resan.md för den ursprungliga tanken att
// dela logiken).
import type { JourneyStepStatus } from "@/ports/JourneyRepository";
import type { PhaseId } from "@/core/score";

/** UI:ts fyra faser (avsnitt 6) — skilt från calculateScores fem interna
 * faser (7.3, `PhaseId` i core/score.ts). Samma uppdelning som
 * adapters/demo/sara.ts's `JourneyPhaseId`, men definierad separat här
 * (se filens header för varför de två inte delar en typ). */
export type UiJourneyPhaseId = "discover" | "tryPhase" | "launch" | "grow";

export type JourneyStepMeta = {
  stepNumber: number;
  journeyPhase: UiJourneyPhaseId;
  maxPoints: number;
};

/** maxPoints och journeyPhase per steg — samma sakuppgifter som
 * adapters/demo/sara.ts's SARA_STEPS (produktkonstanter ur uppdrag 1.5),
 * men utan titel/ingress: de är fri text och hör hemma i i18n
 * (`journeySteps`-nyckeln), inte hårdkodade här. */
export const JOURNEY_STEP_META: readonly JourneyStepMeta[] = [
  { stepNumber: 1, journeyPhase: "discover", maxPoints: 10 },
  { stepNumber: 2, journeyPhase: "discover", maxPoints: 12 },
  { stepNumber: 3, journeyPhase: "tryPhase", maxPoints: 12 },
  { stepNumber: 4, journeyPhase: "tryPhase", maxPoints: 8 },
  { stepNumber: 5, journeyPhase: "tryPhase", maxPoints: 18 },
  { stepNumber: 6, journeyPhase: "tryPhase", maxPoints: 18 },
  { stepNumber: 7, journeyPhase: "launch", maxPoints: 8 },
  { stepNumber: 8, journeyPhase: "launch", maxPoints: 12 },
  { stepNumber: 9, journeyPhase: "launch", maxPoints: 8 },
  { stepNumber: 10, journeyPhase: "launch", maxPoints: 12 },
  { stepNumber: 11, journeyPhase: "grow", maxPoints: 14 },
  { stepNumber: 12, journeyPhase: "grow", maxPoints: 14 },
];

/** Samma regel som demoadapterns lokala `statusFor` (avsiktligt duplicerad,
 * se filens header): ett steg före det aktuella är klart, det aktuella är
 * `current`, resten är låsta. Håller invarianten "högst ett `current`, inget
 * `done` efter ett `locked`" sann av konstruktion. */
export function deriveStepStatus(stepNumber: number, currentStepNumber: number): JourneyStepStatus {
  if (stepNumber < currentStepNumber) return "done";
  if (stepNumber === currentStepNumber) return "current";
  return "locked";
}

/** Högsta avklarade steg + 1, klämt till 1–12. En ny användare (ingen
 * avklarad) står på steg 1. */
export function deriveCurrentStepNumber(completedStepNumbers: readonly number[]): number {
  const highestCompleted = completedStepNumbers.reduce((max, n) => Math.max(max, n), 0);
  return Math.min(Math.max(highestCompleted + 1, 1), 12);
}

/** Vilken av calculateScores fem faser (core/score.ts, 7.3) ett givet
 * stegnummer motsvarar — EvidenceRepository behöver den för att räkna
 * poängen i rätt fas. Gränserna speglar UNLOCK_STEP i core/score.ts exakt
 * (fit/market unlockas steg 1/3, competition steg 3, problem/
 * willingnessToPay steg 5, product/feasibility steg 8/9, traction steg 11). */
export function scorePhaseForStep(stepNumber: number): PhaseId {
  if (stepNumber <= 2) return "discover";
  if (stepNumber <= 4) return "tryBeforeCalls";
  if (stepNumber <= 6) return "tryAfterCalls";
  if (stepNumber <= 10) return "launch";
  return "grow";
}
