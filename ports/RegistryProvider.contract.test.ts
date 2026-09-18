import { expect } from "vitest";
import type { RegistryProvider } from "./RegistryProvider";
import { demoRegistryProvider } from "@/adapters/demo/RegistryProvider";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { describeContract, contractIt } from "./testContract";

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
