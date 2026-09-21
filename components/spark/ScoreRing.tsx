import { cn } from "@/design/cn";
import { getScoreLevel } from "@/score/levels";

type ScoreRingProps = {
  score: number;
  /** Ringens diameter i px (artefaktens sidhuvud: 34). */
  size?: number;
  className?: string;
};

const strokeToneClasses = {
  red: "stroke-score-red",
  orange: "stroke-score-orange",
  yellow: "stroke-score-yellow",
  green: "stroke-score-green",
  strong: "stroke-score-strong",
} as const;

/**
 * Sidhuvudets poängvisning (artefaktens `.ring`): en tunn cirkel med talet i,
 * inte en fylld pill — det var ScoreBadges tonade bakgrundsyta som var det
 * "beigea blocket" grundaren bad om att ta bort. Bara kompakt storlek; den
 * stora poängpanelen (ScorePanel) bygger sitt eget stora tal, ingen ring.
 */
export function ScoreRing({ score, size = 34, className }: ScoreRingProps) {
  const level = getScoreLevel(score);
  const clamped = Math.min(100, Math.max(1, score));
  const radius = size / 2 - size * 0.088;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--hair-2)" strokeWidth={size * 0.1} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={size * 0.1}
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
          className={strokeToneClasses[level.tone]}
          style={{
            transition: `stroke-dashoffset var(--motion-count) var(--ease-out)`,
          }}
        />
      </svg>
      <span className="font-numeric absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-900">
        {clamped}
      </span>
    </span>
  );
}
