import "server-only";
import { RegistryInputError, RegistryTransportError } from "@/core/errors";
import { assertRegistryAccessAllowed } from "@/lib/server/registryAccess";
import {
  AfrCountSchema,
  AfrLegalUnitSchema,
  AfrPageSchema,
  PERSON_JURFORM,
} from "@/lib/server/registrySchemas";

/**
 * Tunn transportklient för SCB:s allmänna företagsregister-API, AFR
 * (docs/dataspiken.md, "SCB AFR, provkörning 2026-09-30", och
 * docs/moduler/registret.md, "SCB AFR"). Listar juridiska enheter med en
 * SNI-kod som huvudbransch. Ingen domänlogik: vilka bolag som räknas och får
 * visas avgör adaptern (adapters/live/RegistryProvider.ts).
 *
 * Säkerhet (docs/moduler/registret.md, "Säkerhet"):
 * - Grinden: varje exporterad funktion anropar assertRegistryAccessAllowed()
 *   först, och lint-regeln `registryTransportPattern` låter bara liveadaptern
 *   och tester importera filen.
 * - SSRF: bas-URL:en kommer bara från SCB_AFR_API_BASE_URL och måste vara
 *   https mot exakt apiafr.scb.se. Indata blir bara en validerad SNI-kod (fem
 *   siffror) i sökvägen och ett tal i cursorId.
 * - Nyckeln (SCB_AFR_API_KEY) skickas bara i headern X-API-Key och skrivs
 *   aldrig ut.
 * - Fel bär aldrig `cause`, `detail` eller `instance` (problem+json kan bära
 *   request-id), och valideringsfel bär aldrig registervärden.
 * - Fysiska personer (jurform 10) och dödsbon (91) lämnar aldrig transporten
 *   (dataspiken §6 fråga 4). Bara de fält adaptern behöver returneras.
 *
 * Gränser: limit 1 000 per sida (~430 kB), eget tak för svarsstorlek, högst
 * 4 anrop/s inom processen (SCB tillåter 5 per nyckel), en ny chans vid 429
 * med kort Retry-After, och ett tak på antal rader per bransch. API:t ligger
 * nere 04:00–04:30 varje natt; ett 503 då ger ett eget felmeddelande.
 *
 * Ingen lagring: inget cachas förrän SCB:s användarvillkor är citerade i
 * docs/dataspiken.md (registret.md, "Cache i registry_cache"). Samtidiga
 * anrop för samma bransch delar ändå på samma genomgång, så att
 * marknadsbilden och bolagslistan på samma sida bara går igenom listan en gång.
 */

const ALLOWED_HOST = "apiafr.scb.se";
const API_VERSION = "/v1";
const PAGE_LIMIT = 1000;
const TIMEOUT_MS = 15_000;
/** En sida med 1 000 rader är ~430 kB; taket lämnar marginal utan att släppa igenom orimliga svar. */
const MAX_RESPONSE_CHARS = 1_500_000;
/** Minst så här långt mellan anropen: 4 per sekund, under SCB:s 5. */
const MIN_INTERVAL_MS = 250;
/** Fler juridiska enheter än så i en bransch går vi inte igenom (80 sidor). */
export const MAX_UNITS_PER_SNI = 80_000;
/** Längsta Retry-After vi väntar ut vid 429 innan vi ger upp. */
const MAX_RETRY_AFTER_S = 5;
/** Hela genomgången av en bransch får ta högst så här lång tid (sidans gräns är 60 s). */
const WALK_DEADLINE_MS = 50_000;

/** SCB:s källnamn, för källstämpling i adaptern (Datalöftet). */
export const SCB_SOURCE_NAME = "SCB:s företagsregister";

/** En juridisk enhet som adaptern får den: bara fält som behövs, aldrig en fysisk person. */
export type ScbLegalUnit = {
  orgNr: string;
  name: string;
  /** Huvudbranschen, fem siffror (SNI 2025). */
  sniCode: string;
  /** SCB:s jurform, t.ex. "49" för övriga aktiebolag. */
  legalFormCode: string | null;
  /** SCB:s storleksklass (anstKl). `null` = uppgift saknas (kod 0 eller okänd). */
  employeeClass: string | null;
  /** ftgStat 1. Allt annat är inte verksam. */
  active: boolean;
  /** reklamSparrTyp 1 ("tar emot reklam"). 2, saknat och okända värden räknas som spärr. */
  receivesAdvertising: boolean;
  /** Länskod för sätet. `null` = okänt (00, 99 eller saknat). */
  countyCode: string | null;
};

