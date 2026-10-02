// @vitest-environment node
// Pulsens omdöme och bevakningar mot en riktig Postgres (PGlite, se
// test/pgMigrations.ts): RLS, check-villkor och unikhet i
// 20261002120000_pulse_feedback_watches.sql.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;
let projectA: string;
let projectB: string;
let signalA: string;
let signalB: string;

async function insertSignal(userId: string, projectId: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `insert into public.pulse_signals (user_id, project_id, category, headline, why_it_matters, source_name, fetched_at)
     values ($1, $2, 'risk:costs', 'Rubrik', 'Varför', 'nyheter.se', '2026-10-02') returning id`,
    [userId, projectId],
  );
  return rows[0].id;
}

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
  const a = await db.query<{ id: string }>(
    "insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'A', 'a', true) returning id",
    [A],
  );
  const b = await db.query<{ id: string }>(
    "insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'B', 'b', true) returning id",
    [B],
  );
  projectA = a.rows[0].id;
  projectB = b.rows[0].id;
  signalA = await insertSignal(A, projectA);
  signalB = await insertSignal(B, projectB);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("pulse_feedback", () => {
  it("A kan ge omdöme om sin egen signal och ändra det", async () => {
    const insert = await queryAs(
      db,
      A,
      "insert into public.pulse_feedback (user_id, signal_id, verdict) values ($1, $2, 'relevant')",
      [A, signalA],
    );
    expect(insert.error).toBeNull();
    const update = await queryAs(
      db,
      A,
      "update public.pulse_feedback set verdict = 'not_relevant' where signal_id = $1 returning verdict",
      [signalA],
    );
    expect(update.rows).toEqual([{ verdict: "not_relevant" }]);
  });

  it("B ser, ändrar och raderar inte A:s omdöme", async () => {
    expect((await queryAs(db, B, "select * from public.pulse_feedback")).rows).toEqual([]);
    const update = await queryAs(db, B, "update public.pulse_feedback set verdict = 'relevant' returning 1");
    expect(update.rows).toEqual([]);
    const del = await queryAs(db, B, "delete from public.pulse_feedback returning 1");
    expect(del.rows).toEqual([]);
  });

  it("B kan inte ge omdöme om A:s signal, varken i eget eller A:s namn", async () => {
    const own = await queryAs(
      db,
      B,
      "insert into public.pulse_feedback (user_id, signal_id, verdict) values ($1, $2, 'relevant')",
      [B, signalA],
    );
    expect(own.error).toMatch(/row-level security/);
    const asA = await queryAs(
      db,
      B,
      "insert into public.pulse_feedback (user_id, signal_id, verdict) values ($1, $2, 'relevant')",
      [A, signalB],
    );
    expect(asA.error).toMatch(/row-level security/);
  });

  it("bara de två omdömena är tillåtna", async () => {
    const result = await queryAs(
      db,
      B,
      "insert into public.pulse_feedback (user_id, signal_id, verdict) values ($1, $2, 'kanske')",
      [B, signalB],
    );
    expect(result.error).toMatch(/check constraint/);
  });

  it("omdömet försvinner med signalen", async () => {
    const extra = await insertSignal(A, projectA);
    await queryAs(db, A, "insert into public.pulse_feedback (user_id, signal_id, verdict) values ($1, $2, 'relevant')", [
      A,
      extra,
    ]);
    await db.query("delete from public.pulse_signals where id = $1", [extra]);
    const { rows } = await db.query("select 1 from public.pulse_feedback where signal_id = $1", [extra]);
    expect(rows).toHaveLength(0);
  });
});

describe("pulse_watches", () => {
  it("A kan lägga till och läsa en bevakning i sitt projekt", async () => {
    const insert = await queryAs(
      db,
      A,
      "insert into public.pulse_watches (user_id, project_id, kind, term) values ($1, $2, 'competitor', 'ByråFlöde') returning term",
      [A, projectA],
    );
    expect(insert.rows).toEqual([{ term: "ByråFlöde" }]);
    expect((await queryAs(db, A, "select term from public.pulse_watches")).rows).toEqual([{ term: "ByråFlöde" }]);
  });

  it("samma ord två gånger i samma projekt nekas, oavsett stora och små bokstäver", async () => {
    const result = await queryAs(
      db,
      A,
      "insert into public.pulse_watches (user_id, project_id, kind, term) values ($1, $2, 'keyword', 'byråflöde')",
      [A, projectA],
    );
    expect(result.error).toMatch(/duplicate key/);
  });

  it.each([
    ["för kort", "x"],
    ["för långt", "x".repeat(61)],
    ["styrtecken", "Byrå\u0007Flöde"],
  ])("ordet nekas: %s", async (_label, term) => {
    const result = await queryAs(
      db,
      A,
      "insert into public.pulse_watches (user_id, project_id, kind, term) values ($1, $2, 'keyword', $3)",
      [A, projectA, term],
    );
    expect(result.error).toMatch(/check constraint/);
  });

  it("B ser, ändrar och raderar inte A:s bevakningar", async () => {
    expect((await queryAs(db, B, "select * from public.pulse_watches")).rows).toEqual([]);
    expect((await queryAs(db, B, "update public.pulse_watches set term = 'kapad' returning 1")).rows).toEqual([]);
    expect((await queryAs(db, B, "delete from public.pulse_watches returning 1")).rows).toEqual([]);
  });

  it("B kan inte lägga en bevakning i A:s projekt", async () => {
    const asA = await queryAs(
      db,
      B,
      "insert into public.pulse_watches (user_id, project_id, kind, term) values ($1, $2, 'keyword', 'kapat')",
      [A, projectA],
    );
    expect(asA.error).toMatch(/row-level security/);
    const ownUserOtherProject = await queryAs(
      db,
      B,
      "insert into public.pulse_watches (user_id, project_id, kind, term) values ($1, $2, 'keyword', 'kapat')",
      [B, projectA],
    );
    expect(ownUserOtherProject.error).toMatch(/foreign key/);
  });

  it("A kan inte ändra en bevakning (ingen update-policy), bara ta bort den", async () => {
    expect((await queryAs(db, A, "update public.pulse_watches set term = 'Nytt' returning 1")).rows).toEqual([]);
    expect((await queryAs(db, A, "delete from public.pulse_watches returning 1")).rows).toHaveLength(1);
  });
});
