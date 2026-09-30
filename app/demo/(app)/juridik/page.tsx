"use client";

import { useEffect, useState } from "react";
import { demoLegalAdvisor } from "@/adapters/demo/LegalAdvisor";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { JuridisktKrav } from "@/core/domain";
import { Legal, type LegalLock } from "@/screens/Legal";

/** Juridik: tunn hämtare (PR 5, docs/plan-en-design.md) — all markup ligger i
 * den delade screens/Legal.tsx. */
export default function DemoLegalPage() {
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [krav, setKrav] = useState<JuridisktKrav[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoLegalAdvisor.getLegalMap("enskild_firma").then((result) => {
      if (!cancelled) setKrav(result);
    });
    return () => {
      cancelled = true;
    };
  }, [beatIndex, entry]);

  if (!krav) return null;
  // I demot betyder en tom karta att den inte är upplåst än i momentet (steg
  // 04), eller att Jonas scenario inte har någon (adapters/demo/LegalAdvisor.ts).
  const locked: LegalLock = krav.length > 0 ? null : entry === "hasIdea" ? "notInScenario" : { unlocksAfterStep: 4 };

  return <Legal data={{ krav }} locked={locked} />;
}
