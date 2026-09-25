"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { Profile, ScoreSnapshot } from "@/core/domain";
import type { JourneyStepView } from "@/ports/JourneyRepository";
import { fill } from "../../_lib/fill";
import { FONDA_DEMO_PATHS } from "../_lib/paths";

export type DemoShellData = {
  profile: Profile;
  score: ScoreSnapshot;
  currentStep: JourneyStepView | null;
  stepCount: number;
};

/** Kopians skal: ett ljust sidhuvud med demomenyn, i landningssidans stil. */
export function DemoShell({ data, children }: { data: DemoShellData; children: ReactNode }) {
  const { t } = useI18n();
  const copy = t.experimentFonda.demo;
  const pathname = usePathname();

  const links = [
    { href: FONDA_DEMO_PATHS.home, label: t.appShell.nav.home },
    { href: FONDA_DEMO_PATHS.score, label: t.appShell.nav.score },
  ];

  return (
    <div className="fdd">
      <header className="fdd-top">
        <div className="fdd-top__inner">
          <Link href="/experiment/fonda" aria-label={copy.backToLanding} className="fd-nav__logo">
            <Logo height={16} />
          </Link>
          <span className="fd-pill fd-pill--fiction">{copy.badge}</span>

          <nav aria-label={copy.navLabel} className="fdd-tabs">
            {links.map((link) => {
              const active = pathname === link.href;
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
          </nav>

          <div className="fdd-top__end">
            {data.currentStep && (
              <p className="fdd-top__step">
                {fill(copy.stepOf, { current: String(data.currentStep.stepNumber).padStart(2, "0"), total: data.stepCount })}
                <span aria-hidden="true"> · </span>
                {data.currentStep.title}
              </p>
            )}
            <LanguageSwitch />
            <span className="fdd-avatar" title={data.profile.name}>
              <span aria-hidden="true">{data.profile.initials}</span>
              <span className="fd-sr-only">{data.profile.name}</span>
            </span>
          </div>
        </div>
      </header>
      <main className="fdd-main">{children}</main>
    </div>
  );
}
