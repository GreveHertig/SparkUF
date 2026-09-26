// Fiktivt exempelunderlag för poängkortet på /. Poängen
// hårdkodas aldrig: exemplet bygger PartEvidence och låter calculateScore
// (core/score.ts) räkna fram båda lägena. Samma form som adapters/demo/sara.ts,
// men fristående så att experimentet inte binder sig till demots scenario.
import type { Källa, ScoreSnapshot } from "@/core/domain";
import {
  ALL_PART_IDS,
  calculateScore,
  type EvidenceItem,
  type PartEvidence,
  type ScorePartId,
} from "@/core/score";

export type ProofLabels = {
  parts: Record<ScorePartId, string>;
  sources: { profile: string; calls: string };
  deltaReason: string;
};

const CALCULATED_AT = "2026-09-14T09:00:00.000Z";

/** Kundsvaren om problemet, och hur många av dem som säger emot i det
 * motsagda läget. Panelen ritar samma antal som räknas. */
export const PROOF_ANSWER_COUNT = 6;
export const PROOF_CONTRADICTING_COUNT = 3;

function källa(namn: string, hämtad: string): Källa {
  return { namn, hämtad };
}

function answers(count: number, points: number, source: Källa, contradicts = false): EvidenceItem[] {
  return Array.from({ length: count }, () => ({
    points,
    source,
    dataType: "customer" as const,
    contradicts: contradicts || undefined,
  }));
}

function buildParts(labels: ProofLabels, contradicted: boolean): PartEvidence[] {
  const calls = källa(labels.sources.calls, "2026-09-12");
  // Sex kundsvar om problemet. I det motsagda läget säger tre av dem emot:
  // de räknas fortfarande, men med negativ vikt, och ett skevt underlag
  // (andel motsägelser över tröskeln) sänker hela delen.
  const confirming = PROOF_ANSWER_COUNT - PROOF_CONTRADICTING_COUNT;
  const problem = contradicted
    ? [...answers(confirming, 2.5, calls), ...answers(PROOF_CONTRADICTING_COUNT, -1, calls, true)]
    : answers(PROOF_ANSWER_COUNT, 2.5, calls);

  const items: Partial<Record<ScorePartId, EvidenceItem[]>> = {
    fit: [{ points: 8, source: källa(labels.sources.profile, "2026-09-02"), dataType: "customer" }],
    market: [{ points: 10, source: källa("SCB", "2026-09-04"), dataType: "register" }],
    competition: [{ points: 6, source: källa("Bolagsverket", "2026-09-04"), dataType: "register" }],
    problem,
    willingnessToPay: answers(3, 4, calls),
  };

  return ALL_PART_IDS.map((partId) => ({
    partId,
    label: labels.parts[partId],
    items: items[partId] ?? [],
  }));
}

/** Båda lägena i exemplet: före och efter att tre kunder säger emot. */
export function proofScores(labels: ProofLabels): { base: ScoreSnapshot; contradicted: ScoreSnapshot } {
  const base = calculateScore({
    phase: "tryAfterCalls",
    parts: buildParts(labels, false),
    calculatedAtIso: CALCULATED_AT,
  });
  const contradicted = calculateScore({
    phase: "tryAfterCalls",
    parts: buildParts(labels, true),
    previousTotal: base.total,
    deltaReason: labels.deltaReason,
    calculatedAtIso: CALCULATED_AT,
  });
  return { base, contradicted };
}
