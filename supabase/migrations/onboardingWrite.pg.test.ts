// @vitest-environment node
// Onboardingens skrivväg mot en riktig Postgres (PGlite, se test/pgMigrations.ts).
// Bevisar att klienten inte kan sätta onboarding_entry eller
// onboarding_completed_at själv, varken med update, insert eller delete och
// insert igen, och att public.complete_onboarding är den enda vägen. Frågorna
// som funktionen tar emot prövas mot PROFILE_QUESTIONS_BY_ENTRY i
// core/onboarding.ts, så att formuläret och databasen aldrig säger olika saker.
// Migreringen: 20261002150000_steg1_onboarding.sql.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb } from "@/test/pgMigrations";
import { PROFILE_QUESTIONS_BY_ENTRY, PROFILE_ANSWER_MAX_LENGTH } from "@/core/onboarding";
import type { OnboardingEntry } from "@/core/domain";

let db: PGlite;
let nextUser = 0;

type Outcome = { rows: Record<string, unknown>[]; code: null } | { rows: null; code: string; message: string };

/** Som queryAs, men ger felkoden (SQLSTATE), som adaptern läser. Rollen är
 * authenticated, anon (userId null) eller den angivna. */
async function run(role: string, userId: string | null, sql: string, params: unknown[] = []): Promise<Outcome> {
  await db.query("select set_config('test.uid', $1, false)", [userId ?? ""]);
  await db.exec(`set role ${role}`);
  try {
    return { rows: (await db.query<Record<string, unknown>>(sql, params)).rows, code: null };
  } catch (error) {
    const { code, message } = error as { code?: string; message: string };
    return { rows: null, code: code ?? "", message };
  } finally {
    await db.exec("reset role");
  }
}

const asUser = (userId: string, sql: string, params: unknown[] = []) => run("authenticated", userId, sql, params);

/** En ny användare, skapad som vid signup: handle_new_user() skapar profilraden. */
async function signUp(name = "Test Person"): Promise<string> {
  const id = `00000000-0000-0000-0000-${String(++nextUser).padStart(12, "0")}`;
  const result = await run("supabase_auth_admin", null, "insert into auth.users (id, raw_user_meta_data) values ($1, $2::jsonb)", [
    id,
    JSON.stringify({ name }),
  ]);
  expect(result.code).toBeNull();
  return id;
}

function completeOnboarding(userId: string, entry: string, answers: unknown) {
  return asUser(userId, "select public.complete_onboarding($1, $2::jsonb) as completed_at", [entry, JSON.stringify(answers)]);
}

function answersFor(entry: OnboardingEntry, value = "Ett svar"): Record<string, string> {
  return Object.fromEntries(PROFILE_QUESTIONS_BY_ENTRY[entry].map((id) => [id, value]));
}

async function profile(userId: string) {
  const { rows } = await db.query<Record<string, unknown>>("select * from public.profiles where user_id = $1", [userId]);
  return rows[0];
}

