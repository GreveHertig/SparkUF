import type { PulseProvider } from "@/ports/PulseProvider";
import {
  PULSE_OPPORTUNITY_AREAS,
  PULSE_RISK_AREAS,
  type PulseFeedbackVerdict,
  type PulseOpportunityArea,
  type PulseRiskArea,
  type PulseSignal,
  type PulseWatch,
  type PulseLearning,
} from "@/core/domain";
import type { Locale } from "@/i18n/context";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EmptyStateError, NotImplementedError, OutreachTransportError, PulseWatchError } from "@/core/errors";
import { requireSupabaseUser } from "@/lib/server/session";
import { search, type TavilySearchResult } from "@/lib/server/tavily";
import { extractDeadline } from "@/core/deadline";
import { writeWhy } from "./pulseWhy";
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
/**
 * Inlärning ur "Relevant" (moduldokumentet, "Inlärning"): så många gillade
 * signaler läses, så många ord läggs högst till sökningen, och ett ord måste
 * stå i så många gillade rubriker för att räknas. Två rubriker krävs så att
 * ett enstaka tillfälligt ord ("miljoner", "satsar") inte styr sökningen.
 */
const MAX_LIKED_SIGNALS = 20;
/**
 * Kundgissningen (profiles.customer_guess, profilsamtalets "Vem tror du
 * skulle köpa?"): högst så många ord ur den läggs till sökningen
 * (moduldokumentet, "Kunden i sökningen").
 */
const MAX_CUSTOMER_TERMS = 3;
/**
 * Högst så många omdömen läses per sidvisning, nyast först. pulse_feedback
 * saknar project_id, så taket är det enda som begränsar läsningen
 * (granskningen av #50, 2026-10-03).
 */
const MAX_FEEDBACK_ROWS = 500;
/**
 * Sökningarna ber Tavily om nyhetsartiklar från så här många dagar bakåt
 * (moduldokumentet, "Bara nyheter"). Utan det kom produktsidor och guider
 * från konkurrenter med, och de saknade datum.
 */
const NEWS_DAYS = 30;
/** Två rubriker räknas som samma nyhet när så stor del av den kortares ord finns i den andra. */
const DUPLICATE_OVERLAP = 0.75;
/** Vanliga engelska småord. Två av dem, och fler än svenska, gör en rubrik engelsk. */
const ENGLISH_WORDS = new Set([
  "the", "and", "of", "in", "for", "to", "with", "on", "is", "are", "a", "an", "how", "what", "why",
  "new", "from", "by", "at", "its", "this", "that", "will", "your",
  // Vanliga ord i engelska rubriker utan småord ("Gallery: 2028 Volvo XC60 PHEV Photos").
  // Inget av dem är ett svenskt ord.
  "gallery", "photos", "pictures", "review", "reviews", "video", "videos", "launch", "launches", "price",
  "prices", "pricing", "specs", "release", "revealed", "unveiled", "update", "sales", "first", "drive",
]);
/** Vanliga svenska småord, motvikten när rubriken saknar å, ä och ö. */
const SWEDISH_WORDS = new Set([
  "och", "i", "för", "med", "på", "av", "till", "om", "som", "är", "en", "ett", "det", "den", "nya",
  "ny", "nytt", "när", "hur", "vad", "kan", "ska", "har", "inte", "efter", "mot", "vid", "från",
]);
const MAX_LEARNED_TERMS = 3;
const MIN_TERM_LIKES = 2;
/** Vanliga nyhetsord som inte säger något om vad grundaren bryr sig om. Bara för inlärningen. */
const NEWS_STOPWORDS = new Set([
  "miljoner", "miljarder", "kronor", "procent", "satsar", "satsning", "företag", "företaget", "företagen",
  "sverige", "svenska", "svensk", "svenskt", "enligt", "under", "efter", "säger", "nytt", "nyheter",
  "ökar", "minskar", "växer", "stiger", "sjunker", "första", "flera", "stora", "större", "kommer",
  "också", "redan", "fortfarande", "jämfört", "dags", "året", "veckan", "idag",
]);

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
  /** Pulsen v3 (migreringen 20261004090000). Saknas när kolumnerna inte finns. */
  why_it_matters?: string;
  why_ai?: boolean | null;
  deadline?: string | null;
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

