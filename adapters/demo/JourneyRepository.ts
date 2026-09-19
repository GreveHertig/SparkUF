import type { JourneyRepository, JourneyStepView, JourneyStepDetail, JourneyStepStatus } from "@/ports/JourneyRepository";
import type { Locale } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import { demoSimulationProvider, simulationQuestions } from "./SimulationProvider";
import { useDemoStore } from "./demoStore";
import { engineFor } from "./journeyEngine";

function statusFor(stepNumber: number, currentStepNumber: number): JourneyStepStatus {
  if (stepNumber < currentStepNumber) return "done";
  if (stepNumber === currentStepNumber) return "current";
  return "locked";
}

/** "Vad som låstes upp" (avsnitt 9.1) — kod-härlett ur skillnaden mellan
 * föregående och nuvarande beats låsta delar, aldrig hårdkodat. */
function diffNewlyUnlocked(previous: ScoreSnapshot, current: ScoreSnapshot): string[] {
  const stillLocked = new Set(current.lockedParts.map((part) => part.name));
  return previous.lockedParts.filter((part) => !stillLocked.has(part.name)).map((part) => part.name);
}

export const demoJourneyRepository: JourneyRepository = {
  async getHomeSummary(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    return engineFor(entry).getJourneySummaryForBeat(beatIndex, locale);
  },

  async getSteps(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    const engine = engineFor(entry);
    const currentStepNumber = engine.getCurrentStepNumberFor(beatIndex);

    return engine.steps.map(
      (step): JourneyStepView => ({
        stepNumber: step.stepNumber,
        journeyPhase: step.journeyPhase,
        title: step.title[locale],
        oneLiner: step.oneLiner[locale],
        maxPoints: step.maxPoints,
        status: statusFor(step.stepNumber, currentStepNumber),
      }),
    );
  },

  async getStepDetail(stepNumber: number, locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    const engine = engineFor(entry);
    const meta = engine.steps.find((step) => step.stepNumber === stepNumber);
    if (!meta) return null;

    const currentStepNumber = engine.getCurrentStepNumberFor(beatIndex);
    const status = statusFor(stepNumber, currentStepNumber);

    const base: JourneyStepDetail = {
      stepNumber: meta.stepNumber,
      journeyPhase: meta.journeyPhase,
      title: meta.title[locale],
      oneLiner: meta.oneLiner[locale],
      maxPoints: meta.maxPoints,
      status,
      why: "",
      doneItems: [],
      highlights: [],
      actionLabel: "",
      momentKind: "after",
      scoreDelta: null,
      newlyUnlockedParts: [],
      verdict: null,
      simulation: null,
    };

    const foundIndex = engine.findLatestBeatIndexForStep(stepNumber, beatIndex);
    if (foundIndex === undefined) return base;
    const beat = engine.getBeatAt(foundIndex);

    const snapshot = engine.getScoreSnapshotForBeat(foundIndex, locale);
    const newlyUnlockedParts =
      foundIndex > 0 ? diffNewlyUnlocked(engine.getScoreSnapshotForBeat(foundIndex - 1, locale), snapshot) : [];

    const simulation = beat.simulationKind
      ? await demoSimulationProvider.simulate(simulationQuestions[beat.simulationKind][locale], locale)
      : null;

    return {
      ...base,
      why: beat.nextStep[locale].why,
      doneItems: beat.nextStep[locale].doneItems,
      highlights: beat.highlights[locale],
      actionLabel: beat.nextStep[locale].actionLabel,
      momentKind: beat.momentKind,
      scoreDelta: { total: snapshot.total, delta: snapshot.delta, deltaReason: snapshot.deltaReason },
      newlyUnlockedParts,
      verdict: beat.verdict ? beat.verdict[locale] : null,
      simulation,
    };
  },
};
