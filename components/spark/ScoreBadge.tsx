"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/design/cn";
import { motion as motionTokens } from "@/design/tokens";
import { getScoreLevel } from "@/score/levels";
import { useI18n } from "@/i18n/context";
import { usePrefersReducedMotion } from "@/design/usePrefersReducedMotion";

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

/** Poäng med nivåfärg. Kompakt i sidhuvud, stor på Hem och Poäng. Animerad räkning. */
export function ScoreBadge({ score, size = "compact", className }: ScoreBadgeProps) {
  const { t } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const level = getScoreLevel(score);
  const clamped = Math.min(100, Math.max(1, score));

  const count = useMotionValue(clamped);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (reducedMotion) {
      count.set(clamped);
      return;
    }
    count.set(1);
    const controls = animate(count, clamped, {
      duration: motionTokens.count / 1000,
      ease: motionTokens.easeStandard,
    });
    return () => controls.stop();
  }, [clamped, reducedMotion, count]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill font-bold",
        toneClasses[level.tone],
        size === "large" ? "px-4 py-2 text-4xl" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <span className="font-numeric inline-flex items-baseline gap-2">
        <motion.span>{rounded}</motion.span>
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