/**
 * Sökord ur grundarens gissning om kunden. Bara bokstäver och siffror
 * (extractKeywords), aldrig vanliga nyhetsord, och inga ord som redan söks.
 * Grundarens text är data, aldrig instruktion.
 */
export function customerTerms(guess: string | null, known: string[] = []): string[] {
  if (!guess) return [];
  const knownStems = known.map((word) => stem(word.toLocaleLowerCase("sv-SE")));
  return extractKeywords(guess)
    .filter((word) => !NEWS_STOPWORDS.has(word) && !/^\p{N}+$/u.test(word) && !knownStems.includes(stem(word)))
    .slice(0, MAX_CUSTOMER_TERMS);
}

/** PostgREST och Postgres svar när en kolumn saknas, t.ex. när en migrering inte är körd. */
function isMissingColumn(error: { code?: string }): boolean {
  return error.code === "42703" || error.code === "PGRST204";
}

/**
 * Grundarens gissning om kunden ur profilen, eller null. Saknas kolumnen
 * (migreringen 20261002190000 inte körd) söker Pulsen som förut.
 */
async function readCustomerGuess(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("profiles").select("customer_guess").eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingColumn(error)) return null;
    throw new Error(`Pulsen: kunde inte läsa profilen (${error.message}).`);
  }
  const guess = (data as { customer_guess?: unknown } | null)?.customer_guess;
  return typeof guess === "string" ? guess : null;
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

/** Bara bokstäver och siffror, gemener: "Sveriges Riksbank" → "sverigesriksbank". */
function squash(text: string): string {
  return (text.toLocaleLowerCase("sv-SE").match(/[\p{L}\p{N}]+/gu) ?? []).join("");
}

/**
 * Tar bort sajtnamnet i slutet av en rubrik ("… | Sveriges Riksbank",
 * "… - SBAB"), eftersom källan redan står i taggen. Bara när det sista ledet
 * matchar källans domän, så att en rubrik som "Räntan sänks – igen" står kvar.
 */
export function stripSiteSuffix(title: string, url: string | null): string {
  if (!url) return title;
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return title;
  }
  const labels = host.split(".");
  const label = squash(labels.length >= 2 ? labels[labels.length - 2] : labels[0]);
  if (!label) return title;
  // Rubriken är okänd text: kapas innan regexen körs, så kostnaden har ett tak.
  let result = Array.from(title).slice(0, 2 * MAX_HEADLINE_CHARS).join("");
  for (let round = 0; round < 2; round++) {
    const match = result.match(/^(.*\S)\s+[|\-–—:]\s+([^|\-–—:]+)$/u);
    if (!match) break;
    const [, head, tail] = match;
    const segment = squash(tail);
    const words = tail.trim().split(/\s+/).length;
    const sameSite = segment === label || (label.length >= 3 && (segment.includes(label) || label.includes(segment)));
    if (!sameSite || words > 6 || Array.from(head).length < 10) break;
    result = head;
  }
  return result;
}

/**
 * Är rubriken svensk? Å, ä eller ö räcker. Annars är den engelsk om den har
 * minst två vanliga engelska småord och fler engelska än svenska. Spark
 * riktar sig till svenska grundare, och förslagen är skrivna för Sverige.
 */
export function isSwedishHeadline(title: string): boolean {
  const lower = title.toLocaleLowerCase("sv-SE");
  if (/[åäö]/u.test(lower)) return true;
  const words = lower.match(/[\p{L}]+/gu) ?? [];
  const english = words.filter((word) => ENGLISH_WORDS.has(word)).length;
  const swedish = words.filter((word) => SWEDISH_WORDS.has(word)).length;
  return !(english >= 2 && english > swedish);
}

/** Rubrikens innehållsord, stammade: underlaget för att känna igen samma nyhet. */
function headlineWords(title: string): Set<string> {
  return new Set(
    (title.toLocaleLowerCase("sv-SE").match(/[\p{L}\p{N}]+/gu) ?? [])
      .filter((word) => Array.from(word).length >= MIN_KEYWORD_CHARS && !STOPWORDS.has(word))
      .map(stem),
  );
}

