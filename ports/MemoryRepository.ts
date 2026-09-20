import type { Locale } from "@/i18n/context";

export type TraceEvent = {
  id: string;
  timestampIso: string;
  description: string;
};

/** Profilen-fliken i Minnet (avsnitt 6, 9.3). */
export type ProfileSummary = {
  name: string;
  role: string;
  bio: string;
  time: string;
  money: string;
  risk: string;
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
