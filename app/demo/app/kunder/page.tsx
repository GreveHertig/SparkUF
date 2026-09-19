"use client";

import { useEffect, useState } from "react";
import { Customers, type CustomersData } from "@/screens/Customers";
import { useI18n } from "@/i18n/context";
import { demoOutreachProvider } from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { useDemoStore, getCurrentStepNumber } from "@/adapters/demo/demoStore";

export default function DemoCustomersPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  // simulationQuestions.tolerance är byrå-specifikt (Saras scenario) —
  // Jonas (persona B) visar ingen simulering, se docs/status.md
  // "Jonas hela resan". demoOutreachProvider.getCampaign returnerar redan
  // [] för Jonas, notInScenario styr bara vilken tomt-läge-text som visas.
  const notInScenario = entry === "hasIdea";
  const [data, setData] = useState<CustomersData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const showSimulation = !notInScenario && getCurrentStepNumber() >= 4;

    Promise.all([
      demoOutreachProvider.getCampaign(locale),
      showSimulation ? demoSimulationProvider.simulate(simulationQuestions.tolerance[locale], locale) : null,
    ]).then(([rows, simulation]) => {
      if (!cancelled) setData({ rows, simulation });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, notInScenario]);

  if (!data) return null;

  return <Customers data={data} notInScenario={notInScenario} />;
}
