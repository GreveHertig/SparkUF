import { OnboardingIdea } from "@/screens/OnboardingIdea";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { NotImplementedError } from "@/core/errors";
import type { IdeaScreening } from "@/ports/ProjectRepository";

// liveProjectRepository är en stub (docs/moduler/projekt-och-ide.md) — se
// app/start/profil/page.tsx för samma mönster.
export default async function StartIdeaPage() {
  let screening: IdeaScreening | null = null;

  try {
    screening = await liveProjectRepository.getIdeaScreening("sv");
  } catch (error) {
    if (!(error instanceof NotImplementedError)) throw error;
  }

  if (!screening) {
    return <ComingSoon />;
  }

  return <OnboardingIdea data={{ screening, continueHref: "/start/profil" }} />;
}