beforeAll(async () => {
  db = await createMigratedDb();
  // Supabase Auth skriver auth.users som en egen roll, inte som superanvändare.
  await db.exec(`
    create role supabase_auth_admin;
    grant usage on schema auth to supabase_auth_admin;
    grant insert, select on auth.users to supabase_auth_admin;
  `);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("signup", () => {
  it("handle_new_user() skapar fortfarande profilraden, fast klienten inte kan skapa den", async () => {
    const id = await signUp("Sara Lindqvist");
    expect(await profile(id)).toMatchObject({
      user_id: id,
      name: "Sara Lindqvist",
      initials: "SL",
      onboarding_entry: null,
      onboarding_completed_at: null,
    });
  });
});

describe("profiles: klienten kan inte sätta onboarding-kolumnerna", () => {
  it("update av onboarding_completed_at eller onboarding_entry nekas, även på den egna raden", async () => {
    const a = await signUp();
    for (const set of [
      "onboarding_completed_at = now()",
      "onboarding_entry = 'hasIdea'",
      "onboarding_entry = 'hasIdea', onboarding_completed_at = now()",
      "role = 'x', onboarding_completed_at = now()",
    ]) {
      const result = await asUser(a, `update public.profiles set ${set} where user_id = $1`, [a]);
      expect(result.code, set).toBe("42501");
    }
    expect(await profile(a)).toMatchObject({ role: null, onboarding_entry: null, onboarding_completed_at: null });
  });

  it("insert och delete nekas, så raden kan inte raderas och skapas igen med flaggan satt", async () => {
    const a = await signUp();
    expect((await asUser(a, "delete from public.profiles where user_id = $1", [a])).code).toBe("42501");
    const insert = await asUser(
      a,
      "insert into public.profiles (user_id, onboarding_entry, onboarding_completed_at) values ($1, 'hasIdea', now())",
      [a],
    );
    expect(insert.code).toBe("42501");
    const plainInsert = await asUser(a, "insert into public.profiles (user_id) values ($1)", [a]);
    expect(plainInsert.code).toBe("42501");
    expect(await profile(a)).toMatchObject({ onboarding_completed_at: null });
  });

  it("de övriga kolumnerna går fortfarande att skriva, och bara på den egna raden", async () => {
    const a = await signUp();
    const b = await signUp();
    const own = await asUser(
      a,
      "update public.profiles set name = 'Ny', initials = 'N', role = 'r', bio = 'b', time_available = 't', money_available = 'm', risk_appetite = 'k' where user_id = $1 returning user_id",
      [a],
    );
    expect(own.rows).toHaveLength(1);
    const other = await asUser(a, "update public.profiles set role = 'kapad' where user_id = $1 returning user_id", [b]);
    expect(other.rows).toHaveLength(0);
    expect(await profile(b)).toMatchObject({ role: null });
  });

  it("anon kan varken skriva profiler eller anropa complete_onboarding", async () => {
    const a = await signUp();
    expect((await run("anon", null, "update public.profiles set role = 'x' where user_id = $1", [a])).code).toBe("42501");
    const call = await run("anon", null, "select public.complete_onboarding('hasIdea', '{}'::jsonb)");
    expect(call.code).toBe("42501");
  });
});

describe("complete_onboarding", () => {
  it("ingång A: skriver de fem svaren trimmade, ingången och klar-tiden i en uppdatering", async () => {
    const a = await signUp();
    const result = await completeOnboarding(a, "noIdea", {
      role: "  Redovisningskonsult \n",
      bio: "Tio år på byrå.",
      time: "10 timmar",
      money: "20 000 kr",
      risk: "Låg",
    });
    expect(result.code).toBeNull();
    const row = await profile(a);
    expect(row).toMatchObject({
      role: "Redovisningskonsult",
      bio: "Tio år på byrå.",
      time_available: "10 timmar",
      money_available: "20 000 kr",
      risk_appetite: "Låg",
      onboarding_entry: "noIdea",
      name: "Test Person",
    });
    expect(row.onboarding_completed_at).not.toBeNull();
  });

  it("ingång B: skriver sina tre svar och lämnar bio och risk orörda", async () => {
    const b = await signUp();
    await db.query("update public.profiles set bio = 'Tidigare' where user_id = $1", [b]);
    expect((await completeOnboarding(b, "hasIdea", { role: "Säljare", time: "5 timmar", money: "Inget" })).code).toBeNull();
    expect(await profile(b)).toMatchObject({ role: "Säljare", bio: "Tidigare", risk_appetite: null, onboarding_entry: "hasIdea" });
  });

  it("ett andra anrop ger 55000 och skriver inte över något", async () => {
    const a = await signUp();
    expect((await completeOnboarding(a, "hasIdea", answersFor("hasIdea", "Först"))).code).toBeNull();
    const before = await profile(a);
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea", "Igen"))).code).toBe("55000");
    expect(await profile(a)).toEqual(before);
  });

  it("påverkar bara den inloggades rad", async () => {
    const a = await signUp();
    const b = await signUp();
    expect((await completeOnboarding(a, "hasIdea", answersFor("hasIdea"))).code).toBeNull();
    expect(await profile(b)).toMatchObject({ role: null, onboarding_completed_at: null });
  });

  it.each([
    ["en okänd ingång", "okänd", answersFor("hasIdea")],
    ["en saknad ingång", null, answersFor("hasIdea")],
    ["svar som inte är ett objekt", "hasIdea", ["Säljare", "5 timmar", "Inget"]],
    ["ett tomt svar", "hasIdea", { ...answersFor("hasIdea"), role: "   " }],
    ["ett för långt svar", "hasIdea", { ...answersFor("hasIdea"), role: "a".repeat(PROFILE_ANSWER_MAX_LENGTH + 1) }],
    ["ett svar som inte är text", "hasIdea", { ...answersFor("hasIdea"), role: 5 }],
    ["ett okänt fält", "hasIdea", { ...answersFor("hasIdea"), onboarding_completed_at: "2026-01-01" }],
  ])("avvisar %s med 22023 utan att skriva något", async (_, entry, answers) => {
    const a = await signUp();
    expect((await completeOnboarding(a, entry as string, answers)).code).toBe("22023");
    expect(await profile(a)).toMatchObject({ role: null, onboarding_entry: null, onboarding_completed_at: null });
  });

  it("ett svar på exakt maxlängden tas emot", async () => {
    const a = await signUp();
    const answers = { ...answersFor("hasIdea"), role: "a".repeat(PROFILE_ANSWER_MAX_LENGTH) };
    expect((await completeOnboarding(a, "hasIdea", answers)).code).toBeNull();
  });
});

// Samma roll som synktestet för stegkraven (journeyStepCompletion.pg.test.ts):
// frågorna finns i SQL (complete_onboarding) och i TS
// (PROFILE_QUESTIONS_BY_ENTRY). Ändras den ena utan den andra fallerar det här.
describe("complete_onboarding stämmer med PROFILE_QUESTIONS_BY_ENTRY", () => {
  const entries = Object.keys(PROFILE_QUESTIONS_BY_ENTRY) as OnboardingEntry[];
  const allQuestions = [...new Set(entries.flatMap((entry) => PROFILE_QUESTIONS_BY_ENTRY[entry]))];

  it.each(entries)("%s: exakt TS-frågorna tas emot, en fråga för lite eller för mycket avvisas", async (entry) => {
    const questions = PROFILE_QUESTIONS_BY_ENTRY[entry];
    const user = await signUp();

    for (const missing of questions) {
      const answers = answersFor(entry);
      delete answers[missing];
      expect((await completeOnboarding(user, entry, answers)).code, `${entry} utan ${missing}`).toBe("22023");
    }
    for (const extra of allQuestions.filter((id) => !questions.includes(id))) {
      const answers = { ...answersFor(entry), [extra]: "Svar" };
      expect((await completeOnboarding(user, entry, answers)).code, `${entry} med ${extra}`).toBe("22023");
    }
    expect((await completeOnboarding(user, entry, answersFor(entry))).code).toBeNull();
  });
});
