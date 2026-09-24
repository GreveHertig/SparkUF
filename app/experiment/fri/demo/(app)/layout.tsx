"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, type Locale } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import type { Profile, ScoreSnapshot } from "@/core/domain";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoProfileRepository } from "@/adapters/demo/ProfileRepository";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { FRI_DEMO_BASE, FRI_DEMO_START } from "../_lib/friPaths";

const LOCALES: readonly Locale[] = ["sv", "en"];

type ShellData = {
  profile: Profile;
  score: ScoreSnapshot;
  currentStep: { number: number; title: string; total: number } | null;
};

/**
 * Skalet för kopians appsidor (= app/demo/app/layout.tsx + screens/AppShell):
 * samma onboarding-spärr och samma sidhuvudsdata ur samma adaptrar, men
 * med en sidomeny i /experiment/fri-stil.
 */
export default function FriDemoAppLayout({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const onboardingDone = useDemoStore((state) => state.onboardingDone);
  const [data, setData] = useState<ShellData | null>(null);

  // Samma spärr som demots layout, men värdet läses ur lagret när effekten
  // körs: under hydreringen ger hooken serverns utgångsläge (false), vilket
  // annars skickar en återvändande besökare till onboardingen vid omladdning.
  useEffect(() => {
    if (!useDemoStore.getState().onboardingDone) router.replace(FRI_DEMO_START);
  }, [onboardingDone, router]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoProfileRepository.getProfile(),
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoJourneyRepository.getSteps(locale),
    ]).then(([profile, score, steps]) => {
      if (cancelled) return;
      const current = steps.find((step) => step.status === "current");
      setData({
        profile,
        score,
        currentStep: current ? { number: current.stepNumber, title: current.title, total: steps.length } : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!onboardingDone || !data) return null;

  const nav = [
    { slug: "", label: t.appShell.nav.home },
    { slug: "medgrundaren", label: t.appShell.nav.cofounder },
    { slug: "resan", label: t.appShell.nav.journey },
    { slug: "poang", label: t.appShell.nav.score },
    { slug: "marknad", label: t.appShell.nav.market },
    { slug: "validering", label: t.appShell.nav.validation },
    { slug: "pulsen", label: t.appShell.nav.pulse },
    { slug: "minnet", label: t.appShell.nav.memory },
    { slug: "juridik", label: t.appShell.nav.legal },
    { slug: "bygg", label: t.appShell.nav.build },
    { slug: "affarsplan", label: t.appShell.nav.businessPlan },
  ].map((item) => {
    const href = item.slug ? `${FRI_DEMO_BASE}/${item.slug}` : FRI_DEMO_BASE;
    const active = item.slug ? (pathname?.startsWith(href) ?? false) : pathname === FRI_DEMO_BASE;
    return { ...item, href, active };
  });

  const level = getScoreLevel(data.score.total);
  const langSwitch = (
    <div role="group" aria-label={t.experimentFree.nav.language} className="fri-lang">
      {LOCALES.map((option) => (
        <button key={option} type="button" aria-pressed={locale === option} onClick={() => setLocale(option)}>
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fri-app">
      <aside className="fri-side">
        <div className="fri-side-top">
          <Link href="/experiment/fri" className="fri-mark" aria-label={t.experimentFreeDemo.backToSite}>
            Spark
          </Link>
          <span className="fri-tag">{t.experimentFree.hero.demoNote}</span>
        </div>
        <nav className="fri-side-nav" aria-label={t.experimentFreeDemo.navLabel}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="fri-side-foot">
          <p className="fri-persona-line">
            <span className="fri-initials" aria-hidden="true">
              {data.profile.initials}
            </span>
            {data.profile.name}
          </p>
          <button
            type="button"
            className="fri-link"
            style={{ fontSize: "0.88rem", color: "var(--muted)" }}
            onClick={() => {
              if (window.confirm(t.demoBar.resetConfirm)) useDemoStore.getState().reset();
            }}
          >
            {t.appShell.restartDemo}
          </button>
        </div>
      </aside>

      <div className="fri-app-main">
        <header className="fri-app-head">
          <div className="fri-app-head-mobile">
            <Link href="/experiment/fri" className="fri-mark" aria-label={t.experimentFreeDemo.backToSite}>
              Spark
            </Link>
            <span className="fri-tag">{t.experimentFree.hero.demoNote}</span>
          </div>
          {data.currentStep && (
            <p className="fri-head-step">
              <span className="fri-mono fri-muted">
                {t.journeyPage.stepLabel} {String(data.currentStep.number).padStart(2, "0")} / {data.currentStep.total}
              </span>
              <span>{data.currentStep.title}</span>
            </p>
          )}
          <div className="fri-head-right">
            <span className="fri-head-score">
              <span className="num">{data.score.total}</span>
              <span className="fri-muted">{t.score.levels[level.key].name}</span>
              {data.score.delta !== 0 && (
                <span className="fri-mono" style={{ color: data.score.delta < 0 ? "var(--signal-ink)" : "var(--ink)" }}>
                  {data.score.delta > 0 ? "+" : "−"}
                  {Math.abs(data.score.delta)}
                </span>
              )}
            </span>
            {langSwitch}
          </div>
        </header>
        <nav className="fri-mobile-nav" aria-label={t.experimentFreeDemo.navLabel}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="fri-demo-main">{children}</main>
      </div>
    </div>
  );
}
