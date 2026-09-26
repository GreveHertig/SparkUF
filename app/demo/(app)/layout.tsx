"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { DemoShell, type DemoShellData } from "../_components/DemoShell";
import { FONDA_DEMO_PATHS } from "../_lib/paths";

/**
 * App-ytan: skalet med demomenyn. Som i det riktiga demot börjar
 * man i onboardingen. Lagret är redan inläst när den här layouten renderas
 * (se ../layout.tsx), så spärren läser det faktiska värdet och skickar inte
 * tillbaka en återvändande besökare.
 */
export default function FondaDemoAppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const onboardingDone = useDemoStore((state) => state.onboardingDone);
  const [data, setData] = useState<DemoShellData | null>(null);

  useEffect(() => {
    if (!onboardingDone) router.replace(FONDA_DEMO_PATHS.start);
  }, [onboardingDone, router]);

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

  if (!onboardingDone || !data) return null;

  return <DemoShell data={data}>{children}</DemoShell>;
}
