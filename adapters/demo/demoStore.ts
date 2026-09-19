"use client";

// Demomotorn (avsnitt 9.1): var i Saras scenario demot står, persisterat i
// localStorage så att sidan kan laddas om mitt i en demo. Bara demot
// (adapters/demo/**, app/demo/**) importerar det här — /app har ingen
// demorad och känner inte till att den här filen finns.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingEntry } from "@/core/domain";
import { saraBeats, type Beat } from "./sara";
import { engineFor } from "./journeyEngine";

// Jonas resa (adapters/demo/jonas.ts) har färre beats än Saras — taket här
// är avsiktligt Saras (längre) array. Varje entry-medveten motor
// (`journeyEngine.ts`s `engineFor`) klampar ändå internt mot SIN EGEN
// arrays längd, så ett `beatIndex` som är för högt för Jonas bara klampas
// till hans sista beat — precis som redan händer vid slutet av Saras resa.
const LAST_BEAT_INDEX = saraBeats.length - 1;

function clampBeatIndex(index: number): number {
  return Math.min(LAST_BEAT_INDEX, Math.max(0, index));
}

type DemoState = {
  beatIndex: number;
  entry: OnboardingEntry;
  /** Har grundaren klickat sig igenom /demo/start? (avsnitt 9.1: demot ska
   * alltid börja i onboardingen.) Styr om /demo/app skickar tillbaka till
   * /demo/start — se app/demo/app/layout.tsx. */
  onboardingDone: boolean;
  tourOn: boolean;
  /** Index i TOUR_STEPS (adapters/demo/tourSteps.ts) — bara meningsfullt
   * medan `tourOn` är sant. */
  tourStepIndex: number;
  collapsed: boolean;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  toggleTour: () => void;
  setTourStep: (index: number) => void;
  toggleCollapsed: () => void;
  setEntry: (entry: OnboardingEntry) => void;
  completeOnboarding: () => void;
  reset: () => void;
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      beatIndex: 0,
      entry: "noIdea",
      onboardingDone: false,
      tourOn: false,
      tourStepIndex: 0,
      collapsed: false,
      next: () => set((state) => ({ beatIndex: clampBeatIndex(state.beatIndex + 1) })),
      back: () => set((state) => ({ beatIndex: clampBeatIndex(state.beatIndex - 1) })),
      goTo: (index) => set({ beatIndex: clampBeatIndex(index) }),
      // Rundturens 20 stopp (adapters/demo/tourSteps.ts) är skrivna mot Saras
      // beats — att slå på rundturen tvingar därför alltid entry till
      // "noIdea" och startar om från stopp 1, oavsett var i demot eller vilken
      // persona presentatören stod i. Stopp 1 (adapters/demo/tourSteps.ts,
      // "valkommen") pekar på /demo/app — onboardingDone måste därför sättas
      // här också, annars skickar app/demo/app/layout.tsx:s onboarding-koll
      // presentatören rakt tillbaka till /demo/start (samma mönster som
      // DemoBar.tsx:s jumpToStep). Att slå av gör bara tourOn falskt, ingen
      // annan sidoeffekt (TourOverlay slutar rendera, resten av läget orört).
      toggleTour: () =>
        set((state) =>
          state.tourOn
            ? { tourOn: false }
            : { tourOn: true, tourStepIndex: 0, entry: "noIdea", beatIndex: 0, onboardingDone: true },
        ),
      setTourStep: (index) => set({ tourStepIndex: index }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      // Ett byte av ingång byter också vilken resa (Saras/Jonas) beatIndex
      // pekar in i — nollställ till steg 1 så man aldrig hamnar mitt i den
      // andra personans array.
      setEntry: (entry) => set({ entry, beatIndex: 0 }),
      completeOnboarding: () => set({ onboardingDone: true }),
      reset: () =>
        set({ beatIndex: 0, entry: "noIdea", onboardingDone: false, tourOn: false, tourStepIndex: 0 }),
    }),
    { name: "spark:demo-state" },
  ),
);

export const DEMO_BEAT_COUNT = saraBeats.length;

/** Nuvarande position i demot, utanför React (`useDemoStore.getState()`),
 * ingångsmedveten via `journeyEngine.ts`s `engineFor` — Saras eller Jonas
 * beat beroende på `entry` (avsnitt 2.1). */
export function getCurrentBeat(): Beat {
  const { beatIndex, entry } = useDemoStore.getState();
  return engineFor(entry).getBeatAt(beatIndex);
}

export function getCurrentStepNumber(): number {
  return getCurrentBeat().stepNumber;
}
