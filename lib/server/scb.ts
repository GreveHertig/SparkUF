import "server-only";
import { RegistryTransportError } from "@/core/errors";

/**
 * Tunn transportklient för SCB:s företagsregister-API (lista bolag per
 * SNI). ÄNNU EJ SKRIVEN: vi vet inte bas-URL, autentisering (certifikat →
 * API-nycklar i september 2026, docs/dataspiken.md §6 rad 8) eller svarets
 * form, och enligt projektregeln hittar vi inte på miljövariabelnamn eller
 * endpoints i förväg. Skrivs efter spiken (docs/dataspiken.md §3) och
 * returnerar då rå JSON som adaptern validerar mot lib/server/registrySchemas.ts.
 *
 * Kastar RegistryTransportError — ett RIKTIGT fel, aldrig NotImplementedError
 * (skulle tystas som "Kommer snart") och aldrig en tom lista.
 * Kända gränser att respektera när den skrivs: max 2 000 rader/anrop och
 * 10 anrop/10 s per användare (Sekundärt, dataspiken §2).
 */
export async function fetchCompanies(_filter: { sniCode?: string }): Promise<unknown> {
  void _filter;
  throw new RegistryTransportError(
    "SCB-transporten är inte skriven än (saknar nycklar och API-spec). Se docs/moduler/registret.md.",
  );
}
