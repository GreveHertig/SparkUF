"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoRegistryProvider, SARA_INDUSTRY_LABEL, SARA_MARKET_SNI_CODE } from "@/adapters/demo/RegistryProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { demoOutreachProvider } from "@/adapters/demo/OutreachProvider";
import { getCurrentStepNumber, useDemoStore } from "@/adapters/demo/demoStore";
import { exampleSource } from "@/adapters/demo/exampleSource";
import { Market, type MarketData, type MarketLock } from "@/screens/Market";

/**
 * Demots Marknad: en tunn hämtare av demodata (PR 8, docs/plan-en-design.md).
 * Markupen ligger i `screens/Market.tsx`. Demodatan bär inga räkenskapsår, så
 * medianomsättningen visas som en lucka (se skärmen).
 */
export default function DemoMarketPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  // Som i originalet: marknadsbilden finns bara i Saras scenario, från steg 03.
  const notInScenario = entry === "hasIdea";
  const unlocked = !notInScenario && getCurrentStepNumber() >= 3;
  const locked: MarketLock = unlocked ? null : notInScenario ? "notInScenario" : { unlocksAfterStep: 2 };
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
      if (cancelled) return;
      setData({
        industryLabel: SARA_INDUSTRY_LABEL[locale],
        registry: { overview, companies, medianRevenueFiscalYears: null },
        // Utskicket i steg 05 är påhittat: exempelkälla, aldrig "Sparks utskick".
        outreach: { rows: campaign, source: exampleSource(locale, { step: 5 }) },
        simulation,
        // Registersiffrorna i demot är påhittade: exempelkälla, aldrig registrets.
        registrySource: { source: exampleSource(locale, { step: 3 }), dataType: "example" },
        // Beskrivningarna är bedömningar i scenariot, inga registeruppgifter.
        competitorsSource: { source: exampleSource(locale, { step: 3 }), dataType: "example" },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, locale, beatIndex]);

  if (locked) return <Market data={EMPTY} dataKind="example" locked={locked} />;
  if (!data) return null;
  return <Market data={data} dataKind="example" locked={null} />;
}

/** Låst sida hämtar ingenting; skärmen läser inte datan i låst läge. */
const EMPTY: MarketData = { industryLabel: null, registry: "notChosen", outreach: null, simulation: null };
