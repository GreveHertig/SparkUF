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
  /** Antal anställda. Liveadaptern ger storleksklassens nedre gräns (SCB ger klasser, aldrig exakta tal). */
  employees: number;
  /**
   * Senaste omsättning i tusentals kronor. `null` = okänd: SCB:s register har
   * ingen omsättning, och årsredovisningarna (iXBRL) är inte byggda än.
   */
  revenueKsek: number | null;
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
   * Konkurrenternas källa, när den skiljer sig från siffrornas (liveadaptern:
   * namnen ur SCB, beskrivningarna ur Bolagsverket). Valfri: demot sätter den inte.
   */
  competitorsSource?: Källa;
  /**
   * Alla juridiska enheter med branschen som huvudbransch, även enskilda
   * firmor och de som inte längre är verksamma. Bara ett antal, aldrig namn
   * (beslut 2026-10-04, dataspiken §6 fråga 4). Valfri: demot sätter den inte.
   */
  registeredTotal?: number;
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
 * Modul: Registret (avsnitt 14.3). Liveadapter bygger på SCB:s
 * företagsregister (AFR) och Bolagsverket. Grindad tills de tre kraven under
 * "Licensgrind" i docs/moduler/registret.md är uppfyllda.
 */
export interface RegistryProvider {
  searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]>;
  /**
   * `sniCode` avgränsar sammanfattningen till en bransch. Valfri så att demot
   * (fast Sara-bransch) fungerar utan den. Liveadaptern kräver den och kastar
   * `RegistryInputError` utan: hela registret gås aldrig igenom
   * (docs/moduler/registret.md, "SCB AFR").
   */
  getMarketOverview(locale: Locale, sniCode?: string): Promise<MarketOverview>;
}
