"use client";

import { useEffect, useState } from "react";
import { BusinessPlan, type BusinessPlanData } from "@/screens/BusinessPlan";
import { useI18n } from "@/i18n/context";
import { getBusinessPlan } from "@/adapters/demo/businessPlan";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoBusinessPlanPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<BusinessPlanData | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBusinessPlan(locale).then((plan) => {
      if (!cancelled) setData({ plan });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return <BusinessPlan data={data} />;
}
