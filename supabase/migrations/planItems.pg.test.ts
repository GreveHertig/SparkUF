// @vitest-environment node
// Min plan mot en riktig Postgres (PGlite, se test/pgMigrations.ts): RLS,
// det unika indexet och check-villkoren i 20261003180000_plan_items.sql och
// egna uppgifter i 20261003210000_plan_items_egna.sql.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const SIGNAL = "00000000-0000-4000-8000-000000000001";
const OTHER_SIGNAL = "00000000-0000-4000-8000-000000000002";

let db: PGlite;

const INSERT =
  "insert into public.plan_items (user_id, text, context, origin, origin_ref) values ($1, $2, $3, 'pulsen', $4) returning id";

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
  await db.query(INSERT, [B, "B:s hemliga steg", null, SIGNAL]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("plan_items", () => {
  it("A kan spara, läsa, bocka av och ta bort sina egna uppgifter", async () => {
    const insert = await queryAs<{ id: string }>(db, A, INSERT, [A, "Läs villkoren", "Bidrag", SIGNAL]);
    expect(insert.error).toBeNull();
    const id = insert.rows![0].id;
    const update = await queryAs(db, A, "update public.plan_items set done = true where id = $1 returning id", [id]);
    expect(update.rows).toHaveLength(1);
    const read = await queryAs<{ text: string; done: boolean }>(db, A, "select text, done from public.plan_items");
    expect(read.rows).toEqual([{ text: "Läs villkoren", done: true }]);
    const remove = await queryAs(db, A, "delete from public.plan_items where id = $1 returning id", [id]);
    expect(remove.rows).toHaveLength(1);
  });

  it("A ser, ändrar och tar aldrig bort B:s uppgifter", async () => {
    expect((await queryAs(db, A, "select * from public.plan_items where user_id = $1", [B])).rows).toEqual([]);
    expect((await queryAs(db, A, "update public.plan_items set done = true where user_id = $1 returning id", [B])).rows).toEqual([]);
    expect((await queryAs(db, A, "delete from public.plan_items where user_id = $1 returning id", [B])).rows).toEqual([]);
    const { rows } = await db.query<{ n: number }>("select count(*)::int as n from public.plan_items where user_id = $1", [B]);
    expect(rows[0].n).toBe(1);
  });

  it("A kan inte skriva som B, och inte flytta en egen uppgift till B", async () => {
    expect((await queryAs(db, A, INSERT, [B, "Förfalskat", null, SIGNAL])).error).toMatch(/row-level security/);
    const own = await queryAs<{ id: string }>(db, A, INSERT, [A, "Min", null, SIGNAL]);
    const move = await queryAs(db, A, "update public.plan_items set user_id = $1 where id = $2", [B, own.rows![0].id]);
    expect(move.error).toMatch(/row-level security/);
  });

  it("samma steg från samma signal nekas, oavsett stora bokstäver, men går från en annan signal", async () => {
    expect((await queryAs(db, A, INSERT, [A, "Ring banken", null, SIGNAL])).error).toBeNull();
    expect((await queryAs(db, A, INSERT, [A, "RING banken", null, SIGNAL])).error).toMatch(/duplicate key/);
    expect((await queryAs(db, A, INSERT, [A, "Ring banken", null, OTHER_SIGNAL])).error).toBeNull();
  });

  it("tom, för lång eller styrtecken i texten nekas, liksom okänt ursprung", async () => {
    expect((await queryAs(db, A, INSERT, [A, "   ", null, SIGNAL])).error).toMatch(/check/);
    expect((await queryAs(db, A, INSERT, [A, "x".repeat(301), null, SIGNAL])).error).toMatch(/check/);
    expect((await queryAs(db, A, INSERT, [A, "rad\nbrytning", null, SIGNAL])).error).toMatch(/check/);
    expect((await queryAs(db, A, INSERT, [A, "Ok", "x".repeat(201), SIGNAL])).error).toMatch(/check/);
    const origin = await queryAs(
      db,
      A,
      "insert into public.plan_items (user_id, text, origin) values ($1, 'Ok', 'annat')",
      [A],
    );
    expect(origin.error).toMatch(/check/);
  });

  it("en egen uppgift (own, utan signal) går att spara och byta text på, men samma egna text två gånger nekas", async () => {
    const OWN = "insert into public.plan_items (user_id, text, origin) values ($1, $2, 'own') returning id";
    const own = await queryAs<{ id: string }>(db, A, OWN, [A, "Ring Riksbyggen"]);
    expect(own.error).toBeNull();
    expect((await queryAs(db, A, OWN, [A, "ring riksbyggen"])).error).toMatch(/duplicate key/);
    const edit = await queryAs(db, A, "update public.plan_items set text = $1 where id = $2 returning id", [
      "Ring HSB",
      own.rows![0].id,
    ]);
    expect(edit.rows).toHaveLength(1);
    // B kan aldrig ändra A:s egna uppgift.
    expect(
      (await queryAs(db, B, "update public.plan_items set text = 'x' where id = $1 returning id", [own.rows![0].id])).rows,
    ).toEqual([]);
  });

  it("utan inloggning syns ingenting", async () => {
    await db.query("select set_config('test.uid', '', false)");
    await db.exec("set role anon");
    try {
      const { rows } = await db.query("select * from public.plan_items");
      expect(rows).toEqual([]);
    } finally {
      await db.exec("reset role");
    }
  });
});
