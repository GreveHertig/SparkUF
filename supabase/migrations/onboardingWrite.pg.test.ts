// @vitest-environment node
// Onboardingens skrivväg mot en riktig Postgres (PGlite, se test/pgMigrations.ts).
// Bevisar att klienten inte kan sätta onboarding_entry eller
// onboarding_completed_at själv, varken med update, insert eller delete och
// insert igen, och att public.save_onboarding_answer och
// public.complete_onboarding är de enda vägarna. Frågorna och valen som
// funktionerna tar emot prövas mot core/onboarding.ts, så att formuläret och
// databasen aldrig säger olika saker.
// Migreringarna: 20261002150000_steg1_onboarding.sql, 20261003150000_onboarding_v4.sql.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb } from "@/test/pgMigrations";
import {
  ONBOARDING_CHOICES,
  ONBOARDING_QUESTIONS_BY_ENTRY,
  ONBOARDING_TEXT_MAX_LENGTH,
  ONBOARDING_TEXT_QUESTION_IDS,
  isChoiceQuestion,
  onboardingQuestionsFor,
  type OnboardingQuestionId,
} from "@/core/onboarding";
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

function saveAnswer(userId: string, question: string, answer: unknown) {
  return asUser(userId, "select public.save_onboarding_answer($1, $2)", [question, answer]);
}

/** Ett giltigt svar: det första valet, eller en text. */
function validAnswer(id: OnboardingQuestionId, text = "Ett svar"): string {
  return isChoiceQuestion(id) ? ONBOARDING_CHOICES[id][0] : text;
}

/** Svar på ingångens kärnfrågor (eller alla frågor). */
function answersFor(entry: OnboardingEntry, which: "core" | "all" = "core"): Record<string, string> {
  const ids = which === "core" ? ONBOARDING_QUESTIONS_BY_ENTRY[entry].core : onboardingQuestionsFor(entry);
  return Object.fromEntries(ids.map((id) => [id, validAnswer(id)]));
}

/** Ingång B: ett aktivt projekt, skapat som /start/ide gör. */
async function giveIdea(userId: string) {
  await db.query("insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'Idé', 'En idé', true)", [
    userId,
  ]);
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
      `onboarding_answers = '{"situation":"employed"}'::jsonb`,
      "onboarding_version = 2",
    ]) {
      const result = await asUser(a, `update public.profiles set ${set} where user_id = $1`, [a]);
      expect(result.code, set).toBe("42501");
    }
    expect(await profile(a)).toMatchObject({
      role: null,
      onboarding_entry: null,
      onboarding_completed_at: null,
      onboarding_answers: {},
      onboarding_version: null,
    });
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

  it("anon kan varken skriva profiler eller anropa onboardingens funktioner", async () => {
    const a = await signUp();
    expect((await run("anon", null, "update public.profiles set role = 'x' where user_id = $1", [a])).code).toBe("42501");
    const call = await run("anon", null, "select public.complete_onboarding('hasIdea', '{}'::jsonb)");
    expect(call.code).toBe("42501");
    const save = await run("anon", null, "select public.save_onboarding_answer('situation', 'employed')");
    expect(save.code).toBe("42501");
  });

  it("hjälpfunktionerna går inte att anropa direkt", async () => {
    const a = await signUp();
    for (const sql of [
      "select * from public.onboarding_v4_questions()",
      "select public.onboarding_v4_clean_answer('noIdea', 'situation', '\"employed\"'::jsonb)",
      `select public.onboarding_v4_entry('${a}')`,
    ]) {
      expect((await asUser(a, sql)).code, sql).toBe("42501");
    }
  });
});

