// Fejkade record_evidence och retract_evidence för adapter- och
// kontraktstester utan Postgres. Speglar reglerna i
// supabase/migrations/20261001120000_evidence_write_path.sql i förenklad form.
// Sanningen om de reglerna prövas mot en riktig Postgres i
// supabase/migrations/evidenceWritePath.pg.test.ts. Testkod.
import { randomUUID } from "node:crypto";
import { EVIDENCE_KINDS, SELF_REPORTED_MULTIPLIER, isEvidenceKind } from "@/core/evidenceKinds";
import type { FakeRow, FakeRpcHandlers, FakeTables } from "./supabaseFake";

export function evidenceRpcFake(userId: string, projectId: string, clock: () => string = () => new Date().toISOString()): FakeRpcHandlers {
  return {
    record_evidence(args: Record<string, unknown>, store: FakeTables) {
      const kind = args.p_kind as string;
      if (!isEvidenceKind(kind)) throw new Error("Okänd bevissort.");
      const spec = EVIDENCE_KINDS[kind];
      if (spec.enteredBy === "system") throw new Error("Den här sorten kan bara läggas in av systemet.");
      const evidence = (store.evidence ??= []);
      const live = (row: FakeRow) => row.project_id === projectId && row.retracted_at === null;

      const duplicate = evidence.find(
        (row) => live(row) && row.kind === kind && row.subject_ref === args.p_subject_ref && row.fetched_at === args.p_fetched_at,
      );
      if (duplicate) return [{ evidence_id: duplicate.id, status: "duplicate" }];

      const samePart = (row: FakeRow) => live(row) && row.part_id === spec.partId && row.subject_ref === args.p_subject_ref;
      if (evidence.some((row) => samePart(row) && row.entered_by === "system")) {
        throw new Error("Det finns redan ett bevis om det här som Spark tagit emot.");
      }
      let replaced = 0;
      for (const row of evidence) {
        if (samePart(row) && row.entered_by === "founder") {
          row.retracted_at = clock();
          row.retracted_reason = "Ersatt av ett nyare bevis om samma sak.";
          replaced += 1;
        }
      }

      const id = randomUUID();
      evidence.push({
        id,
        user_id: userId,
        project_id: projectId,
        kind,
        part_id: spec.partId,
        data_type: spec.dataType,
        contradicts: spec.contradicts,
        points: spec.basePoints * (spec.enteredBy === "either" ? SELF_REPORTED_MULTIPLIER : 1),
        entered_by: "founder",
        subject_ref: args.p_subject_ref,
        source_name: args.p_source_name,
        source_url: args.p_source_url,
        fetched_at: args.p_fetched_at,
        quote: args.p_quote,
        created_at: clock(),
        retracted_at: null,
      });
      return [{ evidence_id: id, status: replaced > 0 ? "replaced" : "recorded" }];
    },

    retract_evidence(args: Record<string, unknown>, store: FakeTables) {
      const row = (store.evidence ?? []).find(
        (candidate) =>
          candidate.id === args.p_evidence_id &&
          candidate.user_id === userId &&
          candidate.entered_by === "founder" &&
          candidate.retracted_at === null,
      );
      if (!row) throw new Error("Beviset finns inte eller kan inte återkallas.");
      row.retracted_at = clock();
      row.retracted_reason = args.p_reason;
      return null;
    },
  };
}

/** En lagrad bevisrad som databasen skulle ha skrivit den. */
export function storedEvidenceRow(
  userId: string,
  projectId: string,
  overrides: Partial<FakeRow> & { kind: keyof typeof EVIDENCE_KINDS },
): FakeRow {
  const spec = EVIDENCE_KINDS[overrides.kind];
  const enteredBy = (overrides.entered_by as string | undefined) ?? (spec.enteredBy === "founder" ? "founder" : "system");
  const selfReported = enteredBy === "founder" && spec.enteredBy === "either";
  return {
    id: randomUUID(),
    user_id: userId,
    project_id: projectId,
    part_id: spec.partId,
    data_type: spec.dataType,
    contradicts: spec.contradicts,
    points: spec.basePoints * (selfReported ? SELF_REPORTED_MULTIPLIER : 1),
    entered_by: enteredBy,
    subject_ref: `${overrides.kind}-subject`,
    source_name: "Testkälla",
    source_url: spec.dataType === "register" ? "https://example.se" : null,
    fetched_at: "2026-09-01",
    quote: null,
    created_at: "2026-09-01T00:00:00Z",
    retracted_at: null,
    ...overrides,
  };
}
