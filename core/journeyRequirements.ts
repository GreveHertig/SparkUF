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
// - Ett steg utan rader här kan inte markeras klart alls.
// - Kraven är grupper. Varje grupp måste vara uppfylld, och en grupp är
//   uppfylld av vilken som helst av sina rader.
// - En grupp kan ha en tröskel (GROUP_THRESHOLDS, tabellen
//   public.journey_step_group_thresholds): minst så många bevis som räknas,
//   sammanlagt över gruppens rader, från minst så många olika subject_ref.
//   Utan tröskel räcker ett bevis.
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
  | "payingCustomer"
  | "verdictAnswers"
  | "priceDecided"
  | "fundingApplied";

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
  // Steg 06–07 och 12: beslut 2026-10-01 i docs/beslut.md.
  6: [
    { group: "verdictAnswers", evidenceKind: "customerProblemConfirmed", subjectRef: null },
    { group: "verdictAnswers", evidenceKind: "customerProblemRejected", subjectRef: null },
    { group: "verdictAnswers", evidenceKind: "customerPriceAccepted", subjectRef: null },
    { group: "verdictAnswers", evidenceKind: "customerPriceDeclined", subjectRef: null },
  ],
  // Ett beslutat pris, inte ett godtaget: ett godtaget pris kräver svar
  // utifrån, vilket dubblerar steg 05 och 06. En kund som godtar priset är
  // ett eget bevis i Betalningsvilja, inte ett krav här.
  7: [{ group: "priceDecided", evidenceKind: "priceDecided", subjectRef: null }],
  8: [{ group: "productScope", evidenceKind: "productScopeFromEvidence", subjectRef: null }],
  9: [{ group: "registration", evidenceKind: "formalRegistrationDone", subjectRef: null }],
  10: [{ group: "published", evidenceKind: "productPublished", subjectRef: null }],
  11: [{ group: "payingCustomer", evidenceKind: "payingCustomer", subjectRef: null }],
  12: [{ group: "fundingApplied", evidenceKind: "fundingApplied", subjectRef: null }],
};

export type GroupThreshold = { minCount: number; minSubjects: number };

/** Grupper som kräver mer än ett bevis, per steg. Steg 06: minst fem
 * kundsvar från minst tre olika bolag (subject_ref). Motsägande svar räknas
 * med, och självrapporterade också (B6). */
export const GROUP_THRESHOLDS: Readonly<Partial<Record<number, Partial<Record<RequirementGroup, GroupThreshold>>>>> = {
  6: { verdictAnswers: { minCount: 5, minSubjects: 3 } },
};

const NO_THRESHOLD: GroupThreshold = { minCount: 1, minSubjects: 1 };

/** Hur långt en grupp med tröskel har kommit. */
export type GroupProgress = GroupThreshold & { count: number; subjects: number; group: RequirementGroup };

/** Ett bevis som räknas just nu (inte återkallat, inte för gammalt). */
export type CountedEvidenceRef = { kind: EvidenceKind; subjectRef: string };

export type StepCompletion =
  | { status: "done" }
  | { status: "previousNotDone" }
  | { status: "noRequirementYet" }
  | { status: "missing"; missing: RequirementGroup[]; progress: GroupProgress[] }
  | { status: "completable" };

export type StepCompletionInput = {
  stepNumber: number;
  completedStepNumbers: readonly number[];
  countedEvidence: readonly CountedEvidenceRef[];
  hasActiveProject: boolean;
};

function matches(requirement: StepRequirement, evidence: CountedEvidenceRef): boolean {
  return (
    "evidenceKind" in requirement &&
    evidence.kind === requirement.evidenceKind &&
    (requirement.subjectRef === null || evidence.subjectRef === requirement.subjectRef)
  );
}

/** Räknar en grupp: bevis som matchar någon av gruppens rader (varje bevis
 * en gång) och antalet olika subject_ref bland dem. Samma räkning som
 * public.complete_journey_step. */
function groupProgress(
  stepNumber: number,
  group: RequirementGroup,
  requirements: readonly StepRequirement[],
  input: StepCompletionInput,
): GroupProgress & { satisfied: boolean } {
  const threshold = GROUP_THRESHOLDS[stepNumber]?.[group] ?? NO_THRESHOLD;
  const rows = requirements.filter((requirement) => requirement.group === group);
  const hit = input.countedEvidence.filter((evidence) => rows.some((requirement) => matches(requirement, evidence)));
  const count = hit.length;
  const subjects = new Set(hit.map((evidence) => evidence.subjectRef)).size;
  const condition = rows.some((requirement) => "condition" in requirement) && input.hasActiveProject;
  return {
    group,
    ...threshold,
    count,
    subjects,
    satisfied: condition || (count >= threshold.minCount && subjects >= threshold.minSubjects),
  };
}

/** Kan steget markeras klart, och vad saknas annars? Ren funktion, samma
 * regler som public.complete_journey_step. */
export function stepCompletion(input: StepCompletionInput): StepCompletion {
  const completed = new Set(input.completedStepNumbers);
  if (completed.has(input.stepNumber)) return { status: "done" };
  if (input.stepNumber > 1 && !completed.has(input.stepNumber - 1)) return { status: "previousNotDone" };

  const requirements = STEP_REQUIREMENTS[input.stepNumber];
  if (!requirements || requirements.length === 0) return { status: "noRequirementYet" };

  const groups = [...new Set(requirements.map((requirement) => requirement.group))].map((group) =>
    groupProgress(input.stepNumber, group, requirements, input),
  );
  const missing = groups.filter((group) => !group.satisfied);
  if (missing.length === 0) return { status: "completable" };
  return {
    status: "missing",
    missing: missing.map((group) => group.group),
    progress: missing
      .filter((group) => GROUP_THRESHOLDS[input.stepNumber]?.[group.group] !== undefined)
      .map(({ group, minCount, minSubjects, count, subjects }) => ({ group, minCount, minSubjects, count, subjects })),
  };
}
