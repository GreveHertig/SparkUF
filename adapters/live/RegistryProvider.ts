import type { Locale } from "@/i18n/context";
import type {
  Competitor,
  MarketOverview,
  RegistryCompany,
  RegistryProvider,
  RegistryQuery,
} from "@/ports/RegistryProvider";
import { RegistryInputError, RegistryTransportError } from "@/core/errors";
import { cleanText } from "@/core/text";
import { assertRegistryAccessAllowed } from "@/lib/server/registryAccess";
import { fetchCompanies } from "@/lib/server/scb";
import { fetchAnnualFigures } from "@/lib/server/bolagsverket";
import {
  AKTIEBOLAG_FORM,
  AnnualFiguresResponseSchema,
  RegistryRowsResponseSchema,
  type AnnualFigures,
  type RegistryRow,
} from "@/lib/server/registrySchemas";

/**
 * Liveadapter för Registret (docs/moduler/registret.md). Domänlogiken är vår
 * (grind, indatavalidering, aktiebolag utan reklamspärr, källstämpling,
 * ärlighet kring luckor); transporten (lib/server/scb.ts, bolagsverket.ts) är
 * ännu oskriven och svarsformerna är ANTAGANDEN (lib/server/registrySchemas.ts).
 *
 * Extern data är DATA: allt valideras med .strict()-scheman, texter från
 * registret rensas och kortas och används aldrig som instruktion. Ingenting
 * hittas på: saknas en siffra utelämnas bolaget eller basis anger 0.
 */

const SNI_PATTERN = /^\d{2}\.\d{3}$/;
/** SCB:s dokumenterade radtak per anrop (Sekundärt, dataspiken §2). Nås det är listan troligen avkortad. */
const SCB_ROW_CAP = 2000;
/** Etiketterna i UI:t (i18n marknad) lovar exakt detta: tillväxt över 10 % och Stockholmsregionen. */
const GROWTH_THRESHOLD = 1.1;
/** ANTAGANDE: länsnamnet så som registret skriver det (registrySchemas.ts). */
const REGION_COUNTY = "Stockholms län";
/** Tak på namngivna träffar (varje träff kostar ett årsredovisningsanrop). */
const MAX_NAMED_RESULTS = 50;
/** Tak på urvalet som medianen/tillväxten räknas på. */
const MAX_SAMPLE = 100;
const MAX_COMPETITORS = 5;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 200;

function requireSni(sniCode: string): string {
  if (typeof sniCode !== "string" || !SNI_PATTERN.test(sniCode)) {
    throw new RegistryInputError("Ogiltig SNI-kod (förväntar formen 12.345).");
  }
  return sniCode;
}

function requireCount(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new RegistryInputError(`${label} måste vara ett heltal >= 0.`);
  }
  return value;
}

function parseRows(raw: unknown): RegistryRow[] {
  const parsed = RegistryRowsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RegistryTransportError("Oväntat svar från bolagsregistret (validering misslyckades).", {
      cause: parsed.error,
    });
  }
  if (parsed.data.companies.length >= SCB_ROW_CAP) {
    // Avkortad lista skulle ge felaktiga antal: hellre ett fel än ett tyst för lågt tal.
    throw new RegistryTransportError("Registersvaret nådde radtaket och kan vara avkortat (kräver paginering).");
  }
  return parsed.data.companies;
}

function parseFigures(raw: unknown): Map<string, AnnualFigures> {
  const parsed = AnnualFiguresResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RegistryTransportError("Oväntat svar från årsredovisningsregistret (validering misslyckades).", {
      cause: parsed.error,
    });
  }
  return new Map(parsed.data.reports.map((r) => [r.orgNr, r]));
}

