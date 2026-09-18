"use client";

import { DataFact } from "@/components/ui/DataFact";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";

export type ScoreData = {
  snapshot: ScoreSnapshot;
  suggestions: ScoreSuggestion[];
};

/** Poäng (avsnitt 6, 7.6): de åtta delarna med nedbrytning, källor och
 * "Höj din poäng", sorterat efter poäng per minut. */
export function Score({ data }: { data: ScoreData }) {
  const { t } = useI18n();
  const { snapshot, suggestions } = data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12">
      <div>
        <Eyebrow>{t.appShell.nav.score}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.scorePage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.scorePage.subtitle}</p>
      </div>

      <div className="flex items-center gap-6 rounded-lg border border-slate-200 bg-white p-6">
        <ScoreBadge score={snapshot.total} size="large" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {snapshot.delta > 0 ? "+" : "−"}
            {Math.abs(snapshot.delta)} {snapshot.deltaReason}
          </p>
          <p className="text-xs text-slate-600">
            {snapshot.previousTotal} → {snapshot.total}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <Eyebrow>{t.scorePage.breakdownTitle}</Eyebrow>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.parts.map((part) => (
            <div key={part.name} className="rounded-lg border border-slate-200 bg-white p-5">
              <DataFact
                label={part.name}
                value={part.points}
                unit={`/ ${part.weight}`}
                source={part.source}
                dataType={part.dataType}
              />
            </div>
          ))}
          {snapshot.lockedParts.map((part) => (
            <LockedState
              key={part.name}
              unlockHint={`${t.homePage.unlocksAfterStepBefore} ${part.unlocksAfterStep}`}
            >
              <p className="text-sm font-medium">{part.name}</p>
            </LockedState>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Eyebrow>{t.scorePage.suggestionsTitle}</Eyebrow>
        <div className="flex flex-col gap-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.partId}
              className={cn("flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between")}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-pill bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600"
                    style={{ letterSpacing: "var(--tracking-label)" }}
                  >
                    {t.scorePage.gapType[suggestion.gapType]}
                  </span>
                  <span className="text-xs text-slate-500">
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
                className="shrink-0 rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 focus-visible:outline-2 focus-visible:outline-accent"
              >
                {suggestion.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
