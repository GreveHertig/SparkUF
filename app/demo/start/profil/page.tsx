"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { OnboardingScript } from "@/ports/ProfileRepository";
import { OnboardingProfile } from "@/screens/OnboardingProfile";
import { FONDA_DEMO_PATHS } from "../../_lib/paths";

/** Profilsamtalet: hämtar samtalet för vald ingång. Markupen ligger i skärmen. */
export default function FondaDemoProfilePage() {
  const { locale } = useI18n();
  const entry = useDemoStore((state) => state.entry);
  const completeOnboarding = useDemoStore((state) => state.completeOnboarding);
  const [script, setScript] = useState<OnboardingScript | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoProfileRepository.getOnboardingScript(entry, locale).then((result) => {
      if (!cancelled) setScript(result);
    });
    return () => {
      cancelled = true;
    };
  }, [entry, locale]);

  if (!script) return null;
  // Ett byte av ingång börjar samtalet om från början.
  return (
    <OnboardingProfile
      key={entry}
      data={{ script }}
      continueHref={FONDA_DEMO_PATHS.home}
      onContinue={completeOnboarding}
    />
  );
}
