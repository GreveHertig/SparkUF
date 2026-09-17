"use client";

import { cn } from "@/design/cn";
import { useI18n, type Locale } from "@/i18n/context";

const options: Locale[] = ["sv", "en"];

type LanguageSwitchProps = {
  className?: string;
  /** "dark" används på mörka ytor (sidomeny, hero, demorad) — se WCAG-notis i DESIGN.md. */
  tone?: "light" | "dark";
};

const wrapperTone = {
  light: "border-slate-300",
  dark: "border-slate-600",
} as const;

const inactiveTone = {
  light: "text-slate-600 hover:text-slate-900",
  dark: "text-slate-300 hover:text-paper-50",
} as const;

const activeTone = {
  light: "bg-accent-600 text-white",
  dark: "bg-accent-300 text-slate-900",
} as const;

const focusRingTone = {
  light: "focus-visible:outline-accent",
  dark: "focus-visible:outline-accent-300",
} as const;

/** SV / EN-växeln i sidhuvudet. Översätter allt: gränssnitt, demoinnehåll, källetiketter. */
export function LanguageSwitch({ className, tone = "light" }: LanguageSwitchProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.common.languageSwitch.label}
      className={cn(
        "inline-flex rounded-pill border p-0.5 text-xs font-semibold uppercase",
        wrapperTone[tone],
        className,
      )}
      style={{ letterSpacing: "var(--tracking-label)" }}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className={cn(
            "rounded-pill px-2.5 py-1 transition-colors focus-visible:outline-2",
            focusRingTone[tone],
            locale === option ? activeTone[tone] : inactiveTone[tone],
          )}
          style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
        >
          {t.common.languageSwitch[option]}
        </button>
      ))}
    </div>
  );
}
