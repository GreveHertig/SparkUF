// Kraven för att markera ett steg i resan som klart (uppdrag 1.4: "håller
// resten av resan låst tills det steget är klart"). Beslut 2026-10-01 i
// docs/beslut.md.
//
// Listan finns på två ställen: här och som seed i tabellen
// public.journey_step_requirements (supabase/migrations/
// 20261001150000_journey_step_completion.sql). Databasen är den bindande
// spärren: public.complete_journey_step prövar samma krav, och ingen klient kan
// skriva i journey_steps direkt. Den här filen finns för att UI:t ska kunna
// visa vad som saknas. supabase/migrations/journeyStepCompletion.pg.test.ts
// håller de två i synk och kör samma fall mot båda.
//
// Regler:
// - Föregående steg måste vara klart.
// - Ett steg utan rader här kan inte markeras klart alls (steg 06, 07 och 12
//   i dag: inget mätbart krav är beslutat, se öppna punkter i docs/beslut.md).
// - Kraven är grupper. Varje grupp måste vara uppfylld, och en grupp är
//   uppfylld av vilken som helst av sina rader.
// - Bara bevis som räknas uppfyller ett krav: inte återkallade och inte
//   äldre än sortens livslängd (beslut B9). Ett självrapporterat bevis över
//   taket (B6) finns ändå, så det uppfyller kravet.
import type { EvidenceKind } from "@/core/evidenceKinds";
import { FIT_QUESTION_IDS, fitSubjectRef, type FitQuestionId } from "@/core/fitQuestions";

export type RequirementGroup =
  | `fit_${FitQuestionId}`
  | "activeProject"
  | "marketCount"
  | "competitorSet"
  | "problem"
  | "willingnessToPay"
  | "productScope"
  | "registration"
  | "published"
  | "payingCustomer";

export type StepRequirement =
  | { group: RequirementGroup; evidenceKind: EvidenceKind; subjectRef: string | null }
  | { group: RequirementGroup; condition: "activeProject" };

export const STEP_REQUIREMENTS: Readonly<Partial<Record<number, readonly StepRequirement[]>>> = {
  1: FIT_QUESTION_IDS.map((id) => ({
    group: `fit_${id}` as const,
    evidenceKind: "profileFitAnswer" as const,
    subjectRef: fitSubjectRef(id),
  })),
  2: [{ group: "activeProject", condition: "activeProject" }],
  3: [{ group: "marketCount", evidenceKind: "registerMarketCount", subjectRef: null }],
  4: [{ group: "competitorSet", evidenceKind: "registerCompetitorSet", subjectRef: null }],
  5: [
    { group: "problem", evidenceKind: "customerProblemConfirmed", subjectRef: null },
    { group: "problem", evidenceKind: "customerProblemRejected", subjectRef: null },
    { group: "willingnessToPay", evidenceKind: "customerPriceAccepted", subjectRef: null },
    { group: "willingnessToPay", evidenceKind: "customerPriceDeclined", subjectRef: null },
  ],
  8: [{ group: "productScope", evidenceKind: "productScopeFromEvidence", subjectRef: null }],
  9: [{ group: "registration", evidenceKind: "formalRegistrationDone", subjectRef: null }],
  10: [{ group: "published", evidenceKind: "productPublished", subjectRef: null }],
  11: [{ group: "payingCustomer", evidenceKind: "payingCustomer", subjectRef: null }],
};

/** Ett bevis som räknas just nu (inte återkallat, inte för gammalt). */
export type CountedEvidenceRef = { kind: EvidenceKind; subjectRef: string };

export type StepCompletion =
  | { status: "done" }
  | { status: "previousNotDone" }
  | { status: "noRequirementYet" }
  | { status: "missing"; missing: RequirementGroup[] }
  | { status: "completable" };

export type StepCompletionInput = {
  stepNumber: number;
  completedStepNumbers: readonly number[];
  countedEvidence: readonly CountedEvidenceRef[];
  hasActiveProject: boolean;
};

function satisfied(requirement: StepRequirement, input: StepCompletionInput): boolean {
  if ("condition" in requirement) return input.hasActiveProject;
  return input.countedEvidence.some(
    (evidence) =>
      evidence.kind === requirement.evidenceKind &&
      (requirement.subjectRef === null || evidence.subjectRef === requirement.subjectRef),
  );
}

/** Kan steget markeras klart, och vad saknas annars? Ren funktion, samma
 * regler som public.complete_journey_step. */
export function stepCompletion(input: StepCompletionInput): StepCompletion {
  const completed = new Set(input.completedStepNumbers);
  if (completed.has(input.stepNumber)) return { status: "done" };
  if (input.stepNumber > 1 && !completed.has(input.stepNumber - 1)) return { status: "previousNotDone" };

  const requirements = STEP_REQUIREMENTS[input.stepNumber];
  if (!requirements || requirements.length === 0) return { status: "noRequirementYet" };

  const groups = [...new Set(requirements.map((requirement) => requirement.group))];
  const missing = groups.filter(
    (group) => !requirements.some((requirement) => requirement.group === group && satisfied(requirement, input)),
  );
  return missing.length > 0 ? { status: "missing", missing } : { status: "completable" };
}
