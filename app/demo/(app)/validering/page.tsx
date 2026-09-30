"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import {
  demoOutreachProvider,
  getResponseCards,
  getValidationAssumptions,
  outreachDateRange,
  outreachOpenRate,
  outreachOpenRateSource,
  outreachSource,
} from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { getCurrentStepNumber, useDemoStore } from "@/adapters/demo/demoStore";
import { Validation, type ValidationData, type ValidationLock } from "@/screens/Validation";

/**
 * Demots Validering: hämtar demodatan för det aktuella momentet och lämnar
 * över till skärmen (PR 7, docs/plan-en-design.md). Samma urval per steg som
 * förut: simuleringen från steg 04, utskickets period och öppningsfrekvens
 * från steg 05, domen från steg 06. En tom kontaktlista betyder låst.
 */
export default function DemoValidationPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const [view, setView] = useState<{ data: ValidationData; locked: ValidationLock } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const step = notInScenario ? 0 : getCurrentStepNumber();
    const showSimulation = !notInScenario && step >= 4;
    const showOutreach = !notInScenario && step >= 5;
    const showVerdict = !notInScenario && step >= 6;
    Promise.all([
      demoOutreachProvider.getCampaign(locale),
      getResponseCards(locale),
      getValidationAssumptions(locale),
      showSimulation ? demoSimulationProvider.simulate(simulationQuestions.tolerance[locale], locale) : null,
      showVerdict ? demoJourneyRepository.getStepDetail(6, locale) : null,
    ]).then(([rows, responses, assumptions, simulation, stepDetail]) => {
      if (cancelled) return;
      const verdict = stepDetail?.verdict;
      const verdictScore = stepDetail?.scoreDelta?.total;
      setView({
        locked: rows.length > 0 ? null : notInScenario ? "notInScenario" : { unlocksAfterStep: 3 },
        data: {
          // Demodatan bär inga räkenskapsår: omsättningen visas som en lucka.
          rows: rows.map((row) => ({ ...row, revenueFiscalYear: null })),
          outreachSource: rows.length > 0 ? outreachSource[locale] : null,
          dateRange: showOutreach ? outreachDateRange : null,
          openRate: showOutreach ? outreachOpenRate : null,
          openRateSource: showOutreach ? outreachOpenRateSource[locale] : null,
          assumptions,
          responses,
          // Demot visar domen bara när den finns; före steg 06 och utan dom döljs sektionen.
          verdict:
            verdict && verdictScore !== undefined
              ? { score: verdictScore, headline: verdict.headline, reasoning: verdict.reasoning }
              : "notReached",
          simulation: simulation ?? "notReached",
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, notInScenario]);

  if (!view) return null;

  return <Validation data={view.data} dataKind="example" locked={view.locked} />;
}
