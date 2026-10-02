import type { PulseProvider } from "@/ports/PulseProvider";
import {
  PULSE_OPPORTUNITY_AREAS,
  PULSE_RISK_AREAS,
  type PulseFeedbackVerdict,
  type PulseOpportunityArea,
  type PulseRiskArea,
  type PulseSignal,
  type PulseWatch,
} from "@/core/domain";
import type { Locale } from "@/i18n/context";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EmptyStateError, NotImplementedError, OutreachTransportError, PulseWatchError } from "@/core/errors";
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
 * Dagscachen (pulse_fetches, avsnittet "Dagscachen"): högst en hämtning per
 * grundare och svensk dag. Datumet räknas alltid av databasen, aldrig här.
 *
 * Risker och möjligheter (moduldokumentet, "Risksignaler" och "Möjligheter"):
 * varje hämtning gör två sökningar, nyheter om idén och dagens tema, så taket
 * är två Tavily-anrop per grundare och dag. Temat roterar mellan sex
 * riskområden och två möjligheter. Varje träff klassas på ord i rubrik och
 * text (ingen modell) som risk, möjlighet eller vanlig nyhet. Sorten sparas i
 * `category` som "risk:<område>" eller "opportunity:<område>", så ingen
 * migration behövs. Text, förslag och spelbok byggs från i18n vid läsning.
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
/** Högst så många risker och möjligheter bland de signaler som visas, resten är nyheter. */
const MAX_RISKS = 3;
const MAX_OPPORTUNITIES = 2;
/** Så många rader läses för att kunna välja både risker och nyheter. */
const READ_WINDOW = 30;
const RISK_CATEGORY_PREFIX = "risk:";
/** Egna bevakningar (pulse_watches): högst så många per projekt, och så långa. */
export const MAX_WATCHES = 10;
const MIN_WATCH_CHARS = 2;
const MAX_WATCH_CHARS = 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OPPORTUNITY_CATEGORY_PREFIX = "opportunity:";

/** En klassad signal: en risk eller en möjlighet inom ett område. */
export type Insight =
  | { kind: "risk"; area: PulseRiskArea }
  | { kind: "opportunity"; area: PulseOpportunityArea };

/**
 * Temasökningens fasta ord per riskområde. Ett tema per dag, i tur och
 * ordning (themeFor), så att alla teman täcks utan fler anrop per dag.
 */
const RISK_QUERY: Record<PulseRiskArea, string> = {
  costs: "stigande priser råvaror kostnader Sverige",
  finance: "räntan Riksbanken kronan finansiering företag",
  regulation: "nya regler lagändring krav företag Sverige",
  competition: "konkurrent lanserar uppköp riskkapital",
  demand: "konjunktur efterfrågan konsumtion varsel",
  supply: "leveransproblem brist leverantörer tullar",
};

/**
 * Ordbörjan som pekar på ett riskområde. Ett ord i rubrik eller text som
 * börjar med ett av dem räknas (så "räntan" och "räntehöjning" träffar
 * "ränt"). Medvetet snäva: hellre en nyhet för lite som risk än en vanlig
 * nyhet som larmar i onödan.
 */
export const RISK_TERMS: Record<PulseRiskArea, string[]> = {
  costs: ["råvar", "prishöjning", "prisökning", "elpris", "energipris", "bränslepris", "drivmedel", "inflation", "kostnadsökning", "fraktpris", "dyrare"],
  finance: ["ränt", "styrränt", "riksbank", "kronkurs", "valuta", "lånekostnad", "kreditgivning", "bolåneränt"],
  regulation: ["lagförslag", "lagändring", "lagkrav", "förordning", "regelverk", "regeländring", "förbud", "tillståndskrav", "direktiv", "gdpr", "skärpta"],
  competition: ["konkurrent", "uppköp", "förvärv", "riskkapital", "nyemission", "lanserar", "marknadsandel"],
  demand: ["konjunktur", "lågkonjunktur", "efterfrågan", "konsumtion", "hushållen", "varsel", "konkurs", "försäljningsras"],
  supply: ["leveransproblem", "leveranstid", "komponentbrist", "materialbrist", "brist", "strejk", "tull", "leverantör"],
};

/** Temasökningens fasta ord per möjlighet. */
const OPPORTUNITY_QUERY: Record<PulseOpportunityArea, string> = {
  funding: "bidrag företagsstöd småföretag Almi Vinnova utlysning",
  procurement: "offentlig upphandling anbud kommun region",
};

