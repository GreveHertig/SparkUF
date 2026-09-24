"use client";

import { useSyncExternalStore } from "react";
import { saraBeats } from "@/adapters/demo/sara";

// Eget moment-läge för /experiment/fri/demo, i en egen localStorage-nyckel.
// Medvetet INTE adapters/demo/demoStore (nyckeln spark:demo-state): kopian ska
// aldrig kunna flytta eller nollställa det riktiga demots framsteg.
const STORAGE_KEY = "spark:fri-demo";
const LAST_BEAT_INDEX = saraBeats.length - 1;

type FriDemoState = { beatIndex: number };

const listeners = new Set<() => void>();
let cache: FriDemoState | null = null;

function clamp(index: number): number {
  return Math.min(LAST_BEAT_INDEX, Math.max(0, Math.round(index)));
}

function read(): FriDemoState {
  if (cache) return cache;
  let beatIndex = 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) beatIndex = clamp(Number((JSON.parse(raw) as Partial<FriDemoState>).beatIndex ?? 0));
  } catch {
    beatIndex = 0;
  }
  cache = { beatIndex };
  return cache;
}

function write(next: FriDemoState) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Privat läge eller blockerad lagring: läget gäller då bara den här fliken.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE: FriDemoState = { beatIndex: 0 };

export function useFriBeatIndex(): number {
  return useSyncExternalStore(subscribe, () => read().beatIndex, () => SERVER_STATE.beatIndex);
}

export const friDemoActions = {
  setBeat(index: number) {
    write({ beatIndex: clamp(index) });
  },
  next() {
    write({ beatIndex: clamp(read().beatIndex + 1) });
  },
  back() {
    write({ beatIndex: clamp(read().beatIndex - 1) });
  },
  reset() {
    write({ beatIndex: 0 });
  },
  lastIndex: LAST_BEAT_INDEX,
};
