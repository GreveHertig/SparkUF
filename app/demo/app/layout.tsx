"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/screens/AppShell";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { DemoBar } from "@/components/spark/DemoBar";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { Profile } from "@/core/domain";

type ShellData = { profile: Profile; score: number };

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

    Promise.all([demoProfileRepository.getProfile(), demoEvidenceRepository.getScoreSnapshot(locale)]).then(
      ([profile, scoreSnapshot]) => {
        if (!cancelled) setData({ profile, score: scoreSnapshot.total });
      },
    );

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
      score={data.score}
      headerLeft={<DemoDataBadge />}
      bottomBar={<DemoBar />}
    >
      {children}
    </AppShell>
  );
}
