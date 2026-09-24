"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n, type Locale } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import { FriDemoBar } from "./_components/FriDemoBar";
import { friProfile, scoreDataFor } from "./_lib/friDemoData";
import { useFriBeatIndex } from "./_lib/friDemoState";
import "./fri-demo.css";

const LOCALES: readonly Locale[] = ["sv", "en"];

/** Skalet för kopian av demot: sidhuvud med märkning och flikar, demoraden i botten. */
export default function FriDemoLayout({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const beatIndex = useFriBeatIndex();
  const score = scoreDataFor(beatIndex, locale).snapshot;
  const level = getScoreLevel(score.total);

  const tabs = [
    { href: "/experiment/fri/demo", label: t.appShell.nav.home },
    { href: "/experiment/fri/demo/poang", label: t.appShell.nav.score },
  ];

  const tabList = (className: string) => (
    <nav className={`fri-demo-tabs ${className}`} aria-label={t.experimentFreeDemo.navLabel}>
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="fri">
      <header className="fri-demo-head">
        <div className="fri-wrap">
          <div className="fri-demo-head-row">
            <div className="fri-demo-brand">
              <Link href="/experiment/fri" className="fri-mark" aria-label={t.experimentFreeDemo.backToSite}>
                Spark
              </Link>
              <span className="fri-tag">{t.experimentFree.hero.demoNote}</span>
            </div>
            {tabList("fri-demo-tabs-desktop")}
            <div className="fri-demo-side">
              <span className="fri-persona">
                <span className="fri-initials" aria-hidden="true">
                  {friProfile.initials}
                </span>
                {friProfile.name}
                <span className="fri-muted">
                  · <span className="fri-mono" style={{ fontSize: "0.8rem", color: "var(--ink)" }}>{score.total}</span>{" "}
                  {t.score.levels[level.key].name}
                </span>
              </span>
              <div role="group" aria-label={t.experimentFree.nav.language} className="fri-lang">
                {LOCALES.map((option) => (
                  <button key={option} type="button" aria-pressed={locale === option} onClick={() => setLocale(option)}>
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {tabList("fri-demo-tabs-mobile")}
        </div>
      </header>
      <main className="fri-wrap fri-demo-main">{children}</main>
      <FriDemoBar />
    </div>
  );
}
