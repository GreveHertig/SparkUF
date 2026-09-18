"use client";

import { useEffect, useState } from "react";
import { Pulse, type PulseData } from "@/screens/Pulse";
import { useI18n } from "@/i18n/context";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoPulsePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<PulseData | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoPulseProvider.getSignals(locale).then((signals) => {
      if (!cancelled) setData({ signals });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Pulse data={data} />;
}
