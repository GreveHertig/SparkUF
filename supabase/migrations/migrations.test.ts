// Statisk vakt (docs/uppdrag.md 14.6: "ingen tabell skapas utan
// RLS-policy") — körs i CI utan Docker/Postgres. Läser alla .sql-filer i
// den här mappen och hävdar att varje `create table public.X` har en
// matchande `alter table public.X enable row level security` och minst en
// `create policy ... on public.X`. Fångar inte om policyerna är KORREKTA
// (det kräver en riktig databas, se adapters/live/rls.live.test.ts), bara
// att ingen tabell glöms bort.
//
// Undantag: tabeller i CLOSED_TABLES är avsiktligt stängda för alla klienter
// (RLS på, INGA policies, rättigheterna indragna från anon och authenticated).
// Stängda tabeller nås bara via servern (service role) eller via en
// säkerhetsfunktion (security definer), aldrig direkt av klienten. För dem
// hävdar vakten tvärtom att ingen policy finns, så att en tabell inte kan
// öppnas i smyg.
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

/**
 * Läsbara men stängda för skrivning: RLS på, en select-policy, men ingen
 * insert-, update-, delete- eller all-policy, och skrivrätten indragen från
 * anon och authenticated. Skrivs bara av servern eller via en
 * security definer-funktion. Lägg bara till med ett beslut i docs/beslut.md.
 */
const WRITE_CLOSED_TABLES: Record<string, string> = {
  evidence:
    "Bevis. Grundaren skriver bara via public.record_evidence, poängen sätts ur sorten. Beslut 2026-10-01, docs/beslut.md (docs/bevislagring.md 2.3).",
  score_snapshots:
    "Poänghistoriken. Skrivs bara av servern (lib/server/scoreSnapshots.ts), så att historiken inte går att förfalska. Beslut 2026-10-01, docs/beslut.md.",
  evidence_kinds: "Bevissorterna. Ändras bara via migreringar. Beslut 2026-10-01, docs/beslut.md.",
  journey_steps:
    "Resans framsteg. Ett steg markeras klart bara via public.complete_journey_step, som prövar stegets krav. Beslut 2026-10-01, docs/beslut.md.",
  journey_step_requirements: "Stegens krav. Ändras bara via migreringar. Beslut 2026-10-01, docs/beslut.md.",
  journey_step_group_thresholds:
    "Trösklar för kravgrupper (steg 06: fem svar, tre bolag). Ändras bara via migreringar. Beslut 2026-10-01, docs/beslut.md.",
  cofounder_messages:
    "Medgrundarens samtal. Grundaren skriver bara via public.reserve_cofounder_message, Medgrundarens svar bara servern (lib/server/cofounderReplies.ts, service role). Beslut Erik 2026-10-03, docs/beslut.md.",
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

type Policy = { name: string; table: string; command: string };

/** Policyerna som finns kvar efter alla migreringar: skapade minus borttagna,
 * i filordning. En policy som tas bort i en senare migrering räknas inte. */
function finalPolicies(sql: string): Policy[] {
  const policies = new Map<string, Policy>();
  const statements = sql.matchAll(
    /(create|drop) policy "([^"]+)" on public\.(\w+)(?:\s+(?:as \w+\s+)?for (\w+))?/gi,
  );
  for (const [, verb, name, table, command] of statements) {
    const key = `${table}:${name}`;
    if (verb.toLowerCase() === "create") policies.set(key, { name, table, command: (command ?? "all").toLowerCase() });
    else policies.delete(key);
  }
  return [...policies.values()];
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

  const writeClosedTables = Object.keys(WRITE_CLOSED_TABLES);
  const policies = finalPolicies(sql);

  it("varje tabell i WRITE_CLOSED_TABLES skapas och är inte samtidigt helt stängd", () => {
    for (const table of writeClosedTables) {
      expect(tables).toContain(table);
      expect(CLOSED_TABLES).not.toHaveProperty(table);
    }
  });

  it.each(writeClosedTables)("%s (stängd för skrivning) har kvar en select-policy", (table) => {
    expect(policies.filter((p) => p.table === table && p.command === "select")).not.toHaveLength(0);
  });

  it.each(writeClosedTables)("%s (stängd för skrivning) har ingen insert-, update-, delete- eller all-policy", (table) => {
    expect(policies.filter((p) => p.table === table && p.command !== "select")).toEqual([]);
  });

  it.each(writeClosedTables)("%s (stängd för skrivning) har skrivrätten indragen från anon och authenticated", (table) => {
    const pattern = new RegExp(`revoke insert, update, delete on table public\\.${table} from anon, authenticated`, "i");
    expect(sql).toMatch(pattern);
  });

  it.each(closedTables)("%s (stängd) har rättigheterna indragna från anon och authenticated", (table) => {
    const pattern = new RegExp(`revoke all on table public\\.${table} from anon, authenticated`, "i");
    expect(sql).toMatch(pattern);
  });
});

