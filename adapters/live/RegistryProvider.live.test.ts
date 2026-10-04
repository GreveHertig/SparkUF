// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

/**
 * Provkörning mot de riktiga registren (docs/bygga-en-modul.md, lager 3, och
 * grindkrav 1 i docs/moduler/registret.md, "Licensgrind"). Körs inte i CI.
 * Claude Codes miljö når varken SCB eller Bolagsverket, så Erik kör det från
 * sin egen dator:
 *
 *   REGISTRY_LIVE_SMOKE=1 REGISTRY_SMOKE_USER_ID=<ditt Supabase user.id> \
 *     node --env-file=.env.local node_modules/vitest/vitest.mjs run \
 *     adapters/live/RegistryProvider.live.test.ts
 *
 * Kräver i .env.local: SCB_AFR_API_KEY, SCB_AFR_API_BASE_URL,
 * BOLAGSVERKET_CLIENT_ID, BOLAGSVERKET_CLIENT_SECRET,
 * BOLAGSVERKET_API_BASE_URL, REGISTRY_LIVE_ENABLED=true och
 * REGISTRY_ALLOWED_USER_IDS med samma user.id. Grinden är den riktiga; bara
 * inloggningen är utbytt mot REGISTRY_SMOKE_USER_ID, som i provkörningen
 * 2026-09-24.
 *
 * Utskriften visar bara antal, andelar och om fälten är ifyllda. Inga
 * bolagsnamn, org.nr eller beskrivningar skrivs ut. Genomgången av en hel
 * bransch tar 20–40 sekunder.
 */
vi.mock("@/lib/server/session", () => ({
  getCurrentUser: async () => (process.env.REGISTRY_SMOKE_USER_ID ? { id: process.env.REGISTRY_SMOKE_USER_ID } : null),
}));

const SNI = process.env.REGISTRY_SMOKE_SNI ?? "69.201";

describe.skipIf(!process.env.REGISTRY_LIVE_SMOKE)("Registret mot riktiga källor (opt-in)", () => {
  it(
    "marknadsbilden och bolagslistan för en bransch, med källa och utan påhittade siffror",
    async () => {
      const { liveRegistryProvider } = await import("@/adapters/live/RegistryProvider");
      const started = Date.now();
      const [overview, companies] = await Promise.all([
        liveRegistryProvider.getMarketOverview("sv", SNI),
        liveRegistryProvider.searchCompanies({ sniCode: SNI }),
      ]);

      console.log(
        JSON.stringify(
          {
            sni: SNI,
            sekunder: Math.round((Date.now() - started) / 1000),
            verksammaAktiebolag: overview.companyCount,
            stockholmProcent: overview.regionSharePercent,
            underlag: overview.basis,
            källa: overview.source,
            konkurrenter: overview.competitors.length,
            konkurrenterMedBeskrivning: overview.competitors.filter((c) => c.description).length,
            namngivnaBolag: companies.length,
            bolagMedLän: companies.filter((c) => c.county).length,
            storleksklasser: [...new Set(companies.map((c) => c.employees))].sort((a, b) => a - b),
          },
          null,
          2,
        ),
      );

      expect(overview.source.namn).toBeTruthy();
      expect(overview.source.hämtad).toBe(new Date().toISOString().slice(0, 10));
      expect(overview.companyCount).toBeGreaterThan(0);
      expect(overview.basis?.medianRevenueCompanies).toBe(0);
      expect(companies.length).toBeGreaterThan(0);
      for (const company of companies) {
        expect(company.revenueKsek).toBeNull();
        expect(company.name).not.toMatch(/fiktiv|fictional/i);
      }
    },
    120_000,
  );
});
