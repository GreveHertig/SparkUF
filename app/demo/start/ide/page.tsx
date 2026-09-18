"use client";

import { useEffect, useState } from "react";
import { OnboardingIdea } from "@/screens/OnboardingIdea";
import { useI18n } from "@/i18n/context";
import { demoProjectRepository } from "@/adapters/demo/ProjectRepository";
import type { IdeaScreening } from "@/ports/ProjectRepository";

export default function DemoStartIdeaPage() {
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

  return <OnboardingIdea data={{ screening, continueHref: "/demo/start/profil" }} />;
}
