import { expect, vi } from "vitest";
import type { RegistryProvider } from "./RegistryProvider";
import { demoRegistryProvider } from "@/adapters/demo/RegistryProvider";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { describeContract, contractIt } from "./testContract";

// Kontraktstestet ska köra utan nätverk/nycklar i CI. Transporten är dessutom
// oskriven (lib/server/scb.ts, bolagsverket.ts), så den mockas med ett litet,
// syntetiskt urval ("Testbolag", aldrig verkliga eller demons bolagsnamn) i
// den ANTAGNA svarsformen (lib/server/registrySchemas.ts). Grön live-svit här
// bevisar vår mappning/filtrering, INTE att Bolagsverket/SCB ser ut så här.
// Licensgrinden mockas som öppen — dess riktiga beteende (nekat som standard)
// bevisas i lib/server/registryAccess.test.ts och ports/stubStatus.test.ts.
// vi.mock hoisas: factorierna refererar bara literaler, inga importer.
vi.mock("@/lib/server/registryAccess", () => ({
  assertRegistryAccessAllowed: vi.fn(async () => undefined),
}));
vi.mock("@/lib/server/scb", () => ({
  fetchCompanies: vi.fn(async () => ({
    companies: [
      { orgNr: "5560000001", name: "Testbolag Ett AB", legalForm: "AB", sniCode: "69.201", employees: 12, county: "Stockholms län", description: "Bokföring för småföretag.", deregistered: false, advertisingBlock: false },
      { orgNr: "5560000002", name: "Testbolag Två AB", legalForm: "AB", sniCode: "69.201", employees: 6, county: "Skåne län", description: "Redovisning.", deregistered: false, advertisingBlock: false },
      { orgNr: "5560000003", name: "Testbolag Tre AB", legalForm: "AB", sniCode: "69.201", employees: 14, county: null, description: null, deregistered: false, advertisingBlock: false },
      { orgNr: "5560000004", name: "Spärrat AB", legalForm: "AB", sniCode: "69.201", employees: 12, county: "Skåne län", description: "x", deregistered: false, advertisingBlock: true },
      { orgNr: "5560000005", name: "Enskild Firma", legalForm: "EF", sniCode: "69.201", employees: 12, county: "Skåne län", description: "x", deregistered: false, advertisingBlock: false },
      { orgNr: "5560000006", name: "Annan Bransch AB", legalForm: "AB", sniCode: "10.000", employees: 12, county: "Skåne län", description: "x", deregistered: false, advertisingBlock: false },
    ],
  })),
}));
vi.mock("@/lib/server/bolagsverket", () => ({
  fetchAnnualFigures: vi.fn(async () => ({
    reports: [
      { orgNr: "5560000001", revenueKsek: 5000, previousRevenueKsek: 4000 },
      { orgNr: "5560000002", revenueKsek: 3000, previousRevenueKsek: 3500 },
      { orgNr: "5560000003", revenueKsek: 4200, previousRevenueKsek: null },
    ],
  })),
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

    contractIt("getMarketOverview har alltid en ifylld källa (Datalöftet)", async () => {
      const overview = await registry.getMarketOverview("sv");
      expect(overview.source.namn).toBeTruthy();
      expect(overview.source.hämtad).toBeTruthy();
      expect(Array.isArray(overview.competitors)).toBe(true);
    });

    contractIt("getMarketOverview svarar på båda språken", async () => {
      const sv = await registry.getMarketOverview("sv");
      const en = await registry.getMarketOverview("en");
      expect(sv.source.namn).toBeTruthy();
      expect(en.source.namn).toBeTruthy();
    });
  },
);
