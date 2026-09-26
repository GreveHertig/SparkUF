"use client";

/**
 * Totalpoängen moment för moment som en enkel linje på skalan 0-100.
 * Ritas ur datan; talen finns också som text för skärmläsare.
 */
export function ScoreHistory({ history }: { history: number[] }) {
  if (history.length === 0) return null;

  const width = 320;
  const height = 120;
  const pad = 6;
  const step = history.length > 1 ? (width - pad * 2) / (history.length - 1) : 0;
  const y = (value: number) => pad + (1 - value / 100) * (height - pad * 2);
  const points = history.map((value, index) => `${pad + index * step},${y(value)}`).join(" ");
  const last = history[history.length - 1];

  return (
    <figure className="fdd-history">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {[25, 50, 75].map((value) => (
          <line key={value} x1={0} x2={width} y1={y(value)} y2={y(value)} className="fdd-history__grid" />
        ))}
        <polyline points={points} className="fdd-history__line" vectorEffect="non-scaling-stroke" />
        <circle cx={pad + (history.length - 1) * step} cy={y(last)} r={4} className="fdd-history__dot" />
      </svg>
      <figcaption className="fd-sr-only">{history.join(", ")}</figcaption>
    </figure>
  );
}
