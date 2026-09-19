import type { Locale } from "@/i18n/context";
import type { Källa } from "@/core/domain";

export type RegistryQuery = {
  sniCode: string;
  minEmployees?: number;
  maxEmployees?: number;
};

export type RegistryCompany = {
  name: string;
  sniCode: string;
  employees: number;
  revenueKsek: number;
  county: string;
};

export type Competitor = {
  name: string;
  description: string;
};

/** Registerbilden för /app/marknad (avsnitt 6, 9.3 steg 03). */
export type MarketOverview = {
  companyCount: number;
  medianRevenueKsek: number;
  growthSharePercent: number;
  regionSharePercent: number;
  source: Källa;
  competitors: Competitor[];
  /**
   * Underlaget bakom siffrorna (Datalöftet, docs/dataspiken.md §3): medianen
   * och tillväxtandelen kan bara räknas på bolag med digital årsredovisning,
   * regionandelen bara på bolag där län går att härleda. Ett antal på 0 betyder
   * att siffran är OKÄND och inte får visas (fältet är då 0, inte ett mått).
   * Valfritt: demot sätter det inte, liveadaptern alltid.
   * Liveadaptern definierar tillväxt som >10 % över föregående år och regionandel
   * som Stockholms län (samma påståenden som etiketterna i i18n).
   */
  basis?: {
    medianRevenueCompanies: number;
    growthCompanies: number;
    regionCompanies: number;
  };
};

/**
 * Modul: Registret (avsnitt 14.3). Liveadapter bygger på Bolagsverket och SCB.
 * Grindad tills licensen är Verifierat (docs/moduler/registret.md,
 * "Licensgrind"); transporten är oskriven tills spiken är gjord.
 */
export interface RegistryProvider {
  searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]>;
  /**
   * `sniCode` avgränsar sammanfattningen till en bransch. Utan den gäller
   * den hela registret. Valfri så att demot (fast Sara-bransch) och
   * kontraktstestet är oförändrade.
   */
  getMarketOverview(locale: Locale, sniCode?: string): Promise<MarketOverview>;
}
