/** Minimal klassnamnssammanslagning — ingen anledning att ta in en dependency för det. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
