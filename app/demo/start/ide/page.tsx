"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import type { IdeaScreening } from "@/ports/ProjectRepository";
import { OnboardingIdea } from "@/screens/OnboardingIdea";
import { DEMO_PATHS } from "../../_lib/paths";

/** Idégenomlysningen (ingång B): hämtar demots genomlysning. Markupen ligger i skärmen. */
export default function DemoIdeaPage() {
  const { locale } = useI18n();
  const [screening, setScreening] = useState<IdeaScreening | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoProjectRepository.getIdeaScreening(locale).then((result) => {
      if (!cancelled) setScreening(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!screening) return null;
  return <OnboardingIdea data={{ screening }} continueHref={DEMO_PATHS.startProfile} />;
}
