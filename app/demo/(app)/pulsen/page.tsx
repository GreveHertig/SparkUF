"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { Pulse, type PulseData } from "@/screens/Pulse";

/**
 * Demots Pulsen: hämtar demoadapterns signaler för det aktuella momentet och
 * lämnar över till skärmen (steg 6, docs/plan-en-design.md).
 *
 * Signalerna är påhittade. Adaptern ger varje signal en exempelkälla för
 * steget där den dyker upp ("Påhittad data, steg 01", PR 11), och sidan sätter
 * datatypen `"example"` så att taggen bär etiketten "Exempel".
 */
export default function DemoPulsePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<PulseData | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoPulseProvider.getSignals(locale).then((signals) => {
      if (!cancelled) setData({ signals, sourceDataType: "example" });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return <Pulse data={data} />;
}