export type ScbBranchListing = {
  units: ScbLegalUnit[];
  /** Alla juridiska enheter med branschen som huvudbransch, enligt /count (även fysiska personer). */
  registeredTotal: number;
  /** Anropsdagen (YYYY-MM-DD), för Källa.hämtad. */
  fetchedAt: string;
};

// ---------------------------------------------------------------- konfiguration

function getApiKey(): string {
  const key = process.env.SCB_AFR_API_KEY?.trim();
  if (!key) {
    throw new RegistryTransportError("SCB_AFR_API_KEY saknas. Sätt den i .env.local (se .env.example).");
  }
  return key;
}

function getBaseUrl(): string {
  const raw = process.env.SCB_AFR_API_BASE_URL?.trim();
  if (!raw) {
    throw new RegistryTransportError(
      "SCB_AFR_API_BASE_URL saknas. Sätt den i .env.local (se .env.example och docs/dataspiken.md).",
    );
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RegistryTransportError("SCB_AFR_API_BASE_URL är inte en giltig URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== ALLOWED_HOST ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new RegistryTransportError(
      `SCB_AFR_API_BASE_URL måste vara https://${ALLOWED_HOST} utan sökväg, port, inloggning, query eller fragment.`,
    );
  }
  return `https://${ALLOWED_HOST}`;
}

// ---------------------------------------------------------------- indata

/** SNI 2025 som fem siffror. "69.201" godtas och blir "69201". */
export function toAfrSni(sniCode: string): string {
  const trimmed = typeof sniCode === "string" ? sniCode.trim() : "";
  const digits = /^\d{2}\.\d{3}$/.test(trimmed) ? trimmed.replace(".", "") : trimmed;
  if (!/^\d{5}$/.test(digits)) {
    throw new RegistryInputError("Ogiltig SNI-kod (förväntar fem siffror, till exempel 69.201 eller 69201).");
  }
  return digits;
}

// ---------------------------------------------------------------- transport

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let nextSlot = 0;

/** Minst MIN_INTERVAL_MS mellan anropen. Best-effort, bara inom processen. */
async function pace(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_INTERVAL_MS;
  if (wait > 0) await sleep(wait);
}

/** Klockan i Stockholm, för att känna igen nattfönstret 04:00–04:30. */
function inNightlyWindow(now: Date = new Date()): boolean {
  const [hour, minute] = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .split(":")
    .map(Number);
  return hour === 4 && minute < 35;
}

async function get(path: string, label: string, deadline = Number.POSITIVE_INFINITY): Promise<unknown> {
  const url = `${getBaseUrl()}${API_VERSION}${path}`;
  const key = getApiKey();
  for (let attempt = 0; ; attempt++) {
    await pace();
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new RegistryTransportError(`SCB (${label}): genomgången tog för lång tid. Välj en smalare SNI-kod.`);
    }
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", "X-API-Key": key },
        // Nyckeln följer aldrig med en omdirigering till en annan värd.
        redirect: "error",
        signal: AbortSignal.timeout(Math.min(TIMEOUT_MS, remaining)),
      });
    } catch {
      throw new RegistryTransportError(`SCB (${label}): anropet misslyckades (nätverk eller timeout).`);
    }

    if (response.status === 429 && attempt === 0) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      if (Number.isFinite(retryAfter) && retryAfter >= 0 && retryAfter <= MAX_RETRY_AFTER_S) {
        await sleep(retryAfter * 1000);
        continue;
      }
    }
    if (response.status === 503 && inNightlyWindow()) {
      throw new RegistryTransportError(
        "SCB (nattfönster): registret uppdateras 04:00–04:30. Försök igen om en stund.",
      );
    }
    if (!response.ok) {
      throw new RegistryTransportError(`SCB (${label}): HTTP ${response.status}.`);
    }

    const declared = Number(response.headers.get("Content-Length"));
    if (Number.isFinite(declared) && declared > MAX_RESPONSE_CHARS * 4) {
      throw new RegistryTransportError(`SCB (${label}): svaret är orimligt stort.`);
    }
    const text = await response.text();
    if (text.length > MAX_RESPONSE_CHARS) {
      throw new RegistryTransportError(`SCB (${label}): svaret är orimligt stort.`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new RegistryTransportError(`SCB (${label}): svaret är inte giltig JSON.`);
    }
  }
}

