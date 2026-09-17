import { cn } from "@/design/cn";

type LogoProps = {
  /** "light" = ljus logga för mörka ytor. "dark" = mörk logga för ljusa ytor. */
  tone?: "light" | "dark";
  className?: string;
  /** Höjd i px — bredden följer proportionellt av ordmärkets bildförhållande. */
  height?: number;
};

// Ordmärket spårat direkt ur public/brand/spark-logo.png med potrace (ingen
// vektorfil fanns — se TODO nedan). Ett tidigare försök att bygga bokstäverna
// som SVG-text + klippt K gav fel avstånd ("SPAR  K"); ett försök därefter att
// måla ut originalbilden via CSS mask-image visade sig opålitligt (rendrade
// som en oklippt rektangel i vissa miljöer). En inbäddad vektorpath har ingen
// extern bildresurs att misslyckas ladda och är pixel för pixel samma form
// som originalet. TODO(logo): ersätt med grundarnas original-SVG när den finns.
const WORDMARK_VIEWBOX = "0 0 240.99 39.84";
const WORDMARK_ASPECT_RATIO = 240.99 / 39.84;
const WORDMARK_TRANSFORM = "translate(-6.013301,46.845722) scale(0.1,-0.1)";
const WORDMARK_PATHS = [
  "M153 459 c-69 -20 -105 -107 -67 -164 19 -30 54 -42 146 -51 87 -8 108 -17 108 -48 0 -36 -34 -59 -93 -64 -42 -3 -61 1 -101 23 l-49 26 -21 -21 c-21 -21 -21 -21 -1 -37 70 -54 184 -69 261 -34 52 24 74 55 74 104 0 76 -36 101 -156 113 -38 3 -79 13 -92 21 -30 18 -26 53 8 71 32 16 121 9 152 -12 30 -21 41 -20 56 5 11 17 10 23 -10 39 -44 36 -145 49 -215 29z",
  "M565 448 c-3 -8 -4 -92 -3 -188 l3 -175 33 -3 32 -3 0 70 c0 67 1 71 24 77 14 3 30 3 35 -1 6 -3 44 -3 84 1 63 6 76 11 105 40 27 27 32 39 32 78 0 36 -6 52 -29 78 l-29 33 -141 3 c-112 3 -142 1 -146 -10z m265 -68 c11 -11 20 -27 20 -35 0 -8 -9 -24 -20 -35 -17 -17 -33 -20 -110 -20 l-90 0 0 48 c0 27 3 52 7 55 3 4 44 7 90 7 70 0 86 -3 103 -20z",
  "M1080 279 c-47 -101 -86 -186 -88 -191 -2 -4 14 -8 36 -8 37 0 41 3 52 34 14 43 23 46 121 46 43 0 79 3 79 6 0 3 -5 14 -10 25 -9 15 -22 19 -70 19 -32 0 -61 4 -64 9 -6 9 55 151 65 151 7 0 129 -264 129 -280 0 -5 18 -10 40 -10 32 0 38 3 33 16 -3 8 -40 93 -83 187 l-77 172 -39 3 -39 3 -85 -182z",
  "M1560 269 l0 -190 33 3 32 3 3 67 c3 75 8 79 72 71 35 -5 46 -12 68 -47 50 -78 72 -96 119 -96 41 0 43 1 43 30 0 24 -4 30 -21 30 -31 0 -57 17 -74 50 -20 38 -20 37 14 54 15 8 36 32 46 52 23 50 13 95 -31 133 l-35 31 -134 0 -135 0 0 -191z m260 111 c11 -11 20 -27 20 -35 0 -8 -9 -24 -20 -35 -17 -17 -33 -20 -105 -20 l-85 0 0 55 0 55 85 0 c72 0 88 -3 105 -20z",
  "M2077 453 c-4 -3 -7 -89 -7 -190 l0 -183 35 0 c31 0 39 7 90 75 30 41 57 75 60 75 3 0 23 -29 46 -65 23 -36 49 -70 59 -75 25 -13 110 -13 110 1 0 24 -22 49 -44 49 -26 0 -49 24 -95 98 l-33 52 54 73 c77 101 76 97 28 97 -40 0 -40 0 -138 -132 l-97 -132 -3 132 -3 132 -28 0 c-15 0 -31 -3 -34 -7z",
];

export function Logo({ tone = "dark", className, height = 20 }: LogoProps) {
  return (
    <svg
      role="img"
      aria-label="Spark"
      viewBox={WORDMARK_VIEWBOX}
      height={height}
      width={height * WORDMARK_ASPECT_RATIO}
      className={cn("shrink-0", tone === "light" ? "text-paper-50" : "text-ink-900", className)}
    >
      <g transform={WORDMARK_TRANSFORM} fill="currentColor" stroke="none">
        {WORDMARK_PATHS.map((d) => (
          <path key={d.slice(0, 12)} d={d} />
        ))}
      </g>
    </svg>
  );
}
