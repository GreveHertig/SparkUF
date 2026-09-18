import type { JourneyRepository, JourneyStepView, JourneyStepDetail, JourneyStepStatus } from "@/ports/JourneyRepository";
import type { Locale } from "@/i18n/context";
import { useDemoStore } from "./demoStore";
import { getJourneySummaryForBeat, getCurrentStepNumberFor, SARA_STEPS, findLatestBeatForStep } from "./sara";

function statusFor(stepNumber: number, currentStepNumber: number): JourneyStepStatus {
  if (stepNumber < currentStepNumber) return "done";
  if (stepNumber === currentStepNumber) return "current";
  return "locked";
}

export const demoJourneyRepository: JourneyRepository = {
  async getHomeSummary(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    return getJourneySummaryForBeat(beatIndex, locale);
  },

  async getSteps(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    const currentStepNumber = getCurrentStepNumberFor(beatIndex);

    return SARA_STEPS.map(
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
    const meta = SARA_STEPS.find((step) => step.stepNumber === stepNumber);
    if (!meta) return null;

    const { beatIndex } = useDemoStore.getState();
    const currentStepNumber = getCurrentStepNumberFor(beatIndex);
    const status = statusFor(stepNumber, currentStepNumber);
    const beat = findLatestBeatForStep(stepNumber, beatIndex);

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
    };

    if (!beat) return base;

    return {
      ...base,
      why: beat.nextStep[locale].why,
      doneItems: beat.nextStep[locale].doneItems,
      highlights: beat.highlights[locale],
      actionLabel: beat.nextStep[locale].actionLabel,
    };
  },
};
