"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { DemoShell, type DemoShellData } from "./_components/DemoShell";
import { FondaDemoBar } from "./_components/FondaDemoBar";
import { retainFondaDemo, useFondaDemoReady } from "./_lib/fondaDemoIsolation";

/**
 * Rot för kopian av demot: växlar demo-lagret till kopians egen nyckel
 * (se _lib/fondaDemoIsolation.ts), hämtar skalets data ur de oförändrade
 * demoadaptrarna och bär demoraden.
 *
 * Innehållet renderas först när växlingen är gjord. Då kan ingen sida hämta
 * data ur det riktiga demots läge, och server och klient renderar samma
 * tomma skal vid hydreringen.
 */
export default function FondaDemoLayout({ children }: { children: ReactNode }) {
  const ready = useFondaDemoReady();

  useLayoutEffect(() => retainFondaDemo(), []);

  return ready ? <ReadyShell>{children}</ReadyShell> : null;
}

function ReadyShell({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<DemoShellData | null>(null);

  // Samma useEffect/useState-mönster som det riktiga demots layout.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoProfileRepository.getProfile(),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([profile, score, steps]) => {
      if (cancelled) return;
      const current = steps.find((step) => step.status === "current") ?? null;
      setData({ profile, score, currentStep: current, stepCount: steps.length });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return (
    <DemoShell data={data}>
      {children}
      <FondaDemoBar />
    </DemoShell>
  );
}
