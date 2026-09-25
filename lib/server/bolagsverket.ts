import "server-only";
import { RegistryInputError, RegistryTransportError } from "@/core/errors";
import { assertRegistryAccessAllowed } from "@/lib/server/registryAccess";
import {
  DokumentlistaResponseSchema,
  OrganisationerResponseSchema,
  TokenResponseSchema,
  type RawOrganisation,
} from "@/lib/server/bolagsverketSchemas";

/**
 * Tunn transportklient för Bolagsverkets API för värdefulla datamängder
 * (docs/dataspiken.md, "Svarsformat, verifierat mot riktiga anrop"). Ingen
 * domänlogik: vilka bolag som får visas avgör adaptern
 * (adapters/live/RegistryProvider.ts). Här översätts bara svaret till en
 * platt form där okänt är null, aldrig en gissning.
 *
 * Säkerhet (docs/moduler/registret.md, "Säkerhet"):
 * - Grinden: varje exporterad funktion anropar assertRegistryAccessAllowed()
 *   först, och en lint-regel låter bara liveadaptern importera filen.
 * - SSRF: token-URL:en är en konstant. Bas-URL:en kommer bara från
 *   BOLAGSVERKET_API_BASE_URL och måste vara https mot *.api.bolagsverket.se.
 *   Indata blir aldrig en del av URL:en, bara av JSON-kroppen.
 * - Org.nr måste vara en juridisk person (tredje siffran >= 2), så ett
 *   personnummer skickas aldrig (dataspiken §6 fråga 4).
 * - Fel bär aldrig `cause` eller svarstext: API:ets felsvar innehåller
 *   request-id, och valideringsfel kan innehålla registervärden.
 * - Gränserna är okända (inga rate limit-headers i steg A), så anropen
 *   görs med minst MIN_INTERVAL_MS mellanrum inom processen.
 *
 * Inte byggt: /dokument och iXBRL (uppskjutet 2026-09-23, inga nya
 * beroenden), därför kastar fetchAnnualFigures fortfarande.
 */

export const BOLAGSVERKET_TOKEN_URL = "https://portal.api.bolagsverket.se/oauth2/token";
const SCOPE = "vardefulla-datamangder:read";
const ALLOWED_HOST_SUFFIX = ".api.bolagsverket.se";
const TIMEOUT_MS = 10_000;
const MAX_RESPONSE_CHARS = 512_000;
/** Förnya token så här långt före utgång. */
const TOKEN_MARGIN_MS = 60_000;
const MIN_INTERVAL_MS = 200;

/** Bolagsverkets källnamn, för källstämpling i adaptern (Datalöftet). */
export const BOLAGSVERKET_SOURCE_NAME = "Bolagsverket";

export type BolagsverketOrganisation = {
  orgNr: string;
  /** Företagsnamnet (organisationsnamntyp FORETAGSNAMN). Null = saknas. */
  name: string | null;
  /** Bolagsverkets organisationsform, t.ex. "AB". */
  legalForm: string | null;
  /** Registreringsdatum hos Bolagsverket (YYYY-MM-DD). Null = saknas, ogiltigt eller felmarkerat. */
  registrationDate: string | null;
  /** SNI-koder som fem siffror, tomma platser borttagna. Version (2007/2025) är inte avgjord. */
  sniCodes: string[];
  /** verksamOrganisation: JA = true, NEJ = false, annat eller saknat = null (okänt). */
  active: boolean | null;
  deregistered: boolean;
  inLiquidationOrRestructuring: boolean;
  /**
   * Null = OKÄNT, inte "ingen spärr" (null i alla svar i steg A, betydelsen är
   * inte klarlagd). En ifylld spärr vi inte känner igen tolkas som true.
   */
  advertisingBlock: boolean | null;
  /** Fem siffror. Län måste härledas ur postnumret, inget eget fält finns. */
  postalCode: string | null;
  postTown: string | null;
  /** Extern fritext: alltid DATA, aldrig instruktion. Adaptern rensar och kortar. */
  description: string | null;
  /** Anropsdagen (YYYY-MM-DD), för Källa.hämtad. */
  fetchedAt: string;
};

// ---------------------------------------------------------------- konfiguration

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.BOLAGSVERKET_CLIENT_ID?.trim();
  const clientSecret = process.env.BOLAGSVERKET_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new RegistryTransportError(
      "BOLAGSVERKET_CLIENT_ID eller BOLAGSVERKET_CLIENT_SECRET saknas. Sätt dem i .env.local (se .env.example).",
    );
  }
  return { clientId, clientSecret };
}

