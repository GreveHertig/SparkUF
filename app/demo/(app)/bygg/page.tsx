"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoBuildProvider } from "@/adapters/demo/BuildProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { exampleSource } from "@/adapters/demo/exampleSource";
import { Build, type BuildData, type BuildLock } from "@/screens/Build";

/** Demots Bygg: specen finns från steg 08, så utan spec är sidan låst till steg 07 (PR 10). */
const UNLOCKS_AFTER_STEP = 7;
/** Steget där bygget körs och credits går åt (cofounderScript.ts, "10-live-korning"). */
const BUILD_STEP = 10;

/**
 * Demots Bygg: hämtar status och spec för det aktuella momentet och lämnar
 * över till skärmen (PR 10, docs/plan-en-design.md). Samma låsning som förut:
 * ingen spec ger låst till steg 07, och Jonas får "inte i scenariot".
 */
export default function DemoBuildPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const [view, setView] = useState<{ data: BuildData; locked: BuildLock } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([demoBuildProvider.getStatus(), demoBuildProvider.getSpec(locale)]).then(([status, spec]) => {
      if (cancelled) return;
      setView({
        data: {
          status,
          spec: spec ?? "none",
          // Credits-talet är påhittat i scenariot (BuildProvider.ts) och hör till
          // bygget i steg 10: egen exempelkälla.
          creditsSource: { source: exampleSource(locale, { step: BUILD_STEP }), dataType: "example" },
        },
        locked: spec ? null : notInScenario ? "notInScenario" : { unlocksAfterStep: UNLOCKS_AFTER_STEP },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, notInScenario]);

  if (!view) return null;

  return <Build data={view.data} locked={view.locked} />;
}
