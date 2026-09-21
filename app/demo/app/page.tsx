"use client";

import { useEffect, useState } from "react";
import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";

// Se app/demo/app/layout.tsx — samma useEffect/useState-mönster i stället för
// `use()`, som kraschade med "async Client Component" vid språkbyte. Sedan
// Session 2 beror Nästa steg-kortet och poängen även på demomotorns
// `beatIndex`.
export default function DemoAppHomePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<AppHomeData | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      demoJourneyRepository.getHomeSummary(locale),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoPulseProvider.getSignals(locale),
      demoEvidenceRepository.getScoreHistory(locale),
      demoEvidenceRepository.getSuggestions(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([journey, score, pulseSignals, scoreHistory, suggestions, journeySteps]) => {
      if (cancelled) return;
      setData({
        todayIso: journey.todayIso,
        score,
        nextStep: journey.nextStep,
        sinceLastTime: journey.sinceLastTime,
        pulseSignals,
        scoreHistory,
        suggestions,
        journeySteps,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <AppHome data={data} journeyStepHref={(stepNumber) => `/demo/app/resan/${stepNumber}`} />;
}
