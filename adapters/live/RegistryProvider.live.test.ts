// @vitest-environment node
import { describe, expect, it } from "vitest";
import { fetchCompanies } from "@/lib/server/scb";
import { RegistryTransportError } from "@/core/errors";

/**
 * Opt-in-test mot de riktiga registren (docs/bygga-en-modul.md, lager 3). Körs
 * inte i CI: `REGISTRY_LIVE_SMOKE=1 pnpm test adapters/live/RegistryProvider.live.test.ts`.
 *
 * BEGRÄNSNING: transporten (lib/server/scb.ts, bolagsverket.ts) är oskriven —
 * vi har inga nycklar och ingen API-spec (docs/dataspiken.md §6). Idag kan
 * testet bara bevisa att en oskriven transport misslyckas högljutt. Efter
 * spiken ska det bytas mot riktiga anrop: bara aktiebolag, ingen reklamspärr,
 * source.hämtad = dagens datum. Kräver också en öppen licensgrind
 * (REGISTRY_LIVE_ENABLED + inloggad tillåten användare), se docs/moduler/registret.md.
 */
describe.skipIf(!process.env.REGISTRY_LIVE_SMOKE)("Registret mot riktiga källor", () => {
  it("oskriven transport misslyckas högljutt (byts mot riktiga anrop efter spiken)", async () => {
    await expect(fetchCompanies({ sniCode: "69.201" })).rejects.toBeInstanceOf(RegistryTransportError);
  });
});
