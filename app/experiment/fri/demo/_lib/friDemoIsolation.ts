"use client";

import { useSyncExternalStore } from "react";
import { useDemoStore } from "@/adapters/demo/demoStore";

// Kopian av demot använder de riktiga demoadaptrarna oförändrade. De läser
// demots läge ur useDemoStore, som sparas i localStorage under
// "spark:demo-state". Medan man är i /experiment/fri/demo pekas lagrets
// nyckel om till en egen, så att kopian aldrig kan läsa eller skriva det
// riktiga demots framsteg. Det görs med zustands publika persist-API
// (setOptions/rehydrate) under körning — ingen demofil är ändrad.
//
// Omhydrering skriver aldrig till lagringen (bara vid en versionsmigrering,
// som demoStore inte har), så att byta nyckel och läsa in är sidoeffektfritt.

export const REAL_DEMO_KEY = "spark:demo-state";
export const FRI_DEMO_KEY = "spark:fri-demo-state";

let mounted = 0;

function hasStored(key: string): boolean {
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/** Växla till kopians läge. Idempotent. */
export function enterFriDemo() {
  if (typeof window === "undefined") return;
  if (useDemoStore.persist.getOptions().name === FRI_DEMO_KEY) return;
  useDemoStore.persist.setOptions({ name: FRI_DEMO_KEY });
  if (hasStored(FRI_DEMO_KEY)) {
    void useDemoStore.persist.rehydrate();
  } else {
    // Första besöket: börja från början (skrivs till kopians nyckel).
    useDemoStore.getState().reset();
  }
}

/** Växla tillbaka till det riktiga demots läge. Idempotent. */
export function leaveFriDemo() {
  if (typeof window === "undefined") return;
  if (useDemoStore.persist.getOptions().name === REAL_DEMO_KEY) return;
  useDemoStore.persist.setOptions({ name: REAL_DEMO_KEY });
  if (hasStored(REAL_DEMO_KEY)) {
    void useDemoStore.persist.rehydrate();
  } else {
    // Det riktiga demot har inget sparat läge: nollställ minnet till
    // demots utgångsläge i stället för att låta kopians läge ligga kvar.
    useDemoStore.getState().reset();
  }
}

/** För layoutens effekt: räknar monteringar så att React StrictModes
 * montera–avmontera–montera i utveckling inte växlar fram och tillbaka. */
export function retainFriDemo(): () => void {
  mounted += 1;
  enterFriDemo();
  return () => {
    mounted -= 1;
    setTimeout(() => {
      if (mounted === 0) leaveFriDemo();
    }, 0);
  };
}

/** Sant när demo-lagret pekar på kopians nyckel. Växlingen (reset eller
 * rehydrate) uppdaterar lagret, så hooken renderar om av sig själv. På
 * servern och vid hydreringen är svaret alltid falskt. */
export function useFriDemoReady(): boolean {
  return useSyncExternalStore(
    useDemoStore.subscribe,
    () => useDemoStore.persist.getOptions().name === FRI_DEMO_KEY,
    () => false,
  );
}
