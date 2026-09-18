import "server-only";
import { NotImplementedError } from "@/core/errors";

/**
 * Skelett för Tavilys search-API, för Webbresearch och Pulsen
 * (adapters/live/ResearchProvider.ts, adapters/live/PulseProvider.ts —
 * server-only, samma mönster som lib/server/gemini.ts: tunn klient här,
 * all domänlogik (frågeformulering, tolkning av resultatet, källhantering)
 * i den anropande adaptern. Se docs/moduler/webbresearch-och-pulsen.md.
 *
 * Ingen riktig sökning görs än — `search` kastar NotImplementedError efter
 * att ha kontrollerat att nyckeln finns, så ett saknat-nyckel-fel alltid
 * upptäcks tidigt, redan innan modulsessionen bygger det riktiga anropet.
 */

export const TAVILY_API_URL = "https://api.tavily.com/search";

const DOC = "docs/moduler/webbresearch-och-pulsen.md";

function getTavilyApiKey(): string {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY saknas. Sätt den i .env.local (se .env.example) — skaffa på tavily.com.",
    );
  }
  return apiKey;
}

export type TavilySearchInput = {
  query: string;
  maxResults?: number;
};

export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
};

export async function search(): Promise<TavilySearchResult[]> {
  getTavilyApiKey();
  throw new NotImplementedError("Webbresearch och Pulsen", DOC);
}
