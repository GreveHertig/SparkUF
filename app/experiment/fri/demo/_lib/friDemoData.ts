// Datan för /experiment/fri/demo, hämtad ur samma demomotor som det riktiga
// demot (adapters/demo/journeyEngine + core/score) — men för kopians EGET
// moment i stället för useDemoStore. Varje funktion speglar motsvarande
// demoadapter rad för rad (hänvisning vid varje funktion); inget räknas om
// här, poängen kommer alltid från calculateScore via motorn.
import type { Locale } from "@/i18n/context";
import type { OnboardingEntry, PulseSignal, ScoreSnapshot, NextStep, SinceLastTime } from "@/core/domain";
import { ALL_PART_IDS, PHASE_UNLOCKED_PARTS, deriveSuggestions, type ScorePartId, type ScoreSuggestion } from "@/core/score";
import type { JourneyStepStatus, JourneyStepView } from "@/ports/JourneyRepository";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { saraProfile } from "@/adapters/demo/sara";
import { pulseSignalsFor } from "./pulseSignals";

// Kopian visar Saras resa (ingång "Ingen idé"), samma som det riktiga demots
// förval. Jonas läggs till när resten av sidorna tas.
export const FRI_ENTRY: OnboardingEntry = "noIdea";
export const friProfile = saraProfile;

const engine = () => engineFor(FRI_ENTRY);

/** = demoJourneyRepository `statusFor`. */
function statusFor(stepNumber: number, currentStepNumber: number): JourneyStepStatus {
  if (stepNumber < currentStepNumber) return "done";
  if (stepNumber === currentStepNumber) return "current";
  return "locked";
}

/** = demoJourneyRepository.getSteps. */
export function stepsFor(beatIndex: number, locale: Locale): JourneyStepView[] {
  const currentStepNumber = engine().getCurrentStepNumberFor(beatIndex);
  return engine().steps.map((step) => ({
    stepNumber: step.stepNumber,
    journeyPhase: step.journeyPhase,
    title: step.title[locale],
    oneLiner: step.oneLiner[locale],
    maxPoints: step.maxPoints,
    status: statusFor(step.stepNumber, currentStepNumber),
  }));
}

/** = demoEvidenceRepository.getSuggestions. */
export function suggestionsFor(beatIndex: number, locale: Locale): ScoreSuggestion[] {
  const phase = engine().getBeatAt(beatIndex).phase;
  const unlocked = new Set(PHASE_UNLOCKED_PARTS[phase]);
  const lockedPartIds = ALL_PART_IDS.filter((id: ScorePartId) => !unlocked.has(id));
  return deriveSuggestions(engine().suggestionCandidates[locale], lockedPartIds);
}

export type FriHomeData = {
  score: ScoreSnapshot;
  scoreHistory: number[];
  nextStep: NextStep;
  sinceLastTime: SinceLastTime;
  suggestions: ScoreSuggestion[];
  pulseSignals: PulseSignal[];
  journeySteps: JourneyStepView[];
};

/** Samma sammanställning som app/demo/app/page.tsx gör ur adaptrarna. */
export function homeDataFor(beatIndex: number, locale: Locale): FriHomeData {
  const journey = engine().getJourneySummaryForBeat(beatIndex, locale);
  return {
    score: engine().getScoreSnapshotForBeat(beatIndex, locale),
    scoreHistory: engine().getScoreHistoryUpToBeat(beatIndex, locale),
    nextStep: journey.nextStep,
    sinceLastTime: journey.sinceLastTime,
    suggestions: suggestionsFor(beatIndex, locale),
    pulseSignals: pulseSignalsFor(FRI_ENTRY, beatIndex, locale),
    journeySteps: stepsFor(beatIndex, locale),
  };
}

export type FriScoreData = {
  snapshot: ScoreSnapshot;
  suggestions: ScoreSuggestion[];
  scoreHistory: number[];
};

/** Samma sammanställning som app/demo/app/poang/page.tsx gör ur adaptrarna. */
export function scoreDataFor(beatIndex: number, locale: Locale): FriScoreData {
  return {
    snapshot: engine().getScoreSnapshotForBeat(beatIndex, locale),
    suggestions: suggestionsFor(beatIndex, locale),
    scoreHistory: engine().getScoreHistoryUpToBeat(beatIndex, locale),
  };
}

/** Rad för demoraden och hoppa-listan: steg, fas och moment ur motorn. */
export function beatsFor(locale: Locale) {
  return engine().beats.map((beat, index) => ({
    index,
    stepNumber: beat.stepNumber,
    phase: beat.phase,
    momentLabel: beat.momentLabel[locale],
  }));
}
