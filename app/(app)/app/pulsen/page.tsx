import { Pulse } from "@/screens/Pulse";
import { livePulseProvider, MAX_WATCHES } from "@/adapters/live/PulseProvider";
import { orNull } from "../_lib/orNull";
import { addWatch, giveFeedback, removeWatch } from "./actions";

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
 */
export default async function LivePulsePage() {
  const [signals, watchItems] = await Promise.all([
    orNull(livePulseProvider.getSignals("sv")),
    orNull(livePulseProvider.getWatches!()),
  ]);
  const available = watchItems !== null;
  return (
    <Pulse
      data={{ signals, sourceDataType: "media" }}
      onFeedback={available ? giveFeedback : undefined}
      watches={
        available ? { items: watchItems, max: MAX_WATCHES, onAdd: addWatch, onRemove: removeWatch } : null
      }
    />
  );
}
