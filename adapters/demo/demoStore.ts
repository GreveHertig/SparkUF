"use client";

// Demomotorn (avsnitt 9.1): var i testscenariot demot står, persisterat i
// localStorage så att sidan kan laddas om mitt i en demo. Bara demot
// (adapters/demo/**, app/demo/**) importerar det här — /app har ingen
// demorad och känner inte till att den här filen finns.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { testScenarioBeats } from "./testScenario";

export type DemoEntry = "noIdea" | "hasIdea";

const LAST_BEAT_INDEX = testScenarioBeats.length - 1;

function clampBeatIndex(index: number): number {
  return Math.min(LAST_BEAT_INDEX, Math.max(0, index));
}

type DemoState = {
  beatIndex: number;
  entry: DemoEntry;
  tourOn: boolean;
  collapsed: boolean;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  toggleTour: () => void;
  toggleCollapsed: () => void;
  setEntry: (entry: DemoEntry) => void;
  reset: () => void;
};

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      beatIndex: 0,
      entry: "noIdea",
      tourOn: false,
      collapsed: false,
      next: () => set((state) => ({ beatIndex: clampBeatIndex(state.beatIndex + 1) })),
      back: () => set((state) => ({ beatIndex: clampBeatIndex(state.beatIndex - 1) })),
      goTo: (index) => set({ beatIndex: clampBeatIndex(index) }),
      toggleTour: () => set((state) => ({ tourOn: !state.tourOn })),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setEntry: (entry) => set({ entry }),
      reset: () => set({ beatIndex: 0, entry: "noIdea", tourOn: false }),
    }),
    { name: "spark:demo-state" },
  ),
);

export const DEMO_BEAT_COUNT = testScenarioBeats.length;
