// @vitest-environment node
// Valideringens samtalslogg mot en riktig Postgres (PGlite, se
// test/pgMigrations.ts): RLS, det unika indexet per bolag, triggern som
// hindrar status att gå bakåt och check-villkoren i
// 20261004100000_validation_contacts.sql.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const PROJECT_A = "00000000-0000-4000-8000-0000000000a1";
const PROJECT_B = "00000000-0000-4000-8000-0000000000b1";

let db: PGlite;

const INSERT =
  "insert into public.validation_contacts (user_id, project_id, company_name) values ($1, $2, $3) returning id";
const ANSWER = `update public.validation_contacts set status = 'responded', responded_on = current_date,
  size_class = 'tenToNineteen', problem_stance = 'confirms', price_stance = 'accepts', price_tested_kr = 990,
  quote = 'Vi lägger timmar på det varje vecka.' where id = $1 returning id`;

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
  await db.query(
    "insert into public.projects (id, user_id, name, one_liner) values ($1, $2, 'A', 'a'), ($3, $4, 'B', 'b')",
    [PROJECT_A, A, PROJECT_B, B],
  );
  await db.query(INSERT, [B, PROJECT_B, "B:s hemliga kund AB"]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("validation_contacts", () => {
  it("A kan lägga till, markera, svara och läsa sina egna bolag", async () => {
    const insert = await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Kvittly AB"]);
    expect(insert.error).toBeNull();
    const id = insert.rows![0].id;
    const contacted = await queryAs(
      db,
      A,
      "update public.validation_contacts set status = 'contacted', contacted_on = current_date, channel = 'phone' where id = $1 returning id",
      [id],
    );
    expect(contacted.rows).toHaveLength(1);
    expect((await queryAs(db, A, ANSWER, [id])).rows).toHaveLength(1);
    const read = await queryAs<{ status: string }>(db, A, "select status from public.validation_contacts where id = $1", [id]);
    expect(read.rows).toEqual([{ status: "responded" }]);
  });

  it("A ser, ändrar och tar aldrig bort B:s bolag", async () => {
    expect((await queryAs(db, A, "select * from public.validation_contacts where user_id = $1", [B])).rows).toEqual([]);
    const update = await queryAs(db, A, "update public.validation_contacts set quote = 'x' where user_id = $1 returning id", [B]);
    expect(update.rows).toEqual([]);
    expect((await queryAs(db, A, "delete from public.validation_contacts where user_id = $1 returning id", [B])).rows).toEqual([]);
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from public.validation_contacts where user_id = $1", [B]);
    expect(rows[0].n).toBe(1);
  });

  it("A kan inte skriva som B, och inte hänga ett bolag på B:s projekt", async () => {
    expect((await queryAs(db, A, INSERT, [B, PROJECT_B, "Förfalskat AB"])).error).toMatch(/row-level security/);
    expect((await queryAs(db, A, INSERT, [A, PROJECT_B, "Fel projekt AB"])).error).toMatch(/foreign key/);
  });

  it("samma bolag en gång per projekt, oavsett stora bokstäver och mellanslag", async () => {
    expect((await queryAs(db, A, INSERT, [A, PROJECT_A, "Bokbyrån Norr"])).error).toBeNull();
    expect((await queryAs(db, A, INSERT, [A, PROJECT_A, "BOKBYRÅN   norr "])).error).toMatch(/duplicate key/);
  });

  it("status går aldrig bakåt, och ett svar blir aldrig ett nej tack", async () => {
    const id = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Bakåt AB"])).rows![0].id;
    await queryAs(db, A, ANSWER, [id]);
    const back = await queryAs(db, A, "update public.validation_contacts set status = 'contacted' where id = $1", [id]);
    expect(back.error).toMatch(/bakåt/);
    const declined = await queryAs(db, A, "update public.validation_contacts set status = 'declined' where id = $1", [id]);
    expect(declined.error).toMatch(/bakåt/);
  });

  it("ett nej tack kan bli ett svar", async () => {
    const id = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Ångrade sig AB"])).rows![0].id;
    expect((await queryAs(db, A, "update public.validation_contacts set status = 'declined' where id = $1", [id])).error).toBeNull();
    expect((await queryAs(db, A, ANSWER, [id])).error).toBeNull();
  });

  it("ett ofullständigt svar nekas", async () => {
    const id = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Halvt svar AB"])).rows![0].id;
    const half = await queryAs(
      db,
      A,
      "update public.validation_contacts set status = 'responded', responded_on = current_date where id = $1",
      [id],
    );
    expect(half.error).toMatch(/answer_complete/);
  });

  it("ett svar kan inte tas bort, men ett planerat bolag kan det", async () => {
    const answered = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Kvar AB"])).rows![0].id;
    await queryAs(db, A, ANSWER, [answered]);
    expect((await queryAs(db, A, "delete from public.validation_contacts where id = $1 returning id", [answered])).rows).toEqual([]);
    const planned = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Borta AB"])).rows![0].id;
    expect((await queryAs(db, A, "delete from public.validation_contacts where id = $1 returning id", [planned])).rows).toHaveLength(1);
  });

  it("tomt namn, styrtecken, okänd kanal, datum i framtiden och negativa priser nekas", async () => {
    expect((await queryAs(db, A, INSERT, [A, PROJECT_A, "   "])).error).toMatch(/check/);
    expect((await queryAs(db, A, INSERT, [A, PROJECT_A, "Rad\nbrytning"])).error).toMatch(/check/);
    const id = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Checkar AB"])).rows![0].id;
    const set = (sql: string) => queryAs(db, A, `update public.validation_contacts set ${sql} where id = $1`, [id]);
    expect((await set("channel = 'fax'")).error).toMatch(/check/);
    expect((await set("contacted_on = current_date + 30")).error).toMatch(/check/);
    expect((await set("price_tested_kr = 0")).error).toMatch(/check/);
    expect((await set("counter_offer_kr = -5")).error).toMatch(/check/);
  });

  it("raden går inte att flytta till ett annat projekt", async () => {
    const id = (await queryAs<{ id: string }>(db, A, INSERT, [A, PROJECT_A, "Flytta AB"])).rows![0].id;
    const move = await queryAs(db, A, "update public.validation_contacts set project_id = $2 where id = $1", [id, PROJECT_B]);
    expect(move.error).not.toBeNull();
  });
});
