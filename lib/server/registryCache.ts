import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { RegistryInputError, RegistryTransportError } from "@/core/errors";
import { assertRegistryAccessAllowed } from "@/lib/server/registryAccess";

/**
 * Gemensam servercache för råa registersvar (tabellen public.registry_cache,
 * supabase/migrations/20260923120000_registry_cache.sql). Beslut Erik
 * 2026-09-23 (docs/beslut.md): bara servern läser och skriver, så att ingen
 * användare kan förfalska registerdata som påverkar Marknad-poängen.
 *
 * Tabellen har RLS utan policies och är stängd för alla klienter. Den nås bara
 * med SUPABASE_SERVICE_ROLE_KEY, som går förbi RLS. Nyckeln:
 * - läses bara här (server-only, lint-regel: bara registrets liveadapter och
 *   tester får importera filen), och har aldrig NEXT_PUBLIC_-prefix;
 * - används bara mot registry_cache. Klienten lämnas aldrig ut ur filen.
 *
 * Grinden (assertRegistryAccessAllowed) anropas först i båda metoderna, som i
 * transporterna. OBS: ingenting får skrivas hit förrän dataspiken §6 fråga 4
 * är avgjord (docs/moduler/registret.md, "Licensgrind" punkt 4). set() finns
 * men anropas inte av någon än.
 */

export const REGISTRY_CACHE_SOURCES = ["scb_foretagsregistret", "bolagsverket_vdm"] as const;
export type RegistryCacheSource = (typeof REGISTRY_CACHE_SOURCES)[number];

const TABLE = "registry_cache";
/** Samma tak som check-villkoret i migreringen. */
export const REGISTRY_CACHE_MAX_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Nyckeln byggs i kod av strukturerad indata (SNI-kod, storleksklass, org.nr), aldrig fritext. */
const REQUEST_KEY_PATTERN = /^[A-Za-z0-9._:=,|-]{1,512}$/;
const MAX_RESPONSE_CHARS = 5_000_000;
/** Tillåten klockskillnad för fetchedAt framåt i tiden. */
const CLOCK_SKEW_MS = 60_000;

export type RegistryCacheEntry = {
  response: unknown;
  rowCount: number;
  sourceName: string;
  sourceUrl: string;
  /** ISO-tidpunkt för det faktiska anropet (Källa.hämtad). */
  fetchedAt: string;
  expiresAt: string;
};

export type RegistryCacheInput = {
  source: RegistryCacheSource;
  requestKey: string;
  response: unknown;
  rowCount: number;
  sourceName: string;
  sourceUrl: string;
  /** När svaret hämtades. Standard: nu. Får inte ligga i framtiden. */
  fetchedAt?: Date;
  /** Giltighetstid. Standard och tak: 7 dagar. */
  ttlMs?: number;
};

const RowSchema = z.object({
  response: z.unknown(),
  row_count: z.number().int().nonnegative(),
  source_name: z.string().min(1),
  source_url: z.string().min(1),
  fetched_at: z.string().min(1),
  expires_at: z.string().min(1),
});

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new RegistryTransportError(
      "NEXT_PUBLIC_SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY saknas. Sätt dem i .env.local (se .env.example).",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function requireKey(source: RegistryCacheSource, requestKey: string): void {
  if (!REGISTRY_CACHE_SOURCES.includes(source)) {
    throw new RegistryInputError("Okänd källa för registercachen.");
  }
  if (typeof requestKey !== "string" || !REQUEST_KEY_PATTERN.test(requestKey)) {
    throw new RegistryInputError("Ogiltig cachenyckel (bara strukturerad nyckel, högst 512 tecken).");
  }
}

/**
 * Giltigt cachat svar, eller null. Tar först bort ALLA utgångna rader (inte
 * bara den här nyckeln), så att ingenting ligger kvar längre än 7 dagar så
 * länge cachen används. Utgångna rader returneras aldrig.
 */
async function get(source: RegistryCacheSource, requestKey: string): Promise<RegistryCacheEntry | null> {
  await assertRegistryAccessAllowed();
  requireKey(source, requestKey);
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  // Fel bär aldrig Supabase-meddelandet: det kan innehålla nyckelvärden.
  const purge = await supabase.from(TABLE).delete().lte("expires_at", now);
  if (purge.error) throw new RegistryTransportError("Registercachen: kunde inte rensa utgångna rader.");

  const { data, error } = await supabase
    .from(TABLE)
    .select("response, row_count, source_name, source_url, fetched_at, expires_at")
    .eq("source", source)
    .eq("request_key", requestKey)
    .gt("expires_at", now)
    .maybeSingle();
  if (error) throw new RegistryTransportError("Registercachen: läsningen misslyckades.");
  if (!data) return null;

  const row = RowSchema.safeParse(data);
  if (!row.success) throw new RegistryTransportError("Registercachen: oväntad rad.");
  return {
    response: row.data.response,
    rowCount: row.data.row_count,
    sourceName: row.data.source_name,
    sourceUrl: row.data.source_url,
    fetchedAt: row.data.fetched_at,
    expiresAt: row.data.expires_at,
  };
}

/** Sparar (eller ersätter) svaret för (source, requestKey). */
async function set(input: RegistryCacheInput): Promise<void> {
  await assertRegistryAccessAllowed();
  requireKey(input.source, input.requestKey);

  if (!Number.isInteger(input.rowCount) || input.rowCount < 0) {
    throw new RegistryInputError("rowCount måste vara ett heltal >= 0.");
  }
  if (typeof input.sourceName !== "string" || !input.sourceName.trim()) {
    throw new RegistryInputError("Källnamn saknas (Datalöftet).");
  }
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(input.sourceUrl);
  } catch {
    throw new RegistryInputError("Käll-URL:en är inte en giltig URL.");
  }
  if (sourceUrl.protocol !== "https:") throw new RegistryInputError("Käll-URL:en måste vara https.");

  const now = Date.now();
  const fetchedAt = input.fetchedAt ?? new Date(now);
  if (Number.isNaN(fetchedAt.getTime()) || fetchedAt.getTime() > now + CLOCK_SKEW_MS) {
    throw new RegistryInputError("fetchedAt är ogiltig eller ligger i framtiden.");
  }
  const ttlMs = input.ttlMs ?? REGISTRY_CACHE_MAX_TTL_MS;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > REGISTRY_CACHE_MAX_TTL_MS) {
    throw new RegistryInputError("Giltighetstiden måste vara mellan 0 och 7 dagar.");
  }
  const expiresAt = new Date(fetchedAt.getTime() + ttlMs);
  if (expiresAt.getTime() <= now) return; // redan utgånget: spara inget

  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(input.response);
  } catch {
    serialized = undefined;
  }
  if (serialized === undefined) throw new RegistryInputError("Svaret går inte att spara som JSON.");
  if (serialized.length > MAX_RESPONSE_CHARS) throw new RegistryInputError("Svaret är för stort för cachen.");

  const { error } = await getServiceClient()
    .from(TABLE)
    .upsert(
      {
        source: input.source,
        request_key: input.requestKey,
        response: JSON.parse(serialized),
        row_count: input.rowCount,
        source_name: input.sourceName.trim(),
        source_url: sourceUrl.href,
        fetched_at: fetchedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "source,request_key" },
    );
  if (error) throw new RegistryTransportError("Registercachen: skrivningen misslyckades.");
}

export const registryCache = { get, set };