/**
 * profiles: klienten (authenticated) får uppdatera exakt de här kolumnerna,
 * och inga andra (20261002150000_steg1_onboarding.sql). En ny kolumn i
 * profiles fäller testet tills den står i en av listerna, med ett beslut:
 * skrivbar för klienten, eller satt bara av servern eller en
 * security definer-funktion.
 */
const PROFILES_CLIENT_WRITABLE = [
  "name",
  "initials",
  "role",
  "bio",
  "time_available",
  "money_available",
  "risk_appetite",
  "customer_guess",
  "frustrations",
];
const PROFILES_CLIENT_CLOSED: Record<string, string> = {
  user_id: "Nyckeln. Sätts av handle_new_user() vid signup.",
  created_at: "Sätts av databasen.",
  updated_at: "Sätts av triggern profiles_set_updated_at.",
  onboarding_entry: "Sätts bara av public.complete_onboarding. Beslut Erik 2026-10-01 (säkerhetsgranskningen).",
  onboarding_completed_at:
    "Sätts bara av public.complete_onboarding. Låser upp steg 1 och 2 och spärren mot /app. Beslut Erik 2026-10-01.",
  onboarding_answers:
    "Svaren på onboardingens v4-frågor. Skrivs bara av public.save_onboarding_answer och public.complete_onboarding, som prövar varje val. Beslut Erik 2026-10-03.",
  onboarding_version:
    "1 = klar med fritextfrågorna, 2 = klar med v4. Sätts bara av migreringen och public.complete_onboarding. Beslut Erik 2026-10-03.",
};

/** Kolumnerna i profiles: create table plus alter table ... add column. */
function profilesColumns(sql: string): string[] {
  const create = sql.match(/create table public\.profiles \(([\s\S]*?)\n\);/i);
  if (!create) return [];
  const created = create[1]
    .split("\n")
    .map((line) => line.match(/^\s*([a-z_]+)\s+[a-z]/i)?.[1])
    .filter((name): name is string => !!name && !/^(constraint|primary|foreign|unique|check)$/i.test(name));
  const added = [...sql.matchAll(/alter table public\.profiles\b[^;]*;/gi)].flatMap((statement) =>
    [...statement[0].matchAll(/add column (?:if not exists )?(\w+)/gi)].map((match) => match[1]),
  );
  return [...new Set([...created, ...added])];
}

describe("supabase/migrations: profiles-kolumner som klienten får skriva", () => {
  const sql = stripComments(readAllMigrationsSql());
  const columns = profilesColumns(sql);
  const grants = [...sql.matchAll(/grant update \(([^)]*)\)\s+on table public\.profiles to authenticated/gi)];

  it("hittar profiles-kolumnerna", () => {
    expect(columns).toContain("user_id");
    expect(columns).toContain("onboarding_completed_at");
  });

  it("varje kolumn har ett beslut: skrivbar eller stängd, aldrig båda", () => {
    const decided = [...PROFILES_CLIENT_WRITABLE, ...Object.keys(PROFILES_CLIENT_CLOSED)];
    expect([...columns].sort()).toEqual([...decided].sort());
    expect(PROFILES_CLIENT_WRITABLE.filter((column) => column in PROFILES_CLIENT_CLOSED)).toEqual([]);
  });

  it("insert, update och delete är indragna från anon och authenticated", () => {
    expect(sql).toMatch(/revoke insert, update, delete on table public\.profiles from anon, authenticated/i);
  });

  it("den senaste update-rätten för authenticated gäller exakt de skrivbara kolumnerna", () => {
    expect(grants.length).toBeGreaterThan(0);
    const granted = grants.at(-1)![1].split(",").map((column) => column.trim());
    expect([...granted].sort()).toEqual([...PROFILES_CLIENT_WRITABLE].sort());
  });

  it("ingen insert-, delete- eller all-policy finns kvar på profiles", () => {
    const policies = finalPolicies(sql).filter((p) => p.table === "profiles");
    expect(policies.map((p) => p.command).sort()).toEqual(["select", "update"]);
  });
});
