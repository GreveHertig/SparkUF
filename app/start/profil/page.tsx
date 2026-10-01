import { OnboardingProfile } from "@/screens/OnboardingProfile";
import { liveProfileRepository } from "@/adapters/live/ProfileRepository";
import { orNull } from "@/app/(app)/app/_lib/orNull";

// Profilens liveadapter är en stubbe (docs/moduler/profil.md): ett
// platshållarfel ger `null`, och samtalet och profilen visar "Kommer snart".
// Plattformen vet ännu inte vilken ingång grundaren valde (ingen port sparar
// den), så "noIdea" är en platshållare tills Profil är byggd.
export default async function StartProfilePage() {
  const script = await orNull(liveProfileRepository.getOnboardingScript("noIdea", "sv"));
  return <OnboardingProfile data={{ script }} continueHref="/app" />;
}
