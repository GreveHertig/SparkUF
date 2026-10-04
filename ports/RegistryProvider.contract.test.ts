import { expect, vi } from "vitest";
import type { RegistryProvider } from "./RegistryProvider";
import { demoRegistryProvider } from "@/adapters/demo/RegistryProvider";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { describeContract, contractIt } from "./testContract";

// Kontraktstestet ska köra utan nätverk och nycklar i CI, så transporterna
// mockas med ett litet, syntetiskt urval ("Testbolag", aldrig verkliga eller
// demots bolagsnamn) i den form transporterna ger (lib/server/scb.ts,
// lib/server/bolagsverket.ts). Svarsformen från SCB och Bolagsverket prövas i
// transporternas egna tester. Licensgrinden mockas som öppen; dess riktiga
// beteende (nekat som standard) bevisas i lib/server/registryAccess.test.ts och
// ports/stubStatus.test.ts. vi.mock hoisas: factorierna refererar bara literaler.
vi.mock("@/lib/server/registryAccess", () => ({
  assertRegistryAccessAllowed: vi.fn(async () => undefined),
}));
vi.mock("@/lib/server/scb", () => ({
  fetchLegalUnitsBySni: vi.fn(async (sni: string) => ({
    fetchedAt: "2026-10-04",
    registeredTotal: 9,
    units:
      sni.replace(".", "") !== "69201"
        ? []
        : [
            { orgNr: "5560000001", name: "Testbolag Ett AB", sniCode: "69201", legalFormCode: "49", employeeClass: "4", active: true, receivesAdvertising: true, countyCode: "01" },
            { orgNr: "5560000002", name: "Testbolag Två AB", sniCode: "69201", legalFormCode: "49", employeeClass: "3", active: true, receivesAdvertising: true, countyCode: "12" },
            { orgNr: "5560000003", name: "Testbolag Tre AB", sniCode: "69201", legalFormCode: "49", employeeClass: "5", active: true, receivesAdvertising: true, countyCode: null },
            { orgNr: "5560000004", name: "Spärrat AB", sniCode: "69201", legalFormCode: "49", employeeClass: "4", active: true, receivesAdvertising: false, countyCode: "12" },
            { orgNr: "5560000005", name: "Handelsbolaget", sniCode: "69201", legalFormCode: "31", employeeClass: "4", active: true, receivesAdvertising: true, countyCode: "12" },
          ],
  })),
}));
vi.mock("@/lib/server/bolagsverket", () => ({
  lookupOrganisation: vi.fn(async (orgNr: string) => [
    {
      orgNr,
      name: `Testbolag ${orgNr} AB`,
      legalForm: "AB",
      registrationDate: "2015-01-01",
      sniCodes: ["69201"],
      active: true,
      deregistered: false,
      inLiquidationOrRestructuring: false,
      advertisingBlock: null,
      postalCode: "11122",
      postTown: "STOCKHOLM",
      description: "Redovisning för småföretag.",
      fetchedAt: "2026-10-04",
    },
  ]),
}));

describeContract<RegistryProvider>(
  "RegistryProvider",
  { demo: demoRegistryProvider, live: liveRegistryProvider },
  (registry) => {
    contractIt("searchCompanies returnerar bara bolag som matchar SNI-koden", async () => {
      const result = await registry.searchCompanies({ sniCode: "69.201" });
      expect(Array.isArray(result)).toBe(true);
      for (const company of result) {
        expect(company.sniCode).toBe("69.201");
      }
    });

    contractIt("searchCompanies respekterar anställdaintervallet", async () => {
      const result = await registry.searchCompanies({
        sniCode: "69.201",
        minEmployees: 10,
        maxEmployees: 15,
      });
      for (const company of result) {
        expect(company.employees).toBeGreaterThanOrEqual(10);
        expect(company.employees).toBeLessThanOrEqual(15);
      }
    });

    contractIt("searchCompanies på en SNI-kod utan träffar ger tom lista, inte fel", async () => {
      const result = await registry.searchCompanies({ sniCode: "00.000" });
      expect(result).toEqual([]);
    });

    // Med SNI-kod: liveadaptern går aldrig igenom hela registret (porten).
    contractIt("getMarketOverview har alltid en ifylld källa (Datalöftet)", async () => {
      const overview = await registry.getMarketOverview("sv", "69.201");
      expect(overview.source.namn).toBeTruthy();
      expect(overview.source.hämtad).toBeTruthy();
      expect(Array.isArray(overview.competitors)).toBe(true);
    });

    contractIt("getMarketOverview svarar på båda språken", async () => {
      const sv = await registry.getMarketOverview("sv", "69.201");
      const en = await registry.getMarketOverview("en", "69.201");
      expect(sv.source.namn).toBeTruthy();
      expect(en.source.namn).toBeTruthy();
    });
  },
);
