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
export default function DemoCofounderPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);

  const data: CofounderData = useMemo(
    () => ({
      moments: saraBeats.slice(0, beatIndex + 1).map((beat) => ({
        id: beat.id,
        momentLabel: `${beat.stepNumber} · ${beat.momentLabel[locale]}`,
        items: cofounderScript[beat.id] ?? [],
      })),
    }),
    [locale, beatIndex],
  );

  return <Cofounder data={data} />;
}
