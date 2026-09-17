"use client";

import { use, useMemo, type ReactNode } from "react";
import { AppShell } from "@/screens/AppShell";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";

// Demot har ingen backend, så adaptrarna kan anropas direkt från klienten
// (avsnitt 3). Locale kommer från i18n-kontexten så att SV/EN-växeln byter
// scenariespråk direkt, utan sidladdning. Promisen memoiseras per locale —
// `use()` ska inte få en ny promise-identitet vid varje rendering.
export default function DemoAppShellLayout({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const profilePromise = useMemo(() => demoProfileRepository.getProfile(), []);
  const scorePromise = useMemo(() => demoEvidenceRepository.getScoreSnapshot(locale), [locale]);
  const profile = use(profilePromise);
  const score = use(scorePromise).total;

  return (
    <AppShell
      homeHref="/demo/app"
      profile={profile}
      score={score}
      headerLeft={<DemoDataBadge />}
    >
      {children}
    </AppShell>
  );
}
