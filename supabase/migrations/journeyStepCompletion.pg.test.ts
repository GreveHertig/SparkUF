// @vitest-environment node
// Resans skrivväg mot en riktig Postgres (PGlite, se test/pgMigrations.ts).
// Bevisar att en användare inte kan markera ett steg som klart genom ett
// direkt anrop mot databasen, och att public.complete_journey_step bara
// släpper igenom ett steg vars krav är uppfyllda. Varje fall prövas också mot
// stepCompletion i core/journeyRequirements.ts, så att UI:t och databasen
// aldrig säger olika saker.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createMigratedDb, queryAs } from "@/test/pgMigrations";
import { GROUP_THRESHOLDS, STEP_REQUIREMENTS, stepCompletion, type CountedEvidenceRef } from "@/core/journeyRequirements";
import { isStale } from "@/core/evidenceInput";
import { isEvidenceKind } from "@/core/evidenceKinds";
import { FIT_QUESTION_IDS, fitSubjectRef } from "@/core/fitQuestions";

const A = "00000000-0000-0000-0000-0000000000a1";
const B = "00000000-0000-0000-0000-0000000000b1";
const C = "00000000-0000-0000-0000-0000000000c1";
const D = "00000000-0000-0000-0000-0000000000d1";
/** Utan projekt, som ingång A under onboardingen. */
const E = "00000000-0000-0000-0000-0000000000e1";
const TODAY = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

let db: PGlite;
const projects: Record<string, string> = {};

function complete(userId: string | null, step: number) {
  return queryAs<{ completed_at: string }>(db, userId, "select public.complete_journey_step($1::smallint) as completed_at", [
    step,
  ]);
}

function recordFit(userId: string, subjectRef: string) {
  return queryAs(
    db,
    userId,
    "select * from public.record_evidence('profileFitAnswer', $1, 'spark:profile', null, $2, 'Ett svar', 1::smallint, 'Profil')",
    [subjectRef, TODAY],
  );
}

/** Onboardingen klar via den enda vägen (public.complete_onboarding, se
 * onboardingWrite.pg.test.ts). Ingången kommer ur databasen: med ett aktivt
 * projekt är det ingång B, utan ingång A. */
function completeOnboarding(userId: string) {
  const answers = projects[userId]
    ? { situation: "employed", payer: "business", customer: "Byråer", talkedTo: "none" }
    : { situation: "employed", time: "h3to6", money: "none", soldB2b: "no" };
  return queryAs(db, userId, "select public.complete_onboarding($1, $2::jsonb)", [
    projects[userId] ? "hasIdea" : "noIdea",
    JSON.stringify(answers),
  ]);
}

/** Ett systembevis, skrivet som servern gör det (service role). */
async function insertSystemEvidence(userId: string, kind: string, fetchedAt: string) {
  await db.query(
    `insert into public.evidence (user_id, project_id, kind, subject_ref, entered_by, module, source_name, source_url, fetched_at, part_id, data_type, points, contradicts)
     values ($1, $2, $3, $4, 'system', 'Registret', 'SCB', 'https://www.scb.se', $5, 'market', 'register', 0, false)`,
    [userId, projects[userId], kind, `${kind}-${fetchedAt}`, fetchedAt],
  );
}

/** Ett kundsvar som Spark tagit emot (entered_by 'system'), skrivet som
 * servern gör det. Grundaren kan bara ha ett eget besked per bolag och del
 * (ersättningsregeln i record_evidence), så fem svar från två bolag går bara
 * att pröva så här. */
async function insertCustomerAnswer(userId: string, kind: string, company: string, fetchedAt = TODAY) {
  await db.query(
    `insert into public.evidence (user_id, project_id, kind, subject_ref, entered_by, module, source_name, source_url, fetched_at, part_id, data_type, points, contradicts)
     values ($1, $2, $3, $4, 'system', 'Utskick', 'Svar', null, $5, 'problem', 'customer', 0, false)`,
    [userId, projects[userId], kind, company, fetchedAt],
  );
}

