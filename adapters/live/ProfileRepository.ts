import type {
  OnboardingAnswer,
  OnboardingScript,
  OnboardingStatus,
  ProfileRepository,
} from "@/ports/ProfileRepository";
import type { OnboardingEntry, Profile } from "@/core/domain";
import type { Locale } from "@/i18n/context";
import { EmptyStateError, OnboardingAlreadyCompletedError } from "@/core/errors";
import {
  isProfileQuestionFor,
  isValidProfileAnswer,
  PROFILE_QUESTIONS_BY_ENTRY,
  type ProfileQuestionId,
} from "@/core/onboarding";
import { requireSupabaseUser } from "@/lib/server/session";
import { readOnboardingStatus } from "@/lib/server/onboardingStatus";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

const DOC = "docs/moduler/profil.md";
const dictionaries = { sv, en };

/** Profilfrågan → profilradens befintliga kolumn, som Minnets Profilen-flik
 * redan läser (docs/moduler/profil.md). */
const PROFILE_COLUMN: Record<ProfileQuestionId, string> = {
  role: "role",
  bio: "bio",
  time: "time_available",
  money: "money_available",
  risk: "risk_appetite",
};

/** Svaren som kolumnvärden. Kastar om svaren inte är exakt ingångens frågor,
 * en gång var, med 1–1000 tecken efter trim. zod i server actions (PR 3) är
 * det första lagret och check-villkoren i databasen det sista. */
function answerColumns(entry: OnboardingEntry, answers: OnboardingAnswer[]): Record<string, string> {
  const columns: Record<string, string> = {};
  const answered = new Set<string>();
  for (const { questionId, answer } of answers) {
    if (!isProfileQuestionFor(entry, questionId)) {
      throw new Error(`Profil: frågan "${questionId}" hör inte till ingången ${entry}.`);
    }
    if (answered.has(questionId)) {
      throw new Error(`Profil: frågan "${questionId}" är besvarad två gånger.`);
    }
    if (!isValidProfileAnswer(answer)) {
      throw new Error(`Profil: svaret på "${questionId}" är tomt eller för långt.`);
    }
    answered.add(questionId);
    columns[PROFILE_COLUMN[questionId]] = answer.trim();
  }
  if (answered.size !== PROFILE_QUESTIONS_BY_ENTRY[entry].length) {
    throw new Error(`Profil: alla frågor för ingången ${entry} är inte besvarade.`);
  }
  return columns;
}

export const liveProfileRepository: ProfileRepository = {
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

  // v1: fasta frågor ur i18n, grundaren skriver sitt eget svar (beslut i
  // PR 1, docs/moduler/profil.md). Ingen databas och ingen Gemini. En
  // framtida Gemini-version fyller samma fält.
  async getOnboardingScript(entry: OnboardingEntry, locale: Locale): Promise<OnboardingScript> {
    const copy = dictionaries[locale].onboarding.profileQuestions[entry];
    const texts = copy as Partial<Record<ProfileQuestionId, string>>;
    return {
      questions: PROFILE_QUESTIONS_BY_ENTRY[entry].map((id) => ({
        id,
        cofounderText: texts[id] ?? "",
        suggestedAnswer: null,
      })),
      closingMessage: copy.closingMessage,
    };
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const { supabase, userId } = await requireSupabaseUser();
    return readOnboardingStatus(supabase, userId);
  },

  // En enda update av profilraden: svaren, ingången och klar-tiden skrivs
  // tillsammans eller inte alls. Villkoret på onboarding_completed_at gör att
  // en klar onboarding aldrig skrivs över (ingen omgörning i v1).
  async completeOnboarding({ entry, answers }): Promise<void> {
    const columns = answerColumns(entry, answers);
    const { supabase, userId } = await requireSupabaseUser();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...columns, onboarding_entry: entry, onboarding_completed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("onboarding_completed_at", null)
      .select("user_id");
    if (error) {
      throw new Error(`Profil: kunde inte spara onboardingen (${error.message}).`);
    }
    if (data && data.length === 1) return;

    // Ingen rad ändrades: antingen är onboardingen redan klar, eller saknas
    // profilraden (triggern handle_new_user ska alltid ha skapat den).
    const status = await readOnboardingStatus(supabase, userId);
    if (status.completed) throw new OnboardingAlreadyCompletedError();
    throw new Error("Profil: profilraden saknas, onboardingen kunde inte sparas.");
  },
};
