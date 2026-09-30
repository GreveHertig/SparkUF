"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JourneyStepDetail } from "@/ports/JourneyRepository";
import { JourneyStep } from "@/screens/JourneyStep";
import { FONDA_DEMO_PATHS } from "../../../_lib/paths";

/** Demots steg: hämtar stegets data för det aktuella momentet och lämnar över till skärmen (PR 9). */
export default function FondaDemoJourneyStepPage({ params }: { params: Promise<{ steg: string }> }) {
  const { steg } = use(params);
  const stepNumber = Number(steg);
  const isValidStep = Number.isInteger(stepNumber);
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
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
  }, [isValidStep, stepNumber, locale, beatIndex, entry]);

  if (!isValidStep) notFound();
  if (data === undefined) return null;
  if (data === null) notFound();

  return <JourneyStep data={data} stepNumber={stepNumber} journeyHref={FONDA_DEMO_PATHS.journey} />;
}
