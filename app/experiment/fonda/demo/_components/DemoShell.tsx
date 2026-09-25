"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { Profile, ScoreSnapshot } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { fill } from "@/app/experiment/fonda/_lib/fill";
import { FONDA_DEMO_PATHS } from "../_lib/paths";

export type DemoShellData = {
  profile: Profile;
  score: ScoreSnapshot;
  currentStep: JourneyStepView | null;
  stepCount: number;
};

/** Kopians sidhuvud: logga, märkning, språk och demomenyn som en flikrad. */
export function DemoTopBar({ children, end }: { children?: ReactNode; end?: ReactNode }) {
  const { t } = useI18n();
  const copy = t.experimentFonda.demo;

  return (
    <header className="fdd-top">
      <div className="fdd-top__inner">
        <Link href="/experiment/fonda" aria-label={copy.backToLanding} className="fd-nav__logo">
          <Logo height={16} />
        </Link>
        <span className="fd-pill fd-pill--fiction">{copy.badge}</span>
        <div className="fdd-top__end">
          {end}
          <LanguageSwitch />
        </div>
      </div>
      {children}
    </header>
  );
}

/** App-ytans skal: sidhuvudet med flikraden för alla sidor. */
export function DemoShell({ data, children }: { data: DemoShellData; children: ReactNode }) {
  const { t } = useI18n();
  const copy = t.experimentFonda.demo;
  const nav = t.appShell.nav;
  const pathname = usePathname();

  const links = [
    { href: FONDA_DEMO_PATHS.home, label: nav.home },
    { href: FONDA_DEMO_PATHS.cofounder, label: nav.cofounder },
    { href: FONDA_DEMO_PATHS.journey, label: nav.journey },
    { href: FONDA_DEMO_PATHS.score, label: nav.score },
    { href: FONDA_DEMO_PATHS.market, label: nav.market },
    { href: FONDA_DEMO_PATHS.validation, label: nav.validation },
    { href: FONDA_DEMO_PATHS.pulse, label: nav.pulse },
    { href: FONDA_DEMO_PATHS.memory, label: nav.memory },
    { href: FONDA_DEMO_PATHS.legal, label: nav.legal },
    { href: FONDA_DEMO_PATHS.build, label: nav.build },
    { href: FONDA_DEMO_PATHS.businessPlan, label: nav.businessPlan },
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
    if (href === FONDA_DEMO_PATHS.home) return pathname === href;
    return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
  }

  return (
    <>
      <DemoTopBar
        end={
          <>
            {data.currentStep && (
              <p className="fdd-top__step">
                {fill(copy.stepOf, {
                  current: String(data.currentStep.stepNumber).padStart(2, "0"),
                  total: data.stepCount,
                })}
                <span aria-hidden="true"> · </span>
                {data.currentStep.title}
              </p>
            )}
            <span className="fdd-avatar" title={data.profile.name}>
              <span aria-hidden="true">{data.profile.initials}</span>
              <span className="fd-sr-only">{data.profile.name}</span>
            </span>
          </>
        }
      >
        <nav aria-label={copy.navLabel} className="fdd-tabs">
          <div ref={tabsRef} className="fdd-tabs__inner">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("fdd-tab", active && "fdd-tab--active")}
                >
                  {link.label}
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