function toUnit(raw: unknown, sni: string): ScbLegalUnit | null {
  const parsed = AfrLegalUnitSchema.safeParse(raw);
  if (!parsed.success) {
    // Bara vägen till felet, aldrig värdena (de kan vara registeruppgifter).
    const where = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new RegistryTransportError(`SCB (lista): oväntat svar (validering misslyckades: ${where}).`);
  }
  const unit = parsed.data;
  const legalFormCode = unit.jurform || null;
  // Okänd juridisk form kan vara en person: stängt som standard.
  if (!legalFormCode || PERSON_JURFORM.has(legalFormCode)) return null;

  const branch = unit.primarNaringsgren?.naringsgren ?? "";
  if (branch !== sni) return null;
  const name = unit.namn.trim();
  if (!name) return null;

  const employeeClass = unit.anstKl && unit.anstKl !== "0" ? unit.anstKl : null;
  const county = unit.lanSate && unit.lanSate !== "00" && unit.lanSate !== "99" ? unit.lanSate.padStart(2, "0") : null;

  return {
    orgNr: unit.orgNr,
    name,
    sniCode: branch,
    legalFormCode,
    employeeClass,
    active: unit.ftgStat === "1",
    receivesAdvertising: String(unit.reklamSparrTyp ?? "").trim() === "1",
    countyCode: county,
  };
}

async function countBySni(sni: string, deadline: number): Promise<number> {
  const parsed = AfrCountSchema.safeParse(await get(`/juridiskaenheter/naringsgren/${sni}/count`, "antal", deadline));
  if (!parsed.success) throw new RegistryTransportError("SCB (antal): oväntat svar.");
  return parsed.data.count;
}

async function walkBranch(sni: string): Promise<ScbBranchListing> {
  const deadline = Date.now() + WALK_DEADLINE_MS;
  const registeredTotal = await countBySni(sni, deadline);
  if (registeredTotal > MAX_UNITS_PER_SNI) {
    throw new RegistryTransportError(
      `SCB (lista): branschen har fler än ${MAX_UNITS_PER_SNI} juridiska enheter och gås inte igenom. Välj en smalare SNI-kod.`,
    );
  }

  const units: ScbLegalUnit[] = [];
  const maxPages = Math.ceil(MAX_UNITS_PER_SNI / PAGE_LIMIT);
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const query = cursor === null ? `?limit=${PAGE_LIMIT}` : `?limit=${PAGE_LIMIT}&cursorId=${encodeURIComponent(cursor)}`;
    const parsed = AfrPageSchema.safeParse(await get(`/juridiskaenheter/naringsgren/${sni}${query}`, "lista", deadline));
    if (!parsed.success) throw new RegistryTransportError("SCB (lista): oväntat svar (sidan saknar jes eller pagination).");

    for (const raw of parsed.data.jes) {
      const unit = toUnit(raw, sni);
      if (unit) units.push(unit);
    }
    const { hasMore, nextCursorId } = parsed.data.pagination;
    if (!hasMore) return { units, registeredTotal, fetchedAt: new Date().toISOString().slice(0, 10) };

    const next = nextCursorId === null || nextCursorId === undefined ? "" : String(nextCursorId);
    if (!/^\d+$/.test(next) || next === cursor) {
      throw new RegistryTransportError("SCB (lista): pagineringen gav ingen giltig nästa sida.");
    }
    cursor = next;
  }
  // Ett avkortat urval skulle ge fel antal: hellre ett fel än en tyst för låg siffra.
  throw new RegistryTransportError("SCB (lista): listan tog inte slut inom taket för antal sidor.");
}

const inFlight = new Map<string, Promise<ScbBranchListing>>();

/**
 * Alla juridiska enheter med `sniCode` som huvudbransch (rangordning 1), utom
 * fysiska personer och dödsbon. Går igenom hela listan sida för sida tills
 * `hasMore` är false. Kastar RegistryTransportError, aldrig en tom eller
 * avkortad lista, när något går fel.
 */
export async function fetchLegalUnitsBySni(sniCode: string): Promise<ScbBranchListing> {
  await assertRegistryAccessAllowed();
  const sni = toAfrSni(sniCode);
  let pending = inFlight.get(sni);
  if (!pending) {
    pending = walkBranch(sni).finally(() => inFlight.delete(sni));
    inFlight.set(sni, pending);
  }
  return pending;
}

/** Bara för tester. */
export function resetScbState(): void {
  nextSlot = 0;
  inFlight.clear();
}
