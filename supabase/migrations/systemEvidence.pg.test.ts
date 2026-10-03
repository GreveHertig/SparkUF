// @vitest-environment node
// Systembevisen från Marknad (lib/server/systemEvidence.ts) mot en riktig
// Postgres (PGlite, se test/pgMigrations.ts): exakt de rader servern skriver
// med service role när grundaren väljer bransch, dubblettspärren och
// återkallelsen vid byte av bransch. Ingen ny migrering behövs för steg 03.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";
import { EVIDENCE_KINDS } from "@/core/evidenceKinds";

const A = "00000000-0000-0000-0000-0000000000c1";
let db: PGlite;
let project: string;

/** Samma kolumner som writeSystemEvidence skickar. */
function insertSystem(kind: string, subjectRef: string, userId: string | null = null) {
  return queryAs<{ id: string; points: string; part_id: string; data_type: string; step_number: number }>(
    db,
    userId,
    `insert into public.evidence (user_id, project_id, kind, subject_ref, source_name, source_url, fetched_at, quote, module, step_number, entered_by, part_id, data_type, contradicts, points)
     values ($1, $2, $3, $4, 'SCB:s företagsregister', 'https://www.scb.se/vara-tjanster/foretagsregistret/', '2026-10-04', '4210', 'Marknad', 3, 'system', 'market', 'register', false, 4)
     returning id, points, part_id, data_type, step_number`,
    [A, project, kind, subjectRef],
  );
}

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1)", [A]);
  const { rows } = await db.query<{ id: string }>(
    "insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'Laddkollen', 'Laddboxar', true) returning id",
    [A],
  );
  project = rows[0].id;
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("systembevis från Marknad", () => {
  it("servern sparar antalet bolag; del, datatyp och poäng kommer ur sorten", async () => {
    const result = await insertSystem("registerMarketCount", "sni:43.210");
    expect(result.error).toBeNull();
    expect(result.rows![0]).toMatchObject({ part_id: "market", data_type: "register", step_number: 3 });
    expect(Number(result.rows![0].points)).toBe(EVIDENCE_KINDS.registerMarketCount.basePoints);
  });

  it("samma bransch igen nekas av unika indexet (servern visar det som duplicate)", async () => {
    const result = await insertSystem("registerMarketCount", "sni:43.210");
    expect(result.error).toMatch(/duplicate key|unique/);
  });

  it("grundaren kan inte skriva registerbevis själv, varken direkt eller via record_evidence", async () => {
    expect((await insertSystem("registerMarketCount", "sni:62.100", A)).error).toMatch(/permission denied/);
    const viaFunction = await queryAs(
      db,
      A,
      "select * from public.record_evidence('registerMarketCount', 'sni:62.100', 'SCB', 'https://scb.se', '2026-10-04', '9999', 3::smallint, 'Marknad')",
    );
    expect(viaFunction.error).toMatch(/systemet/);
  });

  it("vid byte av bransch återkallar servern det gamla, och samma bransch kan sedan sparas igen", async () => {
    const retract = await queryAs(
      db,
      null,
      `update public.evidence set retracted_at = now(), retracted_reason = 'Grundaren valde en annan bransch.'
       where project_id = $1 and user_id = $2 and entered_by = 'system' and retracted_at is null and subject_ref = 'sni:43.210'`,
      [project, A],
    );
    expect(retract.error).toBeNull();
    expect((await insertSystem("registerMarketCount", "sni:62.100")).error).toBeNull();
    const { rows } = await db.query<{ subject_ref: string }>(
      "select subject_ref from public.evidence where project_id = $1 and retracted_at is null",
      [project],
    );
    expect(rows.map((row) => row.subject_ref)).toEqual(["sni:62.100"]);
  });

  it("räcker för att klara steg 03 via public.complete_journey_step", async () => {
    const onboarded = await queryAs(db, A, "select public.complete_onboarding($1, $2::jsonb)", [
      "hasIdea",
      JSON.stringify({ situation: "employed", payer: "business", customer: "Bostadsrättsföreningar", talkedTo: "none" }),
    ]);
    expect(onboarded.error).toBeNull();
    for (const step of [1, 2, 3]) {
      const result = await queryAs(db, A, "select public.complete_journey_step($1::smallint) as completed_at", [step]);
      expect(result.error, `steg ${step}`).toBeNull();
    }
    // Steg 04 kräver konkurrenterna, som inte finns: det nekas.
    const step4 = await queryAs(db, A, "select public.complete_journey_step(4::smallint)");
    expect(step4.error).not.toBeNull();
  });
});
