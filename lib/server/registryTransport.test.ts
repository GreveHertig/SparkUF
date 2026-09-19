import { describe, expect, it } from "vitest";
import { NotImplementedError, RegistryTransportError, isPlaceholderError } from "@/core/errors";
import { fetchCompanies } from "./scb";
import { fetchAnnualFigures } from "./bolagsverket";

describe("registertransport (ännu inte skriven)", () => {
  it("SCB kastar ett riktigt RegistryTransportError, inte en tom lista", async () => {
    const err = await fetchCompanies({ sniCode: "69.201" }).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(err).not.toBeInstanceOf(NotImplementedError);
    expect(isPlaceholderError(err)).toBe(false);
  });

  it("Bolagsverket kastar ett riktigt RegistryTransportError, inte en tom lista", async () => {
    const err = await fetchAnnualFigures(["5560000000"]).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(isPlaceholderError(err)).toBe(false);
  });
});
