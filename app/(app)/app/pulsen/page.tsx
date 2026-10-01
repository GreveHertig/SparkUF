import { Pulse } from "@/screens/Pulse";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { orNull } from "../_lib/orNull";

/**
 * Pulsen i /app (steg 6, docs/plan-en-design.md). Liveadaptern är byggd
 * (Tavily + dagscachen, docs/moduler/webbresearch-och-pulsen.md). Inget aktivt
 * projekt ger en ärlig tom lista och skärmens tomläge. Ett platshållarfel ger
 * "Kommer snart" i listan i stället för en krasch. Ett äkta fel kastas vidare.
 *
 * Inget låst läge: demots Pulsen är öppen i alla moment och har ingen
 * stegspärr att flytta. Ingen exempelkälla sätts här (vakttestet
 * noExampleSources): liveadapterns källa är artikelns domän och hämtdatum.
 */
export default async function LivePulsePage() {
  const signals = await orNull(livePulseProvider.getSignals("sv"));
  return <Pulse data={{ signals }} />;
}
