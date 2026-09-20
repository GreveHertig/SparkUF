/**
 * Samma värden som design/tokens.css, typade för bruk i JS/SVG (t.ex.
 * inline-SVG som inte kan läsa CSS-variabler — se components/ui/Sparkline.tsx).
 * Håll de två filerna i synk för hand — det finns bara en handfull värden.
 * Källa: design-referens/artefakt/TOKENS.md (tokenbyte 2026-09-20), se
 * DESIGN.md och kommentarerna i tokens.css för uträkningen.
 */

export const slate = {
  50: "#f4f6f8",
  100: "#ecf0f3",
  200: "#e4e9ee",
  300: "#c5ccd4",
  400: "#a6b0ba",
  500: "#8693a0",
  600: "#677686",
  700: "#4a5c6e",
  800: "#143253",
  900: "#0e2033",
  950: "#080e13",
} as const;

export const accent = {
  50: "#f0f6fc",
  100: "#dfecf9",
  200: "#c4dbf5",
  300: "#99c0ed",
  400: "#5999e2",
  500: "#2d7eda",
  600: "#0b69d4",
  700: "#0956ae",
  800: "#074388",
  900: "#053266",
} as const;

export const paper50 = slate[50];
export const ink800 = slate[800];
export const ink900 = slate[900];

// Mörkade mot en första instinkt för att nå 4.5:1 kontrast mot respektive
// -bg (kontrollerat mot WCAG AA, se DESIGN.md). Håll i synk med tokens.css.
export const scoreColors = {
  red: { fg: "#a14d43", bg: "#f3e4e1" },
  orange: { fg: "#895c33", bg: "#f2e6d8" },
  yellow: { fg: "#79652d", bg: "#efe8d3" },
  green: { fg: "#3e7056", bg: "#dfeee6" },
  strong: { fg: slate[800], bg: accent[100], glow: accent[300] },
} as const;

export const dataTypeColors = {
  register: { fg: slate[700], bg: slate[100] },
  simulation: { fg: "#7558a3", bg: "#ece5f5" },
  customer: { fg: "#38717f", bg: "#dfeef2" },
} as const;

export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
  24: "6rem",
  32: "8rem",
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.625rem",
  lg: "1rem",
  pill: "999px",
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  count: 900,
  easeStandard: [0.4, 0, 0.2, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
};

export type DataType = keyof typeof dataTypeColors;
export type ScoreTone = keyof typeof scoreColors;
