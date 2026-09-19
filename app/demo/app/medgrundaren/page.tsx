"use client";

import { useMemo } from "react";
import { Cofounder, type CofounderData } from "@/screens/Cofounder";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { cofounderScript } from "@/adapters/demo/cofounderScript";
import { jonasCofounderScript } from "@/adapters/demo/jonasCofounderScript";

// Dialogen byggs synkront ur den aktuella personans beats
// (adapters/demo/sara.ts/jonas.ts) och ett förskrivet skript
// (cofounderScript.ts/jonasCofounderScript.ts) — inget att hämta
// asynkront, så useMemo räcker (till skillnad från övriga /demo/app-sidor
// som await:ar riktiga adapteranrop, se app/demo/app/layout.tsx). Dialogen
// är inte CofounderAgent-porten (den är till för liveadapterns riktiga
// Gemini-samtal, se ports/CofounderAgent.ts) utan ett rent
// presentationsskript.
//
// Visar bara det AKTUELLA momentet, inte hela historiken (grundarens
// önskemål: en ren chattyta, inga uppslukande scrollbara transkript).
// Tidigare "-efter"-moments Spår-sammanfattningar visas i stället som en
// kort "Sedan tidigare"-rad — se screens/Cofounder.tsx.
export default function DemoCofounderPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);

  const data: CofounderData = useMemo(() => {
    const engine = engineFor(entry);
    const script = entry === "hasIdea" ? jonasCofounderScript : cofounderScript;
    const currentBeat = engine.getBeatAt(beatIndex);
    const context = engine.beats
      .slice(0, beatIndex)
      .filter((beat) => beat.momentKind === "after")
      .map((beat) => ({
        id: beat.id,
        text: beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]} — ${beat.nextStep[locale].title}`,
      }));

    return {
      context,
      moment: {
        id: currentBeat.id,
        momentLabel: `${currentBeat.stepNumber} · ${currentBeat.momentLabel[locale]}`,
        items: script[currentBeat.id] ?? [],
      },
    };
  }, [locale, beatIndex, entry]);

  return <Cofounder data={data} />;
}
