"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import type { DataKind, Profile } from "@/core/domain";

/** Var demot/plattformen står i resan just nu (avsnitt 9.1) — utelämnad
 * eller `null` om steget inte går att fastställa (t.ex. live-läget innan
 * Resan-modulen har egen data). `total` skickas med i stället för att
 * hårdkoda "12" i brödsmulan. */
export type AppShellCurrentStep = { number: number; title: string; total: number };

/**
 * Sidhuvudet, utan flikraden: logga, fiktionsmärke, det pågående steget och
 * profilavataren. Flyttad hit oförändrad (PR 2, docs/plan-en-design.md) —
 * demots onboarding (`app/demo/start/layout.tsx`) använder den fristående,
 * utan flikrad, så den måste förbli en egen exporterad byggsten och inte
 * bara ett internt implementationsdetalj i `AppShell`.
 *
 * `dataKind` styr fiktionsmärket ("Exempel med påhittad data") — default
 * `"example"` så att onboardingens anropsställe (`<DemoTopBar />`, alltid
 * demo) inte behöver ändras när `/app` börjar återanvända samma komponent
 * via `AppShell` med `dataKind="live"`.
 */
export function DemoTopBar({
  dataKind = "example",
  children,
  end,
  headerRight,
}: {
  dataKind?: DataKind;
  children?: ReactNode;
  end?: ReactNode;
  headerRight?: ReactNode;
}) {
  const { t } = useI18n();
  const copy = t.site.demo;

  return (
    <header className="fdd-top">
      <div className="fdd-top__inner">
        <Link href="/" aria-label={copy.backToLanding} className="fd-nav__logo">
          <Logo height={16} />
        </Link>
        {dataKind === "example" && <span className="fd-pill fd-pill--fiction">{copy.badge}</span>}
        <div className="fdd-top__end">
          {end}
          <LanguageSwitch />
          {headerRight}
        </div>
      </div>
      {children}
    </header>
  );
}

/**
 * Delat skal för /demo och /app (PR 2, docs/plan-en-design.md): sidhuvudet
 * med flikraden. Skalet vet ingenting om demo eller live — den monterande
 * routen skickar in profilen, det pågående steget (null = inte fastställt,
 * t.ex. Resan-stubben i /app) och `dataKind` för fiktionsmärket. Poängen
 * visas medvetet INTE här (den flyttade markupen, `DemoShell`, visade den
 * aldrig heller — `DemoShellData.score` var redan död kod; varje sida hämtar
 * och visar sin egen poäng, t.ex. Hems poängkort).
 *
 * `navBasePath` styr om flikarna länkar (t.ex. "/demo") eller förblir inerta
 * `<span>`-element (utelämnad — /app har bara några undersidor än, se
 * docs/arkitektur.md 7). `enabledTabs` låter /app länka just de flikar vars
 * sida finns (t.ex. Pulsen). Demoraden och rundturen hör INTE hemma här — de
 * stannar i demots egen layout (`app/demo/layout.tsx`), som redan renderar
 * dem som syskon till det här skalets innehåll.
 *
 * `headerRight` (Session P1) är samma icke-demo-medvetna mönster som förut:
 * /app skickar in en utloggningsknapp (`components/spark/SignOutButton.tsx`),
 * /demo skickar ingenting.
 */
export function AppShell({
  homeHref,
  navBasePath,
  enabledTabs,
  dataKind,
  profile,
  currentStep,
  headerRight,
  children,
}: {
  homeHref: string;
  navBasePath?: string;
  /** Utan `navBasePath`: flikar (fulla href:ar, t.ex. "/app/pulsen") som
   * ändå länkar eftersom sidan finns. Övriga förblir inerta. */
  enabledTabs?: readonly string[];
  dataKind: DataKind;
  profile: Profile;
  currentStep?: AppShellCurrentStep | null;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const copy = t.site.demo;
  const nav = t.appShell.nav;
  const pathname = usePathname();

  const tabs: { href: string; label: string }[] = [
    { href: homeHref, label: nav.home },
    { href: `${navBasePath ?? homeHref}/medgrundaren`, label: nav.cofounder },
    { href: `${navBasePath ?? homeHref}/resan`, label: nav.journey },
    { href: `${navBasePath ?? homeHref}/poang`, label: nav.score },
    { href: `${navBasePath ?? homeHref}/marknad`, label: nav.market },
    { href: `${navBasePath ?? homeHref}/validering`, label: nav.validation },
    { href: `${navBasePath ?? homeHref}/pulsen`, label: nav.pulse },
    { href: `${navBasePath ?? homeHref}/minnet`, label: nav.memory },
    { href: `${navBasePath ?? homeHref}/juridik`, label: nav.legal },
    { href: `${navBasePath ?? homeHref}/bygg`, label: nav.build },
    { href: `${navBasePath ?? homeHref}/affarsplan`, label: nav.businessPlan },
  ];

  // Den aktiva fliken ska synas även när flikraden rullar i sidled (mobil).
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = tabsRef.current;
    const active = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !active) return;
    const start = active.offsetLeft;
    const end = start + active.offsetWidth;
    if (start < row.scrollLeft || end > row.scrollLeft + row.clientWidth) {
      row.scrollLeft = Math.max(0, start - 16);
    }
  }, [pathname]);

  function isActive(href: string): boolean {
    if (href === homeHref) return pathname === href;
    return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
  }

  return (
    <>
      <DemoTopBar
        dataKind={dataKind}
        headerRight={headerRight}
        end={
          <>
            {currentStep && (
              <p className="fdd-top__step">
                {fill(copy.stepOf, {
                  current: String(currentStep.number).padStart(2, "0"),
                  total: currentStep.total,
                })}
                <span aria-hidden="true"> · </span>
                {currentStep.title}
              </p>
            )}
            <span className="fdd-avatar" title={profile.name}>
              <span aria-hidden="true">{profile.initials}</span>
              <span className="fd-sr-only">{profile.name}</span>
            </span>
          </>
        }
      >
        <nav aria-label={dataKind === "example" ? copy.navLabel : t.appShell.navMenuLabel} className="fdd-tabs">
          <div ref={tabsRef} className="fdd-tabs__inner">
            {tabs.map((tab) => {
              if (tab.href !== homeHref && !navBasePath && !enabledTabs?.includes(tab.href)) {
                return (
                  <span key={tab.href} className="fdd-tab fdd-tab--disabled">
                    {tab.label}
                  </span>
                );
              }
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("fdd-tab", active && "fdd-tab--active")}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </DemoTopBar>
      <main className="fdd-main">{children}</main>
    </>
  );
}
