import type { Locale } from "@/i18n/context";
import type { OnboardingEntry } from "@/core/domain";

export type TraceEvent = {
  id: string;
  timestampIso: string;
  description: string;
};

/**
 * Profilen-fliken i Minnet (avsnitt 6, 9.3). Fälten role–risk är svaren från
 * onboardingens profilfrågor (core/onboarding.ts). `null` betyder att frågan
 * inte är besvarad, till exempel bio och risk för ingång B, som bara får
 * role, time och money. Skärmen visar då en lucka och fyller aldrig i något.
 * `name` kommer från signup och är `null` om den saknas. `entry` är ingången
 * grundaren valde, så att skärmen kan visa frågorna som de ställdes.
 */
export type ProfileSummary = {
  entry: OnboardingEntry;
  name: string | null;
  role: string | null;
  bio: string | null;
  time: string | null;
  money: string | null;
  risk: string | null;
};

/** En post som en annan modul vill spara i Spåret. Användaren tas alltid ur sessionen, aldrig ur indata. */
export type RecordTraceEventInput = {
  /** Modulen som skriver, t.ex. "Domen". */
  module: string;
  description: string;
  occurredAtIso: string;
};

/** Modul: Minnet — Profilen, Hjärnan och Spåret (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface MemoryRepository {
  /** `EmptyStateError` bara om onboardingen inte är gjord. */
  getProfileSummary(locale: Locale): Promise<ProfileSummary>;
  getBrainNotes(): Promise<string>;
  setBrainNotes(notes: string): Promise<void>;
  getTraceEvents(locale: Locale): Promise<TraceEvent[]>;
  /**
   * Sparar en post i Spåret för den inloggade användaren (docs/moduler/minnet.md:
   * "skrivs av andra moduler"). Idempotent: samma modul, beskrivning och tid
   * sparas inte två gånger. Ändrad port, eget beslut (docs/bygga-en-modul.md §4).
   */
  recordTraceEvent(event: RecordTraceEventInput): Promise<void>;
}
