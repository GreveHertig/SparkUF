"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { getBusinessPlan } from "@/adapters/demo/businessPlan";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { BusinessPlan, type BusinessPlanData } from "@/screens/BusinessPlan";
import { DEMO_PATHS } from "../../_lib/paths";

/**
 * Demots Affärsplan: sätter samman planen för det aktuella momentet ur
 * demoadaptrarna (`adapters/demo/businessPlan.ts`, som anropar
 * `buildBusinessPlan`) och lämnar över till skärmen (PR 10,
 * docs/plan-en-design.md).
 */
export default function DemoBusinessPlanPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<BusinessPlanData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBusinessPlan(locale), demoJourneyRepository.getSteps(locale)]).then(([plan, steps]) => {
      const completedStepNumbers = steps.filter((step) => step.status === "done").map((step) => step.stepNumber);
      if (!cancelled) {
        setData({
          plan,
          completedStepNumbers,
          steps: steps.map(({ stepNumber, title, status }) => ({ stepNumber, title, status })),
          stepBasePath: DEMO_PATHS.journey,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return <BusinessPlan data={data} />;
}
