// calculateScore — ren funktion från strukturerad evidens till poäng
// (avsnitt 7.1). Sätts aldrig direkt i mockdata; varje scenario (idag
// adapters/demo/testScenario.ts, senare Sara/Jonas) bygger PartEvidence och
// låter den här filen räkna ut ScoreSnapshot. score/levels.ts (Session 1)
// äger bara den visuella tröskeltabellen (7.5) — den här filen äger
// själva beräkningen (7.2–7.4, 7.6).
import type { Källa, ScoreSnapshot, ScorePart, LockedScorePart } from "@/core/domain";
import type { DataType } from "@/design/tokens";

/** De åtta delarna (avsnitt 7.2). Vikterna summerar till 100. */
export type ScorePartId =
  | "market"
  | "competition"
  | "fit"
  | "problem"
  | "willingnessToPay"
  | "product"
  | "traction"
  | "feasibility";

export const ALL_PART_IDS: readonly ScorePartId[] = [
  "market",
  "competition",
  "fit",
  "problem",
  "willingnessToPay",
  "product",
  "traction",
  "feasibility",
];

export const SCORE_PART_WEIGHTS: Record<ScorePartId, number> = {
  market: 12,
  competition: 8,
  fit: 10,
  problem: 18,
  willingnessToPay: 18,
  product: 12,
  traction: 14,
  feasibility: 8,
};

/** De fem faserna och deras tak (avsnitt 7.3). */
export type PhaseId = "discover" | "tryBeforeCalls" | "tryAfterCalls" | "launch" | "grow";

export const PHASE_TOTAL_CAP: Record<PhaseId, number> = {
  discover: 18,
  tryBeforeCalls: 30,
  tryAfterCalls: 66,
  launch: 86,
  grow: 100,
};

/** Vilka delar som är upplåsta i respektive fas (avsnitt 7.3). */
export const PHASE_UNLOCKED_PARTS: Record<PhaseId, ScorePartId[]> = {
  discover: ["fit", "market"],
  tryBeforeCalls: ["fit", "market", "competition"],
  tryAfterCalls: ["fit", "market", "competition", "problem", "willingnessToPay"],
  launch: ["fit", "market", "competition", "problem", "willingnessToPay", "product", "feasibility"],
  grow: [
    "fit",
    "market",
    "competition",
    "problem",
    "willingnessToPay",
    "product",
    "feasibility",
    "traction",
  ],
};

/** Steget som låser upp respektive del — bara siffror (9.3-tidslinjen), inte
 * användartext, så det hårdkodas här i stället för i18n. */
const UNLOCK_STEP: Record<ScorePartId, number> = {
  fit: 1,
  market: 3,
  competition: 3,
  problem: 5,
  willingnessToPay: 5,
  product: 8,
  feasibility: 9,
  traction: 11,
};

/** 7.3: "Passform plus preliminär Marknad" i Upptäck — Marknad är bara halvt
 * upplåst tills "Pröva före samtal" låser upp den fullt. */
const PRELIMINARY_PART_CAP: Partial<Record<PhaseId, Partial<Record<ScorePartId, number>>>> = {
  discover: { market: SCORE_PART_WEIGHTS.market / 2 },
};

/** Ett enskilt bevis. `source` är obligatoriskt — 7.4 "ingen källa, ingen
 * poäng" är typtvingat här, inte bara en konvention. */
export type EvidenceItem = {
  /** Rått värde före avtagande värde-trappan (se `tierMultiplier`). */
  points: number;
  source: Källa;
  dataType: DataType;
  /** Ett svar som säger emot tidigare bevis i samma del. Räknas fullt ut,
   * men ett skevt underlag (många motsägelser) sänker delens poäng — se
   * `scorePart`. */
  contradicts?: boolean;
};

export type PartEvidence = {
  partId: ScorePartId;
  /** Lokaliserad etikett — se i18n `score.parts`. */
  label: string;
  items: EvidenceItem[];
};

export type CalculateScoreInput = {
  phase: PhaseId;
  /** Måste innehålla en post för alla åtta delar (även låsta, för deras
   * etikett) — se `ALL_PART_IDS`. */
  parts: PartEvidence[];
  previousTotal?: number;
  deltaReason?: string;
  calculatedAtIso: string;
};

/** Avtagande värde (7.4): "svar 5–10 är värda mycket, svar 20–30 nästan
 * inget". Tre trappsteg baserat på bevisets index (1-baserat) inom delen. */
function tierMultiplier(indexOneBased: number): number {
  if (indexOneBased <= 10) return 1;
  if (indexOneBased <= 19) return 0.25;
  return 0.05;
}

