"use client";

import { useEffect, useState } from "react";
import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";

// Se app/demo/app/layout.tsx — samma useEffect/useState-mönster i stället för
// `use()`, som kraschade med "async Client Component" vid språkbyte.
export default function DemoAppHomePage() {
  const { locale } = useI18n();
  const [data, setData] = useState<AppHomeData | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      demoJourneyRepository.getHomeSummary(locale),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoPulseProvider.getTodaysSignal(locale),
    ]).then(([journey, score, pulse]) => {
      if (cancelled) return;
      setData({
        todayIso: journey.todayIso,
        score,
        nextStep: journey.nextStep,
        sinceLastTime: journey.sinceLastTime,
        pulse,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!data) return null;

  return <AppHome data={data} />;
}