describe("save_onboarding_answer", () => {
  it("sparar ett svar i taget, och ett svar får ändras innan onboardingen är klar", async () => {
    const a = await signUp();
    expect((await saveAnswer(a, "situation", "employed")).code).toBeNull();
    expect((await saveAnswer(a, "time", "h3to6")).code).toBeNull();
    expect((await saveAnswer(a, "time", "over10")).code).toBeNull();
    expect(await profile(a)).toMatchObject({
      onboarding_answers: { situation: "employed", time: "over10" },
      onboarding_completed_at: null,
      onboarding_entry: null,
      onboarding_version: null,
    });
  });

  it("trimmar fritext", async () => {
    const b = await signUp();
    await giveIdea(b);
    expect((await saveAnswer(b, "customer", "  Frisörsalonger i Malmö \n")).code).toBeNull();
    expect((await profile(b)).onboarding_answers).toEqual({ customer: "Frisörsalonger i Malmö" });
  });

  it("ingången kommer ur databasen: utan projekt är en fråga som bara ingång B ställer okänd", async () => {
    const a = await signUp();
    expect((await saveAnswer(a, "payer", "business")).code).toBe("22023");
    await giveIdea(a);
    expect((await saveAnswer(a, "payer", "business")).code).toBeNull();
  });

  it.each([
    ["ett okänt val", "situation", "astronaut"],
    ["ett val med fel skiftläge", "soldB2b", "Yes"],
    ["en okänd fråga", "role", "Säljare"],
    ["en tom fritext", "frustration", "   "],
    ["en för lång fritext", "frustration", "a".repeat(ONBOARDING_TEXT_MAX_LENGTH + 1)],
    ["ett saknat svar", "situation", null],
  ])("avvisar %s med 22023 utan att skriva något", async (_, question, answer) => {
    const a = await signUp();
    expect((await saveAnswer(a, question, answer)).code).toBe("22023");
    expect((await profile(a)).onboarding_answers).toEqual({});
  });

  it("en fritext på exakt maxlängden tas emot", async () => {
    const a = await signUp();
    expect((await saveAnswer(a, "frustration", "a".repeat(ONBOARDING_TEXT_MAX_LENGTH))).code).toBeNull();
  });

  it("en okänd ingång ger 22023 även när onboardingen redan är klar", async () => {
    const a = await signUp();
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea"))).code).toBeNull();
    expect((await completeOnboarding(a, "okänd", {})).code).toBe("22023");
    expect((await completeOnboarding(a, "noIdea", {})).code).toBe("55000");
  });

  it("efter klar onboarding kan bara återstående frågor besvaras, med den sparade ingången", async () => {
    const a = await signUp();
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea"))).code).toBeNull();
    // Ett projekt efteråt byter inte ingång: payer hör fortfarande inte dit.
    await giveIdea(a);
    expect((await saveAnswer(a, "payer", "business")).code).toBe("22023");
    expect((await saveAnswer(a, "archetype", "seller")).code).toBeNull();
    expect((await saveAnswer(a, "archetype", "builder")).code).toBe("55000");
    expect((await saveAnswer(a, "situation", "between")).code).toBe("55000");
    expect((await profile(a)).onboarding_answers).toMatchObject({ archetype: "seller", situation: "upperSecondary" });
  });

  it("ett konto som blev klart med fritextfrågorna kan besvara v4-frågorna efteråt", async () => {
    const a = await signUp();
    await db.query(
      "update public.profiles set role = 'Säljare', onboarding_entry = 'noIdea', onboarding_completed_at = now(), onboarding_version = 1 where user_id = $1",
      [a],
    );
    expect((await saveAnswer(a, "time", "h6to10")).code).toBeNull();
    expect(await profile(a)).toMatchObject({ role: "Säljare", onboarding_version: 1, onboarding_answers: { time: "h6to10" } });
  });

  it("påverkar bara den inloggades rad", async () => {
    const a = await signUp();
    const b = await signUp();
    expect((await saveAnswer(a, "situation", "employed")).code).toBeNull();
    expect((await profile(b)).onboarding_answers).toEqual({});
  });
});

describe("complete_onboarding", () => {
  it("ingång A: kärnfrågorna räcker, och svaren, ingången, versionen och klar-tiden skrivs", async () => {
    const a = await signUp();
    expect((await saveAnswer(a, "situation", "university")).code).toBeNull();
    const result = await completeOnboarding(a, "noIdea", { time: "h3to6", money: "none", soldB2b: "no" });
    expect(result.code).toBeNull();
    const row = await profile(a);
    expect(row).toMatchObject({
      onboarding_answers: { situation: "university", time: "h3to6", money: "none", soldB2b: "no" },
      onboarding_entry: "noIdea",
      onboarding_version: 2,
      role: null,
      time_available: null,
      name: "Test Person",
    });
    expect(row.onboarding_completed_at).not.toBeNull();
  });

  it("ingång B: med svaren redan sparade räcker ett tomt objekt", async () => {
    const b = await signUp();
    await giveIdea(b);
    for (const [id, answer] of Object.entries(answersFor("hasIdea"))) {
      expect((await saveAnswer(b, id, answer)).code, id).toBeNull();
    }
    expect((await completeOnboarding(b, "hasIdea", {})).code).toBeNull();
    expect(await profile(b)).toMatchObject({ onboarding_entry: "hasIdea", onboarding_version: 2 });
  });

  it("ett andra anrop ger 55000 och skriver inte över något", async () => {
    const a = await signUp();
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea"))).code).toBeNull();
    const before = await profile(a);
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea"))).code).toBe("55000");
    expect(await profile(a)).toEqual(before);
  });

  it("påverkar bara den inloggades rad", async () => {
    const a = await signUp();
    const b = await signUp();
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea"))).code).toBeNull();
    expect(await profile(b)).toMatchObject({ onboarding_answers: {}, onboarding_completed_at: null });
  });

  it.each([
    ["en okänd ingång", "okänd", answersFor("noIdea")],
    ["en saknad ingång", null, answersFor("noIdea")],
    ["en ingång som inte stämmer med databasen", "hasIdea", answersFor("hasIdea")],
    ["svar som inte är ett objekt", "noIdea", ["employed", "h3to6"]],
    ["en saknad kärnfråga", "noIdea", { ...answersFor("noIdea"), soldB2b: undefined }],
    ["ett okänt val", "noIdea", { ...answersFor("noIdea"), money: "miljoner" }],
    ["ett svar som inte är text", "noIdea", { ...answersFor("noIdea"), time: 5 }],
    ["ett okänt fält", "noIdea", { ...answersFor("noIdea"), onboarding_completed_at: "2026-01-01" }],
    ["ett gammalt fritextsvar", "noIdea", { ...answersFor("noIdea"), role: "Säljare" }],
  ])("avvisar %s med 22023 utan att skriva något", async (_, entry, answers) => {
    const a = await signUp();
    expect((await completeOnboarding(a, entry as string, answers)).code).toBe("22023");
    expect(await profile(a)).toMatchObject({
      onboarding_answers: {},
      onboarding_entry: null,
      onboarding_version: null,
      onboarding_completed_at: null,
    });
  });

  it("de återstående frågorna krävs inte, men tas emot om de skickas", async () => {
    const a = await signUp();
    expect((await completeOnboarding(a, "noIdea", answersFor("noIdea", "all"))).code).toBeNull();
    expect(Object.keys((await profile(a)).onboarding_answers as object).sort()).toEqual(
      [...onboardingQuestionsFor("noIdea")].sort(),
    );
  });
});

