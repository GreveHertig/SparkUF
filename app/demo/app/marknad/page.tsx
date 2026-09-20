"use client";

import { useEffect, useState } from "react";
import { Market, type MarketData } from "@/screens/Market";
import { useI18n } from "@/i18n/context";
import { demoRegistryProvider, SARA_MARKET_SNI_CODE, SARA_INDUSTRY_LABEL } from "@/adapters/demo/RegistryProvider";
import { demoOutreachProvider, outreachSource } from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { useDemoStore, getCurrentStepNumber } from "@/adapters/demo/demoStore";

export default function DemoMarketPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  // RegistryProvider.getMarketOverview och simulationQuestions.time är bara
  // byggda mot Saras scenario (registerbild/konkurrenter, byrå-simuleringen)
  // — Jonas (persona B) visar ett ärligt tomt läge i stället för påhittad
  // padel-marknadsdata, se docs/status.md "Jonas hela resan".
  const notInScenario = entry === "hasIdea";
  const unlocked = !notInScenario && getCurrentStepNumber() >= 3;
  const [data, setData] = useState<MarketData | undefined>(undefined);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    Promise.all([
      demoRegistryProvider.getMarketOverview(locale),
      demoSimulationProvider.simulate(simulationQuestions.time[locale], locale),
      demoRegistryProvider.searchCompanies({ sniCode: SARA_MARKET_SNI_CODE }),
      demoOutreachProvider.getCampaign(locale),
    ]).then(([overview, simulation, companies, campaign]) => {
      if (!cancelled) {
        setData({
          overview,
          simulation,
          companies,
          campaign,
          outreachSource: outreachSource[locale],
          industryLabel: SARA_INDUSTRY_LABEL[locale],
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, locale, beatIndex]);

  if (!unlocked) return <Market data={null} notInScenario={notInScenario} />;
  if (!data) return null;

  return <Market data={data} />;
}
