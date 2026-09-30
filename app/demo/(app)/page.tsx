"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { DEMO_PATHS } from "../_lib/paths";

/** Hem: tunn hämtare (PR 3, docs/plan-en-design.md) — all markup ligger i
 * den delade screens/AppHome.tsx. */
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
      setData({
        todayIso: journey.todayIso,
        score,
        homeSummary: { nextStep: journey.nextStep, sinceLastTime: journey.sinceLastTime },
        pulseSignals,
        journeySteps,
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
