"use client";

import { useEffect, useState } from "react";
import { Legal, type LegalData } from "@/screens/Legal";
import { demoLegalAdvisor } from "@/adapters/demo/LegalAdvisor";
import { useDemoStore } from "@/adapters/demo/demoStore";

// Juridik-porten tar inte emot locale (docs/status.md, känd begränsning —
// samma på live- och demoadaptern), så bara beatIndex behövs här.
export default function DemoLegalPage() {
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<LegalData | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoLegalAdvisor.getLegalMap("enskild_firma").then((krav) => {
      if (!cancelled) setData({ krav });
    });
    return () => {
      cancelled = true;
    };
  }, [beatIndex]);

  if (!data) return null;

  return <Legal data={data} />;
}
