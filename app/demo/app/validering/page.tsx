"use client";

import { useEffect, useState } from "react";
import { Validation, type ValidationData } from "@/screens/Validation";
import { useI18n } from "@/i18n/context";
import {
  demoOutreachProvider,
  outreachSource,
  outreachDateRange,
  outreachOpenRate,
  outreachOpenRateSource,
  getResponseCards,
  getValidationAssumptions,
} from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore, getCurrentStepNumber } from "@/adapters/demo/demoStore";

export default function DemoValidationPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  // simulationQuestions.tolerance och steg 06:s domen är byrå-specifika
  // (Saras scenario) — Jonas (persona B) visar ett ärligt tomt läge, se
  // adapters/demo/OutreachProvider.ts.
  const notInScenario = entry === "hasIdea";
  const [data, setData] = useState<ValidationData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentStep = notInScenario ? 0 : getCurrentStepNumber();
    const showSimulation = !notInScenario && currentStep >= 4;
    const showOutreachKpis = !notInScenario && currentStep >= 5;
    const showVerdict = !notInScenario && currentStep >= 6;

    Promise.all([
      demoOutreachProvider.getCampaign(locale),
      getResponseCards(locale),
      getValidationAssumptions(locale),
      showSimulation ? demoSimulationProvider.simulate(simulationQuestions.tolerance[locale], locale) : null,
      showVerdict ? demoJourneyRepository.getStepDetail(6, locale) : null,
    ]).then(([rows, responses, assumptions, simulation, stepDetail]) => {
      if (cancelled) return;
      setData({
        rows,
        outreachSource: rows.length > 0 ? outreachSource[locale] : null,
        responses,
        assumptions,
        simulation,
        contactedDateRange: showOutreachKpis ? outreachDateRange : null,
        openRate: showOutreachKpis ? outreachOpenRate : null,
        openRateSource: showOutreachKpis ? outreachOpenRateSource[locale] : null,
        verdict: stepDetail?.verdict ?? null,
        verdictScoreTotal: stepDetail?.scoreDelta?.total ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, notInScenario]);

  if (!data) return null;

  return <Validation data={data} notInScenario={notInScenario} />;
}
