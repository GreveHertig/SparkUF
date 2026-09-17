"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Dictionary } from "./dictionary";
import { sv } from "./sv";
import { en } from "./en";

export type Locale = "sv" | "en";

const dictionaries: Record<Locale, Dictionary> = { sv, en };

const STORAGE_KEY = "spark:locale";

function isLocale(value: string | null): value is Locale {
  return value === "sv" || value === "en";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isLocale(stored) ? stored : "sv";
}

function getServerSnapshot(): Locale {
  return "sv";
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    // localStorage bara triggar "storage" i ANDRA flikar — den här fliken
    // behöver ett eget event för att useSyncExternalStore ska läsa om värdet.
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n måste användas inuti en LocaleProvider");
  }
  return context;
}
