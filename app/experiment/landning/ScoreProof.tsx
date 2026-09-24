"use client";

import { useId, useMemo, useState } from "react";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import { exampleScores } from "./exampleEvidence";

// Samma nivåtoner som ScoreBadge, men bara nivånamnet: talet visas redan
// stort bredvid, och två tal för samma poäng vore en upprepning.
const levelTone = {
  red: "bg-score-red-bg text-score-red",
  orange: "bg-score-orange-bg text-score-orange",
  yellow: "bg-score-yellow-bg text-score-yellow",
  green: "bg-score-green-bg text-score-green",
  strong: "bg-score-strong-bg text-score-strong",
} as const;

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

/**
 * Poängkortet i hero: ett fiktivt exempel där besökaren själv slår på att tre
 * kunder säger emot, och ser poängen räknas om av calculateScore och sjunka.
 */
export function ScoreProof({ className }: { className?: string }) {
  const { t } = useI18n();
  const copy = t.experimentLanding.proof;
  const [contradicted, setContradicted] = useState(false);
  // Räknas upp vid varje omräkning. Används som key så att talen monteras om
  // och får omräkningsrörelsen, men bara efter en faktisk ändring.
  const [recounts, setRecounts] = useState(0);
  const switchId = useId();
  const hintId = useId();

  const scores = useMemo(
    () =>
      exampleScores({
        parts: t.score.parts,
        sources: copy.sources,
        deltaReason: copy.deltaReason,
      }),
    [t.score.parts, copy.sources, copy.deltaReason],
  );

  const snapshot = contradicted ? scores.contradicted : scores.base;
  const level = getScoreLevel(snapshot.total);
  const changed = recounts > 0;

  function toggle() {
    setContradicted((value) => !value);
    setRecounts((value) => value + 1);
  }

  return (
    <section
      id="exempel"
      aria-label={`${copy.label}: ${copy.idea}`}
      className={cn(
        "scroll-mt-24 rounded-[var(--r-lg)] border border-slate-200 bg-white p-5 shadow-[var(--shadow-lift)] sm:p-7",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm leading-snug text-slate-600">
          <span className="text-slate-900">{copy.label}</span>
          <span aria-hidden="true"> · </span>
          {copy.idea}
        </p>
        <DemoDataBadge />
      </div>

      <div className="mt-6 flex items-end gap-5" aria-live="polite" aria-atomic="true">
        <p className="flex flex-col">
          <span className="text-sm text-slate-600">{copy.scoreLabel}</span>
          <span
            key={`total-${recounts}`}
            className={cn(
              "font-numeric text-[5.25rem] leading-[0.9] tracking-[-0.035em] text-ink-900 sm:text-[6rem]",
              changed && "xl-recount",
            )}
          >
            {snapshot.total}
          </span>
        </p>
        <div className="flex min-w-0 flex-col items-start gap-2 pb-2">
          <span
            key={`level-${recounts}`}
            className={cn(
              "rounded-pill px-2.5 py-1 text-sm",
              levelTone[level.tone],
              changed && "xl-recount",
            )}
          >
            {t.score.levels[level.key].name}
          </span>
          {snapshot.delta !== 0 && (
            <span key={`delta-${recounts}`} className="xl-recount text-sm text-score-red">
              <span className="font-numeric">−{Math.abs(snapshot.delta)}</span> {snapshot.deltaReason}
            </span>
          )}
        </div>
      </div>

      <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        {snapshot.parts.map((part, index) => {
          const before = scores.base.parts[index];
          const moved = contradicted && before.points !== part.points;
          return (
            <div
              key={part.name}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_4.75rem]"
            >
              <dt className="text-[0.95rem] text-slate-900">{part.name}</dt>
              <dd className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <SourceTag source={part.source} dataType={part.dataType} />
              </dd>
              <dd
                key={`${part.name}-${recounts}`}
                className={cn(
                  "font-numeric col-start-2 row-start-1 whitespace-nowrap text-right text-[0.95rem] sm:col-start-3",
                  moved ? "text-score-red" : "text-slate-700",
                  changed && before.points !== scores.contradicted.parts[index].points && "xl-recount",
                )}
              >
                {fill(copy.partPoints, { points: part.points, weight: part.weight })}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs text-slate-600">
        {fill(copy.lockedTemplate, { count: snapshot.lockedParts.length })}
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-[var(--r-md)] bg-slate-50 px-4 py-3.5">
        <label htmlFor={switchId} className="cursor-pointer">
          <span className="block text-[0.95rem] text-slate-900">{copy.toggleLabel}</span>
          <span id={hintId} className="block text-xs text-slate-600">
            {copy.toggleHint}
          </span>
        </label>
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={contradicted}
          aria-describedby={hintId}
          onClick={toggle}
          className={cn(
            "xl-switch relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill p-1",
            contradicted ? "bg-navy" : "bg-slate-500",
          )}
        >
          <span className="xl-switch-thumb block size-5 rounded-pill bg-white shadow-[var(--shadow-soft)]" />
        </button>
      </div>
    </section>
  );
}
