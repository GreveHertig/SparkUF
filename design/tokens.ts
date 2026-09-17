/**
 * Samma värden som design/tokens.css, typade för bruk i JS/SVG (t.ex. Recharts
 * eller inline-SVG som inte kan läsa CSS-variabler). Håll de två filerna i synk
 * för hand — det finns bara en handfull värden.
 */

export const slate = {
  50: "#f1f2f6",
  100: "#e6e8ee",
  200: "#d3d7e0",
  300: "#b3b9c8",
  400: "#8b93a8",
  500: "#6b7387",
  600: "#545b6e",
  700: "#414759",
  800: "#262b31",
  900: "#1b1f23",
  950: "#121417",
} as const;

export const accent = {
  50: "#f2f8ff",
  100: "#e2eefe",
  200: "#cfe3ff",
  300: "#a9cbfd",
  400: "#7eaefa",
  500: "#4f8bf0",
  600: "#366ad6",
  700: "#2952ab",
  800: "#203f83",
  900: "#1a3266",
} as const;

export const paper50 = slate[50];
export const ink800 = slate[800];
export const ink900 = slate[900];

export const scoreColors = {
  red: { fg: "#b3564a", bg: "#f3e4e1" },
  orange: { fg: "#b57a44", bg: "#f2e6d8" },
  yellow: { fg: "#a68a3d", bg: "#efe8d3" },
  green: { fg: "#4d8a6a", bg: "#dfeee6" },
  strong: { fg: slate[800], bg: accent[100], glow: accent[300] },
} as const;

export const dataTypeColors = {
  register: { fg: slate[700], bg: slate[100] },
  simulation: { fg: "#7a5ea8", bg: "#ece5f5" },
  customer: { fg: "#3d7a8a", bg: "#dfeef2" },
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
