export type TraceEvent = {
  id: string;
  timestampIso: string;
  description: string;
};

/** Modul: Minnet — Hjärnan och Spåret (avsnitt 14.3). Liveadapter bygger på Supabase. */
export interface MemoryRepository {
  getBrainNotes(): Promise<string>;
  setBrainNotes(notes: string): Promise<void>;
  getTraceEvents(): Promise<TraceEvent[]>;
}
