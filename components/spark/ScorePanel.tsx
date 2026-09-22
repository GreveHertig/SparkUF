"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SourceTag } from "@/components/ui/SourceTag";
import { Sparkline } from "@/components/ui/Sparkline";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import type { ScoreSnapshot } from "@/core/domain";

function toneClass(share: number): string {
  if (share >= 0.75) return "bg-score-green";
  if (share >= 0.45) return "bg-score-yellow";
  return "bg-score-red";
}

const levelBarToneClasses = {
  red: "bg-score-red",
  orange: "bg-score-orange",
  yellow: "bg-score-yellow",
  green: "bg-score-green",
  strong: "bg-score-strong",
} as const;

/**
 * Poängen som en egen kolumn (artefaktens `scorePanelHTML`): totalen med
 * nivå och rörelse överst, sedan alla åtta delar som staplar med källa, och
 * de låsta delarna sist. En del bär bara en `Källa` (inte flera
 * underlagsrader) — `SourceTag` visar det underlaget bara på den utfällda
 * delen, inte på varje rad (grundarens uttryckliga instruktion).
 */
export function ScorePanel({
  snapshot,
  title,
  history = [],
}: {
  snapshot: ScoreSnapshot;
  title: string;
  /** Totalpoängen genom resan hittills — bara en genuin sekvens, aldrig en
   * påhittad form (samma regel som `KpiTile.trend`, se DESIGN.md). */
  history?: number[];
}) {
  const { t } = useI18n();
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const level = getScoreLevel(snapshot.total);
  const clamped = Math.min(100, Math.max(1, snapshot.total));

  return (
    <Card title={title}>
      <div className="flex flex-col items-center gap-1 border-b border-slate-100 pb-4 text-center">
        <div className="flex items-baseline gap-1">
          <span className="font-numeric text-5xl leading-none text-slate-900">{snapshot.total}</span>
          <span className="font-numeric text-sm text-slate-400">/100</span>
        </div>
        <p className="text-sm text-slate-900">{t.score.levels[level.key].name}</p>
        {snapshot.delta !== 0 && (
          <p className="font-numeric text-xs text-score-green">
            {snapshot.delta > 0 ? "+" : "−"}
            {Math.abs(snapshot.delta)} {snapshot.deltaReason}
          </p>
        )}
        {history.length >= 2 && (
          <div className="mt-1">
            <Sparkline points={history} tone="accent" />
          </div>
        )}
        <div className="mt-3 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-slate-100">
            <div
              className={cn("h-full rounded-pill", levelBarToneClasses[level.tone])}
              style={{ width: `${clamped}%` }}
            />
          </div>
          <div className="font-numeric mt-1 flex justify-between text-[10px] text-slate-400">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col">
        {snapshot.parts.map((part) => {
          const share = part.weight > 0 ? part.points / part.weight : 0;
          const expanded = expandedPart === part.name;
          return (
            <div key={part.name} className="border-b border-slate-100 py-1.5 last:border-b-0">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedPart(expanded ? null : part.name)}
                className="flex w-full flex-col gap-1.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50"
                style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
              >
                <span className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700">{part.name}</span>
                  <span className="font-numeric text-slate-900">
                    {part.points}
                    <span className="text-slate-400">/{part.weight}</span>
                  </span>
                </span>
                <span className="h-1 w-16 overflow-hidden rounded-pill bg-slate-100">
                  <span
                    className={cn("block h-full rounded-pill", toneClass(share))}
                    style={{ width: `${Math.min(100, Math.round(share * 100))}%` }}
                  />
                </span>
              </button>
              {expanded && (
                <div className="px-1 pt-1">
                  <SourceTag source={part.source} dataType={part.dataType} />
                </div>
              )}
            </div>
          );
        })}

        {snapshot.lockedParts.map((part) => (
          <div
            key={part.name}
            className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-sm text-slate-400"
          >
            <span className="flex items-center gap-1.5">
              <LockIcon />
              {part.name}
            </span>
            <span className="text-xs">
              {t.homePage.unlocksAfterStepBefore} {part.unlocksAfterStep}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
