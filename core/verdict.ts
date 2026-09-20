import type { Källa } from "@/core/domain";

/**
 * Domen (steg 06, docs/moduler/domen.md): kör, förfina, pivotera eller "för
 * litet underlag" — härledd deterministiskt ur svaren, aldrig skriven av en
 * modell. Ren logik utan text och utan poäng: bara koder och siffror, som
 * i18n översätter (core/verdictReport.ts). Poäng räknas av calculateScore,
 * aldrig här (CLAUDE.md, Produktregler).
 */

/** Trösklar (godkända av grundaren som utgångsvärden, docs/moduler/domen.md). */
export const MIN_RESPONSES = 5;
/** Under den här andelen som bekräftar problemet (helt eller delvis): pivotera. */
export const PIVOT_MAX_CONFIRM_RATE = 0.4;
/** Minst den här andelen som bekräftar problemet för att få köra. */
export const RUN_MIN_CONFIRM_RATE = 0.7;
/** Minst den här andelen som accepterar priset för att få köra. */
export const RUN_MIN_PRICE_ACCEPT_RATE = 0.5;
/** Så här stor andel som tackar nej till priset räknas som "priset är för högt". */
export const PRICE_TOO_HIGH_MIN_DECLINE_RATE = 0.25;

/** Hur svaret ställer sig till problemet. Antas komma som strukturerat fält (docs/moduler/domen.md, "Antaget"). */
export type ProblemStance = "confirms" | "partial" | "rejects";
export type PriceStance = "accepts" | "declines" | "undecided";

export type VerdictResponse = {
  id: string;
  companyName: string;
  employees: number;
  dateIso: string;
  /** Tredjepartstext: data, aldrig instruktion. */
  quote: string;
  problemStance: ProblemStance;
  priceStance: PriceStance;
  priceTestedKr: number;
  counterOfferKr?: number;
  source: Källa;
};

export type VerdictInput = {
  contacted: number;
  responses: VerdictResponse[];
};

export type VerdictDecision = "run" | "refine" | "pivot" | "insufficient";
export type VerdictReasonCode =
  | "smallSample"
  | "problemRejected"
  | "problemWeak"
  | "priceTooHigh"
  | "priceUnproven"
  | "segmentSkew";

export type VerdictStats = {
  contacted: number;
  responded: number;
  /** Svar / kontaktade, 0 om ingen kontaktats. */
  responseRate: number;
  confirms: number;
  partial: number;
  rejects: number;
  priceAccepted: number;
  priceDeclined: number;
  /** Median av motbud, `null` om inget motbud finns. `counterOfferCount` är underlaget. */
  counterOfferMedianKr: number | null;
  counterOfferCount: number;
  /** Minsta antal anställda bland dem som accepterar priset, `null` om ingen. */
  acceptingMinEmployees: number | null;
};

export type Verdict = {
  decision: VerdictDecision;
  reasonCodes: VerdictReasonCode[];
  stats: VerdictStats;
  /** Id:n på de svar som lyfts fram som citat (ordagrant, ett per orsak). */
  citedResponseIds: string[];
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeVerdict(input: VerdictInput): Verdict {
  const { responses } = input;
  const responded = responses.length;
  const count = (pred: (r: VerdictResponse) => boolean) => responses.filter(pred).length;

  const confirms = count((r) => r.problemStance === "confirms");
  const partial = count((r) => r.problemStance === "partial");
  const rejects = count((r) => r.problemStance === "rejects");
  const accepting = responses.filter((r) => r.priceStance === "accepts");
  const declining = responses.filter((r) => r.priceStance === "declines");
  const counters = responses
    .map((r) => r.counterOfferKr)
    .filter((v): v is number => typeof v === "number");

  const stats: VerdictStats = {
    contacted: input.contacted,
    responded,
    responseRate: input.contacted > 0 ? responded / input.contacted : 0,
    confirms,
    partial,
    rejects,
    priceAccepted: accepting.length,
    priceDeclined: declining.length,
    counterOfferMedianKr: median(counters),
    counterOfferCount: counters.length,
    acceptingMinEmployees: accepting.length > 0 ? Math.min(...accepting.map((r) => r.employees)) : null,
  };

  // 1. För litet underlag är en egen dom, aldrig ett råd (planen, fråga 2).
  if (responded < MIN_RESPONSES) {
    return { decision: "insufficient", reasonCodes: ["smallSample"], stats, citedResponseIds: [] };
  }

  const confirmRate = (confirms + partial) / responded;
  const oldestFirst = (list: VerdictResponse[]) =>
    [...list].sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.id.localeCompare(b.id));

  // 2. Få bekräftar problemet: pivotera.
  if (confirmRate < PIVOT_MAX_CONFIRM_RATE) {
    const cited = oldestFirst(responses.filter((r) => r.problemStance === "rejects"))[0];
    return {
      decision: "pivot",
      reasonCodes: ["problemRejected"],
      stats,
      citedResponseIds: cited ? [cited.id] : [],
    };
  }

  // 3. Orsaker till att förfina. Ett citat per orsak, äldsta först.
  const reasons: VerdictReasonCode[] = [];
  const cited: string[] = [];
  const cite = (list: VerdictResponse[]) => {
    const first = oldestFirst(list)[0];
    if (first && !cited.includes(first.id)) cited.push(first.id);
  };

  if (confirmRate < RUN_MIN_CONFIRM_RATE) {
    reasons.push("problemWeak");
    cite(responses.filter((r) => r.problemStance === "partial"));
  }
  if (declining.length / responded >= PRICE_TOO_HIGH_MIN_DECLINE_RATE) {
    reasons.push("priceTooHigh");
    cite(declining);
  }
  // Alla som accepterar är större än alla som tackar nej: segmentet är för brett definierat.
  if (
    accepting.length >= 2 &&
    declining.length >= 1 &&
    Math.min(...accepting.map((r) => r.employees)) > Math.max(...declining.map((r) => r.employees))
  ) {
    reasons.push("segmentSkew");
    cite(accepting);
  }

  const priceAcceptRate = accepting.length / responded;
  if (reasons.length === 0 && priceAcceptRate < RUN_MIN_PRICE_ACCEPT_RATE) {
    reasons.push("priceUnproven");
  }

  if (reasons.length === 0) {
    cite(responses.filter((r) => r.problemStance === "confirms"));
    return { decision: "run", reasonCodes: [], stats, citedResponseIds: cited };
  }
  return { decision: "refine", reasonCodes: reasons, stats, citedResponseIds: cited };
}