/** Ordbörjan som pekar på en möjlighet. Lika snäva som riskerna. */
export const OPPORTUNITY_TERMS: Record<PulseOpportunityArea, string[]> = {
  funding: ["bidrag", "företagsstöd", "innovationsstöd", "startstöd", "utlysning", "almi", "vinnova", "tillväxtverket", "innovationscheck"],
  procurement: ["upphandling", "upphandlar", "anbud", "ramavtal"],
};

/** Alla teman i rotationen: de sex riskområdena, sedan de två möjligheterna. */
const THEMES: Insight[] = [
  ...PULSE_RISK_AREAS.map((area) => ({ kind: "risk" as const, area })),
  ...PULSE_OPPORTUNITY_AREAS.map((area) => ({ kind: "opportunity" as const, area })),
];

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
  id: string;
  category: string;
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

/**
 * Riskområdet med flest träffar. Rubriken räknas tredubbelt, så ett ord i
 * rubriken väger tyngre än två i brödtexten. Ingen träff ger null.
 */
export function classifyRisk(result: Pick<TavilySearchResult, "title" | "content">): PulseRiskArea | null {
  return bestArea(result, PULSE_RISK_AREAS, RISK_TERMS)?.area ?? null;
}

/** Som classifyRisk, för möjligheterna. */
export function classifyOpportunity(result: Pick<TavilySearchResult, "title" | "content">): PulseOpportunityArea | null {
  return bestArea(result, PULSE_OPPORTUNITY_AREAS, OPPORTUNITY_TERMS)?.area ?? null;
}

/**
 * Risk, möjlighet eller ingenting. Vid lika poäng vinner risken: en varning
 * som visas i onödan är bättre än en risk som visas som möjlighet.
 */
export function classify(result: Pick<TavilySearchResult, "title" | "content">): Insight | null {
  const risk = bestArea(result, PULSE_RISK_AREAS, RISK_TERMS);
  const opportunity = bestArea(result, PULSE_OPPORTUNITY_AREAS, OPPORTUNITY_TERMS);
  if (risk && (!opportunity || risk.score >= opportunity.score)) return { kind: "risk", area: risk.area };
  if (opportunity) return { kind: "opportunity", area: opportunity.area };
  return null;
}

function bestArea<A extends string>(
  result: Pick<TavilySearchResult, "title" | "content">,
  areas: readonly A[],
  terms: Record<A, string[]>,
): { area: A; score: number } | null {
  const words = (text: string) => text.toLocaleLowerCase("sv-SE").match(/[\p{L}\p{N}]+/gu) ?? [];
  const title = words(result.title);
  const body = words(result.content);
  let best: { area: A; score: number } | null = null;
  for (const area of areas) {
    const hits = (list: string[]) => list.filter((word) => terms[area].some((term) => word.startsWith(term))).length;
    const score = 3 * hits(title) + hits(body);
    if (score > 0 && (!best || score > best.score)) best = { area, score };
  }
  return best;
}

/** Dagens tema ur dagscachens datum (räknat av databasen): ett av åtta, i tur och ordning. */
export function themeFor(fetchDate: string): Insight {
  const day = Math.floor(Date.parse(`${fetchDate}T00:00:00Z`) / (24 * 60 * 60 * 1000));
  return THEMES[((day % THEMES.length) + THEMES.length) % THEMES.length];
}

function themeQuery(theme: Insight): string {
  return theme.kind === "risk" ? RISK_QUERY[theme.area] : OPPORTUNITY_QUERY[theme.area];
}

type Candidate = { result: TavilySearchResult; insight: Insight | null };

/**
 * Temasökningens träffar: rubrik krävs och träffen måste själv nämna ett
 * risk- eller möjlighetsord. Att den kom från dagens temasökning räcker
 * inte, och sort och område läses alltid ur texten, inte ur temat.
 */
export function pickThemed(results: TavilySearchResult[], competitors: string[] = []): Candidate[] {
  return results.flatMap((result) => {
    if (!cleanHeadline(result.title)) return [];
    const insight: Insight | null =
      classify(result) ?? (mentionsAny(result, competitors) ? { kind: "risk", area: "competition" } : null);
    return insight ? [{ result, insight }] : [];
  });
}