function effectivePoints(item: EvidenceItem, indexOneBased: number): number {
  // 7.4: simuleringar ger alltid 0 poäng, oavsett rått värde.
  if (item.dataType === "simulation") return 0;
  return item.points * tierMultiplier(indexOneBased);
}

/** Andelen motsägande bevis som utgör ett "skevt underlag" (7.4) och sänker
 * delens totalpoäng, trots att varje motsägande svar räknas fullt ut. */
const SKEW_THRESHOLD = 0.3;
const SKEW_PENALTY = 0.85;

function scorePart(
  items: EvidenceItem[],
  weight: number,
  preliminaryCap: number | undefined,
): { points: number; source: Källa; dataType: DataType } {
  if (items.length === 0) {
    throw new Error(
      "calculateScore: en upplåst del saknar bevis med källa. Ingen poäng utan källa (avsnitt 7.4).",
    );
  }

  const raw = items.reduce((sum, item, index) => sum + effectivePoints(item, index + 1), 0);
  const contradictingShare = items.filter((item) => item.contradicts).length / items.length;
  const skewed = contradictingShare >= SKEW_THRESHOLD ? raw * SKEW_PENALTY : raw;

  const cap = preliminaryCap === undefined ? weight : Math.min(weight, preliminaryCap);
  const points = Math.max(0, Math.min(cap, Math.round(skewed)));

  const last = items[items.length - 1];
  return { points, source: last.source, dataType: last.dataType };
}

/** Räknar poängen från strukturerad evidens (7.1–7.4). Ren funktion: samma
 * indata ger alltid samma utdata, så resultatet kan räknas för hand. */
export function calculateScore(input: CalculateScoreInput): ScoreSnapshot {
  const unlockedIds = new Set(PHASE_UNLOCKED_PARTS[input.phase]);
  const parts: ScorePart[] = [];
  const lockedParts: LockedScorePart[] = [];
  let total = 0;

  for (const partId of ALL_PART_IDS) {
    const evidence = input.parts.find((part) => part.partId === partId);
    if (!evidence) {
      throw new Error(`calculateScore: saknar PartEvidence för "${partId}".`);
    }

    if (!unlockedIds.has(partId)) {
      // 7.3/7.4: låsta delar visas som låsta, aldrig som 0.
      lockedParts.push({ name: evidence.label, unlocksAfterStep: UNLOCK_STEP[partId] });
      continue;
    }

    const weight = SCORE_PART_WEIGHTS[partId];
    const preliminaryCap = PRELIMINARY_PART_CAP[input.phase]?.[partId];
    const scored = scorePart(evidence.items, weight, preliminaryCap);
    parts.push({
      name: evidence.label,
      points: scored.points,
      weight,
      source: scored.source,
      dataType: scored.dataType,
    });
    total += scored.points;
  }

  const phaseCappedTotal = Math.min(total, PHASE_TOTAL_CAP[input.phase]);
  // 7.4: minsta poäng är 1, aldrig 0.
  const clampedTotal = Math.max(1, Math.min(100, phaseCappedTotal));
  const previousTotal = input.previousTotal ?? clampedTotal;

  return {
    total: clampedTotal,
    previousTotal,
    delta: clampedTotal - previousTotal,
    deltaReason: input.deltaReason ?? "",
    calculatedAtIso: input.calculatedAtIso,
    parts,
    lockedParts,
  };
}

/** De tre lucktyperna (7.6). */
export type GapType = "insufficient" | "contradicting" | "structural";

export type ScoreSuggestionInput = {
  partId: ScorePartId;
  label: string;
  gapType: GapType;
  pointsGain: number;
  estimatedMinutes: number;
  explanation: string;
  actionLabel: string;
};

export type ScoreSuggestion = ScoreSuggestionInput & { pointsPerMinute: number };

/** "Höj din poäng" (7.6): sorterat efter poäng per minut. Förslag för en
 * del som råkar vara låst filtreras bort — låsta delar ger aldrig förslag,
 * bara "Låses upp efter steg X" (visas separat, se ScoreSnapshot.lockedParts). */
export function deriveSuggestions(
  candidates: ScoreSuggestionInput[],
  lockedPartIds: ScorePartId[],
): ScoreSuggestion[] {
  const locked = new Set(lockedPartIds);
  return candidates
    .filter((candidate) => !locked.has(candidate.partId))
    .map((candidate) => ({
      ...candidate,
      pointsPerMinute: candidate.pointsGain / Math.max(1, candidate.estimatedMinutes),
    }))
    .sort((a, b) => b.pointsPerMinute - a.pointsPerMinute);
}
