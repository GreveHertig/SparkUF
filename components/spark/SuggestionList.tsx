"use client";

import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { ScoreSuggestion } from "@/core/score";

const gapToneClasses = {
  insufficient: "bg-slate-100 text-slate-600",
  contradicting: "bg-warn-soft text-warn",
  structural: "bg-warn-soft text-warn",
} as const;

/**
 * "Höj din poäng" (7.6) — artefaktens `.sugggrid`: ett rutnät av kort (inte
 * rader), en tunn "rutnätslinje" mellan cellerna i stället för att varje
 * kort bär sin egen kant/skugga ovanpå den kortyta som redan omger hela
 * listan (`Card` hos anroparen) — det var just den dubbla kantlinjen
 * grundaren pekade ut. Extraherad ur `screens/Score.tsx` så att Hem
 * (artefaktens `vyHem`) och Poäng visar samma korttyp.
 */
export function SuggestionList({ suggestions }: { suggestions: ScoreSuggestion[] }) {
  const { t } = useI18n();
  // Rutnätslinjen (gap + bakgrundsfärg som lyser igenom) kräver att sista
  // raden är fylld, annars syns den tomma cellen som en hel grå ruta i
  // stället för en tunn linje — fyllnadsceller (osynliga, bara på ≥sm där
  // griden faktiskt är tre kolumner) täcker mellanrummet.
  const fillerCount = suggestions.length % 3 === 0 ? 0 : 3 - (suggestions.length % 3);

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm bg-slate-200 sm:grid-cols-3">
      {suggestions.map((suggestion) => (
        <div key={suggestion.partId} className="flex flex-col bg-white p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-numeric text-lg text-score-green">+{suggestion.pointsGain}</span>
            <span className="text-sm leading-snug text-slate-900">{suggestion.label}</span>
          </div>
          <p className="mt-1.5 text-xs leading-snug text-slate-600">{suggestion.explanation}</p>
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3.5">
            <span className="rounded-pill bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              ~{suggestion.estimatedMinutes} {t.scorePage.estimatedMinutesUnit}
            </span>
            <span
              className={cn(
                "rounded-pill px-2 py-0.5 text-xs font-semibold uppercase",
                gapToneClasses[suggestion.gapType],
              )}
              style={{ letterSpacing: "var(--tracking-label)" }}
            >
              {t.scorePage.gapType[suggestion.gapType]}
            </span>
            <button
              type="button"
              className="ml-auto shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-accent"
              style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
            >
              {suggestion.actionLabel}
            </button>
          </div>
        </div>
      ))}
      {Array.from({ length: fillerCount }).map((_, index) => (
        <div key={`filler-${index}`} aria-hidden="true" className="hidden bg-white sm:block" />
      ))}
    </div>
  );
}
