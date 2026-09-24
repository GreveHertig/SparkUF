"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useI18n, type Locale } from "@/i18n/context";

const LOCALES: readonly Locale[] = ["sv", "en"];

/** Onboardingens ram i kopian (= app/demo/start/layout.tsx), fri-stil. */
export default function FriDemoStartLayout({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="fri-start">
      <header className="fri-wrap fri-nav">
        <div className="fri-demo-brand">
          <Link href="/experiment/fri" className="fri-mark" aria-label={t.experimentFreeDemo.backToSite}>
            Spark
          </Link>
          <span className="fri-tag">{t.experimentFree.hero.demoNote}</span>
        </div>
        <div role="group" aria-label={t.experimentFree.nav.language} className="fri-lang">
          {LOCALES.map((option) => (
            <button key={option} type="button" aria-pressed={locale === option} onClick={() => setLocale(option)}>
              {option.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main className="fri-wrap fri-start-main">{children}</main>
    </div>
  );
}