/** Markerar steg 1..n som klara direkt, som superanvändare (förbi spärren). */
async function markDoneDirectly(userId: string, steps: number[]) {
  for (const step of steps) {
    await db.query(
      "insert into public.journey_steps (user_id, project_id, step_number, completed_at) values ($1, $2, $3, now()) on conflict (project_id, step_number) do update set completed_at = now()",
      [userId, projects[userId], step],
    );
  }
}

function reportAs(userId: string, kind: string, subject: string, sourceUrl: string | null = null) {
  return queryAs(db, userId, "select * from public.record_evidence($1, $2, 'Bolag AB', $3, $4, null, 5::smallint, 'Validering')", [
    kind,
    subject,
    sourceUrl,
    TODAY,
  ]);
}

/** Vad core/journeyRequirements.ts säger om samma läge i databasen. */
async function coreSays(userId: string, step: number) {
  const evidence = await db.query<{ kind: string; subject_ref: string; fetched_at: string; retracted_at: string | null }>(
    "select kind, subject_ref, to_char(fetched_at, 'YYYY-MM-DD') as fetched_at, retracted_at from public.evidence where user_id = $1",
    [userId],
  );
  const steps = await db.query<{ step_number: number }>(
    "select step_number from public.journey_steps where user_id = $1 and completed_at is not null",
    [userId],
  );
  const profile = await db.query<{ onboarded: boolean }>(
    "select onboarding_completed_at is not null as onboarded from public.profiles where user_id = $1",
    [userId],
  );
  const project = await db.query("select 1 from public.projects where user_id = $1 and is_active", [userId]);
  const countedEvidence: CountedEvidenceRef[] = evidence.rows
    .filter((row) => isEvidenceKind(row.kind) && row.retracted_at === null && !isStale(row.kind, row.fetched_at, TODAY))
    .map((row) => ({ kind: row.kind as CountedEvidenceRef["kind"], subjectRef: row.subject_ref }));
  return stepCompletion({
    stepNumber: step,
    completedStepNumbers: steps.rows.map((row) => row.step_number),
    countedEvidence,
    hasActiveProject: project.rows.length > 0,
    onboardingCompleted: profile.rows[0]?.onboarded === true,
  });
}

/** Kör stegmarkeringen och kontrollerar att core säger samma sak före. */
async function completeAndCompare(userId: string, step: number) {
  const expected = await coreSays(userId, step);
  const result = await complete(userId, step);
  const sqlAccepted = result.error === null;
  expect(sqlAccepted, `steg ${step}: databasen och core säger olika (core: ${expected.status})`).toBe(
    expected.status === "completable" || expected.status === "done",
  );
  return result;
}

beforeAll(async () => {
  db = await createMigratedDb();
  for (const user of [A, B, C, D]) {
    await db.query("insert into auth.users (id) values ($1)", [user]);
    const { rows } = await db.query<{ id: string }>(
      "insert into public.projects (user_id, name, one_liner, is_active) values ($1, 'P', 'p', true) returning id",
      [user],
    );
    projects[user] = rows[0].id;
  }
  await db.query("insert into auth.users (id) values ($1)", [E]);
}, 60_000);

afterAll(async () => {
  await db?.close();
});

