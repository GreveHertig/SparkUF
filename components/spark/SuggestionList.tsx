"use client";

import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { ScoreSuggestion } from "@/core/score";

/**
 * "Höj din poäng" (7.6), sorterat efter poäng per minut — extraherad ur
 * `screens/Score.tsx` så att Hem (artefaktens `vyHem`) och Poäng kan visa
 * samma korttyp i stället för varsin uppfinning.
 */
export function SuggestionList({ suggestions }: { suggestions: ScoreSuggestion[] }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.partId}
          className={cn(
            "flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 leading-snug shadow-lg sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-pill bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600"
                style={{ letterSpacing: "var(--tracking-label)" }}
              >
                {t.scorePage.gapType[suggestion.gapType]}
              </span>
              <span className="font-numeric text-xs text-slate-500">
                {suggestion.pointsGain > 0
                  ? `+${suggestion.pointsGain} · ${suggestion.pointsPerMinute.toFixed(2)} ${t.scorePage.pointsPerMinuteUnit}`
                  : null}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{suggestion.label}</p>
            <p className="mt-1 text-sm text-slate-600">{suggestion.explanation}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent"
            style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
          >
            {suggestion.actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
}
