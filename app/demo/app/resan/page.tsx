"use client";

import { useEffect, useState } from "react";
import { Journey, type JourneyData } from "@/screens/Journey";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";

// Samma useEffect/useState-mönster som /demo/app (se app/demo/app/layout.tsx).
export default function DemoJourneyPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<JourneyData | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoJourneyRepository.getSteps(locale).then((steps) => {
      if (!cancelled) setData({ steps });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Journey data={data} stepHref={(stepNumber) => `/demo/app/resan/${stepNumber}`} />;
}
