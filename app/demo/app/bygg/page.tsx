"use client";

import { useEffect, useState } from "react";
import { Build, type BuildData } from "@/screens/Build";
import { useI18n } from "@/i18n/context";
import { demoBuildProvider } from "@/adapters/demo/BuildProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoBuildPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  // demoBuildProvider returnerar redan not_started/null för Jonas (persona
  // B) — ingen byggspec finns i jonas.ts, se adapters/demo/BuildProvider.ts.
  const notInScenario = entry === "hasIdea";
  const [data, setData] = useState<BuildData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([demoBuildProvider.getStatus(), demoBuildProvider.getSpec(locale)]).then(([status, spec]) => {
      if (!cancelled) setData({ status: status.status, url: status.url, creditsUsed: status.creditsUsed, spec });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Build data={data} notInScenario={notInScenario} />;
}
