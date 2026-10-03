import { Pulse } from "@/screens/Pulse";
import { livePulseProvider, MAX_WATCHES } from "@/adapters/live/PulseProvider";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { liveProjectRepository } from "@/adapters/live/ProjectRepository";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { orNull } from "../_lib/orNull";
import { optional } from "../_lib/optional";
import { addPlaybookToPlan, addWatch, giveFeedback, removeWatch } from "./actions";
import { toPulsePersonal } from "./personal";

/**
 * Pulsen i /app (steg 6, docs/plan-en-design.md). Liveadaptern är byggd
 * (Tavily + dagscachen, docs/moduler/webbresearch-och-pulsen.md). Inget aktivt
 * projekt ger en ärlig tom lista och skärmens tomläge. Ett platshållarfel ger
 * "Kommer snart" i listan i stället för en krasch. Ett äkta fel kastas vidare.
 *
 * Inget låst läge: demots Pulsen är öppen i alla moment och har ingen
 * stegspärr att flytta.
 *
 * Källan är en artikel (domän och hämtdatum), inte ett register: datatypen
 * `"media"` (docs/beslut.md, 2026-10-01), samma som Hem. Aldrig `"example"`
 * (vakttestet noExampleSources).
 *
 * Omdöme och bevakningar ("Omdöme och bevakningar" i moduldokumentet): finns
 * tabellerna inte (migreringen inte körd) ger getWatches NotImplementedError,
 * alltså null här, och då visas varken knapparna eller bevakningarna. Sidan
 * fungerar som förut. Server Actions är de enda funktionerna som skickas till
 * skärmen.
 *
 * Personlig spelbok ("Personlig spelbok" i moduldokumentet): grundarens egna
 * svar ur Profilen, projektet och läget i Resan, utan modell. Spelboken får
 * också en länk till Medgrundaren och, när plan_items finns, knappen
 * "Lägg till stegen i min plan" (docs/moduler/min-plan.md). Saknas en del,
 * eller går den inte att läsa, visas spelboken som förut och sidan kraschar
 * inte (`optional`).
 */
export default async function LivePulsePage() {
  const [signals, watchItems, profile, project, steps, planItems] = await Promise.all([
    orNull(livePulseProvider.getSignals("sv")),
    orNull(livePulseProvider.getWatches!()),
    liveMemoryRepository.getKnownProfile
      ? optional(liveMemoryRepository.getKnownProfile(), "Pulsen: Profilen")
      : Promise.resolve(null),
    optional(liveProjectRepository.getProject(), "Pulsen: projektet"),
    optional(liveJourneyRepository.getSteps("sv"), "Pulsen: Resan"),
    optional(livePlanRepository.getItems(), "Pulsen: Min plan"),
  ]);
  const available = watchItems !== null;
  return (
    <Pulse
      data={{ signals, sourceDataType: "media" }}
      onFeedback={available ? giveFeedback : undefined}
      watches={
        available ? { items: watchItems, max: MAX_WATCHES, onAdd: addWatch, onRemove: removeWatch } : null
      }
      personal={toPulsePersonal({ profile, project, steps }, "sv")}
      cofounderHref="/app/medgrundaren"
      onAddToPlan={planItems !== null ? addPlaybookToPlan : undefined}
      planHref="/app/resan"
    />
  );
}
