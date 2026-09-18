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
 * Docker). Skippas i CI. Kör manuellt:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   SUPABASE_TEST_USER_A_EMAIL=... SUPABASE_TEST_USER_A_PASSWORD=... \
 *   SUPABASE_TEST_USER_B_EMAIL=... SUPABASE_TEST_USER_B_PASSWORD=... \
 *   pnpm test adapters/live/rls.live.test.ts
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

    const { data: deleted } = await clientB.from("profiles").delete().eq("user_id", userIdA).select("user_id");
    expect(deleted ?? []).toHaveLength(0);
  });

  it("journey_steps: RLS-isolering", async () =>
    expectRowIsolation(
      "journey_steps",
      { user_id: userIdA, project_id: projectIdA, step_number: 1 },
      { why: "kapad" },
    ));

  it("evidence: RLS-isolering", async () =>
    expectRowIsolation(
      "evidence",
      {
        user_id: userIdA,
        project_id: projectIdA,
        part_id: "fit",
        points: 1,
        data_type: "customer",
        source_name: marker,
        fetched_at: "2026-01-01",
      },
      { points: 99 },
    ));

  it("score_snapshots: RLS-isolering", async () =>
    expectRowIsolation(
      "score_snapshots",
      { user_id: userIdA, project_id: projectIdA, total: 10, phase: "discover" },
      { total: 99 },
    ));

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

  it("companies: läsbar för alla inloggade, men ingen klient kan skriva (delad registerdata, ingen user_id)", async () => {
    const { error: selectError } = await clientA.from("companies").select("id").limit(1);
    expect(selectError).toBeNull();

    const { error: insertError } = await clientA
      .from("companies")
      .insert({ name: marker, sni_code: "00000", source_name: marker, fetched_at: "2026-01-01" });
    expect(insertError).not.toBeNull();
  });
});
