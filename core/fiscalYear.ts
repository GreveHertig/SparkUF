/**
 * Räkenskapsåret en omsättningssiffra avser (PR 8, docs/plan-en-design.md).
 * En omsättning utan år är ett påstående utan datum: skärmarna visar den bara
 * tillsammans med året, eller med spannet av år när siffran (som en median)
 * bygger på flera bolag med olika räkenskapsår. Saknas året visas luckan.
 */
export type FiscalYearSpan = { from: number; to: number };

/** Spannet som en uppsättning räkenskapsår täcker, eller `null` utan år. */
export function fiscalYearSpanOf(years: readonly number[]): FiscalYearSpan | null {
  const valid = years.filter((year) => Number.isInteger(year) && year > 0);
  if (valid.length === 0) return null;
  return { from: Math.min(...valid), to: Math.max(...valid) };
}

/** "2024" för ett år, "2023–2024" för ett spann. */
export function formatFiscalYearSpan(span: FiscalYearSpan): string {
  return span.from === span.to ? String(span.from) : `${span.from}–${span.to}`;
}
