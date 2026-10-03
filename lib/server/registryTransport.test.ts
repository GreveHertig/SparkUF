import { describe, expect, it } from "vitest";
import { NotImplementedError, RegistryTransportError, isPlaceholderError } from "@/core/errors";
import { fetchCompanies } from "./scb";
import { fetchAnnualFigures } from "./bolagsverket";

describe("registertransport (ännu inte skriven)", () => {
  // Beslut 2026-10-04 (docs/beslut.md): antalet per bransch finns, men hela
  // listan väntar på cache och SCB:s villkor. Den är ett platshållarfel, så att
  // sektionerna som behöver den visar "Kommer snart" i stället för en felruta.
  it("SCB:s bolagslista kastar ett platshållarfel, aldrig en tom lista", async () => {
    const err = await fetchCompanies({ sniCode: "69.201" }).catch((e) => e);
    expect(err).toBeInstanceOf(NotImplementedError);
    expect(isPlaceholderError(err)).toBe(true);
  });

  it("Bolagsverket kastar ett riktigt RegistryTransportError, inte en tom lista", async () => {
    const err = await fetchAnnualFigures(["5560000000"]).catch((e) => e);
    expect(err).toBeInstanceOf(RegistryTransportError);
    expect(isPlaceholderError(err)).toBe(false);
  });
});
