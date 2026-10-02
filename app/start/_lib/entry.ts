import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import type { OnboardingEntry } from "@/core/domain";

/**
 * Ingången som gäller för grundaren: ingång B skapar alltid ett aktivt
 * projekt innan profilsamtalet (/start/ide), ingång A har inget. Härleds på
 * servern, så klienten kan aldrig välja frågor eller ingång själv. Delas av
 * /start/profil och completeOnboardingAction, så att samma frågor visas och
 * prövas. Ligger utanför actions.ts med flit: allt som exporteras därifrån
 * blir en Server Action som klienten kan anropa.
 */
export async function resolveOnboardingEntry(): Promise<OnboardingEntry> {
  return (await liveProjectRepository.getProject()) ? "hasIdea" : "noIdea";
}
