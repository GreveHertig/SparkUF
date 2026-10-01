// Passformsfrågorna (uppdrag 1.5, steg 01 "Om dig"; docs/bevislagring.md 5.1).
// Varje besvarad fråga sparas som ett bevis av sorten profileFitAnswer med
// subject_ref = fitSubjectRef(id). Listan är sluten: steg 01 kräver exakt de
// här fyra (core/journeyRequirements.ts och public.journey_step_requirements),
// så ett bevis med ett annat subject_ref räknas aldrig mot steget.
// Frågornas text ligger i i18n (`fitPanel.questions`).

export const FIT_QUESTION_IDS = ["skills", "network", "time", "money"] as const;

export type FitQuestionId = (typeof FIT_QUESTION_IDS)[number];

export function isFitQuestionId(value: unknown): value is FitQuestionId {
  return typeof value === "string" && (FIT_QUESTION_IDS as readonly string[]).includes(value);
}

/** subject_ref för en passformsfråga. Samma värden står i migrationens seed. */
export function fitSubjectRef(id: FitQuestionId): string {
  return `fit:${id}`;
}

/** Längsta svar som sparas (evidence.quote tar högst 1 000 tecken). */
export const FIT_ANSWER_MAX = 1000;