describe("migreringen: konton som redan var klara", () => {
  it("version och klar-tid hänger ihop: en version utan klar-tid nekas", async () => {
    const a = await signUp();
    await expect(db.query("update public.profiles set onboarding_version = 1 where user_id = $1", [a])).rejects.toThrow();
  });
});

// Samma roll som synktestet för stegkraven (journeyStepCompletion.pg.test.ts):
// frågorna och valen finns i SQL (onboarding_v4_questions) och i TS
// (core/onboarding.ts). Ändras den ena utan den andra fallerar det här.
describe("onboarding_v4_questions stämmer med core/onboarding.ts", () => {
  it("samma frågor, ordning, kärnfrågor och val per ingång", async () => {
    const { rows } = await db.query<{ entry: string; question_id: string; position: number; is_core: boolean; choices: string[] | null }>(
      'select entry, question_id, "position", is_core, choices from public.onboarding_v4_questions() order by entry, "position"',
    );
    for (const entry of Object.keys(ONBOARDING_QUESTIONS_BY_ENTRY) as OnboardingEntry[]) {
      const sql = rows.filter((row) => row.entry === entry);
      const ts = onboardingQuestionsFor(entry);
      expect(sql.map((row) => row.question_id), entry).toEqual([...ts]);
      expect(sql.filter((row) => row.is_core).map((row) => row.question_id), entry).toEqual([
        ...ONBOARDING_QUESTIONS_BY_ENTRY[entry].core,
      ]);
      for (const row of sql) {
        const id = row.question_id as OnboardingQuestionId;
        expect(row.choices, `${entry}.${id}`).toEqual(isChoiceQuestion(id) ? [...ONBOARDING_CHOICES[id]] : null);
      }
    }
  });

  it("högst en fritext per ingång (spec v4 §4)", () => {
    for (const entry of Object.keys(ONBOARDING_QUESTIONS_BY_ENTRY) as OnboardingEntry[]) {
      const text = onboardingQuestionsFor(entry).filter((id) => !isChoiceQuestion(id));
      expect(text.length, entry).toBeLessThanOrEqual(1);
      for (const id of text) expect(ONBOARDING_TEXT_QUESTION_IDS).toContain(id);
    }
  });

  it.each(Object.keys(ONBOARDING_QUESTIONS_BY_ENTRY) as OnboardingEntry[])(
    "%s: varje val i TS tas emot, och utan en kärnfråga blir onboardingen inte klar",
    async (entry) => {
      for (const missing of ONBOARDING_QUESTIONS_BY_ENTRY[entry].core) {
        const user = await signUp();
        if (entry === "hasIdea") await giveIdea(user);
        const answers = answersFor(entry);
        delete answers[missing];
        expect((await completeOnboarding(user, entry, answers)).code, `${entry} utan ${missing}`).toBe("22023");
      }
      const user = await signUp();
      if (entry === "hasIdea") await giveIdea(user);
      for (const id of onboardingQuestionsFor(entry)) {
        const answers = isChoiceQuestion(id) ? ONBOARDING_CHOICES[id] : ["Ett svar"];
        for (const answer of answers) {
          expect((await saveAnswer(user, id, answer)).code, `${entry}.${id}=${answer}`).toBeNull();
        }
      }
      expect((await completeOnboarding(user, entry, {})).code).toBeNull();
    },
  );
});
