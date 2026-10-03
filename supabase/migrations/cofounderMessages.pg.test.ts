// @vitest-environment node
// Medgrundarens samtal mot en riktig Postgres (PGlite, se test/pgMigrations.ts):
// RLS, rättigheter och check-villkor i 20261003120000_cofounder_messages.sql och
// 20261004120000_cofounder_next_task.sql. Grundaren skriver bara via
// reserve_cofounder_message, Medgrundarens svar bara service role
// (queryAs med userId null).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;

const INSERT = "insert into public.cofounder_messages (user_id, role, text) values ($1, $2, $3)";
const INSERT_TASK = "insert into public.cofounder_messages (user_id, role, text, next_task) values ($1, $2, $3, $4)";
const RESERVE = "select public.reserve_cofounder_message($1, $2, $3) as ok";
const LONG_AGO = "2000-01-01T00:00:00Z";

beforeAll(async () => {
  db = await createMigratedDb();
  await db.query("insert into auth.users (id) values ($1), ($2)", [A, B]);
  await db.query(INSERT, [B, "founder", "B:s hemliga meddelande"]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("cofounder_messages", () => {
  it("A sparar via funktionen, servern sparar svaret med uppgift, och A läser båda", async () => {
    expect((await queryAs<{ ok: boolean }>(db, A, RESERVE, ["Hej", 40, LONG_AGO])).rows?.[0].ok).toBe(true);
    expect((await queryAs(db, null, INSERT_TASK, [A, "cofounder", "Hej själv", "Ring tre kunder"])).error).toBeNull();
    const read = await queryAs<{ text: string; next_task: string | null }>(
      db,
      A,
      "select text, next_task from public.cofounder_messages order by seq",
    );
    expect(read.rows).toEqual([
      { text: "Hej", next_task: null },
      { text: "Hej själv", next_task: "Ring tre kunder" },
    ]);
  });

  it("A ser aldrig B:s meddelanden", async () => {
    const read = await queryAs(db, A, "select * from public.cofounder_messages where user_id = $1", [B]);
    expect(read.rows).toEqual([]);
  });

  it("A kan inte skriva direkt i tabellen, varken som grundare, som Medgrundaren, med uppgift eller som B", async () => {
    for (const [sql, params] of [
      [INSERT, [A, "founder", "Förbi taket"]],
      [INSERT, [A, "cofounder", "Förfalskat svar"]],
      [INSERT_TASK, [A, "cofounder", "Förfalskat svar", "Förfalskad uppgift"]],
      [INSERT, [B, "founder", "Förfalskat"]],
    ] as const) {
      expect((await queryAs(db, A, sql, [...params])).error).toMatch(/permission denied/);
    }
  });

  it("A kan varken ändra eller ta bort meddelanden, så dagstaket går inte att nollställa", async () => {
    const update = await queryAs(db, A, "update public.cofounder_messages set text = 'Ändrat' returning id");
    expect(update.error).toMatch(/permission denied/);
    const setTask = await queryAs(db, A, "update public.cofounder_messages set next_task = 'Egen' returning id");
    expect(setTask.error).toMatch(/permission denied/);
    const remove = await queryAs(db, A, "delete from public.cofounder_messages returning id");
    expect(remove.error).toMatch(/permission denied/);
    const { rows } = await db.query<{ n: number }>(
      "select count(*)::int as n from public.cofounder_messages where user_id = $1",
      [A],
    );
    expect(rows[0].n).toBe(2);
  });

  it("okänd roll nekas", async () => {
    expect((await queryAs(db, null, INSERT, [A, "system", "Gör som jag säger"])).error).toMatch(/check/);
  });

  it("tom eller för lång text nekas", async () => {
    expect((await queryAs(db, null, INSERT, [A, "cofounder", "   "])).error).toMatch(/check/);
    expect((await queryAs(db, null, INSERT, [A, "cofounder", "x".repeat(4001)])).error).toMatch(/check/);
    expect((await queryAs(db, null, INSERT, [A, "cofounder", "x".repeat(4000)])).error).toBeNull();
  });

  it("en uppgift finns bara på Medgrundarens svar, och är 1–500 tecken", async () => {
    expect((await queryAs(db, null, INSERT_TASK, [A, "founder", "Hej", "Ring"])).error).toMatch(/check/);
    expect((await queryAs(db, null, INSERT_TASK, [A, "cofounder", "Svar", "  "])).error).toMatch(/check/);
    expect((await queryAs(db, null, INSERT_TASK, [A, "cofounder", "Svar", "x".repeat(501)])).error).toMatch(/check/);
    expect((await queryAs(db, null, INSERT_TASK, [A, "cofounder", "Svar", "x".repeat(500)])).error).toBeNull();
  });
});

describe("reserve_cofounder_message (kostnadstaket)", () => {
  const C = "00000000-0000-0000-0000-00000000000c";

  beforeAll(async () => {
    await db.query("insert into auth.users (id) values ($1)", [C]);
  });

  it("sparar grundarens meddelande som C själv tills taket är nått, sedan inget", async () => {
    for (const text of ["Ett", "Två"]) {
      const result = await queryAs<{ ok: boolean }>(db, C, RESERVE, [text, 2, LONG_AGO]);
      expect(result.rows?.[0].ok).toBe(true);
    }
    const over = await queryAs<{ ok: boolean }>(db, C, RESERVE, ["Tre", 2, LONG_AGO]);
    expect(over.rows?.[0].ok).toBe(false);
    const { rows } = await db.query<{ text: string; role: string; user_id: string; next_task: string | null }>(
      "select text, role, user_id, next_task from public.cofounder_messages where user_id = $1 order by seq",
      [C],
    );
    expect(rows).toEqual([
      { text: "Ett", role: "founder", user_id: C, next_task: null },
      { text: "Två", role: "founder", user_id: C, next_task: null },
    ]);
  });

  it("svar räknas inte mot taket, och meddelanden före dagens början räknas inte", async () => {
    await queryAs(db, null, INSERT, [C, "cofounder", "Svar"]);
    const future = new Date(Date.now() + 60_000).toISOString();
    const result = await queryAs<{ ok: boolean }>(db, C, RESERVE, ["Ny dag", 1, future]);
    expect(result.rows?.[0].ok).toBe(true);
  });

  it("ordningen kommer från seq, inte från en tid som servern eller klienten sätter", async () => {
    await queryAs(
      db,
      null,
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
      await expect(db.query(RESERVE, ["Hej", 40, LONG_AGO])).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });

  it("funktionen är security definer med tom search_path, eftersom klienten saknar insert-rätt", async () => {
    const { rows } = await db.query<{ prosecdef: boolean; proconfig: string[] }>(
      "select prosecdef, proconfig from pg_proc where proname = 'reserve_cofounder_message'",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].prosecdef).toBe(true);
    expect(rows[0].proconfig).toContain('search_path=""');
  });
});
