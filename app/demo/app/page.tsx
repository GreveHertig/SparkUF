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
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<AppHomeData | null>(null);

  useEffect(() => {
    let cancelled = false;

    // PulseProvider.getTodaysSignal har ingen tom/null-variant i porten
    // (används av liveadaptern också) — för Jonas (persona B), som saknar
    // en byggd pulssignal, anropas den därför aldrig, se
    // adapters/demo/PulseProvider.ts.
    const pulsePromise = entry === "hasIdea" ? Promise.resolve(null) : demoPulseProvider.getTodaysSignal(locale);

    Promise.all([
      demoJourneyRepository.getHomeSummary(locale),
      demoEvidenceRepository.getScoreSnapshot(locale),
      pulsePromise,
      demoEvidenceRepository.getScoreHistory(locale),
    ]).then(([journey, score, pulse, scoreHistory]) => {
      if (cancelled) return;
      setData({
        todayIso: journey.todayIso,
        score,
        nextStep: journey.nextStep,
        sinceLastTime: journey.sinceLastTime,
        pulse,
        scoreHistory,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return <AppHome data={data} />;
}
