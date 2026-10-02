import { OnboardingIdea } from "@/screens/OnboardingIdea";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { orNull } from "@/app/(app)/app/_lib/orNull";
import { createProjectAction } from "../actions";

// Ingång B (avsnitt 2.1). Utan aktivt projekt beskriver grundaren idén, och
// createProjectAction sparar den som aktivt projekt. Med projekt visas
// genomlysningen. Den är fortfarande en stubbe (docs/moduler/projekt-och-ide.md):
// ett platshållarfel ger `null`, och varje sektion visar "Kommer snart". Ett
// äkta fel kastas vidare. Demots genomlysning används aldrig här.
export default async function StartIdeaPage() {
  const project = await liveProjectRepository.getProject();
  if (!project) {
    return <OnboardingIdea data={{ screening: null }} continueHref="/start/profil" ideaAction={createProjectAction} />;
  }
  const screening = await orNull(liveProjectRepository.getIdeaScreening("sv"));
  return <OnboardingIdea data={{ screening }} continueHref="/start/profil" />;
}
