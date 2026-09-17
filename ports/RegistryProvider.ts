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

/**
 * Modul: Registret (avsnitt 14.3). Liveadapter bygger på Bolagsverket och SCB
 * — stub tills dataavtal finns.
 */
export interface RegistryProvider {
  searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]>;
}
