import "server-only";
import { z } from "zod";
import { NotImplementedError, RegistryInputError, RegistryTransportError } from "@/core/errors";

/**
 * Tunn transportklient för SCB:s allmänna företagsregister-API, AFR.
 * Kontraktet är https://apiafr.scb.se/swagger/v1/swagger.json (provkört
 * 2026-09-30, docs/dataspiken.md "SCB AFR, provkörning 2026-09-30"). Nyckeln
 * skickas i headern X-API-Key (SCB_AFR_API_KEY), bas-URL i
 * SCB_AFR_API_BASE_URL. Ingen NEXT_PUBLIC_.
 *
 * Byggt (2026-10-04):
 * - `fetchCompanyCount(sni)`: antalet juridiska enheter med huvudbransch `sni`
 *   (`GET /v1/juridiskaenheter/naringsgren/{kod}/count`). Ett anrop, inga namn
 *   och inga personuppgifter. Det räcker för steg 03 i Resan.
 * - `searchIndustries(text)`: SNI-koder vars namn matchar en sökning, ur
 *   kodtabellen `naringsgrenkoder`. Kodtabellen är inte bolagsdata och hålls i
 *   minnet i 7 dagar (samma tak som registry_cache-migreringen sätter för
 *   kodtabeller).
 *
 * Inte byggt: hela bolagslistan per SNI (`fetchCompanies`). Den kräver
 * 26–32 sidor i tur och ordning (20–40 s) och därmed cache, och inget cachas
 * förrän SCB:s användarvillkor är citerade (docs/moduler/registret.md, "SCB
 * AFR"). Den kastar `ScbListingUnavailableError` (ett platshållarfel), så
 * sektionerna som behöver listan visar "Kommer snart" i stället för ett fel.
 *
 * Fel: SCB svarar med application/problem+json. Felen vi kastar bär aldrig
 * `detail` eller `instance` ur svaret, bara status och vår egen text.
 */

export const SCB_AFR_HOST = "apiafr.scb.se";
const API_VERSION = "v1";
const TIMEOUT_MS = 10_000;
/** Ett /count-svar är några tiotal tecken, kodtabellen ~100 kB. */
const MAX_RESPONSE_CHARS = 1_000_000;
/** SCB:s gräns är 5 anrop/s och nyckel (Sekundärt): minst 250 ms mellan anropen. */
const MIN_INTERVAL_MS = 250;
const CODE_TABLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SEARCH_RESULTS = 12;

/** Webbsidan om företagsregistret, som länk i bevisets källa (bevislagring 7.3c). */
export const SCB_REGISTER_INFO_URL = "https://www.scb.se/vara-tjanster/foretagsregistret/";

/** Listan per SNI är inte byggd (se filens header). Ett platshållarfel. */
export class ScbListingUnavailableError extends NotImplementedError {
  constructor() {
    super("Registret (SCB:s bolagslista per bransch)", "docs/moduler/registret.md");
    this.name = "ScbListingUnavailableError";
  }
}

// ---------------------------------------------------------------- konfiguration

function getApiKey(): string {
  const key = process.env.SCB_AFR_API_KEY?.trim();
  if (!key) {
    throw new RegistryTransportError("SCB_AFR_API_KEY saknas. Sätt den i .env.local och i Vercel (se .env.example).");
  }
  return key;
}

function getBaseUrl(): string {
  const raw = process.env.SCB_AFR_API_BASE_URL?.trim() || `https://${SCB_AFR_HOST}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RegistryTransportError("SCB_AFR_API_BASE_URL är inte en giltig URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== SCB_AFR_HOST ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new RegistryTransportError(`SCB_AFR_API_BASE_URL måste vara https://${SCB_AFR_HOST}, utan sökväg, port eller query.`);
  }
  return `https://${SCB_AFR_HOST}`;
}

// ---------------------------------------------------------------- indata

/** SNI 2025 som AFR vill ha den: fem siffror. Tar också appens form "69.201". */
export function toAfrSni(sniCode: string): string {
  if (typeof sniCode !== "string") throw new RegistryInputError("Ogiltig SNI-kod.");
  const digits = sniCode.trim().replace(".", "");
  if (!/^\d{5}$/.test(digits)) throw new RegistryInputError("Ogiltig SNI-kod (förväntar fem siffror, t.ex. 69.201).");
  return digits;
}

/** Appens form ("69.201") ur AFR:s fem siffror. */
export function fromAfrSni(code: string): string {
  return `${code.slice(0, 2)}.${code.slice(2)}`;
}

// ---------------------------------------------------------------- transport

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let nextSlot = 0;

async function pace(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS;
  if (wait > 0) await sleep(wait);
}

/** Bara testerna: nollställer takten och kodtabellens minne. */
export function resetScbStateForTests(): void {
  nextSlot = 0;
  codeTable = null;
}

