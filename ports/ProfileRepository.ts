import type { Locale } from "@/i18n/context";
import type { OnboardingEntry, Profile } from "@/core/domain";

/** En fråga i onboardingens profilsamtal (avsnitt 6, 9.1). Demot har ett
 * färdigt `suggestedAnswer` ur personan (Sara/Jonas) som visas som en
 * klickbar chip. Plattformen har `null`: grundaren skriver sitt eget svar.
 * Plattformens `id` är ett `ProfileQuestionId` (core/onboarding.ts). */
export type OnboardingQuestion = {
  id: string;
  cofounderText: string;
  suggestedAnswer: string | null;
  /** Spec v4 §4 (plattformen): `choice` visas som knappar med `choices`,
   * `text` som ett fritextfält. Saknas i demot, som har färdiga svar.
   * Ändrad port, beslut Erik 2026-10-03 (docs/beslut.md). */
  kind?: "choice" | "text";
  /** Valen med stabila id:n (core/onboarding.ts) och etikett ur i18n. */
  choices?: { id: string; label: string }[];
};

/** Grundarens svar på en fråga i `OnboardingScript.questions`. */
export type OnboardingAnswer = {
  questionId: string;
  answer: string;
};

/** Var grundaren står i onboardingen. `entry` är `null` tills den är klar. */
export type OnboardingStatus = {
  entry: OnboardingEntry | null;
  completed: boolean;
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
  /** Styr spärren mellan /start och /app. Steg 1 ("Om dig") räknas som klart
   * när `completed` är sant (docs/moduler/resan.md). */
  getOnboardingStatus(): Promise<OnboardingStatus>;
  /** Sparar svaren och markerar onboardingen klar i ett enda anrop. Svar på
   * frågor som ingången inte ställer avvisas. På plattformen (spec v4) slås
   * `answers` ihop med de svar som redan sparats, och alla kärnfrågor måste
   * då ha svar; `answers` får vara tom. */
  completeOnboarding(input: { entry: OnboardingEntry; answers: OnboardingAnswer[] }): Promise<void>;
  /** Sparar ett svar på en v4-fråga (spec v4 §4: samtalet kan avbrytas och
   * fortsätta). Före klar onboarding får svaret ändras, efter den kan bara
   * återstående frågor besvaras (`OnboardingAnswerLockedError` annars).
   * Valfri: demot sparar inget. Ändrad port, beslut Erik 2026-10-03. */
  saveOnboardingAnswer?(answer: OnboardingAnswer): Promise<void>;
  /** De v4-svar som redan är sparade, {frågans id: val-id eller text}, så att
   * samtalet fortsätter vid första obesvarade fråga. Valfri, som ovan. */
  getOnboardingAnswers?(): Promise<Record<string, string>>;
}
