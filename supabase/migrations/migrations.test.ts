// Statisk vakt (docs/uppdrag.md 14.6: "ingen tabell skapas utan
// RLS-policy") — körs i CI utan Docker/Postgres. Läser alla .sql-filer i
// den här mappen och hävdar att varje `create table public.X` har en
// matchande `alter table public.X enable row level security` och minst en
// `create policy ... on public.X`. Fångar inte om policyerna är KORREKTA
// (det kräver en riktig databas, se adapters/live/rls.live.test.ts), bara
// att ingen tabell glöms bort.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = import.meta.dirname;

function readAllMigrationsSql(): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  return files.map((file) => readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")).join("\n");
}

function findCreatedTables(sql: string): string[] {
  const matches = sql.matchAll(/create table public\.(\w+)/gi);
  return [...new Set([...matches].map((match) => match[1]))];
}

describe("supabase/migrations: RLS-täckning (14.6)", () => {
  const sql = readAllMigrationsSql();
  const tables = findCreatedTables(sql);

  it("hittar minst en tabell att pröva", () => {
    expect(tables.length).toBeGreaterThan(0);
  });

  it.each(tables)("%s har row level security påslaget", (table) => {
    const pattern = new RegExp(`alter table public\\.${table} enable row level security`, "i");
    expect(sql).toMatch(pattern);
  });

  it.each(tables)("%s har minst en RLS-policy", (table) => {
    const pattern = new RegExp(`create policy [^;]*on public\\.${table}\\b`, "i");
    expect(sql).toMatch(pattern);
  });
});
