import { OnboardingIdea } from "@/screens/OnboardingIdea";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { orNull } from "@/app/(app)/app/_lib/orNull";

// Projektets liveadapter är en stubbe (docs/moduler/projekt-och-ide.md): ett
// platshållarfel ger `null`, och varje sektion visar "Kommer snart". Ett
// äkta fel kastas vidare. Demots genomlysning används aldrig här.
export default async function StartIdeaPage() {
  const screening = await orNull(liveProjectRepository.getIdeaScreening("sv"));
  return <OnboardingIdea data={{ screening }} continueHref="/start/profil" />;
}
