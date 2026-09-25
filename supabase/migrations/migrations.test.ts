// Statisk vakt (docs/uppdrag.md 14.6: "ingen tabell skapas utan
// RLS-policy") — körs i CI utan Docker/Postgres. Läser alla .sql-filer i
// den här mappen och hävdar att varje `create table public.X` har en
// matchande `alter table public.X enable row level security` och minst en
// `create policy ... on public.X`. Fångar inte om policyerna är KORREKTA
// (det kräver en riktig databas, se adapters/live/rls.live.test.ts), bara
// att ingen tabell glöms bort.
//
// Undantag: tabeller i CLOSED_TABLES är avsiktligt stängda för alla klienter
// (RLS på, INGA policies, rättigheterna indragna från anon och authenticated)
// och nås bara av servern med service role. För dem hävdar vakten tvärtom att
// ingen policy finns, så att en tabell inte kan öppnas i smyg.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = import.meta.dirname;

/** Tabell -> varför den är stängd. Lägg bara till med ett beslut i docs/beslut.md. */
const CLOSED_TABLES: Record<string, string> = {
  registry_cache:
    "Gemensam registercache som bara servern läser och skriver (lib/server/registryCache.ts). Beslut Erik 2026-09-23, docs/beslut.md.",
  waitlist:
    "Väntelistan. Nås bara via funktionen public.join_waitlist (security definer), aldrig direkt. Beslut Erik 2026-09-25, docs/beslut.md.",
};

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

/** Utan SQL-kommentarer, så att en policy som bara nämns i en kommentar inte räknas. */
function stripComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("supabase/migrations: RLS-täckning (14.6)", () => {
  const sql = stripComments(readAllMigrationsSql());
  const tables = findCreatedTables(sql);
  const openTables = tables.filter((t) => !(t in CLOSED_TABLES));
  const closedTables = tables.filter((t) => t in CLOSED_TABLES);

  it("hittar minst en tabell att pröva", () => {
    expect(tables.length).toBeGreaterThan(0);
  });

  it.each(tables)("%s har row level security påslaget", (table) => {
    const pattern = new RegExp(`alter table public\\.${table} enable row level security`, "i");
    expect(sql).toMatch(pattern);
  });

  it.each(openTables)("%s har minst en RLS-policy", (table) => {
    const pattern = new RegExp(`create policy [^;]*on public\\.${table}\\b`, "i");
    expect(sql).toMatch(pattern);
  });

  it("varje undantag i CLOSED_TABLES är en tabell som faktiskt skapas", () => {
    for (const table of Object.keys(CLOSED_TABLES)) expect(tables).toContain(table);
  });

  it.each(closedTables)("%s (stängd) har INGEN policy", (table) => {
    const pattern = new RegExp(`create policy [^;]*on public\\.${table}\\b`, "i");
    expect(sql).not.toMatch(pattern);
  });

  it.each(closedTables)("%s (stängd) har rättigheterna indragna från anon och authenticated", (table) => {
    const pattern = new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, "i");
    expect(sql).toMatch(pattern);
  });
});
