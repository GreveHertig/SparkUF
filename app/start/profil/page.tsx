import { OnboardingProfile } from "@/screens/OnboardingProfile";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { orNull } from "@/app/(app)/app/_lib/orNull";
import { completeOnboardingAction } from "../actions";
import { resolveOnboardingEntry } from "../_lib/entry";

// Profilsamtalet med grundarens egna svar. Ingången härleds på servern
// (resolveOnboardingEntry): med ett aktivt projekt är det ingång B och det
// kortare samtalet. completeOnboardingAction prövar samma frågor, sparar
// svaren och skickar vidare till /app. Ett platshållarfel ger `null` och
// "Kommer snart"; ett äkta fel kastas vidare.
export default async function StartProfilePage() {
  const entry = await resolveOnboardingEntry();
  const script = await orNull(liveProfileRepository.getOnboardingScript(entry, "sv"));
  return <OnboardingProfile data={{ script }} continueHref="/app" answerAction={completeOnboardingAction} />;
}
