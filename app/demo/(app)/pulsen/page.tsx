"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { PulseSignal } from "@/core/domain";
import { PulseFeed } from "@/screens/PulseFeed";

/** Pulsen i demot: demoadapterns signaler, visade med den delade skärmen. */
export default function FondaDemoPulsePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [signals, setSignals] = useState<PulseSignal[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoPulseProvider.getSignals(locale).then((result) => {
      if (!cancelled) setSignals(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!signals) return null;

  return <PulseFeed signals={signals} />;
}
