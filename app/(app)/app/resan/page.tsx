import { Journey } from "@/screens/Journey";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { orNull } from "../_lib/orNull";
import { removePlanItem, togglePlanItem } from "./actions";

/**
 * Resan i /app (PR 9, docs/plan-en-design.md). `getSteps` är byggd; ett
 * platshållarfel ger "Kommer snart" i stegraden och faserna i stället för en
 * krasch. Ett äkta fel kastas vidare.
 *
 * Min plan (docs/moduler/min-plan.md) visas under faserna. Finns tabellen
 * plan_items inte (migreringen inte körd) blir planen `null` och delen visas
 * inte alls.
 */
export default async function LiveJourneyPage() {
  const [steps, planItems] = await Promise.all([
    orNull(liveJourneyRepository.getSteps("sv")),
    orNull(livePlanRepository.getItems()),
  ]);
  // Layouten släpper bara in den som är klar med onboardingen.
  return (
    <Journey
      data={{ steps }}
      basePath="/app/resan"
      profileAnswersHref="/app/minnet"
      plan={
        planItems
          ? { items: planItems, onToggle: togglePlanItem, onRemove: removePlanItem, pulseHref: "/app/pulsen" }
          : null
      }
    />
  );
}
