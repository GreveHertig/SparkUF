import { cn } from "@/design/cn";

type SparklineProps = {
  /** Kronologisk punktserie, minst 2 punkter för att rita en linje. */
  points: number[];
  tone?: "accent" | "neutral" | "positive" | "negative";
  width?: number;
  height?: number;
  className?: string;
};

const toneStroke = {
  accent: "var(--accent-600)",
  neutral: "var(--slate-400)",
  positive: "var(--score-green)",
  negative: "var(--score-red)",
} as const;

const toneFill = {
  accent: "var(--accent-200)",
  neutral: "var(--slate-200)",
  positive: "var(--score-green-bg)",
  negative: "var(--score-red-bg)",
} as const;

/**
 * Minimal inline-SVG-sparkline. Ingen egen dependency (recharts är inte
 * motiverat för en 60×20px-linje) — se DESIGN.md. Renderar ingenting om
 * färre än två punkter finns, i stället för att gissa en form.
 */
export function Sparkline({ points, tone = "accent", width = 64, height = 20, className }: SparklineProps) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const padY = 2;

  const coords = points.map((value, index) => {
    const x = index * stepX;
    const y = padY + (1 - (value - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      role="img"
      aria-hidden="true"
    >
      <path d={areaPath} fill={toneFill[tone]} />
      <path d={linePath} fill="none" stroke={toneStroke[tone]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
