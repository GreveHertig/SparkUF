import type { CompleteStepResult, JourneyProgress, StepCompletionView } from "@/ports/JourneyProgress";
import type { Locale } from "@/i18n/context";
import { stepCompletion, type CountedEvidenceRef } from "@/core/journeyRequirements";
import { isStale } from "@/core/evidenceInput";
import { isEvidenceKind } from "@/core/evidenceKinds";
import { EmptyStateError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { getActiveProjectId } from "@/lib/server/activeProject";
import { computeScore, readCompletedStepNumbers, readEvidenceRows, stockholmToday, type EvidenceRow } from "./evidenceScore";
import { settleScore } from "./EvidenceRecorder";
import { liveMemoryRepository } from "./MemoryRepository";
import { scorePhaseForCompletedSteps } from "@/core/journey";
import { fill } from "@/i18n/fill";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

/**
 * Modul: Resan, skrivvägen (beslut 2026-10-01, docs/beslut.md).
 *
 * Ett steg markeras klart bara via databasfunktionen
 * public.complete_journey_step, som prövar föregående steg och stegets krav
 * mot bevis som räknas. Ingen klient kan skriva i journey_steps direkt
 * (supabase/migrations/journeyStepCompletion.pg.test.ts). Kontrollen här, med
 * stepCompletion ur core/journeyRequirements.ts, finns för att UI:t ska kunna
 * visa vad som saknas och för begripliga fel. Den bindande spärren är
 * databasen.
 *
 * Fasen räknas ur högsta avklarade steg (scorePhaseForCompletedSteps), så
 * efter ett avklarat steg räknas poängen om i den nya fasen, med det nya
 * taket, och en snapshot skrivs om totalen ändrats.
 */

const DOC = "docs/moduler/resan.md";
const MODULE = "Resan";
const dictionaries = { sv, en };

/** Steget kan inte markeras klart. Kastas innan något ändras. */
export class JourneyStepBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JourneyStepBlockedError";
  }
}

function assertStepNumber(stepNumber: unknown): asserts stepNumber is number {
  if (typeof stepNumber !== "number" || !Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 12) {
    throw new JourneyStepBlockedError("Okänt steg.");
  }
}

/** Bevis som räknas just nu: inte återkallade och inte för gamla (B9). */
function countedEvidence(rows: readonly EvidenceRow[], todayIso: string): CountedEvidenceRef[] {
  return rows.flatMap((row) =>
    isEvidenceKind(row.kind) && row.retracted_at === null && !isStale(row.kind, row.fetched_at, todayIso)
      ? [{ kind: row.kind, subjectRef: row.subject_ref }]
      : [],
  );
}

export const liveJourneyProgress: JourneyProgress = {
  async getStepCompletion(stepNumber: number): Promise<StepCompletionView> {
    assertStepNumber(stepNumber);
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    const [rows, completedStepNumbers] = projectId
      ? await Promise.all([
          readEvidenceRows(supabase, userId, projectId),
          readCompletedStepNumbers(supabase, userId, projectId),
        ])
      : [[], []];

    const result = stepCompletion({
      stepNumber,
      completedStepNumbers,
      countedEvidence: countedEvidence(rows, stockholmToday()),
      hasActiveProject: projectId !== null,
    });
    return { stepNumber, status: result.status, missing: result.status === "missing" ? result.missing : [] };
  },

  async completeStep(stepNumber: number, locale: Locale): Promise<CompleteStepResult> {
    assertStepNumber(stepNumber);
    const { supabase, userId } = await requireSupabaseUser();
    const projectId = await getActiveProjectId(supabase, userId);
    if (!projectId) throw new EmptyStateError(MODULE, DOC);
    const context = { supabase, userId, projectId };

    const [before, completedBefore] = await Promise.all([
      computeScore(supabase, userId, projectId, locale),
      readCompletedStepNumbers(supabase, userId, projectId),
    ]);
    if (completedBefore.includes(stepNumber)) {
      return { snapshot: before.snapshot, phaseBefore: before.phase, phaseAfter: before.phase };
    }
    const { error } = await supabase.rpc("complete_journey_step", { p_step_number: stepNumber });
    if (error) throw new JourneyStepBlockedError(`Steget kunde inte markeras klart (${error.message}).`);

    const snapshot = await settleScore(context, before, locale, "unlocked");
    const phaseAfter = scorePhaseForCompletedSteps(await readCompletedStepNumbers(supabase, userId, projectId));
    await liveMemoryRepository.recordTraceEvent({
      module: MODULE,
      description: fill(dictionaries[locale].stepCompletion.trace, { step: String(stepNumber).padStart(2, "0") }),
      occurredAtIso: new Date().toISOString(),
    });
    return { snapshot, phaseBefore: before.phase, phaseAfter };
  },
};