function getBaseUrl(): string {
  const raw = process.env.BOLAGSVERKET_API_BASE_URL?.trim();
  if (!raw) {
    throw new RegistryTransportError(
      "BOLAGSVERKET_API_BASE_URL saknas. Sätt den i .env.local (se .env.example och docs/dataspiken.md).",
    );
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RegistryTransportError("BOLAGSVERKET_API_BASE_URL är inte en giltig URL.");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(ALLOWED_HOST_SUFFIX) ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash
  ) {
    throw new RegistryTransportError(
      `BOLAGSVERKET_API_BASE_URL måste vara https mot *${ALLOWED_HOST_SUFFIX}, utan port, inloggning, query eller fragment.`,
    );
  }
  return url.href.replace(/\/+$/, "");
}

// ---------------------------------------------------------------- indata

/** Luhn över alla tio siffror, samma kontroll som Bolagsverket gör (400 annars). */
function hasValidCheckDigit(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[i]) * (i % 2 === 0 ? 2 : 1);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}

function requireOrgNr(orgNr: string): string {
  if (typeof orgNr !== "string" || !/^\d{10}$/.test(orgNr)) {
    throw new RegistryInputError("Ogiltigt organisationsnummer (förväntar tio siffror utan bindestreck).");
  }
  if (Number(orgNr[2]) < 2) {
    throw new RegistryInputError("Numret ser ut som ett personnummer. Bara juridiska personer slås upp.");
  }
  if (!hasValidCheckDigit(orgNr)) {
    throw new RegistryInputError("Organisationsnumret har ogiltig kontrollsiffra.");
  }
  return orgNr;
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

async function send(url: string, init: RequestInit, label: string): Promise<Response> {
  await pace();
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new RegistryTransportError(`Bolagsverket (${label}): anropet misslyckades (nätverk eller timeout).`);
  }
}

