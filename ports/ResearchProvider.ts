export type ResearchResult = {
  title: string;
  url: string;
  snippet: string;
  fetchedAtIso: string;
};

/** Modul: Webbresearch (avsnitt 14.3), delar dokument med PulseProvider. Liveadapter bygger på Tavily. */
export interface ResearchProvider {
  search(query: string): Promise<ResearchResult[]>;
}
