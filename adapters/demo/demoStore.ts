"use client";

// Demomotorn (avsnitt 9.1): var i Saras scenario demot står, persisterat i
// localStorage så att sidan kan laddas om mitt i en demo. Bara demot
// (adapters/demo/**, app/demo/**) importerar det här — /app har ingen
// demorad och känner inte till att den här filen finns.
import { create } from "zustand";
import { useSyncExternalStore } from "react";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import type { OnboardingEntry } from "@/core/domain";
import { saraBeats, type Beat } from "./sara";
import { engineFor } from "./journeyEngine";
import { TOUR_STEPS } from "./tourSteps";

/** Nyckeln demots läge sparas under i localStorage. */
export const DEMO_STATE_KEY = "spark:demo";
/** Samma demos läge före PR 11, med samma form. Flyttas en gång till
 * `DEMO_STATE_KEY` och tas sedan bort. */
export const LEGACY_DEMO_STATE_KEY = "spark:fonda-demo-state";
// "spark:demo-state" hörde till det gamla demot (borttaget i #25) och hade en
// annan form. Det läses aldrig.

// Jonas resa (adapters/demo/jonas.ts) har färre beats än Saras — taket här
// är avsiktligt Saras (längre) array. Varje entry-medveten motor
// (`journeyEngine.ts`s `engineFor`) klampar ändå internt mot SIN EGEN
// arrays längd, så ett `beatIndex` som är för högt för Jonas bara klampas
// till hans sista beat — precis som redan händer vid slutet av Saras resa.
const LAST_BEAT_INDEX = saraBeats.length - 1;

function clampBeatIndex(index: number): number {
  return Math.min(LAST_BEAT_INDEX, Math.max(0, index));
}

type PersistedDemoState = Pick<DemoState, "beatIndex" | "entry" | "onboardingDone" | "tourOn" | "tourStepIndex" | "collapsed">;

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

/** localStorage där ett oläsbart värde (trasig JSON, blockerad lagring) ger
 * "inget sparat" i stället för ett fel. Då börjar demot från början. */
