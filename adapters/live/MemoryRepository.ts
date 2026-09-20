import type { MemoryRepository, ProfileSummary, TraceEvent, RecordTraceEventInput } from "@/ports/MemoryRepository";
import { cleanText } from "@/core/text";
import { EmptyStateError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import type { SupabaseClient } from "@supabase/supabase-js";

const DOC = "docs/moduler/minnet.md";
// Samma gräns som supabase/migrations's check-villkor på brain_notes.notes —
// en andra spärr i adaptern, inte bara i databasen.
const MAX_NOTES_LENGTH = 20000;
const MAX_TRACE_MODULE_LENGTH = 60;
const MAX_TRACE_DESCRIPTION_LENGTH = 500;

type ProfileRow = {
  name: string | null;
  role: string | null;
  bio: string | null;
  time_available: string | null;
  money_available: string | null;
  risk_appetite: string | null;
};

async function getProfileRow(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, role, bio, time_available, money_available, risk_appetite")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Minnet: kunde inte läsa profilen (${error.message}).`);
  return data as ProfileRow | null;
}

export const liveMemoryRepository: MemoryRepository = {
  async getProfileSummary(): Promise<ProfileSummary> {
    const { supabase, userId } = await requireSupabaseUser();
    const row = await getProfileRow(supabase, userId);
    // Alla sex fält krävs (docs/moduler/minnet.md) — ett konto som gjort
    // 01 Om dig men inte fyllt i bakgrund/resurser är ett tomt tillstånd,
    // inte ett fel.
    if (!row || !row.name || !row.role || !row.bio || !row.time_available || !row.money_available || !row.risk_appetite) {
      throw new EmptyStateError("Minnet", DOC);
    }
    return {
      name: row.name,
      role: row.role,
      bio: row.bio,
      time: row.time_available,
      money: row.money_available,
      risk: row.risk_appetite,
    };
  },

  async getBrainNotes(): Promise<string> {
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase.from("brain_notes").select("notes").eq("user_id", userId).maybeSingle();
    if (error) throw new Error(`Minnet: kunde inte läsa Hjärnan (${error.message}).`);
    // Tom sträng är giltigt (docs/moduler/minnet.md) — grundaren har inte
    // skrivit något än, inte ett fel.
    return (data?.notes as string | undefined) ?? "";
  },

  async setBrainNotes(notes: string): Promise<void> {
    const { supabase, userId } = await requireSupabaseUser();
    // Grundarens egen fria text, ovaliderad mot ett schema (docs/moduler/minnet.md)
    // — lagras och returneras som REN TEXT, aldrig HTML-renderad av något som
    // läser den. Om den någonsin skickas till Gemini är den data, aldrig
    // instruktion (CLAUDE.md, avsnitt Säkerhet).
    const trimmed = notes.trim();
    if (trimmed.length > MAX_NOTES_LENGTH) {
      throw new Error(`Minnet: Hjärnan får vara högst ${MAX_NOTES_LENGTH} tecken.`);
    }
    const { error } = await supabase
      .from("brain_notes")
      .upsert({ user_id: userId, notes: trimmed, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error(`Minnet: kunde inte spara Hjärnan (${error.message}).`);
  },

  async recordTraceEvent(event: RecordTraceEventInput): Promise<void> {
    const { supabase, userId } = await requireSupabaseUser();
    // Beskrivningen kan innehålla text från en extern källa: rensas och
    // kortas, och lagras som REN TEXT (data, aldrig instruktion). user_id
    // kommer alltid ur sessionen, och RLS ("insert egen") är den bindande spärren.
    const moduleName = cleanText(event.module, MAX_TRACE_MODULE_LENGTH);
    const description = cleanText(event.description, MAX_TRACE_DESCRIPTION_LENGTH);
    const occurredAt = new Date(event.occurredAtIso);
    if (!moduleName || !description || Number.isNaN(occurredAt.getTime())) {
      throw new Error("Minnet: ogiltig Spår-post (modul, beskrivning och giltig tid krävs).");
    }
    const occurred_at = occurredAt.toISOString();

    // Idempotens: samma händelse (t.ex. en pivot som räknas om) sparas inte igen.
    const { data: existing, error: readError } = await supabase
      .from("trace_events")
      .select("id")
      .eq("user_id", userId)
      .eq("module", moduleName)
      .eq("occurred_at", occurred_at)
      .eq("description", description)
      .limit(1);
    if (readError) throw new Error(`Minnet: kunde inte läsa Spåret (${readError.message}).`);
    if (Array.isArray(existing) && existing.length > 0) return;

    const { error } = await supabase
      .from("trace_events")
      .insert({ user_id: userId, module: moduleName, description, occurred_at });
    if (error) throw new Error(`Minnet: kunde inte spara i Spåret (${error.message}).`);
  },

  async getTraceEvents(): Promise<TraceEvent[]> {
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from("trace_events")
      .select("id, occurred_at, description")
      .eq("user_id", userId)
      // Kronologisk ordning, äldst till senast (docs/moduler/minnet.md) —
      // /app/minnet bestämmer visningsordningen separat.
      .order("occurred_at", { ascending: true });
    if (error) throw new Error(`Minnet: kunde inte läsa Spåret (${error.message}).`);
    return ((data ?? []) as { id: string; occurred_at: string; description: string }[]).map((row) => ({
      id: row.id,
      timestampIso: row.occurred_at,
      description: row.description,
    }));
  },
};