describe("journey_steps: ett direkt anrop kan inte markera ett steg som klart", () => {
  it("insert, update och delete som inloggad användare nekas, även på det egna projektet", async () => {
    const insert = await queryAs(
      db,
      A,
      "insert into public.journey_steps (user_id, project_id, step_number, completed_at) values ($1, $2, 11, now())",
      [A, projects[A]],
    );
    expect(insert.error).toMatch(/permission denied/);

    await db.query("insert into public.journey_steps (user_id, project_id, step_number) values ($1, $2, 3)", [A, projects[A]]);
    const update = await queryAs(db, A, "update public.journey_steps set completed_at = now() where user_id = $1", [A]);
    expect(update.error).toMatch(/permission denied/);
    const remove = await queryAs(db, A, "delete from public.journey_steps where user_id = $1", [A]);
    expect(remove.error).toMatch(/permission denied/);

    const { rows } = await db.query("select 1 from public.journey_steps where user_id = $1 and completed_at is not null", [A]);
    expect(rows).toHaveLength(0);
    await db.query("delete from public.journey_steps where user_id = $1", [A]);
  });

  it("A kan fortfarande läsa sina egna steg, B ser dem inte", async () => {
    await db.query(
      "insert into public.journey_steps (user_id, project_id, step_number, completed_at) values ($1, $2, 1, now())",
      [D, projects[D]],
    );
    expect((await queryAs(db, D, "select step_number from public.journey_steps")).rows).toHaveLength(1);
    expect((await queryAs(db, B, "select step_number from public.journey_steps where user_id = $1", [D])).rows).toEqual([]);
    await db.query("delete from public.journey_steps where user_id = $1", [D]);
  });

  it("kraven går inte att ändra av en klient", async () => {
    const result = await queryAs(db, A, "delete from public.journey_step_requirements");
    expect(result.error).toMatch(/permission denied/);
  });

  it("complete_journey_step utan inloggning nekas", async () => {
    expect((await complete(null, 1)).error).toMatch(/Inte inloggad/);
  });
});

