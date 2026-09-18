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

/** Modul: Minnet — Profilen, Hjärnan och Spåret (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface MemoryRepository {
  getProfileSummary(locale: Locale): Promise<ProfileSummary>;
  getBrainNotes(): Promise<string>;
  setBrainNotes(notes: string): Promise<void>;
  getTraceEvents(locale: Locale): Promise<TraceEvent[]>;
}
