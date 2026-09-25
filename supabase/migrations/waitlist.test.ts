// Statisk vakt för väntelistan, samma idé som migrations.test.ts: läser alla
// .sql-filer i mappen (utan kommentarer) och körs i CI utan Postgres.
// Låser att besökare bara kan nå public.waitlist via public.join_waitlist,
// aldrig direkt. Direkt insert skulle avslöja om en adress redan står på
// listan (201 mot 409), se 20260924120000_waitlist.sql. Prövar texten i
// migreringarna, inte en riktig databas.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = import.meta.dirname;

function readAllMigrationsSqlWithoutComments(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"))
    .join("\n")
    .replace(/--[^\n]*/g, "");
}

function statements(sql: string): string[] {
  return sql.split(";").map((statement) => statement.replace(/\s+/g, " ").trim());
}

describe("supabase/migrations: väntelistan", () => {
  const sql = readAllMigrationsSqlWithoutComments();
  const all = statements(sql);

  it("tar bort alla rättigheter på tabellen från anon och authenticated", () => {
    expect(all).toContain("revoke all on table public.waitlist from anon, authenticated");
  });

  it("ingen migrering ger anon eller authenticated någon rättighet på tabellen", () => {
    // Fångar också namn utan schema (waitlist), med citattecken
    // ("public"."waitlist") och breda grants över hela schemat.
    const grantsToVisitors = all.filter(
      (statement) =>
        /^grant\b/i.test(statement) &&
        /\bto\b.*\b(anon|authenticated|public)\b/i.test(statement) &&
        (/\bon (table )?("?public"?\.)?"?waitlist"?\b/i.test(statement) ||
          /\bon all tables in schema\b/i.test(statement)),
    );
    expect(grantsToVisitors).toEqual([]);
  });

  it("varje definition av join_waitlist är security definer med låst search_path, returnerar void och ger samma svar för dubbletter", () => {
    // Hela funktionen fram till avslutande $$, inte uppdelat på ";", och
    // varje definition, så att en senare create or replace också prövas.
    const definitions = [
      ...sql.matchAll(/create (?:or replace )?function public\.join_waitlist\([\s\S]*?\$\$[\s\S]*?\$\$/gi),
    ].map((match) => match[0].replace(/\s+/g, " "));
    expect(definitions.length).toBeGreaterThan(0);
    for (const fn of definitions) {
      expect(fn).toMatch(/\breturns void\b/i);
      expect(fn).toMatch(/\bsecurity definer\b/i);
      expect(fn).toMatch(/set search_path = ''/i);
      expect(fn).toMatch(/insert into public\.waitlist \(email\)/i);
      expect(fn).toMatch(/lower\(trim\(p_email\)\)/i);
      expect(fn).toMatch(/on conflict \(email\) do nothing/i);
      expect(fn).not.toMatch(/\breturning\b/i);
    }
    // alter function kan ändra definer eller search_path i efterhand.
    expect(all.filter((statement) => /^alter function public\.join_waitlist\b/i.test(statement))).toEqual([]);
  });

  it("join_waitlist får bara köras av anon och authenticated", () => {
    expect(all).toContain("revoke execute on function public.join_waitlist(text) from public");
    const grants = all.filter((statement) => /^grant execute on function public\.join_waitlist\b/i.test(statement));
    expect(grants).toEqual(["grant execute on function public.join_waitlist(text) to anon, authenticated"]);
  });
});
