import type { Dictionary } from "@/i18n/dictionary";
import type { ScoreTone } from "@/design/tokens";

/**
 * Den visuella nivåtabellen från docs/uppdrag.md avsnitt 7.5 — ren
 * presentationsdata, inte poängberäkning. `calculateScore` (Session 2)
 * återanvänder tröskelvärdena härifrån i stället för att duplicera dem.
 */
export type ScoreLevel = {
  min: number;
  max: number;
  tone: ScoreTone;
  key: keyof Dictionary["score"]["levels"];
};

export const SCORE_LEVELS: readonly ScoreLevel[] = [
  { min: 1, max: 29, tone: "red", key: "unproven" },
  { min: 30, max: 49, tone: "orange", key: "underbuiltUnproven" },
  { min: 50, max: 69, tone: "yellow", key: "demandConfirmed" },
  { min: 70, max: 84, tone: "green", key: "builtAndLaunched" },
  { min: 85, max: 100, tone: "strong", key: "provenBusiness" },
];

/** Poängen är alltid minst 1 — se avsnitt 7.4. */
export function getScoreLevel(score: number): ScoreLevel {
  const clamped = Math.min(100, Math.max(1, score));
  return (
    SCORE_LEVELS.find((level) => clamped >= level.min && clamped <= level.max) ??
    SCORE_LEVELS[0]
  );
}
