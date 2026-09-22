"use client";

import { cn } from "@/design/cn";
import { getScoreLevel } from "@/score/levels";
import { useI18n } from "@/i18n/context";

type ScoreBadgeProps = {
  score: number;
  size?: "compact" | "large";
  className?: string;
};

const toneClasses = {
  red: "bg-score-red-bg text-score-red",
  orange: "bg-score-orange-bg text-score-orange",
  yellow: "bg-score-yellow-bg text-score-yellow",
  green: "bg-score-green-bg text-score-green",
  strong:
    "bg-score-strong-bg text-score-strong ring-1 ring-inset ring-score-strong-glow",
} as const;

/**
 * Poäng med nivåfärg. Kompakt i sidhuvud, stor på Hem och Poäng.
 *
 * Renderar talet direkt utan en egen räkneanimation: en tidigare
 * count-up-animation (Framer Motion, `count.set(1)` → `animate(...)` vid
 * varje montering) kunde visa ett annat tal än en samtidigt monterad,
 * icke-animerade `ScoreRing` i sidhuvudet under de ~900 ms animationen
 * pågick — en produkt vars löfte är att siffror är sanna får aldrig visa
 * två olika tal för samma poäng samtidigt (docs/status.md). Borttaget i
 * stället för att bygga delad state mellan instanser.
 */
export function ScoreBadge({ score, size = "compact", className }: ScoreBadgeProps) {
  const { t } = useI18n();
  const level = getScoreLevel(score);
  const clamped = Math.min(100, Math.max(1, score));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill",
        toneClasses[level.tone],
        size === "large" ? "px-4 py-2 text-4xl" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <span className="font-numeric inline-flex items-baseline gap-2">
        <span>{clamped}</span>
        <span
          className={cn("font-medium opacity-70", size === "large" ? "text-lg" : "text-xs")}
        >
          / 100
        </span>
      </span>
      {size === "large" && (
        <span
          className="ml-2 text-sm font-semibold uppercase"
          style={{ letterSpacing: "var(--tracking-label)" }}
        >
          {t.score.levels[level.key].name}
        </span>
      )}
    </span>
  );
}
