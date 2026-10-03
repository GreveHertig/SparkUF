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
 *
 * `frustrations` (ingång A) och `customer` (ingång B) är de två frågor som kom
 * till senare (supabase/migrations/20261002190000_onboarding_nya_fragor.sql).
 * Liveadaptern skickar dem alltid, som text eller `null`. Demoadaptern skickar
 * dem inte: demot är fryst och har inga svar på dem, och skärmen visar en
 * sådan fråga bara när fältet finns.
 */
export type ProfileSummary = {
  entry: OnboardingEntry;
  name: string | null;
  role: string | null;
  bio: string | null;
  time: string | null;
  money: string | null;
  risk: string | null;
  frustrations?: string | null;
  customer?: string | null;
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
  /**
   * De profilfält som är ifyllda, även när inte alla sex är det (ingång B
   * svarar bara på tre frågor). Kastar aldrig för att ett fält saknas, till
   * skillnad från `getProfileSummary`. Läses av Medgrundaren
   * (docs/moduler/medgrundaren.md). Valfri, så att demoadaptern inte behöver
   * ändras. Ändrad port, eget beslut (docs/beslut.md 2026-10-03).
   */
  getKnownProfile?(): Promise<Partial<ProfileSummary>>;
}
