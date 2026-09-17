"use client";

import { cn } from "@/design/cn";
import { useI18n, type Locale } from "@/i18n/context";

const options: Locale[] = ["sv", "en"];

/** SV / EN-växeln i sidhuvudet. Översätter allt: gränssnitt, demoinnehåll, källetiketter. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.common.languageSwitch.label}
      className={cn(
        "inline-flex rounded-pill border border-slate-300 p-0.5 text-xs font-semibold uppercase",
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
            "rounded-pill px-2.5 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-accent",
            locale === option
              ? "bg-slate-900 text-paper-50"
              : "text-slate-500 hover:text-slate-800",
          )}
        >
          {t.common.languageSwitch[option]}
        </button>
      ))}
    </div>
  );
}
