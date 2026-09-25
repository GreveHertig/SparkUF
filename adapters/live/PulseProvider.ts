import type { PulseProvider } from "@/ports/PulseProvider";
import type { PulseSignal } from "@/core/domain";
import type { Locale } from "@/i18n/context";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EmptyStateError, OutreachTransportError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { search, type TavilySearchResult } from "@/lib/server/tavily";
import { formatDate } from "@/i18n/format";
import { sv } from "@/i18n/sv";
import { en } from "@/i18n/en";

/**
 * Pulsens liveadapter (docs/moduler/webbresearch-och-pulsen.md). Söker
 * svenska näringslivsnyheter via Tavily, behåller bara träffar som nämner
 * nyckelord ur det aktiva projektets namn och enradsbeskrivning, och sparar
 * dem i pulse_signals med källa och hämtdatum.
 *
 * Dagscachen (pulse_fetches, avsnittet "Dagscachen"): högst en sökning per
 * grundare och svensk dag. Datumet räknas alltid av databasen, aldrig här.
 */

const DOC = "docs/moduler/webbresearch-och-pulsen.md";
const dictionaries = { sv, en };

/** En `pending`-rad äldre än så här räknas som övergiven (servern dog mitt i). */
const STALE_PENDING_MS = 5 * 60 * 1000;
/**
 * Ett `error` får tas över först när det är så här gammalt. 6 timmar ger
 * högst 3 omförsök per svensk dag (efter 6, 12 och 18 timmar) utan någon
 * räknarkolumn. Beslut Bruno 2026-09-25.
 */
const ERROR_RETRY_MS = 6 * 60 * 60 * 1000;
const MAX_SIGNALS = 5;
const MAX_HEADLINE_CHARS = 200;
const MAX_KEYWORDS = 6;
const MIN_KEYWORD_CHARS = 4;
/** Söksträngens fasta del. Skickas till Tavily, visas aldrig för användaren. */
const QUERY_PREFIX = "svenska näringslivsnyheter";

/** Vanliga ord som inte säger något om branschen. Bara ord med minst MIN_KEYWORD_CHARS tecken behöver stå här. */
const STOPWORDS = new Set([
  "alla", "andra", "också", "deras", "dina", "efter", "eller", "enkel", "enkelt", "från", "genom",
  "hjälp", "hjälpa", "hjälper", "inte", "mellan", "mina", "några", "någon", "samma", "sina", "smart",
  "snabb", "snabbt", "till", "under", "utan", "vara", "våra", "vill", "över", "their", "with", "that",
  "this", "from", "your", "helps", "help",
]);

type FetchStatus = "pending" | "done" | "empty" | "error";

type FetchRow = {
  fetch_date: string;
  status: FetchStatus;
  claimed_at: string;
  fetched_at: string | null;
};

type Project = { id: string; name: string; oneLiner: string };

type SignalRow = {
  headline: string;
  signal_at: string;
  source_name: string;
  source_url: string | null;
  fetched_at: string;
};

const FETCH_COLUMNS = "fetch_date, status, claimed_at, fetched_at";

async function getActiveProject(supabase: SupabaseClient, userId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, one_liner")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Pulsen: kunde inte läsa det aktiva projektet (${error.message}).`);
  if (!data) return null;
  return { id: data.id as string, name: data.name as string, oneLiner: data.one_liner as string };
}

/**
 * Nyckelord ur projektets egna ord. Bara de här skickas till Tavily, inte
 * grundarens hela text (moduldokumentet, "Säkerhet").
 */
export function extractKeywords(text: string): string[] {
  const words = text.toLocaleLowerCase("sv-SE").match(/[\p{L}\p{N}]+/gu) ?? [];
  const keywords: string[] = [];
  for (const word of words) {
    if (Array.from(word).length < MIN_KEYWORD_CHARS || STOPWORDS.has(word) || keywords.includes(word)) continue;
    keywords.push(word);
    if (keywords.length === MAX_KEYWORDS) break;
  }
  return keywords;
}

/** Steg 1 i flödet: `insert ... on conflict do nothing returning`. Databasen sätter fetch_date. */
async function claimToday(supabase: SupabaseClient, userId: string): Promise<FetchRow | null> {
  const { data, error } = await supabase
    .from("pulse_fetches")
    .upsert({ user_id: userId }, { onConflict: "user_id,fetch_date", ignoreDuplicates: true })
    .select(FETCH_COLUMNS);
  if (error) throw new Error(`Pulsen: kunde inte ta dagens hämtning (${error.message}).`);
  return ((data as FetchRow[] | null) ?? [])[0] ?? null;
}

/**
 * Steg 2: claimen krockade, alltså finns dagens rad redan. Grundarens nyaste
 * rad ÄR dagens rad, så vi behöver aldrig räkna ut datumet själva (Supabase-
 * klienten kan inte skicka databasens datumuttryck som filter).
 */
