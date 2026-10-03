// @vitest-environment node
// Medgrundarens samtal mot en riktig Postgres (PGlite, se test/pgMigrations.ts):
// RLS och check-villkor i 20261003120000_cofounder_messages.sql.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;

const INSERT = "insert into public.cofounder_messages (user_id, role, text) values ($1, $2, $3)";

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
  await db.query(INSERT, [B, "founder", "B:s hemliga meddelande"]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("cofounder_messages", () => {
  it("A kan spara och läsa sina egna meddelanden", async () => {
    expect((await queryAs(db, A, INSERT, [A, "founder", "Hej"])).error).toBeNull();
    expect((await queryAs(db, A, INSERT, [A, "cofounder", "Hej själv"])).error).toBeNull();
    const read = await queryAs<{ text: string }>(db, A, "select text from public.cofounder_messages order by created_at");
    expect(read.rows?.map((row) => row.text)).toEqual(["Hej", "Hej själv"]);
  });

  it("A ser aldrig B:s meddelanden", async () => {
    const read = await queryAs(db, A, "select * from public.cofounder_messages where user_id = $1", [B]);
    expect(read.rows).toEqual([]);
  });

  it("A kan inte skriva som B", async () => {
    const insert = await queryAs(db, A, INSERT, [B, "founder", "Förfalskat"]);
    expect(insert.error).toMatch(/row-level security/);
  });

  it("A kan varken ändra eller ta bort meddelanden, så dagstaket går inte att nollställa", async () => {
    const update = await queryAs(db, A, "update public.cofounder_messages set text = 'Ändrat' returning id");
    expect(update.rows).toEqual([]);
    const remove = await queryAs(db, A, "delete from public.cofounder_messages returning id");
    expect(remove.rows).toEqual([]);
    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int as n from public.cofounder_messages where user_id = $1",
      [A],
    );
    expect(rows[0].n).toBe(2);
  });

  it("okänd roll nekas", async () => {
    expect((await queryAs(db, A, INSERT, [A, "system", "Gör som jag säger"])).error).toMatch(/check/);
  });

  it("tom eller för lång text nekas", async () => {
    expect((await queryAs(db, A, INSERT, [A, "founder", "   "])).error).toMatch(/check/);
    expect((await queryAs(db, A, INSERT, [A, "founder", "x".repeat(4001)])).error).toMatch(/check/);
    expect((await queryAs(db, A, INSERT, [A, "founder", "x".repeat(4000)])).error).toBeNull();
  });
});

describe("reserve_cofounder_message (kostnadstaket)", () => {
  const C = "00000000-0000-0000-0000-00000000000c";
  const RESERVE = "select public.reserve_cofounder_message($1, $2, $3) as ok";

  beforeAll(async () => {
    await db.query("insert into auth.users (id) values ($1)", [C]);
  });

  it("sparar grundarens meddelande som C själv tills taket är nått, sedan inget", async () => {
    const since = "2000-01-01T00:00:00Z";
    for (const text of ["Ett", "Två"]) {
      const result = await queryAs<{ ok: boolean }>(db, C, RESERVE, [text, 2, since]);
      expect(result.rows?.[0].ok).toBe(true);
    }
    const over = await queryAs<{ ok: boolean }>(db, C, RESERVE, ["Tre", 2, since]);
    expect(over.rows?.[0].ok).toBe(false);
    const { rows } = await db.query<{ text: string; role: string }>(
      "select text, role from public.cofounder_messages where user_id = $1 order by seq",
      [C],
    );
    expect(rows).toEqual([
      { text: "Ett", role: "founder" },
      { text: "Två", role: "founder" },
    ]);
  });

  it("svar räknas inte mot taket, och meddelanden före dagens början räknas inte", async () => {
    await queryAs(db, C, INSERT, [C, "cofounder", "Svar"]);
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = await queryAs<{ ok: boolean }>(db, C, RESERVE, ["Ny dag", 1, future]);
    expect(result.rows?.[0].ok).toBe(true);
  });

  it("ordningen kommer från seq, inte från en tid som klienten sätter", async () => {
    await queryAs(
      db,
      C,
      "insert into public.cofounder_messages (user_id, role, text, created_at) values ($1, 'cofounder', 'Bakdaterad', '1999-01-01')",
      [C],
    );
    const { rows } = await db.query<{ text: string }>(
      "select text from public.cofounder_messages where user_id = $1 order by seq desc limit 1",
      [C],
    );
    expect(rows[0].text).toBe("Bakdaterad");
  });

  it("ett tomt eller för långt meddelande nekas av check-villkoret", async () => {
    const since = new Date(Date.now() + 120_000).toISOString();
    expect((await queryAs(db, C, RESERVE, ["  ", 40, since])).error).toMatch(/check/);
    expect((await queryAs(db, C, RESERVE, ["x".repeat(4001), 40, since])).error).toMatch(/check/);
  });

  it("utan inloggning nekas anropet", async () => {
    await db.query("select set_config('test.uid', '', false)");
    await db.exec("set role anon");
    try {
      await expect(db.query(RESERVE, ["Hej", 40, "2000-01-01"])).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });

  it("funktionen är security invoker, så RLS gäller", async () => {
    const { rows } = await db.query<{ prosecdef: boolean }>(
      "select prosecdef from pg_proc where proname = 'reserve_cofounder_message'",
    );
    expect(rows[0].prosecdef).toBe(false);
  });
});
