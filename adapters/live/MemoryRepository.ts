import type { MemoryRepository, ProfileSummary, TraceEvent, RecordTraceEventInput } from "@/ports/MemoryRepository";
import type { OnboardingQuestion } from "@/ports/ProfileRepository";
import type { Locale } from "@/i18n/context";
import { cleanText } from "@/core/text";
import { EmptyStateError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import {
  isOnboardingEntry,
  parseOnboardingAnswers,
  remainingOnboardingQuestions,
  type OnboardingAnswers,
} from "@/core/onboarding";
import { answerLabel, toAnswerViews, toOnboardingQuestion } from "@/adapters/live/onboardingQuestions";
import type { OnboardingEntry } from "@/core/domain";
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
  frustrations: string | null;
  customer_guess: string | null;
  onboarding_entry: string | null;
  onboarding_completed_at: string | null;
  /** Saknas tills migreringen 20261003150000_onboarding_v4.sql är körd. */
  onboarding_answers?: unknown;
};

const PROFILE_COLUMNS =
  "name, role, bio, time_available, money_available, risk_appetite, frustrations, customer_guess, onboarding_entry, onboarding_completed_at";

/** Tom eller bara blanksteg räknas som obesvarad, aldrig som ett svar. */
function answerOrNull(value: string | null): string | null {
  return value && value.trim() ? value : null;
}

async function getProfileRow(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(`${PROFILE_COLUMNS}, onboarding_answers`)
    .eq("user_id", userId)
    .maybeSingle();
  if (!error) return data as ProfileRow | null;
  // Utan körd v4-migrering finns inte kolumnen. Då visas profilen som förut,
  // utan v4-svar, i stället för att hela Minnet faller.
  if (error.code !== "42703" && error.code !== "PGRST204") {
    throw new Error(`Minnet: kunde inte läsa profilen (${error.message}).`);
  }
  const legacy = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("user_id", userId).maybeSingle();
  if (legacy.error) throw new Error(`Minnet: kunde inte läsa profilen (${legacy.error.message}).`);
  return legacy.data as ProfileRow | null;
}

/** En klar onboarding: ingången och v4-svaren. Annars tomt tillstånd
 * (docs/moduler/minnet.md). */
function completedOnboarding(row: ProfileRow | null): { entry: OnboardingEntry; answers: OnboardingAnswers } {
  if (!row || !row.onboarding_completed_at || !isOnboardingEntry(row.onboarding_entry)) {
    throw new EmptyStateError("Minnet", DOC);
  }
  return { entry: row.onboarding_entry, answers: parseOnboardingAnswers(row.onboarding_answers) };
}

// Med de valfria metoderna i porten utskrivna, så att de valfria metoderna i porten (getKnownProfile,
// getPendingOnboardingQuestions) är kända för /app.
export const liveMemoryRepository: MemoryRepository & Required<Pick<MemoryRepository, "getKnownProfile" | "getPendingOnboardingQuestions">> = {
  async getProfileSummary(locale: Locale): Promise<ProfileSummary> {
    const { supabase, userId } = await requireSupabaseUser();
    const row = await getProfileRow(supabase, userId);
    // Tomt tillstånd bara om onboardingen inte är gjord (docs/moduler/minnet.md).
    // Efter den visas det som finns, aldrig ifyllt: fritextsvaren från före v4
    // i sina kolumner, och v4-svaren med frågan och valets etikett (spec v4).
    // De obesvarade v4-frågorna är luckorna (getPendingOnboardingQuestions).
    const { entry, answers } = completedOnboarding(row);
    return {
      entry,
      answers: toAnswerViews(entry, answers, locale),
      name: answerOrNull(row!.name),
      role: answerOrNull(row!.role),
      bio: answerOrNull(row!.bio),
      time: answerOrNull(row!.time_available),
      money: answerOrNull(row!.money_available),
      risk: answerOrNull(row!.risk_appetite),
      frustrations: answerOrNull(row!.frustrations),
      customer: answerOrNull(row!.customer_guess),
    };
  },

  async getKnownProfile(): Promise<Partial<ProfileSummary>> {
    const { supabase, userId } = await requireSupabaseUser();
    const row = await getProfileRow(supabase, userId);
    if (!row) return {};
    // Medgrundaren läser på svenska, som resten av /app. Ett fritextsvar från
    // före v4 går före v4-svaret för samma sak, så att inget skrivs över.
    const answers = parseOnboardingAnswers(row.onboarding_answers);
    const v4 = (id: keyof OnboardingAnswers) => (answers[id] ? answerLabel(id, answers[id], "sv") : null);
    const fields: [keyof ProfileSummary, string | null][] = [
      ["name", row.name],
      ["role", row.role?.trim() ? row.role : v4("situation")],
      ["bio", row.bio],
      ["time", row.time_available?.trim() ? row.time_available : v4("time")],
      ["money", row.money_available?.trim() ? row.money_available : v4("money")],
      ["risk", row.risk_appetite],
      ["frustrations", row.frustrations?.trim() ? row.frustrations : v4("frustration")],
      ["customer", row.customer_guess?.trim() ? row.customer_guess : v4("customer")],
    ];
    // Bara ifyllda fält, så att en tom sträng aldrig ser ut som ett svar.
    const known: Partial<ProfileSummary> = Object.fromEntries(
      fields.filter(([, value]) => value?.trim()).map(([key, value]) => [key, value!.trim()]),
    );
    if (isOnboardingEntry(row.onboarding_entry)) {
      const views = toAnswerViews(row.onboarding_entry, answers, "sv");
      if (views.length > 0) known.answers = views;
    }
    return known;
  },

  async getPendingOnboardingQuestions(locale: Locale): Promise<OnboardingQuestion[]> {
    const { supabase, userId } = await requireSupabaseUser();
    const { entry, answers } = completedOnboarding(await getProfileRow(supabase, userId));
    // Härlett, aldrig lagrat: ingångens frågor minus de besvarade (spec v4 §3.2).
    return remainingOnboardingQuestions(entry, answers).map((id) => toOnboardingQuestion(entry, id, locale));
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
