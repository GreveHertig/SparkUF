import { Journey } from "@/screens/Journey";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { orNull } from "../_lib/orNull";

/**
 * Resan i /app (PR 9, docs/plan-en-design.md). `getSteps` är byggd; ett
 * platshållarfel ger "Kommer snart" i stegraden och faserna i stället för en
 * krasch. Ett äkta fel kastas vidare.
 */
export default async function LiveJourneyPage() {
  const steps = await orNull(liveJourneyRepository.getSteps("sv"));
  return <Journey data={{ steps }} basePath="/app/resan" />;
}
