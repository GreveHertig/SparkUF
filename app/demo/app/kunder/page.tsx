"use client";

import { useEffect, useState } from "react";
import { Customers, type CustomersData } from "@/screens/Customers";
import { useI18n } from "@/i18n/context";
import { demoOutreachProvider } from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { getCurrentStepNumberFor } from "@/adapters/demo/sara";

export default function DemoCustomersPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<CustomersData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const showSimulation = getCurrentStepNumberFor(beatIndex) >= 4;

    Promise.all([
      demoOutreachProvider.getCampaign(locale),
      showSimulation ? demoSimulationProvider.simulate(simulationQuestions.tolerance[locale], locale) : null,
    ]).then(([rows, simulation]) => {
      if (!cancelled) setData({ rows, simulation });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Customers data={data} />;
}
