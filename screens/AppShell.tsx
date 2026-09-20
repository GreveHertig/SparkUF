"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { cn } from "@/design/cn";
import { getScoreLevel } from "@/score/levels";
import { useI18n } from "@/i18n/context";
import type { Profile, ScoreSnapshot } from "@/core/domain";

/** Var demot/plattformen står i resan just nu (avsnitt 9.1) — utelämnad
 * eller `null` om steget inte går att fastställa (t.ex. live-läget innan
 * Resan-modulen har egen data). `total` skickas med i stället för att
 * hårdkoda "12" i brödsmulan. */
export type AppShellCurrentStep = { number: number; title: string; total: number };

/**
 * Delad sidomeny + sidhuvud för /app (avsnitt 6). Shellen vet ingenting om
 * demo eller live — den monterande routen skickar in profil, poängsnapshotten
 * (null betyder "inte hämtad än", visas inte som 0) och vart Hem-länken ska
 * peka. Demoläget lägger sin egen `DemoDataBadge` i `headerLeft` och
 * `DemoBar` i `bottomBar` — shellen bara reserverar plats, den känner inte
 * till demoraden.
 *
 * `navBasePath` styr om sidomenyn länkar (t.ex. "/demo/app") eller förblir
 * inert (utelämnad — /app har inga undersidor än, se docs/arkitektur.md 7).
 *
 * `headerRight` (Session P1) är samma icke-demo-medvetna mönster som
 * `headerLeft`/`bottomBar`: /app skickar in en utloggningsknapp
 * (components/spark/SignOutButton.tsx), /demo/app skickar ingenting.
 *
 * Brödsmula + poängvisning (uppgift 1, gemensamt skal): sidans namn hämtas
 * ur samma `navItems`/`pathname`-matchning som redan styr sidomenyns aktiva
 * länk, i stället för att varje route skickar in en egen etikett. Poängen
 * läses bara — den räknas fortfarande av `calculateScore` hos den
 * anropande routen.
 */
export function AppShell({
  homeHref,
  navBasePath,
  profile,
  scoreSnapshot,
  currentStep,
  headerLeft,
  headerRight,
  bottomBar,
  children,
}: {
  homeHref: string;
  navBasePath?: string;
  profile: Profile;
  scoreSnapshot: ScoreSnapshot | null;
  currentStep?: AppShellCurrentStep | null;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
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
    { slug: "validering", label: t.appShell.nav.validation },
    { slug: "pulsen", label: t.appShell.nav.pulse },
    { slug: "minnet", label: t.appShell.nav.memory },
    { slug: "juridik", label: t.appShell.nav.legal },
    { slug: "bygg", label: t.appShell.nav.build },
  ];

  const activeNavItem = navItems.find(
    ({ slug }) => navBasePath && pathname?.startsWith(`${navBasePath}/${slug}`),
  );
  const pageLabel = pathname === homeHref ? t.appShell.nav.home : (activeNavItem?.label ?? t.appShell.nav.home);
  const scoreHref = `${navBasePath ?? homeHref}/poang`;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col gap-6 bg-ink-800 p-5">
        <Logo tone="light" height={18} />
        <nav className="flex flex-col gap-0.5" aria-label={t.appShell.nav.home}>
          <Link
            href={homeHref}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent-300",
              pathname === homeHref ? "bg-accent-600 text-white" : "text-slate-400 hover:text-paper-50",
            )}
            style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
          >
            {t.appShell.nav.home}
          </Link>
          {navItems.map(({ slug, label }) =>
            navBasePath ? (
              <Link
                key={slug}
                href={`${navBasePath}/${slug}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent-300",
                  pathname?.startsWith(`${navBasePath}/${slug}`)
                    ? "bg-accent-600 text-white"
                    : "text-slate-400 hover:text-paper-50",
                )}
                style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
              >
                {label}
              </Link>
            ) : (
              <span key={slug} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-400">
                {label}
              </span>
            ),
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex flex-col gap-1">
            <p className="font-numeric text-xs font-medium text-slate-500">
              {pageLabel}
              {currentStep && (
                <>
                  {" · "}
                  {t.journeyPage.stepLabel} {String(currentStep.number).padStart(2, "0")} {t.marketPage.ofLabel}{" "}
                  {currentStep.total}
                  {" · "}
                  {currentStep.title}
                </>
              )}
            </p>
            {headerLeft}
          </div>
          <div className="flex items-center gap-3">
            {scoreSnapshot && (
              <Link
                href={scoreHref}
                aria-label={t.appShell.nav.score}
                className="flex items-center gap-2 rounded-pill border border-slate-200 py-1 pl-1 pr-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-accent-300"
                style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
              >
                <ScoreBadge score={scoreSnapshot.total} />
                <span className="text-xs font-semibold text-slate-700">
                  {t.score.levels[getScoreLevel(scoreSnapshot.total).key].name}
                </span>
                {scoreSnapshot.delta !== 0 && (
                  <span
                    className={cn(
                      "font-numeric text-xs font-semibold",
                      scoreSnapshot.delta > 0 ? "text-score-green" : "text-score-red",
                    )}
                    title={scoreSnapshot.deltaReason}
                  >
                    {scoreSnapshot.delta > 0 ? "+" : "−"}
                    {Math.abs(scoreSnapshot.delta)}
                  </span>
                )}
              </Link>
            )}
            <LanguageSwitch />
            <div className="flex items-center gap-2" aria-label={t.appShell.profileMenuLabel}>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
                aria-hidden="true"
              >
                {profile.initials}
              </span>
              <span className="text-sm font-medium text-slate-700">{profile.name}</span>
            </div>
            {headerRight}
          </div>
        </header>
        <main className={cn("flex-1 bg-paper-50 p-6", Boolean(bottomBar) && "pb-20")}>{children}</main>
        {bottomBar}
      </div>
    </div>
  );
}
