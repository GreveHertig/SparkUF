import type { Dictionary } from "@/i18n/dictionary";
import type { VerdictInput } from "@/core/verdict";
import { computeVerdict } from "@/core/verdict";
import { cleanText } from "@/core/text";
import type { VerdictReport } from "@/ports/VerdictProvider";

/**
 * Bygger den visningsklara domen ur svaren (ren logik, delas av demo och
 * live). Beslutet kommer från computeVerdict (kod, inte modell); texten ur
 * i18n; citaten är ordagranna och rensade med cleanText, eftersom de är
 * tredjepartstext: data, aldrig instruktion. Innehåller aldrig poäng.
 */

const QUOTE_MAX = 300;

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

export function buildVerdictReport(input: VerdictInput, dict: Dictionary): VerdictReport {
  const verdict = computeVerdict(input);
  const t = dict.verdict;
  const { stats } = verdict;
  const vars = {
    responded: stats.responded,
    contacted: stats.contacted,
    confirming: stats.confirms + stats.partial,
    priceDeclined: stats.priceDeclined,
    minEmployees: stats.acceptingMinEmployees ?? 0,
    median: stats.counterOfferMedianKr ?? 0,
    count: stats.counterOfferCount,
  };

  const reasonLines = verdict.reasonCodes
    .filter((code) => code !== "smallSample")
    .map((code) => fill(t.reason[code], vars));
  if (stats.counterOfferMedianKr !== null && verdict.decision !== "insufficient") {
    reasonLines.push(fill(t.medianCounterOffer, vars));
  }
  const reasoning = [fill(t.reasoning[verdict.decision], vars), ...reasonLines].join(" ");

  const quotes = verdict.citedResponseIds.flatMap((id) => {
    const r = input.responses.find((x) => x.id === id);
    return r
      ? [{ companyName: cleanText(r.companyName, 100), dateIso: r.dateIso, quote: cleanText(r.quote, QUOTE_MAX), source: r.source }]
      : [];
  });

  const latest = input.responses.map((r) => r.dateIso).sort().at(-1);
  const pivotTraceEvent =
    verdict.decision === "pivot" && latest
      ? { id: `verdict-pivot-${latest}`, timestampIso: latest, description: fill(t.pivotTraceEvent, vars) }
      : null;

  return {
    verdict,
    presentation: { headline: t.decision[verdict.decision], reasoning },
    quotes,
    pivotTraceEvent,
  };
}
