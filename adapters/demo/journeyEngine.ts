// Gemensamt skal för Saras och Jonas resa-motorer (adapters/demo/sara.ts
// respektive adapters/demo/jonas.ts) — samma form, olika data. Demoadaptrar
// som behöver vara ingångsmedvetna (avsnitt 2.1: två personas) väljer rätt
// motor via `engineFor(entry)` i stället för att hårdkoda `sara.ts`-anrop.
import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { OnboardingEntry } from "@/core/domain";
import type { JourneySummary } from "@/ports/JourneyRepository";
import type { ScoreSuggestionInput } from "@/core/score";
import type { Beat, StepMeta } from "./sara";
import { saraEngine } from "./sara";
import { jonasEngine } from "./jonas";

export type JourneyEngine = {
  beats: readonly Beat[];
  steps: readonly StepMeta[];
  suggestionCandidates: Record<Locale, ScoreSuggestionInput[]>;
  getBeatAt(index: number): Beat;
  getCurrentStepNumberFor(beatIndex: number): number;
  findBeatIndexById(id: string): number;
  findLatestBeatIndexForStep(stepNumber: number, upToIndex: number): number | undefined;
  findLatestBeatForStep(stepNumber: number, upToIndex: number): Beat | undefined;
  getScoreSnapshotForBeat(index: number, locale: Locale): ScoreSnapshot;
  getScoreHistoryUpToBeat(index: number, locale: Locale): number[];
  getJourneySummaryForBeat(index: number, locale: Locale): JourneySummary;
};

/** Väljer Saras eller Jonas motor ur demoStore-state `entry` (avsnitt 2.1) —
 * anropande adaptrar slipper hålla reda på vilken modul som hör till vilken
 * ingång, bara fråga `engineFor(entry)`. */
export function engineFor(entry: OnboardingEntry): JourneyEngine {
  return entry === "hasIdea" ? jonasEngine : saraEngine;
}
