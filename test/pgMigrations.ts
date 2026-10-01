// Kör alla migreringar i supabase/migrations/ mot en riktig Postgres i
// processen (PGlite, Postgres kompilerat till WebAssembly). Ingen Docker, inget
// nätverk, så det går i CI. Testkod, importeras aldrig av app-kod.
//
// Supabase-specifika delar som migreringarna förutsätter stubbas minimalt:
// rollerna anon/authenticated/service_role, schemat auth med auth.users och
// auth.uid() (läser inställningen test.uid), och Supabases standardrättigheter
// (alla tre rollerna får allt i public, precis som i ett nytt Supabase-projekt;
// det är migreringarnas revoke och RLS som ska stänga).
//
// Det här prövar databasens regler (RLS, rättigheter, triggrar, funktioner),
// inte PostgREST. adapters/live/rls.live.test.ts prövar samma sak mot ett
// riktigt Supabase-projekt.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = path.join(import.meta.dirname, "..", "supabase", "migrations");

export async function createMigratedDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  `);
  const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")
      // pgcrypto finns inte i PGlite. gen_random_uuid() är inbyggd sedan Postgres 13.
      .replace(/create extension if not exists pgcrypto[^;]*;/i, "");
    await db.exec(sql);
  }
  return db;
}

export type QueryOutcome<T> = { rows: T[]; error: null } | { rows: null; error: string };

/** Kör en fråga som en inloggad användare (authenticated, auth.uid() = userId)
 * eller, med userId null, som servern med service role. */
export async function queryAs<T = Record<string, unknown>>(
  db: PGlite,
  userId: string | null,
  sql: string,
  params: unknown[] = [],
): Promise<QueryOutcome<T>> {
  await db.query("select set_config('test.uid', $1, false)", [userId ?? ""]);
  await db.exec(`set role ${userId ? "authenticated" : "service_role"}`);
  try {
    const result = await db.query<T>(sql, params);
    return { rows: result.rows, error: null };
  } catch (error) {
    return { rows: null, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await db.exec("reset role");
  }
}
