"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { Profile } from "@/core/domain";

/**
 * Delad sidomeny + sidhuvud för /app (avsnitt 6). Shellen vet ingenting om
 * demo eller live — den monterande routen skickar in profil, poäng (null
 * betyder "inte hämtad än", visas inte som 0) och vart Hem-länken ska peka.
 * Demoläget lägger sin egen `DemoDataBadge` i `headerLeft` och `DemoBar` i
 * `bottomBar` — shellen bara reserverar plats, den känner inte till demoraden.
 *
 * `navBasePath` styr om sidomenyn länkar (t.ex. "/demo/app") eller förblir
 * inert (utelämnad — /app har inga undersidor än, se docs/arkitektur.md 7).
 */
export function AppShell({
  homeHref,
  navBasePath,
  profile,
  score,
  headerLeft,
  bottomBar,
  children,
}: {
  homeHref: string;
  navBasePath?: string;
  profile: Profile;
  score: number | null;
  headerLeft?: ReactNode;
  bottomBar?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems: { slug: string; label: string }[] = [
    { slug: "medgrundaren", label: t.appShell.nav.cofounder },
    { slug: "resan", label: t.appShell.nav.journey },
    { slug: "poang", label: t.appShell.nav.score },
    { slug: "marknad", label: t.appShell.nav.market },
    { slug: "kunder", label: t.appShell.nav.customers },
    { slug: "pulsen", label: t.appShell.nav.pulse },
    { slug: "minnet", label: t.appShell.nav.memory },
    { slug: "juridik", label: t.appShell.nav.legal },
    { slug: "bygg", label: t.appShell.nav.build },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-8 bg-ink-800 p-6">
        <Logo tone="light" height={18} />
        <nav className="flex flex-col gap-1" aria-label={t.appShell.nav.home}>
          <Link
            href={homeHref}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent-300",
              pathname === homeHref ? "bg-slate-700 text-paper-50" : "text-slate-400 hover:text-paper-50",
            )}
          >
            {t.appShell.nav.home}
          </Link>
          {navItems.map(({ slug, label }) =>
            navBasePath ? (
              <Link
                key={slug}
                href={`${navBasePath}/${slug}`}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent-300",
                  pathname?.startsWith(`${navBasePath}/${slug}`)
                    ? "bg-slate-700 text-paper-50"
                    : "text-slate-400 hover:text-paper-50",
                )}
              >
                {label}
              </Link>
            ) : (
              <span key={slug} className="rounded-md px-3 py-2 text-sm font-medium text-slate-400">
                {label}
              </span>
            ),
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <div>{headerLeft}</div>
          <div className="flex items-center gap-4">
            {score !== null && <ScoreBadge score={score} />}
            <LanguageSwitch />
            <div className="flex items-center gap-2" aria-label={t.appShell.profileMenuLabel}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
                aria-hidden="true"
              >
                {profile.initials}
              </span>
              <span className="text-sm font-medium text-slate-700">{profile.name}</span>
            </div>
          </div>
        </header>
        <main className={cn("flex-1 bg-paper-50 p-8", Boolean(bottomBar) && "pb-20")}>{children}</main>
        {bottomBar}
      </div>
    </div>
  );
}
