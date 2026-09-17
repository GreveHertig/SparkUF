"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { getScoreLevel } from "@/score/levels";
import { useI18n } from "@/i18n/context";
import { ScoreBadge } from "./ScoreBadge";

type VerdictCardProps = {
  score: number;
  /** Utslaget, t.ex. "Förfina · snäva segmentet". */
  headline: string;
  reasoning: string;
  className?: string;
};

/** Stor poäng + utslag (kör / förfina / pivotera) + motivering. */
export function VerdictCard({ score, headline, reasoning, className }: VerdictCardProps) {
  const { t } = useI18n();
  const level = getScoreLevel(score);

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-6", className)}>
      <Eyebrow>{t.score.levels[level.key].name}</Eyebrow>
      <div className="mt-3">
        <ScoreBadge score={score} size="large" />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-900">{headline}</p>
      <p className="mt-2 text-sm text-slate-600">{reasoning}</p>
    </div>
  );
}