async function readLatest(supabase: SupabaseClient, userId: string): Promise<FetchRow | null> {
  const { data, error } = await supabase
    .from("pulse_fetches")
    .select(FETCH_COLUMNS)
    .eq("user_id", userId)
    .order("fetch_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Pulsen: kunde inte läsa dagens hämtning (${error.message}).`);
  return (data as FetchRow | null) ?? null;
}

/**
 * Tar över ett `error` (äldre än ERROR_RETRY_MS) eller en övergiven `pending`
 * (äldre än STALE_PENDING_MS). Villkoret ligger i update-frågans WHERE, så
 * bara en av flera samtidiga förfrågningar får tillbaka en rad.
 */
async function takeOver(supabase: SupabaseClient, userId: string, row: FetchRow): Promise<FetchRow | null> {
  const now = Date.now();
  let query = supabase
    .from("pulse_fetches")
    .update({ status: "pending", claimed_at: new Date(now).toISOString(), fetched_at: null })
    .eq("user_id", userId)
    .eq("fetch_date", row.fetch_date);
  if (row.status === "error") {
    query = query.eq("status", "error").lt("fetched_at", new Date(now - ERROR_RETRY_MS).toISOString());
  } else if (row.status === "pending") {
    query = query.eq("status", "pending").lt("claimed_at", new Date(now - STALE_PENDING_MS).toISOString());
  } else {
    return null;
  }
  const { data, error } = await query.select(FETCH_COLUMNS);
  if (error) throw new Error(`Pulsen: kunde inte ta över dagens hämtning (${error.message}).`);
  return ((data as FetchRow[] | null) ?? [])[0] ?? null;
}

/** Steg 3: status och fetched_at i samma update, bara om vår claim fortfarande gäller. */
async function finish(
  supabase: SupabaseClient,
  userId: string,
  claim: FetchRow,
  status: Exclude<FetchStatus, "pending">,
): Promise<void> {
  const { error } = await supabase
    .from("pulse_fetches")
    .update({ status, fetched_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("fetch_date", claim.fetch_date)
    .eq("status", "pending")
    .eq("claimed_at", claim.claimed_at);
  if (error) throw new Error(`Pulsen: kunde inte avsluta dagens hämtning (${error.message}).`);
}

/** Rubriken är text från en okänd webbplats: data, aldrig instruktion. Styrtecken bort, blanksteg ihop, längden kapad. */
function cleanHeadline(title: string): string {
  const flat = title.replace(/[\p{Cc}\p{Cf}]+/gu, " ").replace(/\s+/g, " ").trim();
  const chars = Array.from(flat);
  return chars.length > MAX_HEADLINE_CHARS ? `${chars.slice(0, MAX_HEADLINE_CHARS - 1).join("")}…` : flat;
}

function sourceName(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

/** Publiceringsdatumet om det är giltigt och inte ligger i framtiden, annars nu. */
function signalAt(result: TavilySearchResult): string {
  const now = Date.now();
  const published = result.publishedDate ? Date.parse(result.publishedDate) : NaN;
  return new Date(Number.isNaN(published) || published > now ? now : published).toISOString();
}

/** Vanliga svenska böjningsändelser, längst först, så att "byråer" också hittar "byrå" och "byråerna". */
const SUFFIXES = ["arna", "erna", "orna", "ar", "er", "or", "en", "et", "na"];

/** Ordstammen, men aldrig kortare än MIN_KEYWORD_CHARS tecken. */
export function stem(keyword: string): string {
  for (const suffix of SUFFIXES) {
    if (keyword.endsWith(suffix) && Array.from(keyword).length - suffix.length >= MIN_KEYWORD_CHARS) {
      return keyword.slice(0, -suffix.length);
    }
  }
  return keyword;
}

/** Bara träffar med rubrik som nämner minst ett nyckelord. URL:en är redan validerad (https, ingen userinfo) i lib/server/tavily.ts. */
export function pickRelevant(results: TavilySearchResult[], keywords: string[]): TavilySearchResult[] {
  const stems = keywords.map(stem);
  const seen = new Set<string>();
  return results.filter((result) => {
    if (!cleanHeadline(result.title) || seen.has(result.url)) return false;
    const text = `${result.title} ${result.content}`.toLocaleLowerCase("sv-SE");
    if (!stems.some((s) => text.includes(s))) return false;
    seen.add(result.url);
    return true;
  });
}

async function runSearch(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  keywords: string[],
  claim: FetchRow,
): Promise<void> {
  let results: TavilySearchResult[];
  try {
    results = await search({ query: `${QUERY_PREFIX} ${keywords.join(" ")}`, maxResults: MAX_SIGNALS });
  } catch (error) {
    await finish(supabase, userId, claim, "error");
    // Nätverk/HTTP/ogiltigt svar: tomläge nu, nytt försök om 6 timmar.
    // Allt annat (t.ex. saknad TAVILY_API_KEY) är ett konfigurationsfel som ska synas.
    if (error instanceof OutreachTransportError) return;
    throw error;
  }

  let saved: number;
  try {
    saved = await saveNewSignals(supabase, userId, project, claim, pickRelevant(results, keywords));
  } catch (error) {
    await finish(supabase, userId, claim, "error");
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Pulsen: kunde inte spara dagens signaler (${reason}).`);
  }
  await finish(supabase, userId, claim, saved > 0 ? "done" : "empty");
}

/** Sparar de träffar som inte redan finns och returnerar hur många det blev. */
async function saveNewSignals(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  claim: FetchRow,
  relevant: TavilySearchResult[],
): Promise<number> {
  if (relevant.length === 0) return 0;
  // Samma artikel sparas bara en gång, även om Tavily hittar den flera dagar.
  // Bara dagens kandidater slås upp, så frågan växer inte med historiken.
  const { data: existing, error } = await supabase
    .from("pulse_signals")
    .select("source_url")
    .eq("user_id", userId)
    .eq("project_id", project.id)
    .in(
      "source_url",
      relevant.map((result) => result.url),
    );
  if (error) throw new Error(error.message);
  const known = new Set(((existing as { source_url: string | null }[] | null) ?? []).map((r) => r.source_url));
  const fresh = relevant.filter((result) => !known.has(result.url));
  if (fresh.length > 0) await insertSignals(supabase, userId, project, claim, fresh);
  return fresh.length;
}

async function insertSignals(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  claim: FetchRow,
  fresh: TavilySearchResult[],
): Promise<void> {
  // Kolumnerna är NOT NULL, så den svenska texten sparas. Vid läsning byggs den om per språk.
  const texts = dictionaries.sv.pulsePage;
  const { error } = await supabase.from("pulse_signals").insert(
    fresh.map((result) => ({
      user_id: userId,
      project_id: project.id,
      category: texts.liveCategory,
      headline: cleanHeadline(result.title),
      why_it_matters: texts.liveWhyItMatters.replace("{project}", project.name),
      signal_at: signalAt(result),
      source_name: sourceName(result.url),
      source_url: result.url,
      fetched_at: claim.fetch_date,
    })),
  );
  if (error) throw new Error(error.message);
}

/** Dagscachens flöde. Söker bara om den här förfrågan äger dagens rad. */
async function refreshIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
): Promise<void> {
  const keywords = extractKeywords(`${project.name} ${project.oneLiner}`);
  // Utan nyckelord går det inte att filtrera på bransch: sök inte alls.
  if (keywords.length === 0) return;

  let claim = await claimToday(supabase, userId);
  if (!claim) {
    const today = await readLatest(supabase, userId);
    if (!today) return;
    claim = await takeOver(supabase, userId, today);
  }
  if (claim) await runSearch(supabase, userId, project, keywords, claim);
}

/**
 * Visningsdatum för en artikel i svensk tid, "YYYY-MM-DD". Bara för
 * visning: dagscachens dag räknas fortfarande av databasen.
 */
function stockholmDate(timestamp: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date(timestamp));
}

async function readSignals(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  locale: Locale,
): Promise<PulseSignal[]> {
  const { data, error } = await supabase
    .from("pulse_signals")
    .select("headline, signal_at, source_name, source_url, fetched_at")
    .eq("user_id", userId)
    .eq("project_id", project.id)
    .order("signal_at", { ascending: false })
    .limit(MAX_SIGNALS);
  if (error) throw new Error(`Pulsen: kunde inte läsa signalerna (${error.message}).`);

  const texts = dictionaries[locale].pulsePage;
  // Kategori och "varför" byggs om från i18n, så att signalen följer språket.
  return ((data as SignalRow[] | null) ?? [])
    .filter((row) => row.headline && row.source_name && row.fetched_at)
    .map((row) => ({
      category: texts.liveCategory,
      headline: row.headline,
      whyItMatters: texts.liveWhyItMatters.replace("{project}", project.name),
      timestamp: formatDate(stockholmDate(row.signal_at), locale),
      source: {
        namn: row.source_name,
        hämtad: row.fetched_at,
        ...(row.source_url ? { url: row.source_url } : {}),
      },
    }));
}

async function getSignals(locale: Locale): Promise<PulseSignal[]> {
  const { supabase, userId } = await requireSupabaseUser();
  const project = await getActiveProject(supabase, userId);
  if (!project) return [];
  await refreshIfNeeded(supabase, userId, project);
  return readSignals(supabase, userId, project, locale);
}

export const livePulseProvider: PulseProvider = {
  async getTodaysSignal(locale: Locale) {
    const [latest] = await getSignals(locale);
    // Porten tillåter inget tomt svar här. EmptyStateError ger ett ärligt tomläge.
    if (!latest) throw new EmptyStateError("Pulsen", DOC);
    return latest;
  },

  getSignals,
};
