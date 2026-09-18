"use client";

import { useEffect, useState } from "react";
import { OnboardingProfile } from "@/screens/OnboardingProfile";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import type { OnboardingScript } from "@/ports/ProfileRepository";

// Delad route för båda ingångarna (avsnitt 6: en enda "/start/profil").
// Ingång A kommer hit direkt från valet av ingång; ingång B kommer hit efter
// idégenomlysningen (/demo/start/ide) med ett kortare, passform-fokuserat
// samtal — samma route, olika innehåll ur entry-state (avsnitt 2.1).
export default function DemoStartProfilePage() {
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

  return (
    <OnboardingProfile
      data={{
        script,
        continueHref: "/demo/app",
        onContinue: completeOnboarding,
      }}
    />
  );
}
