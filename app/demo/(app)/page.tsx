"use client";

import { useEffect, useState } from "react";
import { useI18n, type Locale } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider, getSignalSteps } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { exampleSource } from "@/adapters/demo/exampleSource";
import type { Källa, NextStep, SinceLastTime } from "@/core/domain";
import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { DEMO_PATHS } from "../_lib/paths";
import { textHasFigure } from "../_lib/figures";

/** Steget i scenariots egna källnamn ("Utskicket, steg 05"). */
const STEP_IN_SOURCE = /\b(?:steg|step)\s+(\d+)/i;

function originStep(source: Källa, fallback: number): number {
  const match = source.namn.match(STEP_IN_SOURCE);
  return match ? Number(match[1]) : fallback;
}

/**
 * "Sedan sist" är påhittat: källorna i scenariot ("Utskicket, steg 05") bar
 * registrets tagg, och antalet mottagare bar källan "Inget utskick ännu" även
 * efter utskicket. Varje siffra får i stället en exempelkälla för steget där
 * den kommer ifrån. Mottagarna kommer ur samma utskick som öppningsgraden.
 * Utan steg i källan (inget utskick än) gäller det aktuella steget.
 */
function exampleSinceLastTime(since: SinceLastTime, locale: Locale, currentStep: number): SinceLastTime {
  const outreachStep = originStep(since.openRateSource, currentStep);
  return {
    ...since,
    emailSentSource: exampleSource(locale, { step: outreachStep }),
    openRateSource: exampleSource(locale, { step: outreachStep }),
    responsesSource: exampleSource(locale, { step: originStep(since.responsesSource, currentStep) }),
  };
}

/** Rubriken, förklaringen och "Redan klart" ("5 betalande byråer"). */
function nextStepHasFigure(nextStep: NextStep): boolean {
  return textHasFigure(`${nextStep.title} ${nextStep.why} ${nextStep.doneItems.join(" ")}`);
}

/** Hem: tunn hämtare (PR 3, docs/plan-en-design.md) — all markup ligger i
 * den delade screens/AppHome.tsx. Signalen, "sedan sist" och siffrorna i
 * handlingskortet är påhittade och visas med exempelkällor (PR 11, som
 * demots Pulsen-sida), aldrig med en myndighets namn. */
export default function DemoHomePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const next = useDemoStore((state) => state.next);
  const [data, setData] = useState<AppHomeData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoJourneyRepository.getHomeSummary(locale),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoPulseProvider.getSignals(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([journey, score, pulseSignals, journeySteps]) => {
      if (cancelled) return;
      const currentStep = engineFor(entry).getBeatAt(beatIndex).stepNumber;
      const signalSteps = getSignalSteps();
      setData({
        todayIso: journey.todayIso,
        score,
        homeSummary: {
          nextStep: journey.nextStep,
          // Demot har alltid ett "sedan sist"; null är plattformens fall.
          sinceLastTime: journey.sinceLastTime && exampleSinceLastTime(journey.sinceLastTime, locale, currentStep),
        },
        // Den påhittade relativa tiden ("4 dagar sedan") stämde inte med
        // källans datum (docs/buggar-2026-09.md punkt 11) och visas inte.
        pulseSignals: pulseSignals.map((signal, index) => ({
          ...signal,
          timestamp: "",
          source: exampleSource(locale, { step: signalSteps[index] ?? 1 }),
        })),
        journeySteps,
        sourceDataTypes: { pulse: "example", sinceLastTime: "example" },
        nextStepSource: nextStepHasFigure(journey.nextStep)
          ? { source: exampleSource(locale, { step: currentStep }), dataType: "example" }
          : undefined,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return (
    <AppHome
      data={data}
      dataKind="example"
      onNextStep={next}
      journeyBasePath={DEMO_PATHS.journey}
      scoreHref={DEMO_PATHS.score}
    />
  );
}
