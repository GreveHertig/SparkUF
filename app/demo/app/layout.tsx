"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/screens/AppShell";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { useI18n } from "@/i18n/context";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import type { Profile } from "@/core/domain";

type ShellData = { profile: Profile; score: number };

// Demot har ingen backend, så adaptrarna kan anropas direkt från klienten
// (avsnitt 3). `use()` visade sig krascha med "async Client Component" när
// locale ändrades (varje rendering skapade en ny promise-identitet) — en
// vanlig useEffect/useState är den stabila lösningen för klientdata som
// beror på en prop som kan ändras efter första renderingen.
export default function DemoAppShellLayout({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [data, setData] = useState<ShellData | null>(null);

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
  }, [locale]);

  if (!data) return null;

  return (
    <AppShell
      homeHref="/demo/app"
      profile={data.profile}
      score={data.score}
      headerLeft={<DemoDataBadge />}
    >
      {children}
    </AppShell>
  );
}
