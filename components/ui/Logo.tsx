import { cn } from "@/design/cn";

type LogoProps = {
  /** "light" = ljus logga för mörka ytor. "dark" = mörk logga för ljusa ytor. */
  tone?: "light" | "dark";
  className?: string;
  /** Höjd i px — bredden följer proportionellt via viewBox. */
  height?: number;
};

// TODO(logo): public/brand/spark-logo.png är den enda tillgångsvi har. Ingen
// vektorfil finns att spåra, så det här är ett handbyggt ordmärke: "SPARK" i
// Manrope Extra Bold med brett bokstavsavstånd, där K:s nedre ben klipps med
// en clip-path för att efterlikna originalets sneda avskärning. Ersätt med
// grundarnas original-SVG så snart den finns.
export function Logo({ tone = "dark", className, height = 20 }: LogoProps) {
  const fill = tone === "light" ? "var(--paper-50)" : "var(--ink-900)";

  return (
    <svg
      role="img"
      aria-label="Spark"
      viewBox="0 0 232 44"
      height={height}
      width={(232 / 44) * height}
      className={cn("shrink-0", className)}
    >
      <defs>
        <clipPath id="spark-logo-k-cut" clipPathUnits="userSpaceOnUse">
          <polygon points="182,2 228,2 228,30 218,38 182,38" />
        </clipPath>
      </defs>
      <text
        x="0"
        y="34"
        fontFamily="var(--font-sans)"
        fontWeight={800}
        fontSize="36"
        letterSpacing="5"
        fill={fill}
      >
        SPAR
      </text>
      <text
        x="182"
        y="34"
        fontFamily="var(--font-sans)"
        fontWeight={800}
        fontSize="36"
        letterSpacing="5"
        fill={fill}
        clipPath="url(#spark-logo-k-cut)"
      >
        K
      </text>
    </svg>
  );
}
