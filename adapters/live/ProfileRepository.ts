import type {
  OnboardingAnswer,
  OnboardingScript,
  OnboardingStatus,
  ProfileRepository,
  SavedOnboardingAnswer,
} from "@/ports/ProfileRepository";
import type { OnboardingEntry, Profile } from "@/core/domain";
import type { Locale } from "@/i18n/context";
import {
  EmptyStateError,
  NotImplementedError,
  OnboardingAlreadyCompletedError,
  OnboardingAnswerInvalidError,
  OnboardingAnswerLockedError,
} from "@/core/errors";
import {
  ONBOARDING_QUESTIONS_BY_ENTRY,
  isOnboardingQuestionFor,
  isValidOnboardingAnswer,
  parseOnboardingAnswerRecords,
} from "@/core/onboarding";
import { requireSupabaseUser } from "@/lib/server/session";
import { readOnboardingStatus } from "@/lib/server/onboardingStatus";
import { answeredOn, toOnboardingQuestion } from "@/adapters/live/onboardingQuestions";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

const DOC = "docs/moduler/profil.md";
/** Felkoden från public.complete_onboarding när onboardingen redan är klar,
 * och från public.save_onboarding_answer när frågan redan är besvarad efteråt. */
const ALREADY_COMPLETED = "55000";
/** Felkoden när databasen avvisar indata (fel fråga för ingången, okänt val). */
const INVALID_INPUT = "22023";
const dictionaries = { sv, en };

/** Svaren som ett objekt {frågans id: svar}, så som
 * public.complete_onboarding tar emot dem. Kastar om en fråga inte hör till
 * ingången, är besvarad två gånger eller har ett ogiltigt svar. zod i server
 * actions är det första lagret och databasfunktionen det bindande. Kärnfrågorna
 * kan redan vara sparade (saveOnboardingAnswer), så listan får vara tom. */
function answerObject(entry: OnboardingEntry, answers: OnboardingAnswer[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { questionId, answer } of answers) {
    if (!isOnboardingQuestionFor(entry, questionId)) {
      throw new Error(`Profil: frågan "${questionId}" hör inte till ingången ${entry}.`);
    }
    if (questionId in result) {
      throw new Error(`Profil: frågan "${questionId}" är besvarad två gånger.`);
    }
    if (!isValidOnboardingAnswer(questionId, answer)) {
      throw new Error(`Profil: svaret på "${questionId}" är ogiltigt.`);
    }
    result[questionId] = answer.trim();
  }
  return result;
}

/** En kolumn eller funktion som saknas: migreringen
 * 20261003150000_onboarding_v4.sql är inte körd. */
function isMissingMigration(error: { code?: string }): boolean {
  return ["42703", "PGRST204", "PGRST202", "42883"].includes(error.code ?? "");
}

// Med de valfria metoderna i porten utskrivna, så att de valfria metoderna i porten (saveOnboardingAnswer,
// getOnboardingAnswers) är kända för routes och actions i /start.
export const liveProfileRepository: ProfileRepository & Required<Pick<ProfileRepository, "saveOnboardingAnswer" | "getOnboardingAnswers">> = {
  async getProfile(): Promise<Profile> {
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("name, initials")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Profil: kunde inte läsa profilen (${error.message}).`);
    }
    // handle_new_user()-triggern (supabase/migrations/) skapar alltid en rad
    // vid signup, men name/initials är tomma tills 01 Om dig är klar — ett
    // tomt namn är samma tomma tillstånd som en helt saknad rad
    // (docs/moduler/profil.md: "en användare utan namn har inte slutfört
    // 01 Om dig").
    if (!data || !data.name || !data.initials) {
      throw new EmptyStateError("Profil", DOC);
    }
    return { name: data.name as string, initials: data.initials as string };
  },

  // Spec v4 §4: kärnfrågorna, med val där det går, ur i18n. Grundaren svarar
  // på en i taget och varje svar sparas direkt (saveOnboardingAnswer). De
  // återstående frågorna ställs i Minnet (MemoryRepository.getPendingOnboardingQuestions).
  async getOnboardingScript(entry: OnboardingEntry, locale: Locale): Promise<OnboardingScript> {
    return {
      questions: ONBOARDING_QUESTIONS_BY_ENTRY[entry].core.map((id) => toOnboardingQuestion(entry, id, locale)),
      closingMessage: dictionaries[locale].onboarding.startFrame.lede,
    };
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const { supabase, userId } = await requireSupabaseUser();
    return readOnboardingStatus(supabase, userId);
  },

  // Klienten kan inte skriva onboarding_entry, onboarding_completed_at eller
  // onboarding_answers själv (supabase/migrations/20261002150000_steg1_onboarding.sql,
  // 20261003150000_onboarding_v4.sql). Bara public.complete_onboarding
  // (security definer) sätter ingången och klar-tiden, efter att ha prövat att
  // alla kärnfrågor har svar. En klar onboarding skrivs aldrig över: funktionen
  // ger felkod 55000.
  async completeOnboarding({ entry, answers }): Promise<void> {
    const answersById = answerObject(entry, answers);
    const { supabase } = await requireSupabaseUser();
    const { error } = await supabase.rpc("complete_onboarding", { p_entry: entry, p_answers: answersById });
    if (!error) return;
    if (error.code === ALREADY_COMPLETED) throw new OnboardingAlreadyCompletedError();
    throw new Error(`Profil: kunde inte spara onboardingen (${error.message}).`);
  },

  async saveOnboardingAnswer({ questionId, answer }: OnboardingAnswer): Promise<SavedOnboardingAnswer> {
    // Ingången prövas i databasen (den härleds där, aldrig ur indata). Här
    // bara att frågan finns och att svaret har rätt form.
    const known = isOnboardingQuestionFor("noIdea", questionId) || isOnboardingQuestionFor("hasIdea", questionId);
    if (!known || !isValidOnboardingAnswer(questionId, answer)) {
      throw new Error(`Profil: svaret på "${questionId}" är ogiltigt.`);
    }
    const { supabase } = await requireSupabaseUser();
    const trimmed = answer.trim();
    const { data, error } = await supabase.rpc("save_onboarding_answer", { p_question: questionId, p_answer: trimmed });
    // Databasen ger tiden svaret sparades med (now()).
    if (!error) return { answer: trimmed, answeredOn: answeredOn(typeof data === "string" ? data : null) };
    if (error.code === ALREADY_COMPLETED) throw new OnboardingAnswerLockedError();
    if (error.code === INVALID_INPUT) throw new OnboardingAnswerInvalidError();
    if (isMissingMigration(error)) throw new NotImplementedError("Profil (onboarding v4)", DOC);
    throw new Error(`Profil: kunde inte spara svaret (${error.message}).`);
  },

  async getOnboardingAnswers(): Promise<Record<string, SavedOnboardingAnswer>> {
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase.from("profiles").select("onboarding_answers").eq("user_id", userId).maybeSingle();
    if (error) {
      if (isMissingMigration(error)) throw new NotImplementedError("Profil (onboarding v4)", DOC);
      throw new Error(`Profil: kunde inte läsa svaren (${error.message}).`);
    }
    // Bara giltiga svar: ett okänt id eller val tas bort, aldrig gissat. Ett
    // svar utan tid får `answeredOn: null`, aldrig dagens datum.
    const records = parseOnboardingAnswerRecords(data?.onboarding_answers);
    return Object.fromEntries(
      Object.entries(records).map(([id, record]) => [id, { answer: record!.answer, answeredOn: answeredOn(record!.answeredAt) }]),
    );
  },
};
