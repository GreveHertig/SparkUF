"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/screens/AppShell";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { DemoBar } from "@/components/spark/DemoBar";
import { TourOverlay } from "@/components/spark/TourOverlay";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { AppShellCurrentStep } from "@/screens/AppShell";
import type { Profile, ScoreSnapshot } from "@/core/domain";

type ShellData = { profile: Profile; scoreSnapshot: ScoreSnapshot; currentStep: AppShellCurrentStep | null };

// Demot har ingen backend, så adaptrarna kan anropas direkt från klienten
// (avsnitt 3). `use()` visade sig krascha med "async Client Component" när
// locale ändrades (varje rendering skapade en ny promise-identitet) — en
// vanlig useEffect/useState är den stabila lösningen för klientdata som
// beror på en prop som kan ändras efter första renderingen. Sedan Session 2
// beror poängen även på demomotorns `beatIndex` (adapters/demo/demoStore.ts)
// — samma mönster, ett beroende till.
export default function DemoAppShellLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const onboardingDone = useDemoStore((state) => state.onboardingDone);
  const [data, setData] = useState<ShellData | null>(null);

  // Avsnitt 9.1: demot ska alltid börja i onboardingen. Zustands `persist`
  // hydrerar från localStorage först efter första klientrendering, så det
  // här får inte avgöras i själva renderingen (det skulle skicka tillbaka
  // även återvändande besökare under ett ögonblick) — en effekt som körs
  // efter hydrering är den stabila platsen, samma resonemang som datahämtningen nedan.
  useEffect(() => {
    if (!onboardingDone) router.replace("/demo/start");
  }, [onboardingDone, router]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      demoProfileRepository.getProfile(),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([profile, scoreSnapshot, steps]) => {
      if (cancelled) return;
      const current = steps.find((step) => step.status === "current");
      setData({
        profile,
        scoreSnapshot,
        currentStep: current ? { number: current.stepNumber, title: current.title, total: steps.length } : null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!onboardingDone) return null;
  if (!data) return null;

  return (
    <AppShell
      homeHref="/demo/app"
      navBasePath="/demo/app"
      profile={data.profile}
      scoreSnapshot={data.scoreSnapshot}
      currentStep={data.currentStep}
      headerLeft={<DemoDataBadge />}
      bottomBar={<DemoBar />}
    >
      {children}
      <TourOverlay />
    </AppShell>
  );
}
