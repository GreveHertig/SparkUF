"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { saraHomeContent } from "./sara-mock";

// Bara /app är byggd hittills — övriga navigationsposter är medvetet inerta
// (ingen href) tills respektive sida finns, i stället för döda länkar.
export default function AppShellLayout({ children }: { children: ReactNode }) {
  const { locale, t } = useI18n();
  const content = saraHomeContent[locale];

  const inertNavItems = [
    t.appShell.nav.cofounder,
    t.appShell.nav.journey,
    t.appShell.nav.score,
    t.appShell.nav.market,
    t.appShell.nav.customers,
    t.appShell.nav.pulse,
    t.appShell.nav.memory,
    t.appShell.nav.legal,
    t.appShell.nav.build,
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-8 bg-ink-800 p-6">
        <Logo tone="light" height={18} />
        <nav className="flex flex-col gap-1" aria-label={t.appShell.nav.home}>
          <Link
            href="/app"
            className="rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-paper-50 focus-visible:outline-2 focus-visible:outline-accent-300"
          >
            {t.appShell.nav.home}
          </Link>
          {inertNavItems.map((label) => (
            <span key={label} className="rounded-md px-3 py-2 text-sm font-medium text-slate-400">
              {label}
            </span>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <DemoDataBadge />
          <div className="flex items-center gap-4">
            <ScoreBadge score={content.score} />
            <LanguageSwitch />
            <div className="flex items-center gap-2" aria-label={t.appShell.profileMenuLabel}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
                aria-hidden="true"
              >
                {content.founderInitials}
              </span>
              <span className="text-sm font-medium text-slate-700">{content.founderName}</span>
            </div>
          </div>
        </header>
        <main className={cn("flex-1 bg-paper-50 p-8")}>{children}</main>
      </div>
    </div>
  );
}
