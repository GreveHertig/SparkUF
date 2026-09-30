"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { cofounderScript } from "@/adapters/demo/cofounderScript";
import { jonasCofounderScript } from "@/adapters/demo/jonasCofounderScript";
import { Cofounder, type CofounderData } from "@/screens/Cofounder";

/**
 * Demots Medgrundare: plockar det aktuella momentet ur det förskrivna manuset
 * och det som redan är känt ur de passerade "efter"-momenten, och lämnar över
 * till skärmen (PR 10, docs/plan-en-design.md). Manuset stannar här, i demots
 * sida — skärmen vet inte att samtalet är förskrivet.
 */
export default function DemoCofounderPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);

  const data = useMemo<CofounderData>(() => {
    const engine = engineFor(entry);
    const script = entry === "hasIdea" ? jonasCofounderScript : cofounderScript;
    const currentBeat = engine.getBeatAt(beatIndex);
    return {
      context: engine.beats
        .slice(0, beatIndex)
        .filter((beat) => beat.momentKind === "after")
        .map((beat) => ({
          id: beat.id,
          text: beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]}: ${beat.nextStep[locale].title}`,
        })),
      moment: {
        label: `${String(currentBeat.stepNumber).padStart(2, "0")} · ${currentBeat.momentLabel[locale]}`,
        items: script[currentBeat.id] ?? [],
      },
    };
  }, [locale, beatIndex, entry]);

  return <Cofounder data={data} />;
}
