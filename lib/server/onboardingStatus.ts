import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { OnboardingStatus } from "@/ports/ProfileRepository";
import { isOnboardingEntry } from "@/core/onboarding";

/**
 * Var användaren står i onboardingen, ur profilraden
 * (supabase/migrations/20260930120000_onboarding.sql). Delad av Profil
 * (`getOnboardingStatus`) och Resan (steg 1 klart, steg 2-varianten) i
 * stället för att båda adaptrarna upprepar samma fråga, samma mönster som
 * `getActiveProjectId`. En saknad rad är samma sak som en ny användare.
 */
export async function readOnboardingStatus(supabase: SupabaseClient, userId: string): Promise<OnboardingStatus> {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_entry, onboarding_completed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Profil: kunde inte läsa onboardingstatusen (${error.message}).`);
  }
  const completed = Boolean(data?.onboarding_completed_at);
  // Porten: `entry` är null tills onboardingen är klar. Databasen tillåter en
  // ingång utan klar-tid (bara det omvända är spärrat), så den filtreras här.
  const entry = completed && isOnboardingEntry(data?.onboarding_entry) ? data.onboarding_entry : null;
  return { entry, completed };
}
