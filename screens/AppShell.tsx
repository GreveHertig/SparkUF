"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { Logo } from "@/components/ui/Logo";
import { NavIcon, type NavIconName } from "@/components/spark/NavIcon";
import { ScoreRing } from "@/components/spark/ScoreRing";
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
 * `sidebarFooterAction` (Formgivningspass mot artefakten, uppgift 2) är
 * samma mönster igen: en valfri knapp i sidfoten under profilblocket
 * (artefaktens `.side-foot .restart`) — /demo/app skickar in
 * `SidebarRestart`, /app skickar ingenting (ingen återställning i
 * plattformsläget).
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
  sidebarFooterAction,
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
  sidebarFooterAction?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();

  const navItems: { slug: string; label: string; icon: NavIconName }[] = [
    { slug: "medgrundaren", label: t.appShell.nav.cofounder, icon: "cofounder" },
    { slug: "resan", label: t.appShell.nav.journey, icon: "journey" },
    { slug: "poang", label: t.appShell.nav.score, icon: "score" },
    { slug: "marknad", label: t.appShell.nav.market, icon: "market" },
    { slug: "validering", label: t.appShell.nav.validation, icon: "validation" },
    { slug: "pulsen", label: t.appShell.nav.pulse, icon: "pulse" },
    { slug: "minnet", label: t.appShell.nav.memory, icon: "memory" },
    { slug: "juridik", label: t.appShell.nav.legal, icon: "legal" },
    { slug: "bygg", label: t.appShell.nav.build, icon: "build" },
  ];

  // Räknare (artefaktens navbtn .ct) — bara där en redan hämtad siffra
  // finns att visa utan en ny datahämtning i skalet: upplåsta delar av
  // totalt åtta, på Hem, precis som artefaktens kritKlara()/4.
  const unlockedCount = scoreSnapshot
    ? `${scoreSnapshot.parts.length}/${scoreSnapshot.parts.length + scoreSnapshot.lockedParts.length}`
    : null;

  const activeNavItem = navItems.find(
    ({ slug }) => navBasePath && pathname?.startsWith(`${navBasePath}/${slug}`),
  );
  const pageLabel = pathname === homeHref ? t.appShell.nav.home : (activeNavItem?.label ?? t.appShell.nav.home);
  const scoreHref = `${navBasePath ?? homeHref}/poang`;

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-sidebar-bg",
          Boolean(bottomBar) && "pb-20",
        )}
      >
        <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
          <span
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-white/10 text-accent-300"
            aria-hidden="true"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />
            </svg>
          </span>
          <span>
            <Logo tone="light" height={16} />
            <small className="mt-0.5 block text-[11px] text-slate-400">{t.appShell.tagline}</small>
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-1" aria-label={t.appShell.nav.home}>
          <Link
            href={homeHref}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent-300",
              pathname === homeHref
                ? "bg-accent-600 text-white shadow-lg"
                : "text-slate-200 hover:bg-white/[0.08] hover:text-white",
            )}
            style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
          >
            <NavIcon name="home" />
            {t.appShell.nav.home}
            {unlockedCount && <span className="font-numeric ml-auto text-[10.5px] text-slate-400">{unlockedCount}</span>}
          </Link>
          {navItems.map(({ slug, label, icon }) =>
            navBasePath ? (
              <Link
                key={slug}
                href={`${navBasePath}/${slug}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent-300",
                  pathname?.startsWith(`${navBasePath}/${slug}`)
                    ? "bg-accent-600 text-white shadow-lg"
                    : "text-slate-200 hover:bg-white/[0.08] hover:text-white",
                )}
                style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
              >
                <NavIcon name={icon} />
                {label}
              </Link>
            ) : (
              <span key={slug} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-slate-500">
                <NavIcon name={icon} />
                {label}
              </span>
            ),
          )}
        </nav>
        <div className="border-t border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2.5" aria-label={t.appShell.profileMenuLabel}>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs text-slate-200"
              aria-hidden="true"
            >
              {profile.initials}
            </span>
            <span className="text-[12.5px] text-slate-200">{profile.name}</span>
          </div>
          {sidebarFooterAction && <div className="mt-3">{sidebarFooterAction}</div>}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="font-numeric flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-900">{pageLabel}</span>
                {headerLeft}
              </p>
              {currentStep && (
                <span className="flex w-fit items-center gap-1.5 rounded-pill border border-slate-200 px-2.5 py-1 text-xs text-slate-900">
                  <span className="h-1.5 w-1.5 rounded-pill bg-accent-600" aria-hidden="true" />
                  {t.journeyPage.stepLabel} {String(currentStep.number).padStart(2, "0")} {t.marketPage.ofLabel}{" "}
                  {currentStep.total} · {currentStep.title}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {scoreSnapshot && (
              <Link
                href={scoreHref}
                aria-label={t.appShell.nav.score}
                className="flex items-center gap-2 rounded-pill border border-slate-200 py-1 pl-1 pr-3 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-accent-300"
                style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
              >
                <ScoreRing score={scoreSnapshot.total} />
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
            {headerRight}
          </div>
        </header>
        <main className={cn("flex-1 bg-paper-50 p-6", Boolean(bottomBar) && "pb-20")}>{children}</main>
        {bottomBar}
      </div>
    </div>
  );
}