/** Handlar två rubriker om samma sak ("Riksbanken sänker räntan" och "Riksbanken sänker styrräntan igen")? */
export function isNearDuplicate(a: string, b: string): boolean {
  const left = headlineWords(a);
  const right = headlineWords(b);
  const smaller = Math.min(left.size, right.size);
  if (smaller < 2) return squash(a) === squash(b);
  let shared = 0;
  for (const word of left) {
    // Böjningar och sammansättningar räknas: "räntan" finns i "styrräntan".
    const related = (other: string) =>
      other.startsWith(word) || word.startsWith(other) || other.endsWith(word) || word.endsWith(other);
    if (right.has(word) || [...right].some(related)) shared++;
  }
  return shared / smaller >= DUPLICATE_OVERLAP;
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

/**
 * Är träffen svensk? Rubriken avgör först (isSwedishHeadline). Har rubriken
 * varken å, ä, ö eller ett svenskt småord avgör texten: utan å, ä och ö och
 * med minst två engelska småord är den engelsk. Bara vid sparandet, där
 * texten finns; vid läsning finns bara rubriken.
 */
export function isSwedishResult(result: Pick<TavilySearchResult, "title" | "content">): boolean {
  if (!isSwedishHeadline(result.title)) return false;
  const title = result.title.toLocaleLowerCase("sv-SE");
  const titleWords = title.match(/[\p{L}]+/gu) ?? [];
  if (/[åäö]/u.test(title) || titleWords.some((word) => SWEDISH_WORDS.has(word))) return true;
  const content = (result.content ?? "").toLocaleLowerCase("sv-SE");
  if (!content.trim() || /[åäö]/u.test(content)) return true;
  const words = content.match(/[\p{L}]+/gu) ?? [];
  const english = words.filter((word) => ENGLISH_WORDS.has(word)).length;
  const swedish = words.filter((word) => SWEDISH_WORDS.has(word)).length;
  return !(english >= 2 && english > swedish);
}

/**
 * Bara träffar med rubrik som nämner minst ett nyckelord. URL:en är redan
 * validerad (https, ingen userinfo) i lib/server/tavily.ts.
 *
 * `watchTerms` (egna bevakningar) räcker när ordet står i rubriken, eller
 * när projektet saknar nyckelord. Ett bevakningsord som bara nämns i
 * förbigående i texten räcker inte ensamt (moduldokumentet, "Pulsen v3").
 */
export function pickRelevant(
  results: TavilySearchResult[],
  keywords: string[],
  watchTerms: string[] = [],
): TavilySearchResult[] {
  const stems = keywords.map(stem);
  const watchStems = watchTerms.map(stem);
  const seen = new Set<string>();
  return results.filter((result) => {
    if (!cleanHeadline(result.title) || !isSwedishResult(result) || seen.has(result.url)) return false;
    const text = `${result.title} ${result.content}`.toLocaleLowerCase("sv-SE");
    const title = result.title.toLocaleLowerCase("sv-SE");
    const relevant =
      stems.some((s) => text.includes(s)) ||
      watchStems.some((s) => (stems.length === 0 ? text : title).includes(s));
    if (!relevant) return false;
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

/**
 * Dagens tema ur dagscachens datum (räknat av databasen): ett av åtta, i tur
 * och ordning. Har grundaren ett favoritområde (flest "Relevant") blir varannan
 * dag favoriten, och de andra dagarna roterar fortfarande genom alla åtta, så
 * att inget område tystnar.
 */
export function themeFor(fetchDate: string, favorite: Insight | null = null): Insight {
  const day = Math.floor(Date.parse(`${fetchDate}T00:00:00Z`) / (24 * 60 * 60 * 1000));
  const at = (n: number) => THEMES[((n % THEMES.length) + THEMES.length) % THEMES.length];
  if (!favorite) return at(day);
  return day % 2 !== 0 ? favorite : at(day / 2);
}

/** Vad grundaren har lärt Pulsen genom "Relevant". Tomt när inget är gillat. */
export type Preferences = {
  /** Gillade signaler per sort: "risk:<område>", "opportunity:<område>" eller "news". */
  areaLikes: Map<string, number>;
  /** Ord som återkommer i gillade rubriker. Skickas till Tavily som data. */
  terms: string[];
};

/** Sortens nyckel för en rad: "risk:<område>", "opportunity:<område>" eller "news". */
function kindKey(category: string): string {
  const insight = insightOf(category);
  return insight ? categoryOf(insight) : "news";
}

/**
 * Ren inlärning ur gillade signaler (kategori och rubrik). Rubrikerna är
 * text från okända webbplatser: bara bokstäver och siffror tas ut
 * (extractKeywords), och de blir sökord, aldrig instruktion.
 * `known` är ord som redan söks (projektets och bevakningarnas).
 */
export function learnPreferences(liked: { category: string; headline: string }[], known: string[] = []): Preferences {
  const areaLikes = new Map<string, number>();
  const counts = new Map<string, number>();
  const order: string[] = [];
  const knownStems = known.map((word) => stem(word.toLocaleLowerCase("sv-SE")));
  for (const { category, headline } of liked) {
    const key = kindKey(category);
    areaLikes.set(key, (areaLikes.get(key) ?? 0) + 1);
    const words = extractKeywords(headline).filter(
      (word) => !NEWS_STOPWORDS.has(word) && !/^\p{N}+$/u.test(word) && !knownStems.includes(stem(word)),
    );
    for (const word of new Set(words.map(stem))) {
      if (!counts.has(word)) order.push(word);
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  const terms = order
    .filter((word) => (counts.get(word) ?? 0) >= MIN_TERM_LIKES)
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
    .slice(0, MAX_LEARNED_TERMS);
  return { areaLikes, terms };
}

/** Risken eller möjligheten med flest "Relevant", eller null. Vid lika: den med nyast gillad signal. */
export function favoriteInsight(preferences: Preferences): Insight | null {
  let best: { insight: Insight; likes: number } | null = null;
  for (const [key, likes] of preferences.areaLikes) {
    const insight = insightOf(key);
    if (insight && (!best || likes > best.likes)) best = { insight, likes };
  }
  return best?.insight ?? null;
}

/**
 * Hur mycket en signal liknar det grundaren har gillat: antalet gillade av
 * samma sort, plus ett om rubriken nämner ett inlärt ord. Noll utan omdömen,
 * och då är ordningen densamma som förut.
 */
export function preferenceScore(row: { category: string; headline: string }, preferences: Preferences): number {
  const sameKind = preferences.areaLikes.get(kindKey(row.category)) ?? 0;
  const headline = row.headline.toLocaleLowerCase("sv-SE");
  const mentionsTerm = preferences.terms.some((term) => headline.includes(term)) ? 1 : 0;
  return sameKind + mentionsTerm;
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
export function pickThemed(
  results: TavilySearchResult[],
  competitors: string[] = [],
  keywords: string[] = [],
): Candidate[] {
  return results.flatMap((result) => {
    if (!cleanHeadline(result.title) || !isSwedishResult(result)) return [];
    const insight: Insight | null =
      classify(result) ?? (isCompetitorNews(result, competitors, keywords) ? { kind: "risk", area: "competition" } : null);
    return insight ? [{ result, insight }] : [];
  });
}

/**
 * En konkurrensrisk: konkurrenten står i rubriken, eller nämns i texten
 * tillsammans med ett av projektets ord. En konkurrent som bara nämns i
 * förbigående gör inte nyheten till en konkurrensrisk.
 */
export function isCompetitorNews(
  result: Pick<TavilySearchResult, "title" | "content">,
  competitors: string[],
  keywords: string[] = [],
): boolean {
  if (!mentionsAny(result, competitors)) return false;
  if (keywords.length === 0) return true;
  const title = result.title.toLocaleLowerCase("sv-SE");
  if (competitors.some((term) => title.includes(term))) return true;
  const text = `${result.title} ${result.content}`.toLocaleLowerCase("sv-SE");
  return keywords.map(stem).some((s) => text.includes(s));
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
  preferences: Preferences,
  claim: FetchRow,
): Promise<void> {
  // Egna bevakningar läggs till sökorden och relevansfiltret. En träff som
  // nämner en bevakad konkurrent är en konkurrensrisk om inget annat passar.
  // Ord som lärts ur "Relevant" läggs till sist, på samma sätt.
  const watchTerms = watches.map((watch) => watch.term.toLocaleLowerCase("sv-SE"));
  const competitors = watches
    .filter((watch) => watch.kind === "competitor")
    .map((watch) => watch.term.toLocaleLowerCase("sv-SE"));
  const terms: string[] = [];
  for (const term of [...keywords, ...watchTerms, ...preferences.terms]) {
    if (!terms.includes(term)) terms.push(term);
  }
  // Projektets ord och inlärda ord avgör relevansen; en bevakning räcker inte ensam.
  const relevanceTerms = [...keywords, ...preferences.terms];
  const insightFor = (result: TavilySearchResult): Insight | null =>
    classify(result) ??
    (isCompetitorNews(result, competitors, relevanceTerms) ? { kind: "risk", area: "competition" } : null);

  // Bara nyhetsartiklar från den senaste månaden, inga produktsidor.
  const newsQuery = `${QUERY_PREFIX} ${terms.join(" ")}`;
  let results: TavilySearchResult[];
  try {
    results = await search({ query: newsQuery, maxResults: MAX_SIGNALS, topic: "news", days: NEWS_DAYS });
  } catch (error) {
    await finish(supabase, userId, claim, "error");
    // Nätverk/HTTP/ogiltigt svar: tomläge nu, nytt försök om 6 timmar.
    // Allt annat (t.ex. saknad TAVILY_API_KEY) är ett konfigurationsfel som ska synas.
    if (error instanceof OutreachTransportError) return;
    throw error;
  }

  // Temasökningen är ett tillägg: ett nätverksfel där stoppar inte dagens
  // nyheter. Ett konfigurationsfel syns, som ovan.
  // Gav nyhetssökningen ingenting alls (smal bransch) blir dagens andra anrop
  // en vanlig webbsökning på samma ord i stället för temat, så att taket på
  // två anrop håller och grundaren ändå får något.
  let riskResults: TavilySearchResult[] = [];
  const theme = themeFor(claim.fetch_date, favoriteInsight(preferences));
  const fallback = results.length === 0;
  try {
    if (fallback) {
      results = await search({ query: newsQuery, maxResults: MAX_SIGNALS });
    } else {
      riskResults = await search({
        query: `${themeQuery(theme)} ${terms.join(" ")}`,
        maxResults: MAX_SIGNALS,
        topic: "news",
        days: NEWS_DAYS,
      });
    }
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
    ...pickRelevant(results, relevanceTerms, watchTerms).map((result) => ({ result, insight: insightFor(result) })),
    ...pickThemed(riskResults, competitors, relevanceTerms),
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
  // Pulsen v3: en egen mening per nyhet från Gemini (bara med PULSE_AI_WHY,
  // adapters/live/pulseWhy.ts) och sista ansökningsdag ur artikeln för
  // möjligheter (core/deadline.ts). Annars den förskrivna texten och inget datum.
  const headlines = fresh.map(({ result }) => cleanHeadline(stripSiteSuffix(result.title, result.url)));
  const aiWhy = await writeWhy(
    { name: project.name, oneLiner: project.oneLiner },
    fresh.map(({ result }, index) => ({ headline: headlines[index], content: result.content ?? "" })),
  );
  const rows = fresh.map(({ result, insight }, index) => {
    const template = (insight ? insightTexts(insight, "sv").whyItMatters : texts.liveWhyItMatters).replace(
      "{project}",
      project.name,
    );
    const base = {
      user_id: userId,
      project_id: project.id,
      category: insight ? categoryOf(insight) : texts.liveCategory,
      headline: headlines[index],
      why_it_matters: template,
      signal_at: signalAt(result),
      source_name: sourceName(result.url),
      source_url: result.url,
      fetched_at: claim.fetch_date,
    };
    const deadline =
      insight?.kind === "opportunity" ? extractDeadline(`${result.title}. ${result.content ?? ""}`, claim.fetch_date) : null;
    const v3 = { deadline, why_ai: aiWhy[index] !== null, why_it_matters: aiWhy[index] ?? template };
    return { base, v3 };
  });
  const { error } = await supabase.from("pulse_signals").insert(rows.map(({ base, v3 }) => ({ ...base, ...v3 })));
  if (!error) return;
  // Utan migreringen 20261004090000 saknas kolumnerna: spara som förut, med
  // den förskrivna texten (en AI-text utan märkning sparas aldrig).
  if (!isMissingColumn(error)) throw new Error(error.message);
  const { error: retry } = await supabase.from("pulse_signals").insert(rows.map(({ base }) => base));
  if (retry) throw new Error(retry.message);
}

/** Dagscachens flöde. Söker bara om den här förfrågan äger dagens rad. */
async function refreshIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  project: Project,
  liked: LikedSignal[],
): Promise<void> {
  const projectWords = extractKeywords(`${project.name} ${project.oneLiner}`);
  // Saknas tabellen (migreringen inte körd) blir det inga bevakningar.
  const watches = (await readWatches(supabase, userId, project.id)) ?? [];
  // Kunden efter idén: nyheter om dem som ska köpa, inte bara om produkten.
  const customer = customerTerms(await readCustomerGuess(supabase, userId), [
    ...projectWords,
    ...watches.map((watch) => watch.term),
  ]);
  const keywords = [...projectWords, ...customer];
  const preferences = learnPreferences(liked, [...keywords, ...watches.map((watch) => watch.term)]);
  // Utan nyckelord, kundord, bevakningar och inlärda ord går det inte att filtrera på bransch: sök inte alls.
  if (keywords.length === 0 && watches.length === 0 && preferences.terms.length === 0) return;

  let claim = await claimToday(supabase, userId);
  if (!claim) {
    const today = await readLatest(supabase, userId);
    if (!today) return;
    claim = await takeOver(supabase, userId, today);
  }
  if (claim) await runSearch(supabase, userId, project, keywords, watches, preferences, claim);
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
  feedback: Feedback,
): Promise<PulseSignal[]> {
  const BASE_COLUMNS = "id, category, headline, signal_at, source_name, source_url, fetched_at";
  const read = (columns: string) =>
    supabase
      .from("pulse_signals")
      .select(columns)
      .eq("user_id", userId)
      .eq("project_id", project.id)
      .order("signal_at", { ascending: false })
      .limit(READ_WINDOW);
  // Pulsen v3: AI-texten och sista ansökningsdag. Utan migreringen läses som förut.
  let { data, error } = await read(`${BASE_COLUMNS}, why_it_matters, why_ai, deadline`);
  if (error && isMissingColumn(error)) ({ data, error } = await read(BASE_COLUMNS));
  if (error) throw new Error(`Pulsen: kunde inte läsa signalerna (${error.message}).`);
  const today = stockholmDate(new Date().toISOString());

  // Signaler som grundaren markerat "Inte relevant" visas inte igen.
  const preferences = learnPreferences(feedback.liked);
  const score = (row: SignalRow) => preferenceScore(row, preferences);
  // Det som liknar det grundaren gillat först, annars nyast först. Utan
  // omdömen är alla poäng noll och ordningen densamma som förut.
  const byPreference = (a: SignalRow, b: SignalRow) =>
    score(b) - score(a) || Date.parse(b.signal_at) - Date.parse(a.signal_at);
  // Äldre rader sparades med sajtnamnet kvar och utan språkfilter: samma regler vid läsning.
  const sorted = ((data as unknown as SignalRow[] | null) ?? [])
    .filter((row) => row.headline && row.source_name && row.fetched_at && !feedback.hidden.has(row.id))
    .map((row) => ({ ...row, headline: cleanHeadline(stripSiteSuffix(row.headline, row.source_url)) }))
    .filter((row) => row.headline && isSwedishHeadline(row.headline))
    .sort(byPreference);
  // Samma nyhet från två källor visas en gång: den som kommer först (gillad sort, annars nyast).
  const rows: SignalRow[] = [];
  for (const row of sorted) {
    if (!rows.some((kept) => isNearDuplicate(kept.headline, row.headline))) rows.push(row);
  }
  // Högst en signal per risk- och möjlighetsområde, så att listan varierar.
  const onePerArea = (list: SignalRow[]) =>
    list.filter((row, index) => list.findIndex((other) => other.category === row.category) === index);
  // Högst MAX_RISKS risker och MAX_OPPORTUNITIES möjligheter, resten nyheter,
  // högst MAX_SIGNALS totalt (porten: 3–5). Risker och möjligheter trängs
  // alltså inte undan av en dag med många nyheter.
  const kindOf = (row: SignalRow) => insightOf(row.category)?.kind ?? "news";
  const risks = onePerArea(rows.filter((row) => kindOf(row) === "risk")).slice(0, MAX_RISKS);
  const opportunities = onePerArea(rows.filter((row) => kindOf(row) === "opportunity"))
    .slice(0, Math.min(MAX_OPPORTUNITIES, MAX_SIGNALS - risks.length));
  const news = rows.filter((row) => kindOf(row) === "news").slice(0, MAX_SIGNALS - risks.length - opportunities.length);
  const chosen = [...risks, ...opportunities, ...news].sort(byPreference);

  const texts = dictionaries[locale].pulsePage;
  // Kategori, "varför" och förslag byggs om från i18n, så att signalen följer språket.
  return chosen.map((row) => {
    const insight = insightOf(row.category);
    const areaTexts = insight ? insightTexts(insight, locale) : null;
    const label = insight?.kind === "opportunity" ? texts.opportunityLabel : texts.riskLabel;
    return {
      id: row.id,
      ...(score(row) > 0 ? { boosted: true } : {}),
      category: areaTexts ? `${label} · ${areaTexts.name}` : texts.liveCategory,
      headline: row.headline,
      // En AI-text finns bara på svenska; på engelska visas den förskrivna texten.
      whyItMatters:
        row.why_ai === true && locale === "sv" && row.why_it_matters
          ? row.why_it_matters
          : (areaTexts ? areaTexts.whyItMatters : texts.liveWhyItMatters).replace("{project}", project.name),
      ...(row.why_ai === true && locale === "sv" && row.why_it_matters ? { whyByAi: true } : {}),
      // Bara ett datum som inte har passerat, och bara för möjligheter.
      ...(insight?.kind === "opportunity" && row.deadline && row.deadline.slice(0, 10) >= today
        ? { deadline: row.deadline.slice(0, 10) }
        : {}),
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

type LikedSignal = { category: string; headline: string };
/** Grundarens omdömen: dolda signaler och gillade signaler (kategori och rubrik). */
type Feedback = { hidden: Set<string>; liked: LikedSignal[] };

/**
 * Omdömena för projektet. "Inte relevant" döljs, och de senaste
 * MAX_LIKED_SIGNALS gillade signalerna läses för inlärningen. Saknas
 * tabellen döljs och lärs ingenting.
 */
async function readFeedback(supabase: SupabaseClient, userId: string, projectId: string): Promise<Feedback> {
  const { data, error } = await supabase
    .from("pulse_feedback")
    .select("signal_id, verdict")
    .eq("user_id", userId)
    // Nyast först, så att de senaste omdömena väljs när de blir många.
    .order("created_at", { ascending: false })
    .limit(MAX_FEEDBACK_ROWS);
  if (error) {
    if (isMissingTable(error)) return { hidden: new Set(), liked: [] };
    throw new Error(`Pulsen: kunde inte läsa omdömena (${error.message}).`);
  }
  const rows = (data as { signal_id: string; verdict: string }[] | null) ?? [];
  const hidden = new Set(rows.filter((row) => row.verdict === "not_relevant").map((row) => row.signal_id));
  const likedIds = rows.filter((row) => row.verdict === "relevant").map((row) => row.signal_id);
  if (likedIds.length === 0) return { hidden, liked: [] };

  // Bara projektets egna signaler, nyast först. RLS släpper bara igenom grundarens egna.
  const { data: signals, error: signalError } = await supabase
    .from("pulse_signals")
    .select("category, headline")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .in("id", likedIds.slice(0, 100))
    .order("signal_at", { ascending: false })
    .limit(MAX_LIKED_SIGNALS);
  if (signalError) throw new Error(`Pulsen: kunde inte läsa de gillade signalerna (${signalError.message}).`);
  return { hidden, liked: (signals as LikedSignal[] | null) ?? [] };
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
  const feedback = await readFeedback(supabase, userId, project.id);
  await refreshIfNeeded(supabase, userId, project, feedback.liked);
  return readSignals(supabase, userId, project, locale, feedback);
}

/** Sortens namn i språket, för "Pulsen lär sig". Vanliga nyheter heter "Branschnyheter". */
function kindName(key: string, locale: Locale): string {
  const insight = insightOf(key);
  return insight ? insightTexts(insight, locale).name : dictionaries[locale].pulsePage.newsTitle;
}

/**
 * Vad omdömena har lärt Pulsen (Pulsen v3): sorterna med flest "Relevant",
 * flest först, och de inlärda orden. Samma inlärning som sorteringen och
 * sökningen använder, så att det som visas är det som faktiskt påverkar.
 */
export function describeLearning(preferences: Preferences, locale: Locale): PulseLearning {
  const areas = [...preferences.areaLikes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => kindName(key, locale));
  return { areas: [...new Set(areas)], terms: [...preferences.terms] };
}

async function getLearning(locale: Locale): Promise<PulseLearning> {
  const { supabase, userId } = await requireSupabaseUser();
  const project = await getActiveProject(supabase, userId);
  if (!project) return { areas: [], terms: [] };
  const feedback = await readFeedback(supabase, userId, project.id);
  return describeLearning(learnPreferences(feedback.liked), locale);
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
  getLearning,
};
