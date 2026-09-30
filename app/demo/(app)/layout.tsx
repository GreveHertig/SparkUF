"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { AppShell, type AppShellCurrentStep } from "@/screens/AppShell";
import type { Profile } from "@/core/domain";
import { FONDA_DEMO_PATHS } from "../_lib/paths";

type ShellData = { profile: Profile; currentStep: AppShellCurrentStep | null };

/**
 * App-ytan: skalet med demomenyn. Som i det riktiga demot börjar
 * man i onboardingen. Lagret är redan inläst när den här layouten renderas
 * (se ../layout.tsx), så spärren läser det faktiska värdet och skickar inte
 * tillbaka en återvändande besökare.
 *
 * Tunn hämtare (PR 2, docs/plan-en-design.md): all markup ligger i den
 * delade `screens/AppShell.tsx`. Hämtar bara profil och steg — poängen
 * behövs inte längre av skalet (varje sida hämtar sin egen).
 */
export default function FondaDemoAppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const onboardingDone = useDemoStore((state) => state.onboardingDone);
  const [data, setData] = useState<ShellData | null>(null);

  useEffect(() => {
    if (!onboardingDone) router.replace(FONDA_DEMO_PATHS.start);
  }, [onboardingDone, router]);

  // Samma useEffect/useState-mönster som det riktiga demots layout.
  useEffect(() => {
    let cancelled = false;
    Promise.all([demoProfileRepository.getProfile(), demoJourneyRepository.getSteps(locale)]).then(
      ([profile, steps]) => {
        if (cancelled) return;
        const current = steps.find((step) => step.status === "current") ?? null;
        const currentStep = current
          ? { number: current.stepNumber, title: current.title, total: steps.length }
          : null;
        setData({ profile, currentStep });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!onboardingDone || !data) return null;

  return (
    <AppShell
      homeHref={FONDA_DEMO_PATHS.home}
      navBasePath={FONDA_DEMO_PATHS.home}
      dataKind="example"
      profile={data.profile}
      currentStep={data.currentStep}
    >
      {children}
    </AppShell>
  );
}