describe("complete_journey_step: kraven", () => {
  it("steg 01 kräver klar onboarding: fyra passformssvar räcker inte, och steg 02 väntar", async () => {
    for (const id of FIT_QUESTION_IDS) await recordFit(A, fitSubjectRef(id));
    expect((await completeAndCompare(A, 1)).error).toMatch(/onboardingCompleted/);
    expect((await completeAndCompare(A, 2)).error).toMatch(/Föregående/);

    expect((await completeOnboarding(A)).error).toBeNull();
    const one = await completeAndCompare(A, 1);
    expect(one.error).toBeNull();
    const { rows } = await db.query<{ at: string }>("select onboarding_completed_at::text as at from public.profiles where user_id = $1", [A]);
    expect(new Date(one.rows![0].completed_at).toISOString()).toBe(new Date(rows[0].at).toISOString());
    // Steg 1 får ingen rad i journey_steps.
    expect((await db.query("select 1 from public.journey_steps where user_id = $1", [A])).rows).toHaveLength(0);
  });

  it("steg 01 kräver inget projekt (ingång A), men steg 02 gör det", async () => {
    expect((await completeAndCompare(E, 1)).error).toMatch(/onboardingCompleted/);
    expect((await completeOnboarding(E)).error).toBeNull();
    expect((await completeAndCompare(E, 1)).error).toBeNull();
    expect((await complete(E, 2)).error).toMatch(/Inget aktivt projekt/);
  });

  it("en gammal rad för steg 01 räknas inte: steg 02 kräver klar onboarding (beslut 2026-10-02)", async () => {
    await markDoneDirectly(C, [1]);
    expect((await completeAndCompare(C, 1)).error).toMatch(/onboardingCompleted/);
    expect((await completeAndCompare(C, 2)).error).toMatch(/Föregående/);
  });

  it("ett redan klart steg ger samma datum igen och ändras inte", async () => {
    const first = await complete(A, 1);
    const second = await complete(A, 1);
    expect(second.rows?.[0].completed_at).toEqual(first.rows?.[0].completed_at);
  });

  it("ett steg kan inte hoppas över", async () => {
    expect((await completeAndCompare(A, 3)).error).toMatch(/Föregående/);
    expect((await completeAndCompare(A, 11)).error).toMatch(/Föregående/);
  });

  it("steg 02 kräver ett aktivt projekt, som funktionen redan kräver", async () => {
    expect((await completeAndCompare(A, 2)).error).toBeNull();
  });

  it("steg 03 kräver registerdata, som grundaren inte kan lägga in själv", async () => {
    expect((await completeAndCompare(A, 3)).error).toMatch(/marketCount/);
    const own = await queryAs(
      db,
      A,
      "select * from public.record_evidence('registerMarketCount', 'sni', 'SCB', null, $1, null, 3::smallint, 'x')",
      [TODAY],
    );
    expect(own.error).toMatch(/systemet/);
    await insertSystemEvidence(A, "registerMarketCount", TODAY);
    expect((await completeAndCompare(A, 3)).error).toBeNull();
  });

  it("ett för gammalt bevis uppfyller inget krav (beslut B9)", async () => {
    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await insertSystemEvidence(A, "registerCompetitorSet", old);
    expect((await completeAndCompare(A, 4)).error).toMatch(/competitorSet/);
    await insertSystemEvidence(A, "registerCompetitorSet", TODAY);
    expect((await completeAndCompare(A, 4)).error).toBeNull();
  });

  it("steg 05 kräver både ett problembevis och ett prisbevis, självrapporterat räcker", async () => {
    const report = (kind: string, company: string) =>
      queryAs(db, A, "select * from public.record_evidence($1, $2, 'Bolag AB', null, $3, null, 5::smallint, 'Validering')", [
        kind,
        company,
        TODAY,
      ]);
    await report("customerProblemRejected", "bolag-1");
    expect((await completeAndCompare(A, 5)).error).toMatch(/willingnessToPay/);
    await report("customerPriceAccepted", "bolag-2");
    expect((await completeAndCompare(A, 5)).error).toBeNull();
  });

  it("steg 06 kräver fem svar från tre bolag, och grundarens egna svar räknas", async () => {
    // A har ett problembesked från bolag-1 och ett prisbesked från bolag-2.
    expect((await completeAndCompare(A, 6)).error).toMatch(/verdictAnswers/);
    await reportAs(A, "customerPriceDeclined", "bolag-1");
    await reportAs(A, "customerProblemConfirmed", "bolag-2");
    expect((await completeAndCompare(A, 6)).error).toMatch(/verdictAnswers/);
    await reportAs(A, "customerProblemConfirmed", "bolag-3");
    expect((await completeAndCompare(A, 6)).error).toBeNull();
  });

  it("steg 07 kräver ett beslutat pris: ett godtaget pris räcker inte, och priset ger ingen poäng", async () => {
    // A har redan ett godtaget pris från bolag-2 (steg 05).
    expect((await completeAndCompare(A, 7)).error).toMatch(/priceDecided/);
    expect((await reportAs(A, "priceDecided", "price")).error).toBeNull();
    const { rows } = await db.query<{ points: string; entered_by: string }>(
      "select points, entered_by from public.evidence where user_id = $1 and kind = 'priceDecided'",
      [A],
    );
    expect(rows.map((row) => ({ points: Number(row.points), enteredBy: row.entered_by }))).toEqual([{ points: 0, enteredBy: "founder" }]);
    expect((await completeAndCompare(A, 7)).error).toBeNull();
  });

  it("steg 12 kräver en inskickad ansökan till en finansiär", async () => {
    await markDoneDirectly(A, [8, 9, 10, 11]);
    expect((await completeAndCompare(A, 12)).error).toMatch(/fundingApplied/);
    expect((await reportAs(A, "fundingApplied", "Almi 2026-0042", "https://www.almi.se")).error).toBeNull();
    expect((await completeAndCompare(A, 12)).error).toBeNull();
  });

  it("steg 06: fem svar från två bolag räcker inte, och föråldrade och återkallade svar räknas inte", async () => {
    await markDoneDirectly(D, [1, 2, 3, 4, 5]);
    for (const kind of ["customerProblemConfirmed", "customerProblemRejected", "customerPriceAccepted", "customerPriceDeclined"]) {
      await insertCustomerAnswer(D, kind, "x");
    }
    await insertCustomerAnswer(D, "customerProblemConfirmed", "y");
    expect((await completeAndCompare(D, 6)).error).toMatch(/verdictAnswers/);

    const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await insertCustomerAnswer(D, "customerPriceDeclined", "z", old);
    expect((await completeAndCompare(D, 6)).error).toMatch(/verdictAnswers/);

    await insertCustomerAnswer(D, "customerProblemConfirmed", "w");
    await db.query("update public.evidence set retracted_at = now(), retracted_reason = 'Fel' where user_id = $1 and subject_ref = 'w'", [D]);
    expect((await completeAndCompare(D, 6)).error).toMatch(/verdictAnswers/);

    await insertCustomerAnswer(D, "customerPriceAccepted", "v");
    expect((await completeAndCompare(D, 6)).error).toBeNull();
  });

  it("ett återkallat bevis uppfyller inget krav", async () => {
    await markDoneDirectly(B, [2]);
    await insertSystemEvidence(B, "registerMarketCount", TODAY);
    await db.query("update public.evidence set retracted_at = now(), retracted_reason = 'Fel' where user_id = $1", [B]);
    expect((await completeAndCompare(B, 3)).error).toMatch(/marketCount/);
  });

  it("A:s onboarding uppfyller inte B:s steg 01 och 02", async () => {
    expect((await completeAndCompare(B, 1)).error).toMatch(/onboardingCompleted/);
    await db.query("delete from public.journey_steps where user_id = $1 and step_number = 2", [B]);
    expect((await completeAndCompare(B, 2)).error).toMatch(/Föregående/);
  });
});