/** Nämner rubrik eller text något av orden (redan gemener)? */
function mentionsAny(result: Pick<TavilySearchResult, "title" | "content">, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const text = `${result.title} ${result.content}`.toLocaleLowerCase("sv-SE");
  return terms.some((term) => text.includes(term));
}

async function runSearch(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  keywords: string[],
  watches: PulseWatch[],
  claim: FetchRow,
): Promise<void> {
  // Egna bevakningar läggs till sökorden och relevansfiltret. En träff som
  // nämner en bevakad konkurrent är en konkurrensrisk om inget annat passar.
  const watchTerms = watches.map((watch) => watch.term.toLocaleLowerCase("sv-SE"));
  const competitors = watches
    .filter((watch) => watch.kind === "competitor")
    .map((watch) => watch.term.toLocaleLowerCase("sv-SE"));
  const terms = [...keywords, ...watchTerms.filter((term) => !keywords.includes(term))];
  const insightFor = (result: TavilySearchResult): Insight | null =>
    classify(result) ?? (mentionsAny(result, competitors) ? { kind: "risk", area: "competition" } : null);

  let results: TavilySearchResult[];
  try {
    results = await search({ query: `${QUERY_PREFIX} ${terms.join(" ")}`, maxResults: MAX_SIGNALS });
  } catch (error) {
    await finish(supabase, userId, claim, "error");
    // Nätverk/HTTP/ogiltigt svar: tomläge nu, nytt försök om 6 timmar.
    // Allt annat (t.ex. saknad TAVILY_API_KEY) är ett konfigurationsfel som ska synas.
    if (error instanceof OutreachTransportError) return;
    throw error;
  }

  // Temasökningen är ett tillägg: ett nätverksfel där stoppar inte dagens
  // nyheter. Ett konfigurationsfel syns, som ovan.
  let riskResults: TavilySearchResult[] = [];
  const theme = themeFor(claim.fetch_date);
  try {
    riskResults = await search({ query: `${themeQuery(theme)} ${terms.join(" ")}`, maxResults: MAX_SIGNALS });
  } catch (error) {
    if (!(error instanceof OutreachTransportError)) {
      await finish(supabase, userId, claim, "error");
      throw error;
    }
  }

  // En nyhet som själv handlar om en risk eller möjlighet blir det. Samma
  // artikel från båda sökningarna tas bara en gång.
  const seen = new Set<string>();
  const candidates = [
    ...pickRelevant(results, terms).map((result) => ({ result, insight: insightFor(result) })),
    ...pickThemed(riskResults, competitors),
  ].filter(({ result }) => (seen.has(result.url) ? false : (seen.add(result.url), true)));

  let saved: number;
  try {
    saved = await saveNewSignals(supabase, userId, project, claim, candidates);
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
  relevant: Candidate[],
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
      relevant.map(({ result }) => result.url),
    );
  if (error) throw new Error(error.message);
  const known = new Set(((existing as { source_url: string | null }[] | null) ?? []).map((r) => r.source_url));
  const fresh = relevant.filter(({ result }) => !known.has(result.url));
  if (fresh.length > 0) await insertSignals(supabase, userId, project, claim, fresh);
  return fresh.length;
}

