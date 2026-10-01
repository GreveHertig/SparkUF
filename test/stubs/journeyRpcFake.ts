// Fejkad complete_journey_step för adapter- och kontraktstester utan Postgres.
// Prövar kraven med stepCompletion (core/journeyRequirements.ts), som
// journeyStepCompletion.pg.test.ts håller i samma läge som databasfunktionen.
// Sanningen om databasens regler prövas mot Postgres där. Testkod.
import { stepCompletion, type CountedEvidenceRef } from "@/core/journeyRequirements";
import { isStale } from "@/core/evidenceInput";
import { isEvidenceKind } from "@/core/evidenceKinds";
import type { FakeRpcHandlers, FakeTables } from "./supabaseFake";

export function journeyRpcFake(userId: string, projectId: string, todayIso: string): FakeRpcHandlers {
  return {
    complete_journey_step(args: Record<string, unknown>, store: FakeTables) {
      const stepNumber = args.p_step_number as number;
      const steps = (store.journey_steps ??= []);
      const completed = steps
        .filter((row) => row.project_id === projectId && row.completed_at !== null)
        .map((row) => row.step_number as number);
      const countedEvidence: CountedEvidenceRef[] = (store.evidence ?? []).flatMap((row) =>
        row.project_id === projectId &&
        row.retracted_at === null &&
        isEvidenceKind(row.kind) &&
        !isStale(row.kind, row.fetched_at as string, todayIso)
          ? [{ kind: row.kind, subjectRef: row.subject_ref as string }]
          : [],
      );
      const result = stepCompletion({ stepNumber, completedStepNumbers: completed, countedEvidence, hasActiveProject: true });
      if (result.status === "done") return null;
      if (result.status !== "completable") throw new Error(`Stegets krav är inte uppfyllda (${result.status}).`);
      steps.push({ user_id: userId, project_id: projectId, step_number: stepNumber, completed_at: `${todayIso}T00:00:00Z` });
      return `${todayIso}T00:00:00Z`;
    },
  };
}
