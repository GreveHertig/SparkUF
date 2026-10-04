import { describe, expect, it } from "vitest";
import { RegistryTransportError, isPlaceholderError } from "@/core/errors";
import { fetchAnnualFigures } from "./bolagsverket";

/**
 * Det som fortfarande inte är skrivet i registertransporten. SCB-delen är
 * skriven sedan 2026-10-04 och prövas i lib/server/scb.test.ts.
 */
describe("registertransport: det som inte är skrivet än", () => {
  it("årsredovisningarna kastar ett riktigt RegistryTransportError, inte en tom lista", async () => {
    const err = await fetchAnnualFigures(["5560000000"]).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(isPlaceholderError(err)).toBe(false);
  });
});