const safeLocalStorage: PersistStorage<PersistedDemoState> = {
  getItem: (name) => {
    try {
      const raw = window.localStorage.getItem(name);
      return raw === null ? null : (JSON.parse(raw) as StorageValue<PersistedDemoState>);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Full eller blockerad lagring: demot fungerar ändå, utan att sparas.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Se setItem.
    }
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validIndex(value: unknown, max: number): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : undefined;
}

/**
 * Tar bara med fält med rätt typ och värden som finns. Ett gammalt eller
 * trasigt sparat läge kan därför aldrig krascha sidan: det som inte går att
 * läsa får utgångsläget. En rundtur utan giltigt stopp slås av.
 */
export function sanitizePersisted(persisted: unknown): Partial<PersistedDemoState> {
  if (!isRecord(persisted)) return {};
  const result: Partial<PersistedDemoState> = {};
  if (typeof persisted.beatIndex === "number" && Number.isFinite(persisted.beatIndex)) {
    result.beatIndex = clampBeatIndex(Math.trunc(persisted.beatIndex));
  }
  if (persisted.entry === "noIdea" || persisted.entry === "hasIdea") result.entry = persisted.entry;
  if (typeof persisted.onboardingDone === "boolean") result.onboardingDone = persisted.onboardingDone;
  if (typeof persisted.collapsed === "boolean") result.collapsed = persisted.collapsed;
  const tourStepIndex = validIndex(persisted.tourStepIndex, TOUR_STEPS.length - 1);
  if (tourStepIndex !== undefined) result.tourStepIndex = tourStepIndex;
  if (typeof persisted.tourOn === "boolean") {
    // Rundturen finns bara för Sara (se toggleTour) och kräver ett giltigt stopp.
    result.tourOn = persisted.tourOn && tourStepIndex !== undefined && (result.entry ?? "noIdea") === "noIdea";
  }
  return result;
}

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
      // beats — den finns bara för Sara-scenariot (docs/beslut.md, uppgift 2).
      // Går INTE att slå på medan entry är "hasIdea" (Jonas) — no-op i
      // stället för att tvinga entry till "noIdea" i tysthet, så rundturen
      // aldrig startar ovanpå Jonas sidor. DemoBar.tsx haller knappen
      // `disabled` i det läget (riktig disabled-knapp, inte en klickbar som
      // gör ingenting) och det globala tangentbordsgenvägen (T) speglar
      // samma spärr. Stopp 1 (adapters/demo/tourSteps.ts, "valkommen") pekar
      // på /demo/app — onboardingDone måste därför sättas här också, annars
      // skickar app/demo/app/layout.tsx:s onboarding-koll presentatören rakt
      // tillbaka till /demo/start (samma mönster som DemoBar.tsx:s
      // jumpToStep). Att slå av gör bara tourOn falskt, ingen annan
      // sidoeffekt (TourOverlay slutar rendera, resten av läget orört).
      toggleTour: () =>
        set((state) => {
          if (state.tourOn) return { tourOn: false };
          if (state.entry === "hasIdea") return {};
          return { tourOn: true, tourStepIndex: 0, beatIndex: 0, onboardingDone: true };
        }),
      setTourStep: (index) => set({ tourStepIndex: index }),
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      // Ett byte av ingång byter också vilken resa (Saras/Jonas) beatIndex
      // pekar in i — nollställ till steg 1 så man aldrig hamnar mitt i den
      // andra personans array. Slår alltid av en pågående rundtur också:
      // rundturens stopp är skrivna mot Saras beats/routes, så den kan aldrig
      // fortsätta meningsfullt över ett persona-byte (uppgift 2 — annars
      // skulle Saras rundtur kunna fortsätta synas ovanpå Jonas sidor om
      // presentatören bytte ingång mitt i en pågående rundtur).
      setEntry: (entry) => set({ entry, beatIndex: 0, tourOn: false, tourStepIndex: 0 }),
      completeOnboarding: () => set({ onboardingDone: true }),
      reset: () =>
        set({ beatIndex: 0, entry: "noIdea", onboardingDone: false, tourOn: false, tourStepIndex: 0 }),
    }),
    {
      name: DEMO_STATE_KEY,
      storage: safeLocalStorage,
      // Läses in först av demots layout (`hydrateDemoStore`), så att servern
      // och klientens första rendering är likadana och det gamla läget hinner
      // flyttas till den nya nyckeln.
      skipHydration: true,
      partialize: (state): PersistedDemoState => ({
        beatIndex: state.beatIndex,
        entry: state.entry,
        onboardingDone: state.onboardingDone,
        tourOn: state.tourOn,
        tourStepIndex: state.tourStepIndex,
        collapsed: state.collapsed,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
);

/** Flyttar demots läge från nyckeln före PR 11, en gång. */
function migrateLegacyKey() {
  try {
    const storage = window.localStorage;
    const legacy = storage.getItem(LEGACY_DEMO_STATE_KEY);
    if (legacy === null) return;
    if (storage.getItem(DEMO_STATE_KEY) === null) storage.setItem(DEMO_STATE_KEY, legacy);
    storage.removeItem(LEGACY_DEMO_STATE_KEY);
  } catch {
    // Blockerad lagring: inget att flytta.
  }
}

/** Läser in demots sparade läge. Anropas av demots layout. Idempotent. */
export function hydrateDemoStore() {
  if (typeof window === "undefined" || useDemoStore.persist.hasHydrated()) return;
  migrateLegacyKey();
  void useDemoStore.persist.rehydrate();
}

/** Sant när demots läge är inläst. Alltid falskt på servern och vid
 * hydreringen, så att båda renderar samma tomma skal. */
export function useDemoStoreHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useDemoStore.persist.onFinishHydration(onChange),
    () => useDemoStore.persist.hasHydrated(),
    () => false,
  );
}

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