/** Bara aktiebolag utan reklamspärr som är aktiva får visas med namn (dataspiken §2). */
function isNameable(row: RegistryRow): boolean {
  return row.legalForm === AKTIEBOLAG_FORM && !row.deregistered && !row.advertisingBlock;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

const SOURCE_NAME: Record<Locale, string> = {
  sv: "Bolagsverket och SCB",
  en: "Bolagsverket and Statistics Sweden (SCB)",
};

export const liveRegistryProvider: RegistryProvider = {
  async searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]> {
    await assertRegistryAccessAllowed();
    const sniCode = requireSni(query.sniCode);
    const min = requireCount(query.minEmployees, "minEmployees");
    const max = requireCount(query.maxEmployees, "maxEmployees");
    if (min !== undefined && max !== undefined && min > max) {
      throw new RegistryInputError("minEmployees får inte vara större än maxEmployees.");
    }

    const rows = parseRows(await fetchCompanies({ sniCode }));
    // Okänt antal anställda kan inte uppfylla ett intervall, och porten kräver
    // ett tal: en rad utan känt antal utelämnas hellre än får ett påhittat.
    const hits = rows
      .filter(
        (r) =>
          r.sniCode === sniCode &&
          isNameable(r) &&
          r.employees !== null &&
          (min === undefined || r.employees >= min) &&
          (max === undefined || r.employees <= max),
      )
      .sort((a, b) => a.orgNr.localeCompare(b.orgNr))
      .slice(0, MAX_NAMED_RESULTS);
    if (hits.length === 0) return [];

    const figures = parseFigures(await fetchAnnualFigures(hits.map((r) => r.orgNr)));
    const companies: RegistryCompany[] = [];
    for (const r of hits) {
      const name = cleanText(r.name, MAX_NAME_LENGTH);
      if (!name) continue;
      const revenue = figures.get(r.orgNr)?.revenueKsek;
      // Ingen omsättning i en digital årsredovisning => utelämnas, aldrig 0.
      if (revenue === null || revenue === undefined || r.employees === null) continue;
      companies.push({
        name,
        sniCode: r.sniCode,
        employees: r.employees,
        revenueKsek: revenue,
        // Län saknas => tom sträng (porten kräver string), aldrig en gissning.
        county: r.county ? cleanText(r.county, MAX_NAME_LENGTH) : "",
      });
    }
    return companies;
  },

  async getMarketOverview(locale: Locale, sniCode?: string): Promise<MarketOverview> {
    await assertRegistryAccessAllowed();
    const sni = sniCode === undefined ? undefined : requireSni(sniCode);

    const all = parseRows(await fetchCompanies({ sniCode: sni }));
    const active = all.filter((r) => !r.deregistered && (sni === undefined || r.sniCode === sni));

    // Regionandel: andelen bolag i Stockholmsregionen av de bolag där län är känt.
    const withCounty = active.filter((r) => r.county);
    const regionCompanies = withCounty.length;
    const regionSharePercent = regionCompanies
      ? Math.round((withCounty.filter((r) => r.county === REGION_COUNTY).length / regionCompanies) * 100)
      : 0;

    // Årsredovisningar finns bara för aktiebolag: ett urval, aldrig hela marknaden.
    // Deterministiskt urval (sorterat på orgNr), inte transportens ordning.
    const sample = active
      .filter((r) => r.legalForm === AKTIEBOLAG_FORM)
      .sort((a, b) => a.orgNr.localeCompare(b.orgNr))
      .slice(0, MAX_SAMPLE);
    const figures = sample.length
      ? parseFigures(await fetchAnnualFigures(sample.map((r) => r.orgNr)))
      : new Map<string, AnnualFigures>();
    const revenues: number[] = [];
    let grew = 0;
    let comparable = 0;
    for (const r of sample) {
      const f = figures.get(r.orgNr);
      if (!f || f.revenueKsek === null) continue;
      revenues.push(f.revenueKsek);
      if (f.previousRevenueKsek !== null && f.previousRevenueKsek > 0) {
        comparable += 1;
        if (f.revenueKsek > f.previousRevenueKsek * GROWTH_THRESHOLD) grew += 1;
      }
    }

    // Konkurrenter är bara meningsfulla inom en bransch: utan sniCode inga.
    const competitors: Competitor[] = (sni === undefined ? [] : active)
      .filter(isNameable)
      .sort((a, b) => (b.employees ?? -1) - (a.employees ?? -1))
      .map((r) => ({
        name: cleanText(r.name, MAX_NAME_LENGTH),
        description: cleanText(r.description ?? "", MAX_DESCRIPTION_LENGTH),
      }))
      // Filtrera efter rensning: en tom rensad text räknas som saknad.
      .filter((c) => c.name && c.description)
      .slice(0, MAX_COMPETITORS);

    return {
      companyCount: active.length,
      medianRevenueKsek: revenues.length ? median(revenues) : 0,
      growthSharePercent: comparable ? Math.round((grew / comparable) * 100) : 0,
      regionSharePercent,
      // Hämtningsdatum är det faktiska anropsdatumet, aldrig hårdkodat.
      source: { namn: SOURCE_NAME[locale], hämtad: new Date().toISOString().slice(0, 10) },
      competitors,
      basis: {
        medianRevenueCompanies: revenues.length,
        growthCompanies: comparable,
        regionCompanies,
      },
    };
  },
};
