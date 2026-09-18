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
};

/**
 * Modul: Registret (avsnitt 14.3). Liveadapter bygger på Bolagsverket och SCB
 * — stub tills dataavtal finns.
 */
export interface RegistryProvider {
  searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]>;
  getMarketOverview(locale: Locale): Promise<MarketOverview>;
}
