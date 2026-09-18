"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { JourneyStepScreen } from "@/screens/JourneyStep";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";

// Samma useEffect/useState-mönster som /demo/app (se app/demo/app/layout.tsx)
// — `use()` med en promise vars identitet ändras per locale kraschade
// tidigare (docs/arkitektur.md avsnitt 7). `params` är däremot en stabil
// promise per navigering, så den läses med `use()` som brukligt i App Router.
export default function DemoJourneyStepPage({ params }: { params: Promise<{ steg: string }> }) {
  const { steg } = use(params);
  const stepNumber = Number(steg);
  const isValidStep = Number.isInteger(stepNumber);
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<JourneyStepDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!isValidStep) return;
    let cancelled = false;
    demoJourneyRepository.getStepDetail(stepNumber, locale).then((detail) => {
      if (!cancelled) setData(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [isValidStep, stepNumber, locale, beatIndex]);

  if (!isValidStep) notFound();
  if (data === undefined) return null;
  if (data === null) notFound();

  return <JourneyStepScreen data={data} backHref="/demo/app/resan" />;
}
