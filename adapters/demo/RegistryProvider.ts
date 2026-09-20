import type { Locale } from "@/i18n/context";
import type { RegistryProvider, Competitor } from "@/ports/RegistryProvider";
import type { RegistryCompany } from "@/ports/RegistryProvider";
import type { Källa } from "@/core/domain";

/** De 40 snabbast växande byråerna (9.3 steg 04) — ett representativt urval
 * på 20 visas här, resten summeras i registerstatistiken. SNI 69.201. */
export const saraCompanies: RegistryCompany[] = [
  { name: "Ekbacka Redovisning AB", sniCode: "69.201", employees: 8, revenueKsek: 4200, county: "Stockholms län" },
  { name: "Nordkonsult Ekonomi AB", sniCode: "69.201", employees: 12, revenueKsek: 6100, county: "Stockholms län" },
  { name: "Backafors Bokföringsbyrå AB", sniCode: "69.201", employees: 6, revenueKsek: 3400, county: "Västra Götalands län" },
  { name: "Siffra & Partners AB", sniCode: "69.201", employees: 15, revenueKsek: 8700, county: "Stockholms län" },
  { name: "Ålandsgatans Redovisning AB", sniCode: "69.201", employees: 9, revenueKsek: 4900, county: "Skåne län" },
  { name: "Kvitto & Co Ekonomikonsult AB", sniCode: "69.201", employees: 18, revenueKsek: 11200, county: "Stockholms län" },
  { name: "Lundgren Revision & Redovisning AB", sniCode: "69.201", employees: 7, revenueKsek: 3900, county: "Uppsala län" },
  { name: "Effektbyrån Ekonomi AB", sniCode: "69.201", employees: 11, revenueKsek: 5800, county: "Stockholms län" },
  { name: "Brovik Redovisningskonsulter AB", sniCode: "69.201", employees: 14, revenueKsek: 7300, county: "Östergötlands län" },
  { name: "Klarsikt Bokföring AB", sniCode: "69.201", employees: 6, revenueKsek: 3200, county: "Stockholms län" },
  { name: "Nyckeltal Redovisning AB", sniCode: "69.201", employees: 16, revenueKsek: 9500, county: "Skåne län" },
  { name: "Solid Ekonomi AB", sniCode: "69.201", employees: 10, revenueKsek: 5300, county: "Stockholms län" },
  { name: "Grönlunds Byrå AB", sniCode: "69.201", employees: 5, revenueKsek: 3000, county: "Västmanlands län" },
  { name: "Precis Redovisning AB", sniCode: "69.201", employees: 13, revenueKsek: 7000, county: "Stockholms län" },
  { name: "Ankarnäs Ekonomikonsult AB", sniCode: "69.201", employees: 8, revenueKsek: 4400, county: "Hallands län" },
  { name: "Vidsikt Redovisningsbyrå AB", sniCode: "69.201", employees: 19, revenueKsek: 12500, county: "Stockholms län" },
  { name: "Fasta Punkten Ekonomi AB", sniCode: "69.201", employees: 7, revenueKsek: 3700, county: "Örebro län" },
  { name: "Trygg Bokföring & Lön AB", sniCode: "69.201", employees: 12, revenueKsek: 6400, county: "Stockholms län" },
  { name: "Millimeter Redovisning AB", sniCode: "69.201", employees: 9, revenueKsek: 4800, county: "Jönköpings län" },
  { name: "Överblick Ekonomikonsult AB", sniCode: "69.201", employees: 17, revenueKsek: 10100, county: "Stockholms län" },
];

/** SNI-koden Saras scenario är byggt kring (samma kod på alla `saraCompanies`)
 * — exporterad så att skärmar/routes som behöver den (t.ex. Marknad-sidans
 * storleksfördelning) läser den härifrån i stället för att upprepa strängen. */
export const SARA_MARKET_SNI_CODE = "69.201";

const registerSource: Källa = { namn: "Bolagsverket och SCB", hämtad: "2026-01-09" };
const registerSourceEn: Källa = { namn: "Bolagsverket and Statistics Sweden (SCB)", hämtad: "2026-01-09" };

/**
 * Urvalet bakom medianen/tillväxtandelen/regionandelen (Datalöftet,
 * docs/dataspiken.md §3): bara aktiebolag med digital årsredovisning ger
 * omsättning och tillväxt, och regionen kräver att länet går att härleda ur
 * postadressen. 312 bolag totalt i SNI 69.201 — ingen siffra här låtsas
 * gälla alla 312.
 */
const registerBasis = {
  medianRevenueCompanies: 194,
  growthCompanies: 171,
  regionCompanies: 308,
};

const competitors: Record<Locale, Competitor[]> = {
  sv: [
    { name: "Kvittly (fiktivt)", description: "App för kvittoskanning riktad mot privatpersoner, inte byråer." },
    { name: "ByråFlöde (fiktivt)", description: "Helhetssystem för redovisningsbyråer — dyrt och tungt att införa." },
    { name: "Underlagshjälpen (fiktivt)", description: "Manuell tjänst, ingen automatisering av påminnelser." },
  ],
  en: [
    { name: "Kvittly (fictional)", description: "Receipt-scanning app aimed at individuals, not firms." },
    { name: "ByråFlöde (fictional)", description: "Full accounting-firm platform — expensive and heavy to adopt." },
    { name: "Underlagshjälpen (fictional)", description: "A manual service, no automation of reminders." },
  ],
};

export const demoRegistryProvider: RegistryProvider = {
  async searchCompanies(query) {
    return saraCompanies.filter(
      (company) =>
        company.sniCode === query.sniCode &&
        (query.minEmployees === undefined || company.employees >= query.minEmployees) &&
        (query.maxEmployees === undefined || company.employees <= query.maxEmployees),
    );
  },

  async getMarketOverview(locale: Locale) {
    return {
      companyCount: 312,
      medianRevenueKsek: 4200,
      growthSharePercent: 18,
      regionSharePercent: 31,
      source: locale === "sv" ? registerSource : registerSourceEn,
      competitors: competitors[locale],
      basis: registerBasis,
    };
  },
};
