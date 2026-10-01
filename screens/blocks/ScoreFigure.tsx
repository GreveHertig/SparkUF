"use client";

import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import type { ScoreSnapshot } from "@/core/domain";

/**
 * Poängens byggstenar, delade av Hem (`screens/AppHome.tsx`), Poäng
 * (`screens/Score.tsx`) och demots Resan-steg (via `DemoBlocks.tsx`). Flyttade
 * hit i PR 4 (docs/plan-en-design.md) från `app/demo/_components/DemoBlocks.tsx`,
 * så att dubbletten som PR 3 lade i `screens/AppHome.tsx` kunde tas bort.
 * Ligger under `screens/` och tar bara typer från `core/` — portregeln gäller.
 */

// Samma nivåtoner som ScoreBadge.
export const levelTone = {
  red: "bg-score-red-bg text-score-red",
  orange: "bg-score-orange-bg text-score-orange",
  yellow: "bg-score-yellow-bg text-score-yellow",
  green: "bg-score-green-bg text-score-green",
  strong: "bg-score-strong-bg text-score-strong",
} as const;

/** "+11" / "−3" / "0". Minustecknet är ett riktigt minus. */
export function formatDelta(delta: number): string {
  if (delta === 0) return "0";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

/** Poängen som stort tal, "av 100" och nivån. */
export function ScoreFigure({ snapshot, size = "large" }: { snapshot: ScoreSnapshot; size?: "large" | "medium" }) {
  const { t } = useI18n();
  const level = getScoreLevel(snapshot.total);

  return (
    <div className={cn("fdd-figure", size === "medium" && "fdd-figure--medium")}>
      <p className="fd-proof__number">
        <span key={snapshot.total} className="fd-recount">
          {snapshot.total}
        </span>
        <span className="fd-proof__outof">{t.site.proof.outOf}</span>
      </p>
      <span className={cn("fd-level", levelTone[level.tone])}>{t.score.levels[level.key].name}</span>
    </div>
  );
}

/** Poängrörelsen sedan förra momentet, med skälet. Inget visas vid 0. */
export function ScoreDelta({ snapshot }: { snapshot: ScoreSnapshot }) {
  if (snapshot.delta === 0) return null;
  return (
    <p className="fdd-delta">
      <span className={snapshot.delta > 0 ? "fdd-delta__up" : "fdd-delta__down"}>{formatDelta(snapshot.delta)}</span>
      {snapshot.deltaReason && <> {snapshot.deltaReason}</>}
    </p>
  );
}