async function getJson(path: string, label: string): Promise<unknown> {
  const url = `${getBaseUrl()}/${API_VERSION}/${path}`;
  const key = getApiKey();
  await pace();
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "X-API-Key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new RegistryTransportError(`SCB (${label}): anropet misslyckades (nätverk eller timeout).`);
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    // 503 mellan 04:00 och 04:30 är SCB:s nattliga uppdatering.
    const reason =
      response.status === 503
        ? "registret uppdateras just nu"
        : response.status === 429
          ? "för många anrop, försök igen om en stund"
          : response.status === 401
            ? "nyckeln nekades"
            : `HTTP ${response.status}`;
    throw new RegistryTransportError(`SCB (${label}): ${reason}.`);
  }
  const text = await response.text();
  if (text.length > MAX_RESPONSE_CHARS) throw new RegistryTransportError(`SCB (${label}): svaret är orimligt stort.`);
  try {
    return JSON.parse(text);
  } catch {
    throw new RegistryTransportError(`SCB (${label}): svaret är inte giltig JSON.`);
  }
}

// ---------------------------------------------------------------- antal per bransch

/** Verifierat 2026-09-30: `{ count: 25791, path }`. `path` och okända fält ignoreras. */
const CountResponseSchema = z.object({ count: z.number().int().nonnegative() });

/**
 * Antalet juridiska enheter med huvudbransch `sniCode` i SCB:s
 * företagsregister. Omfattar alla juridiska former (även enskilda firmor),
 * verksamma eller inte: det är registrets eget tal, och etiketten i appen ska
 * säga just det. Ett okänt SNI (404) ger 0.
 */
export async function fetchCompanyCount(sniCode: string): Promise<number> {
  const sni = toAfrSni(sniCode);
  const raw = await getJson(`juridiskaenheter/naringsgren/${sni}/count`, "antal");
  if (raw === null) return 0;
  const parsed = CountResponseSchema.safeParse(raw);
  if (!parsed.success) throw new RegistryTransportError("SCB (antal): oväntat svar (validering misslyckades).");
  return parsed.data.count;
}

// ---------------------------------------------------------------- branschnamn

export type SniIndustry = { code: string; name: string };

/** En rad ur `naringsgrenkoder`: `kod` och `klartext` (Verifierat). Övriga fält ignoreras. */
const CodeRowSchema = z.object({ kod: z.union([z.string(), z.number()]), klartext: z.string() });

let codeTable: { rows: SniIndustry[]; expiresAt: number } | null = null;

/** Tabellen kan komma som en lista eller inslagen i ett objekt. Formen på
 * omslaget är inte verifierad, så båda tas emot. */
function codeRowsOf(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const firstArray = Object.values(raw as Record<string, unknown>).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  throw new RegistryTransportError("SCB (branscher): oväntat svar (ingen lista).");
}

async function loadCodeTable(): Promise<SniIndustry[]> {
  if (codeTable && codeTable.expiresAt > Date.now()) return codeTable.rows;
  const raw = await getJson("kodtabeller/naringsgrenkoder", "branscher");
  const rows: SniIndustry[] = [];
  for (const item of codeRowsOf(raw)) {
    const parsed = CodeRowSchema.safeParse(item);
    if (!parsed.success) continue;
    const code = String(parsed.data.kod).trim();
    const name = parsed.data.klartext.replace(/\s+/g, " ").trim().slice(0, 200);
    if (/^\d{5}$/.test(code) && name) rows.push({ code, name });
  }
  if (rows.length === 0) throw new RegistryTransportError("SCB (branscher): kodtabellen var tom.");
  codeTable = { rows, expiresAt: Date.now() + CODE_TABLE_TTL_MS };
  return rows;
}

function normalize(text: string): string {
  return text.toLocaleLowerCase("sv-SE").normalize("NFC");
}

/** Branschens namn för en SNI-kod, eller null om koden inte finns. */
export async function fetchIndustryName(sniCode: string): Promise<string | null> {
  const sni = toAfrSni(sniCode);
  const rows = await loadCodeTable();
  return rows.find((row) => row.code === sni)?.name ?? null;
}

/**
 * Branscher vars namn innehåller alla orden i sökningen ("el installation"),
 * eller vars kod börjar med de siffror som skrivits. Söktexten är data och
 * används bara för att jämföra med kodtabellen, aldrig i ett anrop.
 */
export async function searchIndustries(text: string): Promise<SniIndustry[]> {
  const query = normalize(typeof text === "string" ? text : "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (query.length < 2) return [];
  const rows = await loadCodeTable();
  const digits = query.replace(/[.\s]/g, "");
  if (/^\d+$/.test(digits)) return rows.filter((row) => row.code.startsWith(digits)).slice(0, MAX_SEARCH_RESULTS);
  const words = query.split(" ");
  return rows
    .filter((row) => {
      const name = normalize(row.name);
      return words.every((word) => name.includes(word));
    })
    .slice(0, MAX_SEARCH_RESULTS);
}

// ---------------------------------------------------------------- bolagslistan

/**
 * Hela bolagslistan per SNI är inte byggd (se filens header). Kastar
 * `ScbListingUnavailableError`, ett platshållarfel, aldrig en tom lista.
 */
export async function fetchCompanies(_filter: { sniCode?: string }): Promise<unknown> {
  void _filter;
  throw new ScbListingUnavailableError();
}
