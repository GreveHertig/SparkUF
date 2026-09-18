import type { Locale } from "@/i18n/context";
import type { OnboardingEntry, Profile } from "@/core/domain";

/** En fråga i onboardingens profilsamtal (avsnitt 6, 9.1) — `suggestedAnswer`
 * är svaret som visas som en klickbar chip. Demot bygger dessa ur den
 * persona som redan är skriven (Sara/Jonas); plattformen ska senare ersätta
 * chippen med ett riktigt fritextsvar till Gemini (P1). */
export type OnboardingQuestion = {
  id: string;
  cofounderText: string;
  suggestedAnswer: string;
};

export type OnboardingScript = {
  questions: OnboardingQuestion[];
  /** Medgrundarens sammanfattande replik efter sista frågan, innan grundaren går vidare. */
  closingMessage: string;
};

/** Modul: Profil (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface ProfileRepository {
  getProfile(): Promise<Profile>;
  /** Onboardingens profilsamtal (avsnitt 6, `/start/profil`). `entry` avgör
   * om det är hela samtalet (ingång A) eller det kortare passform-samtalet
   * efter idégenomlysningen (ingång B, avsnitt 2.1). */
  getOnboardingScript(entry: OnboardingEntry, locale: Locale): Promise<OnboardingScript>;
}
