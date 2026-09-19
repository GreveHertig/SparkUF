"use client";

import { useMemo } from "react";
import { Cofounder, type CofounderData } from "@/screens/Cofounder";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { saraBeats } from "@/adapters/demo/sara";
import { cofounderScript } from "@/adapters/demo/cofounderScript";

// Dialogen byggs synkront ur Saras beats (adapters/demo/sara.ts) och
// cofounderScript.ts — inget att hämta asynkront, så useMemo räcker (till
// skillnad från övriga /demo/app-sidor som await:ar riktiga adapteranrop,
// se app/demo/app/layout.tsx). Dialogen är inte CofounderAgent-porten (den
// är till för liveadapterns riktiga Gemini-samtal, se
// ports/CofounderAgent.ts) utan ett rent presentationsskript.
//
// Visar bara det AKTUELLA momentet, inte hela historiken (grundarens
// önskemål: en ren chattyta, inga uppslukande scrollbara transkript).
// Tidigare "-efter"-moments Spår-sammanfattningar visas i stället som en
// kort "Sedan tidigare"-rad — se screens/Cofounder.tsx.
export default function DemoCofounderPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);

  const data: CofounderData = useMemo(() => {
    const currentBeat = saraBeats[beatIndex];
    const context = saraBeats
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
        items: cofounderScript[currentBeat.id] ?? [],
      },
    };
  }, [locale, beatIndex]);

  return <Cofounder data={data} />;
}