async function insertSignals(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  claim: FetchRow,
  fresh: Candidate[],
): Promise<void> {
  // Kolumnerna är NOT NULL, så den svenska texten sparas. Vid läsning byggs den om per språk.
  // För en risk eller möjlighet sparas sorten som "risk:<område>" eller
  // "opportunity:<område>" i category.
  const texts = dictionaries.sv.pulsePage;
  const { error } = await supabase.from("pulse_signals").insert(
    fresh.map(({ result, insight }) => ({
      user_id: userId,
      project_id: project.id,
      category: insight ? categoryOf(insight) : texts.liveCategory,
      headline: cleanHeadline(result.title),
      why_it_matters: (insight ? insightTexts(insight, "sv").whyItMatters : texts.liveWhyItMatters).replace(
        "{project}",
        project.name,
      ),
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
  // Saknas tabellen (migreringen inte körd) blir det inga bevakningar.
  const watches = (await readWatches(supabase, userId, project.id)) ?? [];
  // Utan nyckelord och bevakningar går det inte att filtrera på bransch: sök inte alls.
  if (keywords.length === 0 && watches.length === 0) return;

  let claim = await claimToday(supabase, userId);
  if (!claim) {
    const today = await readLatest(supabase, userId);
    if (!today) return;
    claim = await takeOver(supabase, userId, today);
  }
  if (claim) await runSearch(supabase, userId, project, keywords, watches, claim);
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
    .select("id, category, headline, signal_at, source_name, source_url, fetched_at")
    .eq("user_id", userId)
    .eq("project_id", project.id)
    .order("signal_at", { ascending: false })
    .limit(READ_WINDOW);
  if (error) throw new Error(`Pulsen: kunde inte läsa signalerna (${error.message}).`);

  // Signaler som grundaren markerat "Inte relevant" visas inte igen.
  const hidden = await readHiddenSignalIds(supabase, userId);
  const rows = ((data as SignalRow[] | null) ?? []).filter(
    (row) => row.headline && row.source_name && row.fetched_at && !hidden.has(row.id),
  );
  // Högst MAX_RISKS risker och MAX_OPPORTUNITIES möjligheter, resten nyheter,
  // högst MAX_SIGNALS totalt (porten: 3–5). Risker och möjligheter trängs
  // alltså inte undan av en dag med många nyheter.
  const kindOf = (row: SignalRow) => insightOf(row.category)?.kind ?? "news";
  const risks = rows.filter((row) => kindOf(row) === "risk").slice(0, MAX_RISKS);
  const opportunities = rows
    .filter((row) => kindOf(row) === "opportunity")
    .slice(0, Math.min(MAX_OPPORTUNITIES, MAX_SIGNALS - risks.length));
  const news = rows.filter((row) => kindOf(row) === "news").slice(0, MAX_SIGNALS - risks.length - opportunities.length);
  const chosen = [...risks, ...opportunities, ...news].sort((a, b) => Date.parse(b.signal_at) - Date.parse(a.signal_at));

  const texts = dictionaries[locale].pulsePage;
  // Kategori, "varför" och förslag byggs om från i18n, så att signalen följer språket.
  return chosen.map((row) => {
    const insight = insightOf(row.category);
    const areaTexts = insight ? insightTexts(insight, locale) : null;
    const label = insight?.kind === "opportunity" ? texts.opportunityLabel : texts.riskLabel;
    return {
      id: row.id,
      category: areaTexts ? `${label} · ${areaTexts.name}` : texts.liveCategory,
      headline: row.headline,
      whyItMatters: (areaTexts ? areaTexts.whyItMatters : texts.liveWhyItMatters).replace("{project}", project.name),
      timestamp: formatDate(stockholmDate(row.signal_at), locale),
      source: {
        namn: row.source_name,
        hämtad: row.fetched_at,
        ...(row.source_url ? { url: row.source_url } : {}),
      },
      ...(insight?.kind === "risk" && areaTexts ? { risk: { area: insight.area, actions: [...areaTexts.actions] } } : {}),
      ...(insight?.kind === "opportunity" && areaTexts
        ? { opportunity: { area: insight.area, actions: [...areaTexts.actions] } }
        : {}),
    };
  });
}

function categoryOf(insight: Insight): string {
  return `${insight.kind === "risk" ? RISK_CATEGORY_PREFIX : OPPORTUNITY_CATEGORY_PREFIX}${insight.area}`;
}

function insightTexts(insight: Insight, locale: Locale) {
  const texts = dictionaries[locale].pulsePage;
  return insight.kind === "risk" ? texts.riskAreas[insight.area] : texts.opportunityAreas[insight.area];
}

/**
 * "risk:costs" och "opportunity:funding" ger sorten och området. Allt annat
 * (äldre rader med "Branschnyhet", okända värden) är en vanlig nyhet:
 * värdet kontrolleras mot en vitlista.
 */
function insightOf(category: string): Insight | null {
  if (category.startsWith(RISK_CATEGORY_PREFIX)) {
    const area = category.slice(RISK_CATEGORY_PREFIX.length);
    return (PULSE_RISK_AREAS as readonly string[]).includes(area) ? { kind: "risk", area: area as PulseRiskArea } : null;
  }
  if (category.startsWith(OPPORTUNITY_CATEGORY_PREFIX)) {
    const area = category.slice(OPPORTUNITY_CATEGORY_PREFIX.length);
    return (PULSE_OPPORTUNITY_AREAS as readonly string[]).includes(area)
      ? { kind: "opportunity", area: area as PulseOpportunityArea }
      : null;
  }
  return null;
}

/** PostgREST och Postgres svar när en tabell saknas, t.ex. när en migrering inte är körd. */
function isMissingTable(error: { code?: string }): boolean {
  return error.code === "PGRST205" || error.code === "42P01";
}

/** Projektets bevakningar, eller null om tabellen saknas. */
async function readWatches(supabase: SupabaseClient, userId: string, projectId: string): Promise<PulseWatch[] | null> {
  const { data, error } = await supabase
    .from("pulse_watches")
    .select("id, kind, term")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingTable(error)) return null;
    throw new Error(`Pulsen: kunde inte läsa bevakningarna (${error.message}).`);
  }
  return ((data as PulseWatch[] | null) ?? []).filter((watch) => watch.kind === "competitor" || watch.kind === "keyword");
}

/** Signaler med omdömet "not_relevant". Saknas tabellen döljs ingenting. */
async function readHiddenSignalIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("pulse_feedback")
    .select("signal_id, verdict")
    .eq("user_id", userId)
    .eq("verdict", "not_relevant");
  if (error) {
    if (isMissingTable(error)) return new Set();
    throw new Error(`Pulsen: kunde inte läsa omdömena (${error.message}).`);
  }
  return new Set(((data as { signal_id: string }[] | null) ?? []).map((row) => row.signal_id));
}

/** Grundarens ord: styrtecken bort, blanksteg ihop, längden kapad. Data, aldrig instruktion. */
export function cleanWatchTerm(term: string): string {
  const flat = term.replace(/[\p{Cc}\p{Cf}]+/gu, " ").replace(/\s+/g, " ").trim();
  return Array.from(flat).slice(0, MAX_WATCH_CHARS).join("").trim();
}

const notBuilt = () => new NotImplementedError("Pulsen: omdöme och bevakningar", DOC);

async function setFeedback(signalId: string, verdict: PulseFeedbackVerdict): Promise<void> {
  if (!UUID_PATTERN.test(signalId)) throw new Error("Pulsen: ogiltigt signal-id.");
  if (verdict !== "relevant" && verdict !== "not_relevant") throw new Error("Pulsen: ogiltigt omdöme.");
  const { supabase, userId } = await requireSupabaseUser();
  // RLS släpper bara igenom omdömen om grundarens egna signaler.
  const { error } = await supabase
    .from("pulse_feedback")
    .upsert({ user_id: userId, signal_id: signalId, verdict }, { onConflict: "user_id,signal_id" });
  if (error) {
    if (isMissingTable(error)) throw notBuilt();
    throw new Error(`Pulsen: kunde inte spara omdömet (${error.message}).`);
  }
}

async function getWatches(): Promise<PulseWatch[]> {
  const { supabase, userId } = await requireSupabaseUser();
  const project = await getActiveProject(supabase, userId);
  if (!project) return [];
  const watches = await readWatches(supabase, userId, project.id);
  if (watches === null) throw notBuilt();
  return watches;
}

async function addWatch(kind: PulseWatch["kind"], term: string): Promise<void> {
  if (kind !== "competitor" && kind !== "keyword") throw new Error("Pulsen: ogiltig sorts bevakning.");
  const clean = cleanWatchTerm(term);
  if (Array.from(clean).length < MIN_WATCH_CHARS) throw new PulseWatchError("too_short");
  const { supabase, userId } = await requireSupabaseUser();
  const project = await getActiveProject(supabase, userId);
  if (!project) throw new PulseWatchError("no_project");
  const existing = await readWatches(supabase, userId, project.id);
  if (existing === null) throw notBuilt();
  if (existing.length >= MAX_WATCHES) throw new PulseWatchError("too_many");
  const { error } = await supabase
    .from("pulse_watches")
    .insert({ user_id: userId, project_id: project.id, kind, term: clean });
  if (error) {
    // Samma ord finns redan (unikt per projekt, oavsett stora och små bokstäver): inget att göra.
    if (error.code === "23505") return;
    if (isMissingTable(error)) throw notBuilt();
    throw new Error(`Pulsen: kunde inte spara bevakningen (${error.message}).`);
  }
}

async function removeWatch(id: string): Promise<void> {
  if (!UUID_PATTERN.test(id)) throw new Error("Pulsen: ogiltigt id.");
  const { supabase, userId } = await requireSupabaseUser();
  const { error } = await supabase.from("pulse_watches").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    if (isMissingTable(error)) throw notBuilt();
    throw new Error(`Pulsen: kunde inte ta bort bevakningen (${error.message}).`);
  }
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
  setFeedback,
  getWatches,
  addWatch,
  removeWatch,
};
