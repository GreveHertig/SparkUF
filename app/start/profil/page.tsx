import { OnboardingProfile } from "@/screens/OnboardingProfile";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { orNull } from "@/app/(app)/app/_lib/orNull";
import { completeOnboardingAction, saveOnboardingAnswerAction } from "../actions";
import { resolveOnboardingEntry } from "../_lib/entry";

// Profilsamtalet enligt spec v4 §4: kärnfrågorna en i taget, med grundarens
// sparade svar, så att samtalet fortsätter där det slutade. Ingången härleds
// på servern (resolveOnboardingEntry): med ett aktivt projekt är det ingång B.
// Efter kärnfrågorna visas startkortet, och "Till appen" gör onboardingen klar.
// Ett platshållarfel (till exempel en okörd migrering) ger `null` och
// "Kommer snart"; ett äkta fel kastas vidare.
export default async function StartProfilePage() {
  const entry = await resolveOnboardingEntry();
  const [script, answers] = await Promise.all([
    orNull(liveProfileRepository.getOnboardingScript(entry, "sv")),
    orNull(liveProfileRepository.getOnboardingAnswers()),
  ]);
  return (
    <OnboardingProfile
      data={{ script: answers ? script : null }}
      continueHref="/app"
      live={{
        entry,
        answers: answers ?? {},
        saveAnswer: saveOnboardingAnswerAction,
        completeAction: completeOnboardingAction,
      }}
    />
  );
}
