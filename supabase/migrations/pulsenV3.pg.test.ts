// @vitest-environment node
// Pulsen v3 mot en riktig Postgres (PGlite, se test/pgMigrations.ts): de nya
// kolumnerna i 20261004090000_pulsen_v3.sql och att RLS fortfarande gäller.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

const PLAN =
  "insert into public.plan_items (user_id, text, origin, due_date, due_source, due_fetched) values ($1, $2, 'own', $3, $4, $5) returning id";

describe("Pulsen v3", () => {
  it("plan_items: sista dag sparas med källa, eller inte alls", async () => {
    expect((await queryAs(db, A, PLAN, [A, "Med datum", "2026-11-30", "energimyndigheten.se", "2026-10-04"])).error).toBeNull();
    expect((await queryAs(db, A, PLAN, [A, "Utan datum", null, null, null])).error).toBeNull();
    // Datum utan källa, eller källa utan datum, nekas.
    expect((await queryAs(db, A, PLAN, [A, "Halvt", "2026-11-30", null, null])).error).toMatch(/check/);
    expect((await queryAs(db, A, PLAN, [A, "Halvt 2", null, "energimyndigheten.se", "2026-10-04"])).error).toMatch(/check/);
    expect((await queryAs(db, A, PLAN, [A, "Styrtecken", "2026-11-30", "a\nb", "2026-10-04"])).error).toMatch(/check/);
  });

  it("plan_items: B ser aldrig A:s sista dag", async () => {
    const read = await queryAs<{ due_date: string }>(db, B, "select due_date from public.plan_items where user_id = $1", [A]);
    expect(read.rows).toEqual([]);
  });

  it("pulse_signals: deadline och why_ai finns, why_ai är falskt som standard", async () => {
    const { rows } = await db.query<{ column_name: string; column_default: string | null }>(
      "select column_name, column_default from information_schema.columns where table_name = 'pulse_signals' and column_name in ('deadline', 'why_ai') order by column_name",
    );
    expect(rows.map((row) => row.column_name)).toEqual(["deadline", "why_ai"]);
    expect(rows.find((row) => row.column_name === "why_ai")?.column_default).toBe("false");
  });
});
