// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Bevisar uppgift 6 (docs/status.md, Session P1): en inloggad användare kan
 * inte läsa, ändra, radera eller skapa rader som hör till en annan
 * användare — RLS-policyerna i supabase/migrations/ håller mot en RIKTIG
 * databas, inte bara i teorin (jfr den statiska täckningsvakten,
 * supabase/migrations/migrations.test.ts, som bara kontrollerar att en
 * policy FINNS, inte att den är korrekt).
 *
 * Kräver två redan existerande testkonton i SAMMA Supabase-projekt som
 * migreringarna är körda mot (`supabase link` + `supabase db push`, se
 * docs/status.md "Session P1" — inte körbart i den här sandboxen, ingen
 * Docker). Konto A ska inte ha något aktivt projekt: onboardingtesterna
 * skapar och raderar ett själva. Onboardingtestet klarar A:s onboarding via
 * complete_onboarding, och det går inte att göra om: efter första körningen
 * prövas bara att ett andra anrop nekas. Återställ A i SQL Editor vid behov
 * (docs/status.md, "Steg 1 klart"). Skippas i CI. Kör manuellt:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_TEST_USER_A_EMAIL=... SUPABASE_TEST_USER_A_PASSWORD=... \
 *   SUPABASE_TEST_USER_B_EMAIL=... SUPABASE_TEST_USER_B_PASSWORD=... \
 *   pnpm test adapters/live/rls.live.test.ts
 * eller, med värdena i .env.local (vitest läser inte filen själv):
 *   set -a; . ./.env.local; set +a; pnpm test adapters/live/rls.live.test.ts
 *
 * Använder @supabase/supabase-js's createClient direkt (inte
 * lib/server/supabase.ts) — den filen kräver next/headers, som inte finns
 * utanför en Next-request. Det här testet prövar databasens RLS-policyer
 * direkt, samma tabeller adaptrarna läser/skriver via requireSupabaseUser().
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.SUPABASE_TEST_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.SUPABASE_TEST_USER_A_PASSWORD;
const USER_B_EMAIL = process.env.SUPABASE_TEST_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.SUPABASE_TEST_USER_B_PASSWORD;

const CAN_RUN = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && USER_A_EMAIL && USER_A_PASSWORD && USER_B_EMAIL && USER_B_PASSWORD,
);

function makeClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}

