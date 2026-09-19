import "server-only";
import { RegistryTransportError } from "@/core/errors";

/**
 * Tunn transportklient för Bolagsverkets API för värdefulla datamängder
 * (årsredovisningar/iXBRL per organisationsnummer). ÄNNU EJ SKRIVEN, samma
 * skäl som lib/server/scb.ts: inga nycklar, ingen spec, inga påhittade
 * endpoints eller variabelnamn. Returnerar rå JSON som adaptern validerar mot
 * lib/server/registrySchemas.ts. Kastar RegistryTransportError, aldrig en
 * tom lista.
 */
export async function fetchAnnualFigures(_orgNrs: string[]): Promise<unknown> {
  void _orgNrs;
  throw new RegistryTransportError(
    "Bolagsverket-transporten är inte skriven än (saknar nycklar och API-spec). Se docs/moduler/registret.md.",
  );
}
