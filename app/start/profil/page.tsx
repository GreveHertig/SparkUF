import { OnboardingProfile } from "@/screens/OnboardingProfile";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { NotImplementedError } from "@/core/errors";
import type { OnboardingScript } from "@/ports/ProfileRepository";

// liveProfileRepository är en stub (docs/moduler/profil.md) — sidan visar
// "Kommer snart" i stället för att krascha, tills P1 bygger den (avsnitt 4 i
// docs/arkitektur.md). JSX konstrueras aldrig inuti try/catch.
// Plattformen vet ännu inte vilken ingång grundaren valde (ingen persistens
// finns innan P1) — "noIdea" är en platshållarparameter, spelar ingen roll
// eftersom adaptern kastar oavsett.
export default async function StartProfilePage() {
  let script: OnboardingScript | null = null;

  try {
    script = await liveProfileRepository.getOnboardingScript("noIdea", "sv");
  } catch (error) {
    if (!(error instanceof NotImplementedError)) throw error;
  }

  if (!script) {
    return <ComingSoon />;
  }

  return <OnboardingProfile data={{ script, continueHref: "/app" }} />;
}