describe.skipIf(!CAN_RUN)("RLS-isolering (riktig databas)", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userIdA: string;
  let projectIdA: string;
  const marker = `rls-test-${Date.now()}`;

  beforeAll(async () => {
    clientA = makeClient();
    clientB = makeClient();

    const signInA = await clientA.auth.signInWithPassword({ email: USER_A_EMAIL!, password: USER_A_PASSWORD! });
    if (signInA.error || !signInA.data.user) {
      throw new Error(`Kunde inte logga in SUPABASE_TEST_USER_A: ${signInA.error?.message}`);
    }
    userIdA = signInA.data.user.id;

    const signInB = await clientB.auth.signInWithPassword({ email: USER_B_EMAIL!, password: USER_B_PASSWORD! });
    if (signInB.error || !signInB.data.user) {
      throw new Error(`Kunde inte logga in SUPABASE_TEST_USER_B: ${signInB.error?.message}`);
    }

    // is_active: false — kolliderar då aldrig med ett riktigt aktivt projekt
    // kontot råkar ha (projects_ett_aktivt_per_user tillåter bara ett).
    const { data: project, error: projectError } = await clientA
      .from("projects")
      .insert({ user_id: userIdA, name: marker, one_liner: marker, is_active: false })
      .select("id")
      .single();
    if (projectError || !project) {
      throw new Error(`Kunde inte skapa testprojektet: ${projectError?.message}`);
    }
    projectIdA = project.id as string;
  });

  afterAll(async () => {
    // cascade (on delete cascade) städar bort alla beroende testrader.
    await clientA.from("projects").delete().eq("id", projectIdA);
    await clientA.from("brain_notes").delete().eq("user_id", userIdA);
  });

  /** A skapar en rad, försöker sedan som B: läsa, ändra, radera och
   * utge sig för att äga en ny rad. Allt ska misslyckas/ge noll rader. */
  async function expectRowIsolation(
    table: string,
    insertRow: Record<string, unknown>,
    updatePayload: Record<string, unknown>,
  ) {
    const { data: inserted, error: insertError } = await clientA.from(table).insert(insertRow).select("id").single();
    expect(insertError, `${table}: A kunde inte skapa sin egen testrad`).toBeNull();
    const id = inserted!.id as string;

    const { data: selected } = await clientB.from(table).select("id").eq("id", id);
    expect(selected ?? [], `${table}: B kunde läsa A:s rad`).toHaveLength(0);

    const { data: updated } = await clientB.from(table).update(updatePayload).eq("id", id).select("id");
    expect(updated ?? [], `${table}: B kunde ändra A:s rad`).toHaveLength(0);

    const { data: deleted } = await clientB.from(table).delete().eq("id", id).select("id");
    expect(deleted ?? [], `${table}: B kunde radera A:s rad`).toHaveLength(0);

    const { error: impersonationError } = await clientB.from(table).insert({ ...insertRow, user_id: userIdA });
    expect(impersonationError, `${table}: B kunde skapa en rad som utger sig för att tillhöra A`).not.toBeNull();

    await clientA.from(table).delete().eq("id", id);
  }

  it("projects: B kan inte läsa, ändra eller radera A:s projekt", async () => {
    const { data: selected } = await clientB.from("projects").select("id").eq("id", projectIdA);
    expect(selected ?? []).toHaveLength(0);

    const { data: updated } = await clientB.from("projects").update({ name: "kapad" }).eq("id", projectIdA).select("id");
    expect(updated ?? []).toHaveLength(0);

    const { data: deleted } = await clientB.from("projects").delete().eq("id", projectIdA).select("id");
    expect(deleted ?? []).toHaveLength(0);
  });

  it("profiles: B kan inte läsa, ändra eller radera A:s profil", async () => {
    const { data: selected } = await clientB.from("profiles").select("user_id").eq("user_id", userIdA);
    expect(selected ?? []).toHaveLength(0);

    const { data: updated } = await clientB
      .from("profiles")
      .update({ name: "kapad" })
      .eq("user_id", userIdA)
      .select("user_id");
    expect(updated ?? []).toHaveLength(0);

    // Ingen klient får radera profilrader (20261002150000_steg1_onboarding.sql).
    const { data: deleted, error: deleteError } = await clientB
      .from("profiles")
      .delete()
      .eq("user_id", userIdA)
      .select("user_id");
    expect(deleteError?.code).toBe("42501");
    expect(deleted ?? []).toHaveLength(0);
  });

  // journey_steps är stängd för skrivning sedan
  // 20261001150000_journey_step_completion.sql: ett steg markeras klart bara
  // via complete_journey_step, som prövar stegets krav. Annars kunde A
  // markera steg 11 som klart själv och låsa upp hela poängen. Samma regler
  // prövas i CI mot Postgres i supabase/migrations/journeyStepCompletion.pg.test.ts.
  it("journey_steps: A kan inte markera ett steg som klart direkt, varken med insert, update eller funktionen utan krav", async () => {
    const insert = await clientA
      .from("journey_steps")
      .insert({ user_id: userIdA, project_id: projectIdA, step_number: 11, completed_at: new Date().toISOString() });
    expect(insert.error, "journey_steps: A kunde skriva ett avklarat steg direkt").not.toBeNull();

    const { data: updated } = await clientA
      .from("journey_steps")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", userIdA)
      .select("id");
    expect(updated ?? [], "journey_steps: A kunde markera ett steg som klart med update").toHaveLength(0);

    // Steg 12 kräver steg 11, och steg 06 har inget krav alls. Båda nekas
    // oavsett vad kontots aktiva projekt innehåller.
    const skipped = await clientA.rpc("complete_journey_step", { p_step_number: 12 });
    expect(skipped.error, "journey_steps: A kunde hoppa till steg 12").not.toBeNull();

    const { error: impersonationError } = await clientB
      .from("journey_steps")
      .insert({ user_id: userIdA, project_id: projectIdA, step_number: 1, completed_at: new Date().toISOString() });
    expect(impersonationError, "journey_steps: B kunde skriva ett steg på A:s projekt").not.toBeNull();
  });

  // evidence och score_snapshots är stängda för skrivning sedan
  // 20261001120000_evidence_write_path.sql (docs/bevislagring.md 2.3): ingen
  // klient skriver direkt. A skriver bevis bara via record_evidence, och
  // poängen sätts av databasen ur sorten. Samma regler prövas i CI mot
  // Postgres i supabase/migrations/evidenceWritePath.pg.test.ts.
  it("evidence: egna points avvisas, och B kan varken läsa, ändra eller återkalla A:s bevis", async () => {
    const direct = await clientA.from("evidence").insert({
      user_id: userIdA,
      project_id: projectIdA,
      kind: "customerProblemConfirmed",
      subject_ref: marker,
      entered_by: "system",
      module: "test",
      part_id: "problem",
      points: 99,
      data_type: "customer",
      source_name: marker,
      fetched_at: "2026-01-01",
    });
    expect(direct.error, "evidence: A kunde skriva en rad med egna points direkt").not.toBeNull();

    // record_evidence använder det AKTIVA projektet. Testprojektet är inaktivt
    // (se beforeAll), så anropet går mot kontots riktiga aktiva projekt om ett
    // sådant finns. Saknas det nekas anropet, och då prövas bara läsdelen.
    const recorded = await clientA.rpc("record_evidence", {
      p_kind: "customerProblemConfirmed",
      p_subject_ref: marker,
      p_source_name: marker,
      p_source_url: null,
      p_fetched_at: "2026-01-01",
      p_quote: null,
      p_step_number: null,
      p_module: "test",
    });
    if (recorded.error) {
      expect(recorded.error.message).toMatch(/aktivt projekt/i);
      return;
    }
    const evidenceId = (recorded.data as { evidence_id: string }[])[0].evidence_id;

    const { data: row } = await clientA.from("evidence").select("points, entered_by").eq("id", evidenceId).single();
    expect(Number(row!.points), "evidence: poängen kom inte ur sorten").toBe(1.5);
    expect(row!.entered_by).toBe("founder");

    const { data: selected } = await clientB.from("evidence").select("id").eq("id", evidenceId);
    expect(selected ?? [], "evidence: B kunde läsa A:s bevis").toHaveLength(0);
    const { data: updated } = await clientB.from("evidence").update({ points: 99 }).eq("id", evidenceId).select("id");
    expect(updated ?? [], "evidence: B kunde ändra A:s bevis").toHaveLength(0);
    const retractedByB = await clientB.rpc("retract_evidence", { p_evidence_id: evidenceId, p_reason: "kapad" });
    expect(retractedByB.error, "evidence: B kunde återkalla A:s bevis").not.toBeNull();

    // Städa: A återkallar sitt testbevis (bevis raderas aldrig av en klient).
    await clientA.rpc("retract_evidence", { p_evidence_id: evidenceId, p_reason: marker });
  });

  it("score_snapshots: ingen klient kan skriva historiken, inte ens sin egen", async () => {
    const { error } = await clientA
      .from("score_snapshots")
      .insert({ user_id: userIdA, project_id: projectIdA, total: 99, phase: "grow" });
    expect(error, "score_snapshots: A kunde skriva en egen snapshot").not.toBeNull();
    const { data: selected } = await clientB.from("score_snapshots").select("id").eq("user_id", userIdA);
    expect(selected ?? [], "score_snapshots: B kunde läsa A:s historik").toHaveLength(0);
  });

  it("trace_events: RLS-isolering", async () =>
    expectRowIsolation(
      "trace_events",
      { user_id: userIdA, project_id: projectIdA, module: "test", description: marker },
      { description: "kapad" },
    ));

  it("legal_items: RLS-isolering", async () =>
    expectRowIsolation(
      "legal_items",
      {
        user_id: userIdA,
        project_id: projectIdA,
        item_key: "test",
        title: marker,
        description: marker,
        source_name: marker,
        fetched_at: "2026-01-01",
      },
      { title: "kapad" },
    ));

  it("pulse_signals: RLS-isolering", async () =>
    expectRowIsolation(
      "pulse_signals",
      {
        user_id: userIdA,
        project_id: projectIdA,
        category: "test",
        headline: marker,
        why_it_matters: marker,
        source_name: marker,
        fetched_at: "2026-01-01",
      },
      { headline: "kapad" },
    ));

  // Pulsens dagscache (supabase/migrations/20260925090000_pulse_fetches.sql).
  // Ingen id-kolumn (nyckeln är user_id + fetch_date) och ingen delete-policy,
  // så expectRowIsolation passar inte. Testraden får ett datum långt bak i
  // tiden: den krockar aldrig med dagens riktiga cache, och adaptern läser
  // bara den nyaste raden. Ett framtida datum skulle blockera kontots egen
  // sökning (docs/status.md, "Pulsen: liveadaptern", Kända problem). Raden
  // kan inte raderas av klienten; upsert gör att den inte samlas på hög.
  it("pulse_fetches: B kan inte läsa, ändra, radera eller skapa A:s dagscache", async () => {
    const testDate = "2000-01-01";
    const row = { user_id: userIdA, fetch_date: testDate, status: "done", fetched_at: "2000-01-01T06:00:00Z" };

    const { error: upsertError } = await clientA.from("pulse_fetches").upsert(row, { onConflict: "user_id,fetch_date" });
    expect(upsertError, "pulse_fetches: A kunde inte skapa sin egen rad").toBeNull();
    const { data: own } = await clientA
      .from("pulse_fetches")
      .select("fetch_date")
      .eq("user_id", userIdA)
      .eq("fetch_date", testDate);
    expect(own ?? [], "pulse_fetches: A kunde inte läsa sin egen rad").toHaveLength(1);

    const { data: selected } = await clientB.from("pulse_fetches").select("fetch_date").eq("user_id", userIdA);
    expect(selected ?? [], "pulse_fetches: B kunde läsa A:s rader").toHaveLength(0);

    const { data: updated } = await clientB
      .from("pulse_fetches")
      .update({ status: "error" })
      .eq("user_id", userIdA)
      .eq("fetch_date", testDate)
      .select("fetch_date");
    expect(updated ?? [], "pulse_fetches: B kunde ändra A:s rad").toHaveLength(0);

    const { data: deleted } = await clientB
      .from("pulse_fetches")
      .delete()
      .eq("user_id", userIdA)
      .eq("fetch_date", testDate)
      .select("fetch_date");
    expect(deleted ?? [], "pulse_fetches: B kunde radera A:s rad").toHaveLength(0);

    // B försöker lägga en rad i A:s namn, t.ex. ett framtida datum som skulle
    // blockera A:s sökning. Ska stoppas av insert-policyn.
    const { error: impersonationError } = await clientB
      .from("pulse_fetches")
      .insert({ ...row, fetch_date: "2099-01-01" });
    expect(impersonationError, "pulse_fetches: B kunde skapa en rad i A:s namn").not.toBeNull();

    const { data: stillThere } = await clientA
      .from("pulse_fetches")
      .select("status")
      .eq("user_id", userIdA)
      .eq("fetch_date", testDate)
      .single();
    expect(stillThere?.status, "pulse_fetches: A:s rad ändrades av B").toBe("done");
  });

  it("outreach_messages + responses: RLS-isolering", async () => {
    const { data: message, error: messageError } = await clientA
      .from("outreach_messages")
      .insert({ user_id: userIdA, project_id: projectIdA, recipient_email: "test@exempel.se", subject: marker, body: marker })
      .select("id")
      .single();
    expect(messageError).toBeNull();
    const messageId = message!.id as string;

    const { data: selectedMessage } = await clientB.from("outreach_messages").select("id").eq("id", messageId);
    expect(selectedMessage ?? []).toHaveLength(0);

    const { data: response, error: responseError } = await clientA
      .from("responses")
      .insert({ user_id: userIdA, outreach_message_id: messageId, body: marker })
      .select("id")
      .single();
    expect(responseError).toBeNull();
    const responseId = response!.id as string;

    const { data: selectedResponse } = await clientB.from("responses").select("id").eq("id", responseId);
    expect(selectedResponse ?? []).toHaveLength(0);

    const { error: impersonationError } = await clientB
      .from("responses")
      .insert({ user_id: userIdA, outreach_message_id: messageId, body: "kapad" });
    expect(impersonationError).not.toBeNull();

    await clientA.from("responses").delete().eq("id", responseId);
    await clientA.from("outreach_messages").delete().eq("id", messageId);
  });

  it("brain_notes: B kan inte läsa, ändra eller radera A:s Hjärna, och kan inte skapa en åt A", async () => {
    const { error: upsertError } = await clientA
      .from("brain_notes")
      .upsert({ user_id: userIdA, notes: marker }, { onConflict: "user_id" });
    expect(upsertError).toBeNull();

    const { data: selected } = await clientB.from("brain_notes").select("user_id").eq("user_id", userIdA);
    expect(selected ?? []).toHaveLength(0);

    const { data: updated } = await clientB
      .from("brain_notes")
      .update({ notes: "kapad" })
      .eq("user_id", userIdA)
      .select("user_id");
    expect(updated ?? []).toHaveLength(0);

    const { data: deleted } = await clientB.from("brain_notes").delete().eq("user_id", userIdA).select("user_id");
    expect(deleted ?? []).toHaveLength(0);
  });

  // Onboardingen live, PR 2 (docs/status.md). Kräver migreringen
  // 20260930120000_onboarding.sql. Felkoderna kommer från Postgres via
  // PostgREST: 42501 (RLS), 23505 (unikt index), 23514 (check-villkor).
  describe("onboardingen", () => {
    it("profiles: B kan inte sätta A:s onboarding-kolumner", async () => {
      const before = await clientA
        .from("profiles")
        .select("onboarding_entry, onboarding_completed_at")
        .eq("user_id", userIdA)
        .single();
      expect(before.error, "profiles: A kunde inte läsa sin egen onboardingstatus").toBeNull();

      const { data: updated, error } = await clientB
        .from("profiles")
        .update({ onboarding_entry: "hasIdea", onboarding_completed_at: new Date().toISOString(), role: "kapad" })
        .eq("user_id", userIdA)
        .select("user_id");
      expect(error?.code, "profiles: klienten fick skriva onboarding-kolumnerna").toBe("42501");
      expect(updated ?? [], "profiles: B kunde ändra A:s onboarding").toHaveLength(0);

      const after = await clientA
        .from("profiles")
        .select("onboarding_entry, onboarding_completed_at")
        .eq("user_id", userIdA)
        .single();
      expect(after.data, "profiles: A:s onboardingstatus ändrades av B").toEqual(before.data);
    });

    // Bara public.complete_onboarding får sätta kolumnerna
    // (20261002150000_steg1_onboarding.sql). Annars kunde A hoppa över
    // spärren mot /app och låsa upp steg 1 och 2 själv.
    it("profiles: A kan inte sätta sina egna onboarding-kolumner, varken med update eller insert", async () => {
      const before = await clientA
        .from("profiles")
        .select("onboarding_entry, onboarding_completed_at")
        .eq("user_id", userIdA)
        .single();

      for (const payload of [
        { onboarding_completed_at: new Date().toISOString() },
        { onboarding_entry: "hasIdea" },
        { role: "r", onboarding_entry: "hasIdea", onboarding_completed_at: new Date().toISOString() },
      ]) {
        const { data, error } = await clientA.from("profiles").update(payload).eq("user_id", userIdA).select("user_id");
        expect(error?.code, `profiles: A fick skriva ${Object.keys(payload).join(", ")}`).toBe("42501");
        expect(data ?? []).toHaveLength(0);
      }

      const insert = await clientA
        .from("profiles")
        .insert({ user_id: userIdA, onboarding_entry: "hasIdea", onboarding_completed_at: new Date().toISOString() });
      expect(insert.error, "profiles: A kunde skapa en profilrad").not.toBeNull();

      const after = await clientA
        .from("profiles")
        .select("onboarding_entry, onboarding_completed_at")
        .eq("user_id", userIdA)
        .single();
      expect(after.data).toEqual(before.data);
    });

    it("onboardingflödet fungerar via complete_onboarding, ett andra anrop ger 55000, och steg 2 kan markeras klart efteråt", async () => {
      const answers = { role: "RLS-test", customer: "RLS-test", time: "1 timme", money: "Inget" };
      const status = await clientA.from("profiles").select("onboarding_completed_at").eq("user_id", userIdA).single();
      expect(status.error).toBeNull();
      if (status.data!.onboarding_completed_at === null) {
        const first = await clientA.rpc("complete_onboarding", { p_entry: "hasIdea", p_answers: answers });
        expect(first.error, "complete_onboarding: A kunde inte klara onboardingen").toBeNull();
      }
      const done = await clientA.from("profiles").select("onboarding_entry, onboarding_completed_at").eq("user_id", userIdA).single();
      expect(done.data!.onboarding_completed_at).not.toBeNull();

      const second = await clientA.rpc("complete_onboarding", { p_entry: "hasIdea", p_answers: answers });
      expect(second.error?.code, "complete_onboarding: ett andra anrop togs emot").toBe("55000");
      const unchanged = await clientA.from("profiles").select("onboarding_entry, onboarding_completed_at").eq("user_id", userIdA).single();
      expect(unchanged.data).toEqual(done.data);

      // Steg 1 är klart av onboardingen, utan projekt och utan rad.
      const stepOne = await clientA.rpc("complete_journey_step", { p_step_number: 1 });
      expect(stepOne.error, "complete_journey_step(1) efter onboardingen").toBeNull();

      // Steg 2 kräver ett aktivt projekt. Kontot ska inte ha något (se
      // filhuvudet); har det ett används det och lämnas kvar.
      const { data: existing } = await clientA
        .from("projects")
        .select("id")
        .eq("user_id", userIdA)
        .eq("is_active", true)
        .maybeSingle();
      let createdId: string | null = null;
      try {
        if (!existing) {
          const created = await clientA
            .from("projects")
            .insert({ user_id: userIdA, name: `${marker}-steg2`, one_liner: marker, is_active: true })
            .select("id")
            .single();
          expect(created.error, "projects: A kunde inte skapa ett aktivt projekt").toBeNull();
          createdId = created.data!.id as string;
        }
        const stepTwo = await clientA.rpc("complete_journey_step", { p_step_number: 2 });
        expect(stepTwo.error, "complete_journey_step(2) efter onboardingen").toBeNull();
        const { data: rows } = await clientA
          .from("journey_steps")
          .select("step_number, completed_at")
          .eq("project_id", createdId ?? existing!.id)
          .eq("step_number", 2);
        expect(rows?.[0]?.completed_at).toBeTruthy();
      } finally {
        // on delete cascade tar med sig raden i journey_steps.
        if (createdId) await clientA.from("projects").delete().eq("id", createdId);
      }
    });

    it("projects: B kan inte skapa ett projekt med user_id = A", async () => {
      const { data, error } = await clientB
        .from("projects")
        .insert({ user_id: userIdA, name: marker, one_liner: marker, is_active: false })
        .select("id");
      expect(error, "projects: B kunde skapa ett projekt i A:s namn").not.toBeNull();
      expect(error?.code).toBe("42501");
      expect(data).toBeNull();
    });

    it("projects: A kan inte ha två aktiva projekt (projects_ett_aktivt_per_user)", async () => {
      const created: string[] = [];
      try {
        // Kontot ska inte ha något aktivt projekt (se filhuvudet), men har det
        // ett räcker det som det första.
        const { data: existing } = await clientA
          .from("projects")
          .select("id")
          .eq("user_id", userIdA)
          .eq("is_active", true)
          .maybeSingle();
        if (!existing) {
          const first = await clientA
            .from("projects")
            .insert({ user_id: userIdA, name: `${marker}-aktiv-1`, one_liner: marker, is_active: true })
            .select("id")
            .single();
          expect(first.error, "projects: A kunde inte skapa sitt första aktiva projekt").toBeNull();
          created.push(first.data!.id as string);
        }

        const second = await clientA
          .from("projects")
          .insert({ user_id: userIdA, name: `${marker}-aktiv-2`, one_liner: marker, is_active: true })
          .select("id")
          .single();
        if (second.data) created.push(second.data.id as string);
        expect(second.error, "projects: A fick två aktiva projekt").not.toBeNull();
        expect(second.error?.code).toBe("23505");
      } finally {
        for (const id of created) await clientA.from("projects").delete().eq("id", id);
      }
    });

    it("projects: databasen avvisar för långt eller tomt namn och för lång ingress", async () => {
      const cases = [
        { name: marker, one_liner: "a".repeat(281) },
        { name: "a".repeat(81), one_liner: marker },
        { name: "   ", one_liner: marker },
      ];
      for (const fields of cases) {
        const { data, error } = await clientA
          .from("projects")
          .insert({ user_id: userIdA, ...fields, is_active: false })
          .select("id");
        if (data?.[0]) await clientA.from("projects").delete().eq("id", data[0].id);
        expect(error, `projects: databasen tog emot ${JSON.stringify(fields).slice(0, 60)}…`).not.toBeNull();
        expect(error?.code).toBe("23514");
      }
    });

    it("profiles: databasen avvisar ett för långt svar på A:s egen rad, och complete_onboarding en okänd ingång", async () => {
      const tooLong = await clientA.from("profiles").update({ role: "a".repeat(1001) }).eq("user_id", userIdA).select("user_id");
      expect(tooLong.error, "profiles: databasen tog emot ett svar på 1001 tecken").not.toBeNull();
      expect(tooLong.error?.code).toBe("23514");

      // Ingången prövas före raden, så felet är detsamma om A redan är klar.
      const unknownEntry = await clientA.rpc("complete_onboarding", {
        p_entry: "okänd",
        p_answers: { role: "r", time: "t", money: "m" },
      });
      expect(unknownEntry.error, "complete_onboarding: databasen tog emot en okänd ingång").not.toBeNull();
      expect(unknownEntry.error?.code).toBe("22023");
    });
  });

  it("companies: läsbar för alla inloggade, men ingen klient kan skriva (delad registerdata, ingen user_id)", async () => {
    const { error: selectError } = await clientA.from("companies").select("id").limit(1);
    expect(selectError).toBeNull();

    const { error: insertError } = await clientA
      .from("companies")
      .insert({ name: marker, sni_code: "00000", source_name: marker, fetched_at: "2026-01-01" });
    expect(insertError).not.toBeNull();
  });
});
