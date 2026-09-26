/**
 * SCB:s storleksklasser för antal anställda. Demot visar klassen, inte det
 * exakta antalet: registret ger storleksklasser (docs/buggar-2026-09.md punkt 13).
 */
export const SIZE_CLASSES = [
  { key: "oneToFour", min: 1, max: 4, range: "1–4" },
  { key: "fiveToNine", min: 5, max: 9, range: "5–9" },
  { key: "tenToNineteen", min: 10, max: 19, range: "10–19" },
  { key: "twentyToFortyNine", min: 20, max: 49, range: "20–49" },
  { key: "fiftyPlus", min: 50, max: Infinity, range: "50+" },
] as const;

export type SizeClass = (typeof SIZE_CLASSES)[number];

/** Klassen ett antal anställda hör till, eller null för 0 och ogiltiga tal. */
export function sizeClassFor(employees: number): SizeClass | null {
  return SIZE_CLASSES.find((size) => employees >= size.min && employees <= size.max) ?? null;
}
