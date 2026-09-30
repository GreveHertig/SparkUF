"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { getBusinessPlan } from "@/adapters/demo/businessPlan";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { BusinessPlan as BusinessPlanModel } from "@/core/businessPlan";
import { BusinessPlan } from "@/screens/BusinessPlan";

/**
 * Demots Affärsplan: sätter samman planen för det aktuella momentet ur
 * demoadaptrarna (`adapters/demo/businessPlan.ts`, som anropar
 * `buildBusinessPlan`) och lämnar över till skärmen (PR 10,
 * docs/plan-en-design.md).
 */
export default function FondaDemoBusinessPlanPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [plan, setPlan] = useState<BusinessPlanModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBusinessPlan(locale).then((result) => {
      if (!cancelled) setPlan(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!plan) return null;

  return <BusinessPlan data={{ plan }} />;
}
