import { BusinessPlan, type BusinessPlanData } from "@/screens/BusinessPlan";
import { getLiveBusinessPlan } from "@/adapters/live/businessPlan";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { orNull } from "../_lib/orNull";

/**
 * Affärsplanen i /app (PR 10, kopplad till riktig data 2026-10-03). Planen
 * sätts samman av `getLiveBusinessPlan` (adapters/live/businessPlan.ts) ur
 * projektet, onboardingsvaren och bevisen, och `buildBusinessPlan`
 * (core/businessPlan.ts) avgör varje avsnitts status. Avsnitt utan riktigt
 * underlag visas som luckor med steget som skulle ge det, aldrig med demots
 * data. Ett platshållarfel ger "Kommer snart" i alla avsnitt, som förut.
 *
 * Resans steg ger luckorna sina namn och en länk till det aktuella steget.
 */
export default async function LiveBusinessPlanPage() {
  const [plan, steps] = await Promise.all([
    orNull(getLiveBusinessPlan("sv")),
    orNull(liveJourneyRepository.getSteps("sv")),
  ]);

  const data: BusinessPlanData = {
    plan,
    completedStepNumbers: (steps ?? []).filter((step) => step.status === "done").map((step) => step.stepNumber),
    steps: steps && steps.map(({ stepNumber, title, status }) => ({ stepNumber, title, status })),
    stepBasePath: "/app/resan",
  };

  return <BusinessPlan data={data} />;
}
