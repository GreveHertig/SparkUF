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
/** Felkoden från public.complete_onboarding när onboardingen redan är klar. */
const ALREADY_COMPLETED = "55000";
const dictionaries = { sv, en };

/** Svaren som ett objekt {frågans id: svar}, så som
 * public.complete_onboarding tar emot dem. Kastar om svaren inte är exakt
 * ingångens frågor, en gång var, med 1–1000 tecken efter trim. zod i server
 * actions är det första lagret och databasfunktionen det bindande. */
function answerObject(entry: OnboardingEntry, answers: OnboardingAnswer[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { questionId, answer } of answers) {
    if (!isProfileQuestionFor(entry, questionId)) {
      throw new Error(`Profil: frågan "${questionId}" hör inte till ingången ${entry}.`);
    }
    if (questionId in result) {
      throw new Error(`Profil: frågan "${questionId}" är besvarad två gånger.`);
    }
    if (!isValidProfileAnswer(answer)) {
      throw new Error(`Profil: svaret på "${questionId}" är tomt eller för långt.`);
    }
    result[questionId] = answer.trim();
  }
  if (Object.keys(result).length !== PROFILE_QUESTIONS_BY_ENTRY[entry].length) {
    throw new Error(`Profil: alla frågor för ingången ${entry} är inte besvarade.`);
  }
  return result;
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

  // Klienten kan inte skriva onboarding_entry eller onboarding_completed_at
  // själv (supabase/migrations/20261002150000_steg1_onboarding.sql). Bara
  // public.complete_onboarding (security definer) gör det, och skriver
  // svaren, ingången och klar-tiden i en enda uppdatering. En klar
  // onboarding skrivs aldrig över (ingen omgörning i v1): funktionen ger
  // felkod 55000.
  async completeOnboarding({ entry, answers }): Promise<void> {
    const answersById = answerObject(entry, answers);
    const { supabase } = await requireSupabaseUser();
    const { error } = await supabase.rpc("complete_onboarding", { p_entry: entry, p_answers: answersById });
    if (!error) return;
    if (error.code === ALREADY_COMPLETED) throw new OnboardingAlreadyCompletedError();
    throw new Error(`Profil: kunde inte spara onboardingen (${error.message}).`);
  },
};
