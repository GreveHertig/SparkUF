import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PhaseId } from "@/core/score";

/**
 * Skriver poänghistoriken (public.score_snapshots). Beslut 2026-10-01
 * (docs/beslut.md, docs/bevislagring.md 2.3): ingen klient får skriva i
 * tabellen, annars går historiken och den visade förändringen att förfalska.
 * Totalen räknas av calculateScore i kod och aldrig i SQL, så den kan inte
 * sättas av en databasfunktion som användaren själv anropar. Därför skriver
 * servern med SUPABASE_SERVICE_ROLE_KEY, som går förbi RLS.
 *
 * Nyckeln:
 * - läses bara här (server-only, lint-regel: bara adapters/live/EvidenceRecorder.ts
 *   och tester får importera filen), och har aldrig NEXT_PUBLIC_-prefix;
 * - används bara mot score_snapshots, bara för insert. Klienten lämnas aldrig ut.
 *
 * userId och projectId kommer från anroparens session (requireSupabaseUser och
 * getActiveProjectId), aldrig ur indata. Den sammansatta främmande nyckeln
 * (project_id, user_id) → projects (id, user_id) gör det omöjligt i databasen
 * att skriva på någon annans projekt, även med service role.
 */

const PHASES: readonly PhaseId[] = ["discover", "tryBeforeCalls", "tryAfterCalls", "launch", "grow"];
/** delta_reason lagras som en strukturerad nyckel ("recorded:profileFitAnswer"),
 * aldrig som fri text. Visningen slår upp texten i i18n. */
const DELTA_REASON_PATTERN = /^[a-z]+(:[A-Za-z]+)?$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ScoreSnapshotWrite = {
  userId: string;
  projectId: string;
  total: number;
  phase: PhaseId;
  delta: number;
  deltaReason: string;
};

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas. Sätt dem i .env.local (se .env.example).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function validateScoreSnapshotWrite(input: ScoreSnapshotWrite): void {
  if (!UUID_PATTERN.test(input.userId) || !UUID_PATTERN.test(input.projectId)) {
    throw new Error("Poänghistoriken: ogiltigt användar- eller projekt-id.");
  }
  if (!Number.isInteger(input.total) || input.total < 1 || input.total > 100) {
    throw new Error("Poänghistoriken: totalen måste vara ett heltal 1–100.");
  }
  if (!Number.isInteger(input.delta) || Math.abs(input.delta) > 99) {
    throw new Error("Poänghistoriken: ogiltig förändring.");
  }
  if (!PHASES.includes(input.phase)) throw new Error("Poänghistoriken: okänd fas.");
  if (input.deltaReason.length > 100 || !DELTA_REASON_PATTERN.test(input.deltaReason)) {
    throw new Error("Poänghistoriken: ogiltig orsak.");
  }
}

export async function writeScoreSnapshot(input: ScoreSnapshotWrite): Promise<void> {
  validateScoreSnapshotWrite(input);
  const { error } = await getServiceClient().from("score_snapshots").insert({
    user_id: input.userId,
    project_id: input.projectId,
    total: input.total,
    phase: input.phase,
    delta: input.delta,
    delta_reason: input.deltaReason,
  });
  if (error) throw new Error(`Poänghistoriken: kunde inte spara (${error.message}).`);
}
