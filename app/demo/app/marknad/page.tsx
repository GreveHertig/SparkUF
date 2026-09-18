"use client";

import { useEffect, useState } from "react";
import { Market, type MarketData } from "@/screens/Market";
import { useI18n } from "@/i18n/context";
import { demoRegistryProvider } from "@/adapters/demo/RegistryProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { getCurrentStepNumberFor } from "@/adapters/demo/sara";

export default function DemoMarketPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const unlocked = getCurrentStepNumberFor(beatIndex) >= 3;
  const [data, setData] = useState<MarketData | undefined>(undefined);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    Promise.all([
      demoRegistryProvider.getMarketOverview(locale),
      demoSimulationProvider.simulate(simulationQuestions.time[locale], locale),
    ]).then(([overview, simulation]) => {
      if (!cancelled) setData({ overview, simulation });
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, locale, beatIndex]);

  if (!unlocked) return <Market data={null} />;
  if (!data) return null;

  return <Market data={data} />;
}
