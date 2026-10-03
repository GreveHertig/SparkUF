import "server-only";
import { OutreachTransportError } from "@/core/errors";
import { TavilyResponseSchema, TavilyResultSchema } from "@/lib/server/tavilySchemas";

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
/** Högst så långt bakåt en nyhetssökning får gå. */
const MAX_NEWS_DAYS = 365;

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
  /**
   * "news" söker bara nyhetsartiklar (Tavilys `topic`). Utelämnat är
   * Tavilys vanliga webbsökning, som förut.
   */
  topic?: "general" | "news";
  /** Bara för `topic: "news"`: artiklar från så här många dagar bakåt (1–365). */
  days?: number;
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
        // Skickas bara när de är satta, så att andra anropare får exakt samma anrop som förut.
        ...(input.topic === "news" || input.topic === "general" ? { topic: input.topic } : {}),
        ...(input.topic === "news" && input.days !== undefined && Number.isFinite(input.days)
          ? { days: Math.min(Math.max(1, Math.floor(input.days)), MAX_NEWS_DAYS) }
          : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Ingen `cause` i felen: den kan bära innehåll från en extern sida.
    throw new OutreachTransportError("Tavily-anropet misslyckades (nätverk eller timeout).");
  }
  if (!response.ok) {
    throw new OutreachTransportError(`Tavily svarade med HTTP ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new OutreachTransportError("Tavily svarade med ogiltig JSON.");
  }
  const parsed = TavilyResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new OutreachTransportError("Oväntat svar från Tavily (validering misslyckades).");
  }

  // Ogiltiga resultat (t.ex. http:, javascript:, userinfo i URL:en) kastas bort ett i taget.
  const valid = parsed.data.results.flatMap((raw) => {
    const item = TavilyResultSchema.safeParse(raw);
    return item.success ? [item.data] : [];
  });

  return valid.slice(0, maxResults).map((r) => ({
    title: r.title,
    url: r.url,
    content: truncate(r.content, MAX_RAW_CHARS),
    ...(r.raw_content ? { rawContent: truncate(r.raw_content, MAX_RAW_CHARS) } : {}),
    ...(r.published_date ? { publishedDate: r.published_date } : {}),
  }));
}
