"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { Journey } from "@/screens/Journey";
import { FONDA_DEMO_PATHS } from "../../_lib/paths";

/** Demots Resan: hämtar stegen för det aktuella momentet och lämnar över till skärmen (PR 9). */
export default function FondaDemoJourneyPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [steps, setSteps] = useState<JourneyStepView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoJourneyRepository.getSteps(locale).then((result) => {
      if (!cancelled) setSteps(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!steps) return null;

  return <Journey data={{ steps }} basePath={FONDA_DEMO_PATHS.journey} />;
}