describe("journey_step_requirements stämmer med core/journeyRequirements.ts", () => {
  it("samma krav per steg", async () => {
    const { rows } = await db.query<{
      step_number: number;
      req_group: string;
      evidence_kind: string | null;
      subject_ref: string | null;
      condition: string | null;
    }>("select step_number, req_group, evidence_kind, subject_ref, condition from public.journey_step_requirements");
    const key = (row: { step: number; group: string; kind: string | null; subject: string | null; condition: string | null }) =>
      `${row.step}|${row.group}|${row.kind ?? ""}|${row.subject ?? ""}|${row.condition ?? ""}`;
    const fromDb = rows
      .map((row) =>
        key({ step: row.step_number, group: row.req_group, kind: row.evidence_kind, subject: row.subject_ref, condition: row.condition }),
      )
      .sort();
    const fromCore = Object.entries(STEP_REQUIREMENTS)
      .flatMap(([step, requirements]) =>
        (requirements ?? []).map((requirement) =>
          "condition" in requirement
            ? key({ step: Number(step), group: requirement.group, kind: null, subject: null, condition: requirement.condition })
            : key({
                step: Number(step),
                group: requirement.group,
                kind: requirement.evidenceKind,
                subject: requirement.subjectRef,
                condition: null,
              }),
        ),
      )
      .sort();
    expect(fromDb).toEqual(fromCore);
  });

  it("samma trösklar per grupp", async () => {
    const { rows } = await db.query<{ step_number: number; req_group: string; min_count: number; min_subjects: number }>(
      "select step_number, req_group, min_count, min_subjects from public.journey_step_group_thresholds",
    );
    const fromDb = rows.map((row) => `${row.step_number}|${row.req_group}|${row.min_count}|${row.min_subjects}`).sort();
    const fromCore = Object.entries(GROUP_THRESHOLDS)
      .flatMap(([step, groups]) =>
        Object.entries(groups ?? {}).map(([group, threshold]) => `${step}|${group}|${threshold.minCount}|${threshold.minSubjects}`),
      )
      .sort();
    expect(fromDb).toEqual(fromCore);
  });
});
