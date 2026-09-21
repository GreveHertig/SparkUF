"use client";

import { Card } from "@/components/ui/Card";
import { SourceTag } from "@/components/ui/SourceTag";
import { Sparkline } from "@/components/ui/Sparkline";
import { ScoreBadge } from "@/components/spark/ScoreBadge";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";

function toneClass(share: number): string {
  if (share >= 0.75) return "bg-score-green";
  if (share >= 0.45) return "bg-score-yellow";
  return "bg-score-red";
}

/**
 * Poängen som en egen kolumn (artefaktens `scorePanelHTML`): totalen med
 * nivå och rörelse överst, sedan alla åtta delar som staplar med källa, och
 * de låsta delarna sist. En del bär bara en `Källa` (inte flera
 * underlagsrader) — `SourceTag` visar det underlaget, ScorePanel hittar
 * inte på fler bevisrader per del.
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

  return (
    <Card title={title} right={<span className="font-numeric text-xs text-slate-500">/100</span>}>
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <ScoreBadge score={snapshot.total} size="large" />
          {history.length >= 2 && <Sparkline points={history} tone="accent" />}
        </div>
        {snapshot.delta !== 0 && (
          <p className="mt-1 text-sm font-semibold text-slate-900">
            <span className="font-numeric">
              {snapshot.delta > 0 ? "+" : "−"}
              {Math.abs(snapshot.delta)}
            </span>{" "}
            {snapshot.deltaReason}
          </p>
        )}
        <p className="font-numeric text-xs text-slate-500">
          {snapshot.previousTotal} → {snapshot.total}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {snapshot.parts.map((part) => {
          const share = part.weight > 0 ? part.points / part.weight : 0;
          return (
            <div key={part.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-700">{part.name}</span>
                <span className="font-numeric text-slate-900">
                  {part.points}
                  <span className="text-slate-400">/{part.weight}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-pill bg-slate-100">
                <div
                  className={cn("h-full rounded-pill", toneClass(share))}
                  style={{ width: `${Math.min(100, Math.round(share * 100))}%` }}
                />
              </div>
              <SourceTag source={part.source} dataType={part.dataType} />
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
