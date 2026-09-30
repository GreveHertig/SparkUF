import "server-only";
import { RegistryTransportError } from "@/core/errors";

/**
 * Tunn transportklient för SCB:s allmänna företagsregister-API, AFR (lista
 * bolag per SNI). ÄNNU EJ SKRIVEN. Spiken är gjord 2026-09-30
 * (docs/dataspiken.md, "SCB AFR, provkörning 2026-09-30"): kontraktet är
 * https://apiafr.scb.se/swagger/v1/swagger.json, nyckeln skickas i headern
 * X-API-Key (SCB_AFR_API_KEY, bas-URL i SCB_AFR_API_BASE_URL), listor
 * pagineras med limit och cursorId tills pagination.hasMore är false.
 * Förslaget för transporten står i docs/moduler/registret.md, "SCB AFR".
 * Returnerar då rå JSON som adaptern validerar mot lib/server/registrySchemas.ts
 * (som ska skrivas om mot det verkliga svaret).
 *
 * Kastar RegistryTransportError — ett RIKTIGT fel, aldrig NotImplementedError
 * (skulle tystas som "Kommer snart") och aldrig en tom lista.
 * Gränser att respektera: limit 1 000 per sida med eget tak för svarsstorlek
 * (inte Bolagsverkets 512 000 tecken), högst 5 anrop/s per nyckel, 429 med
 * Retry-After, och API:t ligger nere 04:00–04:30 varje natt.
 */
export async function fetchCompanies(_filter: { sniCode?: string }): Promise<unknown> {
  void _filter;
  throw new RegistryTransportError(
    "SCB-transporten är inte skriven än (saknar nycklar och API-spec). Se docs/moduler/registret.md.",
  );
}