async function readJson(response: Response, label: string): Promise<unknown> {
  const text = await response.text();
  if (text.length > MAX_RESPONSE_CHARS) {
    throw new RegistryTransportError(`Bolagsverket (${label}): svaret är orimligt stort.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new RegistryTransportError(`Bolagsverket (${label}): svaret är inte giltig JSON.`);
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;

async function requestToken(): Promise<string> {
  const { clientId, clientSecret } = getCredentials();
  const response = await send(
    BOLAGSVERKET_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: SCOPE,
      }),
    },
    "token",
  );
  if (!response.ok) {
    throw new RegistryTransportError(`Bolagsverket (token): HTTP ${response.status}.`);
  }
  const parsed = TokenResponseSchema.safeParse(await readJson(response, "token"));
  if (!parsed.success) {
    throw new RegistryTransportError("Bolagsverket (token): oväntat svar.");
  }
  cachedToken = {
    value: parsed.data.access_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000 - TOKEN_MARGIN_MS,
  };
  return cachedToken.value;
}

/** Token ur cachen, annars en ny. Samtidiga anrop delar på samma hämtning. */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  pendingToken ??= requestToken().finally(() => {
    pendingToken = null;
  });
  return pendingToken;
}

/**
 * POST mot API:et med bearer-token. Vid 401 hämtas en ny token och anropet
 * görs om en gång (en token kan dras in före expires_in).
 */
async function postJson(path: string, body: unknown, label: string): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  for (let attempt = 0; ; attempt++) {
    const token = await getToken();
    const response = await send(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
      label,
    );
    if (response.status !== 401 || attempt > 0) return response;
    cachedToken = null;
  }
}

// ---------------------------------------------------------------- mappning

/** Uppgiften räknas bara om delobjektets `fel` är tomt. */
function ok<T extends { fel?: unknown }>(part: T | null | undefined): T | null {
  return part && (part.fel === null || part.fel === undefined) ? part : null;
}

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** OVERIFIERAT hur en satt spärr ser ut. Allt ifyllt som inte uttryckligen är "nej" räknas som spärr. */
function mapAdvertisingBlock(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "object" && "kod" in value) {
    const kod = String((value as { kod: unknown }).kod).toUpperCase();
    if (kod === "NEJ") return false;
  }
  return true;
}

function mapOrganisation(raw: RawOrganisation, fetchedAt: string): BolagsverketOrganisation {
  const names = ok(raw.organisationsnamn)?.organisationsnamnLista ?? [];
  const name = names.find((n) => n.organisationsnamntyp?.kod === "FORETAGSNAMN") ?? null;
  const sni = ok(raw.naringsgrenOrganisation)?.sni ?? [];
  const address = ok(raw.postadressOrganisation)?.postadress;
  const postalCode = address?.postnummer?.replace(/\s/g, "") ?? "";
  const active = ok(raw.verksamOrganisation)?.kod.trim().toUpperCase();

  return {
    orgNr: raw.organisationsidentitet.identitetsbeteckning,
    name: nonEmpty(name?.namn),
    legalForm: nonEmpty(ok(raw.organisationsform)?.kod),
    registrationDate: ok(raw.organisationsdatum)?.registreringsdatum ?? null,
    sniCodes: sni.map((s) => s.kod.trim()).filter((kod) => /^\d{5}$/.test(kod)),
    active: active === "JA" ? true : active === "NEJ" ? false : null,
    deregistered: raw.avregistreradOrganisation !== null && raw.avregistreradOrganisation !== undefined,
    inLiquidationOrRestructuring:
      raw.pagaendeAvvecklingsEllerOmstruktureringsforfarande !== null &&
      raw.pagaendeAvvecklingsEllerOmstruktureringsforfarande !== undefined,
    advertisingBlock: mapAdvertisingBlock(raw.reklamsparr),
    postalCode: /^\d{5}$/.test(postalCode) ? postalCode : null,
    postTown: nonEmpty(address?.postort),
    description: nonEmpty(ok(raw.verksamhetsbeskrivning)?.beskrivning),
    fetchedAt,
  };
}

// ---------------------------------------------------------------- exporterat

/**
 * Slår upp ett bolag på organisationsnummer (POST /organisationer). Tom lista
 * = inte hittat. OVERIFIERAT hur "finns inte" besvaras, så både 404 och en tom
 * lista ger []. Svar för ett annat org.nr än det begärda kastas bort.
 */
export async function lookupOrganisation(orgNr: string): Promise<BolagsverketOrganisation[]> {
  await assertRegistryAccessAllowed();
  const id = requireOrgNr(orgNr);

  const response = await postJson("/organisationer", { identitetsbeteckning: id }, "organisationer");
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new RegistryTransportError(`Bolagsverket (organisationer): HTTP ${response.status}.`);
  }
  const parsed = OrganisationerResponseSchema.safeParse(await readJson(response, "organisationer"));
  if (!parsed.success) {
    throw new RegistryTransportError("Bolagsverket (organisationer): oväntat svar (validering misslyckades).");
  }
  const fetchedAt = new Date().toISOString().slice(0, 10);
  return parsed.data.organisationer
    .filter((o) => o.organisationsidentitet.identitetsbeteckning === id)
    .map((o) => mapOrganisation(o, fetchedAt));
}

/**
 * Listar årsredovisningar för ett bolag (POST /dokumentlista). Elementens form
 * är OVERIFIERAD (listan var tom för alla bolag i steg A): validera dem innan
 * något läses ur dem.
 */
export async function fetchDocumentList(orgNr: string): Promise<Record<string, unknown>[]> {
  await assertRegistryAccessAllowed();
  const id = requireOrgNr(orgNr);

  const response = await postJson("/dokumentlista", { identitetsbeteckning: id }, "dokumentlista");
  if (!response.ok) {
    throw new RegistryTransportError(`Bolagsverket (dokumentlista): HTTP ${response.status}.`);
  }
  const parsed = DokumentlistaResponseSchema.safeParse(await readJson(response, "dokumentlista"));
  if (!parsed.success) {
    throw new RegistryTransportError("Bolagsverket (dokumentlista): oväntat svar (validering misslyckades).");
  }
  return parsed.data.dokument;
}

/**
 * Nyckeltal ur årsredovisningar (iXBRL via /dokument). ÄNNU EJ SKRIVEN:
 * uppskjutet 2026-09-23 (kräver zip-hantering, inga nya beroenden nu, och
 * /dokumentlista har inte gett något dokument än). Kastar RegistryTransportError,
 * aldrig en tom lista.
 */
export async function fetchAnnualFigures(_orgNrs: string[]): Promise<unknown> {
  void _orgNrs;
  throw new RegistryTransportError(
    "Årsredovisningarna (/dokument, iXBRL) är inte byggda än. Se docs/moduler/registret.md.",
  );
}

/** Bara för tester. */
export function resetBolagsverketState(): void {
  cachedToken = null;
  pendingToken = null;
  nextSlot = 0;
}
