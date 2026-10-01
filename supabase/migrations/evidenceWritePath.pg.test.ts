// @vitest-environment node
// Skrivvägen för bevis mot en riktig Postgres (PGlite, se test/pgMigrations.ts).
// Bevisar fel 1 i docs/bevislagring.md avsnitt 0 rättat: en användare kan inte
// sätta egna poäng, egen del eller en annan användare, varken direkt mot
// tabellen eller via funktionen. Inte heller servern med service role kan
// sätta egna poäng: triggern tar dem ur sorten.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";
import { EVIDENCE_KINDS, SELF_REPORTED_MULTIPLIER } from "@/core/evidenceKinds";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;
let projectA: string;

type RecordResult = { evidence_id: string; status: string };

function record(userId: string | null, kind: string, subject: string, options: { date?: string; source?: string } = {}) {
  return queryAs<RecordResult>(
    db,
    userId,
    "select * from public.record_evidence($1, $2, $3, null, $4, 'Ett citat', 5::smallint, 'Validering')",
    [kind, subject, options.source ?? "Bolag AB", options.date ?? "2026-09-01"],
  );
}

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
  const { rows } = await db.query<{ id: string }>(
    "insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'A', 'a', true) returning id",
    [A],
  );
  projectA = rows[0].id;
  await db.query("insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'B', 'b', true)", [B]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("evidence: egna poäng avvisas (fel 1, 7.1)", () => {
  it("en direkt insert med egna points som inloggad användare nekas", async () => {
    const result = await queryAs(
      db,
      A,
      `insert into public.evidence (user_id, project_id, part_id, points, data_type, source_name, fetched_at, kind, subject_ref, entered_by, module)
       values ($1, $2, 'problem', 99, 'customer', 'Påhittad', '2026-09-01', 'customerProblemConfirmed', 'bolag-x', 'system', 'x')`,
      [A, projectA],
    );
    expect(result.error).toMatch(/permission denied/);
    const { rows } = await db.query("select 1 from public.evidence where subject_ref = 'bolag-x'");
    expect(rows).toHaveLength(0);
  });

  it("record_evidence tar inte ens emot points, del eller användare", async () => {
    const { rows } = await db.query<{ args: string }>(
      "select pg_get_function_arguments('public.record_evidence'::regproc) as args",
    );
    expect(rows[0].args).not.toMatch(/points|part|user|project|entered_by|contradicts|data_type/);
  });

  it("poängen sätts ur sorten: ett självrapporterat kundsvar ger halva sortens poäng", async () => {
    const result = await record(A, "customerProblemConfirmed", "bolag-1");
    expect(result.rows?.[0].status).toBe("recorded");
    const { rows } = await db.query<{ points: string; part_id: string; entered_by: string; user_id: string }>(
      "select points, part_id, entered_by, user_id from public.evidence where id = $1",
      [result.rows![0].evidence_id],
    );
    expect(Number(rows[0].points)).toBe(EVIDENCE_KINDS.customerProblemConfirmed.basePoints * SELF_REPORTED_MULTIPLIER);
    expect(rows[0]).toMatchObject({ part_id: "problem", entered_by: "founder", user_id: A });
  });

  it("inte heller servern (service role) kan sätta egna poäng, del eller datatyp", async () => {
    const result = await queryAs<{ points: string; part_id: string; data_type: string; contradicts: boolean }>(
      db,
      null,
      `insert into public.evidence (user_id, project_id, part_id, points, data_type, contradicts, source_name, source_url, fetched_at, kind, subject_ref, entered_by, module)
       values ($1, $2, 'traction', 99, 'register', true, 'SCB', 'https://scb.se', '2026-09-01', 'registerMarketCount', 'sni-62', 'system', 'Registret')
       returning points, part_id, data_type, contradicts`,
      [A, projectA],
    );
    expect(result.error).toBeNull();
    expect(Number(result.rows![0].points)).toBe(EVIDENCE_KINDS.registerMarketCount.basePoints);
    expect(result.rows![0]).toMatchObject({ part_id: "market", data_type: "register", contradicts: false });
  });

  it("ett sparat bevis kan inte ändras i efterhand, inte ens av servern", async () => {
    expect((await queryAs(db, A, "update public.evidence set points = 99")).error).toMatch(/permission denied/);
    expect((await queryAs(db, null, "update public.evidence set points = 99 where subject_ref = 'sni-62'")).error).toMatch(
      /kan inte ändras/,
    );
  });

  it("delete och skrivningar i score_snapshots och evidence_kinds nekas", async () => {
    expect((await queryAs(db, A, "delete from public.evidence")).error).toMatch(/permission denied/);
    expect(
      (
        await queryAs(db, A, "insert into public.score_snapshots (user_id, project_id, total, phase) values ($1, $2, 99, 'grow')", [
          A,
          projectA,
        ])
      ).error,
    ).toMatch(/permission denied/);
    expect(
      (await queryAs(db, A, "update public.evidence_kinds set base_points = 100")).error,
    ).toMatch(/permission denied/);
  });
});

describe("record_evidence: regler", () => {
  it("samma sort, sak och datum ger duplicate", async () => {
    expect((await record(A, "customerProblemConfirmed", "bolag-1")).rows?.[0].status).toBe("duplicate");
  });

  it("ett nytt besked från samma bolag i samma del ersätter det gamla (7.2b)", async () => {
    const result = await record(A, "customerProblemRejected", "bolag-1", { date: "2026-09-10" });
    expect(result.rows?.[0].status).toBe("replaced");
    const { rows } = await db.query(
      "select kind from public.evidence where subject_ref = 'bolag-1' and retracted_at is null",
    );
    expect(rows).toEqual([{ kind: "customerProblemRejected" }]);
  });

  it("grundaren kan inte ersätta ett svar Spark tagit emot (7.7)", async () => {
    await queryAs(
      db,
      null,
      `insert into public.evidence (user_id, project_id, part_id, points, data_type, source_name, source_url, fetched_at, kind, subject_ref, entered_by, module)
       values ($1, $2, 'problem', 0, 'customer', 'Svar', 'https://x.se', '2026-09-01', 'customerProblemRejected', 'bolag-9', 'system', 'Utskick')`,
      [A, projectA],
    );
    expect((await record(A, "customerProblemConfirmed", "bolag-9")).error).toMatch(/Spark tagit emot/);
  });

  it("nekar registerdata, okänd sort, framtida datum, tomt källnamn och anrop utan inloggning", async () => {
    expect((await record(A, "registerMarketCount", "sni-1")).error).toMatch(/bara läggas in av systemet/);
    expect((await record(A, "madeUp", "x")).error).toMatch(/Okänd bevissort/);
    expect((await record(A, "customerPriceAccepted", "bolag-2", { date: "2099-01-01" })).error).toMatch(/framtiden/);
    expect((await record(A, "customerPriceAccepted", "bolag-2", { source: "   " })).error).toMatch(/source_name_not_blank/);
    expect((await record(null, "customerPriceAccepted", "bolag-2")).error).toMatch(/Inte inloggad/);
    expect((await record(A, "customerPriceAccepted", "bolag-2", { source: "spark:profile" })).error).toMatch(/Sparks egna/);
    const badUrl = await queryAs(
      db,
      A,
      "select * from public.record_evidence('customerPriceAccepted', 'bolag-3', 'Bolag AB', 'javascript:alert(1)', '2026-09-01', null, null, 'm')",
    );
    expect(badUrl.error).toMatch(/source_url_http/);
    expect((await record(A, "profileFitAnswer", "q-time", { source: "spark:profile" })).error).toBeNull();
  });

  it("B ser inte A:s bevis och kan inte återkalla dem", async () => {
    const seen = await queryAs<{ n: number }>(db, B, "select count(*)::int as n from public.evidence");
    expect(seen.rows?.[0].n).toBe(0);
    const { rows } = await db.query<{ id: string }>(
      "select id from public.evidence where subject_ref = 'bolag-1' and retracted_at is null",
    );
    expect((await queryAs(db, B, "select public.retract_evidence($1, 'kapad')", [rows[0].id])).error).toMatch(
      /kan inte återkallas/,
    );
  });

  it("A kan återkalla ett eget bevis, men bara med en anledning, och aldrig ett systembevis", async () => {
    const own = await db.query<{ id: string }>(
      "select id from public.evidence where subject_ref = 'bolag-1' and retracted_at is null",
    );
    expect((await queryAs(db, A, "select public.retract_evidence($1, '')", [own.rows[0].id])).error).toMatch(/anledning/);
    expect((await queryAs(db, A, "select public.retract_evidence($1, 'Fel bolag')", [own.rows[0].id])).error).toBeNull();

    const system = await db.query<{ id: string }>("select id from public.evidence where subject_ref = 'sni-62'");
    expect((await queryAs(db, A, "select public.retract_evidence($1, 'vill inte')", [system.rows[0].id])).error).toMatch(
      /kan inte återkallas/,
    );
  });
});

// docs/bevislagring.md 2.4: sorterna finns i core/evidenceKinds.ts och som
// seed i public.evidence_kinds. Databasen sätter poängen ur sin kopia, så de
// får aldrig glida isär.
describe("evidence_kinds stämmer med core/evidenceKinds.ts", () => {
  it("samma sorter med samma del, datatyp, poäng, motsäger, inmatare och livslängd", async () => {
    const { rows } = await db.query<{
      kind: string;
      part_id: string;
      data_type: string;
      base_points: string;
      contradicts: boolean;
      entered_by: string;
      fresh_for_days: number | null;
    }>("select * from public.evidence_kinds order by kind");
    const fromDb = Object.fromEntries(
      rows.map((row) => [
        row.kind,
        {
          partId: row.part_id,
          dataType: row.data_type,
          basePoints: Number(row.base_points),
          contradicts: row.contradicts,
          enteredBy: row.entered_by,
          freshForDays: row.fresh_for_days,
        },
      ]),
    );
    const fromCore = Object.fromEntries(
      Object.entries(EVIDENCE_KINDS).map(([kind, spec]) => [
        kind,
        {
          partId: spec.partId,
          dataType: spec.dataType,
          basePoints: spec.basePoints,
          contradicts: spec.contradicts,
          enteredBy: spec.enteredBy,
          freshForDays: spec.freshForDays,
        },
      ]),
    );
    expect(fromDb).toEqual(fromCore);
  });

  it("självrapporteringens faktor i triggern är SELF_REPORTED_MULTIPLIER", async () => {
    const { rows } = await db.query<{ src: string }>(
      "select prosrc as src from pg_proc where proname = 'evidence_derive_from_kind'",
    );
    expect(rows[0].src).toContain(`then ${SELF_REPORTED_MULTIPLIER} else 1`);
  });
});
