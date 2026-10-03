import { Journey } from "@/screens/Journey";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { orNull } from "../_lib/orNull";
import { optional } from "../_lib/optional";
import { addOwnPlanItem, editPlanItem, removePlanItem, togglePlanItem } from "./actions";

/**
 * Resan i /app (PR 9, docs/plan-en-design.md). `getSteps` är byggd; ett
 * platshållarfel ger "Kommer snart" i stegraden och faserna i stället för en
 * krasch. Ett äkta fel kastas vidare.
 *
 * Min plan (docs/moduler/min-plan.md) visas under faserna. Finns tabellen
 * plan_items inte (migreringen inte körd), eller går planen inte att läsa,
 * blir den `null` och delen visas inte alls. Stegen visas ändå.
 */
export default async function LiveJourneyPage() {
  const [steps, planItems] = await Promise.all([
    orNull(liveJourneyRepository.getSteps("sv")),
    optional(livePlanRepository.getItems(), "Resan: Min plan"),
  ]);
  // Layouten släpper bara in den som är klar med onboardingen.
  return (
    <Journey
      data={{ steps }}
      basePath="/app/resan"
      profileAnswersHref="/app/minnet"
      plan={
        planItems
          ? {
              items: planItems,
              onToggle: togglePlanItem,
              onRemove: removePlanItem,
              onEdit: editPlanItem,
              onAdd: addOwnPlanItem,
              pulseHref: "/app/pulsen",
              cofounderHref: "/app/medgrundaren",
            }
          : null
      }
    />
  );
}
