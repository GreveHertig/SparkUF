"use client";

import { use, useMemo } from "react";
import { AppHome } from "@/screens/AppHome";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";

// Promiserna memoiseras per locale — `use()` ska inte få en ny
// promise-identitet vid varje rendering (se app/demo/app/layout.tsx).
export default function DemoAppHomePage() {
  const { locale } = useI18n();
  const journeyPromise = useMemo(() => demoJourneyRepository.getHomeSummary(locale), [locale]);
  const scorePromise = useMemo(() => demoEvidenceRepository.getScoreSnapshot(locale), [locale]);
  const pulsePromise = useMemo(() => demoPulseProvider.getTodaysSignal(locale), [locale]);
  const journey = use(journeyPromise);
  const score = use(scorePromise);
  const pulse = use(pulsePromise);

  return (
    <AppHome
      data={{
        todayIso: journey.todayIso,
        score,
        nextStep: journey.nextStep,
        sinceLastTime: journey.sinceLastTime,
        pulse,
      }}
    />
  );
}
