import type { CompleteStepResult, JourneyProgress, StepCompletionView } from "@/ports/JourneyProgress";
import type { Locale } from "@/i18n/context";
import { useDemoStore } from "./demoStore";
import { engineFor } from "./journeyEngine";

// Demots resa är manusstyrd per moment (uppdrag 9.1): steget byts med
// demoraden, inte med en knapp. Demoadaptern sparar därför ingenting, på samma
// sätt som adapters/demo/EvidenceRecorder.ts. Steg före det aktuella är klara,
// det aktuella kan markeras (utan att något ändras), och resten väntar på
// föregående steg. Demot importerar aldrig liveadaptern.

function current() {
  const { beatIndex, entry } = useDemoStore.getState();
  const engine = engineFor(entry);
  return { engine, beatIndex, currentStep: engine.getCurrentStepNumberFor(beatIndex) };
}

export const demoJourneyProgress: JourneyProgress = {
  async getStepCompletion(stepNumber: number): Promise<StepCompletionView> {
    const { currentStep } = current();
    const status = stepNumber < currentStep ? "done" : stepNumber === currentStep ? "completable" : "previousNotDone";
    return { stepNumber, status, missing: [], progress: [] };
  },

  async completeStep(_stepNumber: number, locale: Locale): Promise<CompleteStepResult> {
    const { engine, beatIndex } = current();
    const phase = engine.getBeatAt(beatIndex).phase;
    return { snapshot: engine.getScoreSnapshotForBeat(beatIndex, locale), phaseBefore: phase, phaseAfter: phase };
  },
};
