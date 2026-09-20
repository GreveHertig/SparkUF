import "server-only";
import { OutreachTransportError } from "@/core/errors";
import { TavilyResponseSchema } from "@/lib/server/tavilySchemas";

/**
 * Tunn klient för Tavilys search-API (server-only, samma mönster som
 * lib/server/gemini.ts: ingen domänlogik här, den ligger i den anropande
 * adaptern). Används av mejlsökningen (adapters/live/OutreachPrep.ts) och
 * framöver av Webbresearch och Pulsen.
 *
 * SSRF: URL:en är en modulkonstant. Ingen parameter, miljövariabel eller
 * indata kan byta host, och vi hämtar aldrig själva en tredjepartssida:
 * Tavily gör hämtningen, vi läser bara dess svar. Det är en medveten
 * designgräns.
 */

export const TAVILY_API_URL = "https://api.tavily.com/search";

const TIMEOUT_MS = 10_000;
const MAX_RESULTS = 5;
const MAX_RAW_CHARS = 20_000;
const MAX_QUERY_CHARS = 400;

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
  /** Sidans text, trunkerad till MAX_RAW_CHARS tecken. */
  rawContent?: string;
  publishedDate?: string;
};

/** Kodpunktsvis trunkering: delar aldrig ett surrogatpar. */
function truncate(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length > max ? chars.slice(0, max).join("") : text;
}

export async function search(input: TavilySearchInput): Promise<TavilySearchResult[]> {
  const apiKey = getTavilyApiKey();
  const maxResults = Math.min(Math.max(1, input.maxResults ?? MAX_RESULTS), MAX_RESULTS);

  let response: Response;
  try {
    response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        query: truncate(input.query, MAX_QUERY_CHARS),
        max_results: maxResults,
        include_raw_content: true,
        search_depth: "basic",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    throw new OutreachTransportError("Tavily-anropet misslyckades (nätverk eller timeout).", { cause });
  }
  if (!response.ok) {
    throw new OutreachTransportError(`Tavily svarade med HTTP ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new OutreachTransportError("Tavily svarade med ogiltig JSON.", { cause });
  }
  const parsed = TavilyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new OutreachTransportError("Oväntat svar från Tavily (validering misslyckades).");
  }

  return parsed.data.results.slice(0, maxResults).map((r) => ({
    title: r.title,
    url: r.url,
    content: truncate(r.content, MAX_RAW_CHARS),
    ...(r.raw_content ? { rawContent: truncate(r.raw_content, MAX_RAW_CHARS) } : {}),
    ...(r.published_date ? { publishedDate: r.published_date } : {}),
  }));
}
