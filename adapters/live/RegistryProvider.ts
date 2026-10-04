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
import { fetchLegalUnitsBySni, type ScbLegalUnit } from "@/lib/server/scb";
import { lookupOrganisation } from "@/lib/server/bolagsverket";
import {
  AKTIEBOLAG_JURFORM,
  COUNTY_NAMES,
  EMPLOYEE_CLASSES,
  STOCKHOLM_COUNTY_CODE,
} from "@/lib/server/registrySchemas";

/**
 * Liveadapter för Registret (docs/moduler/registret.md). Listan kommer ur
 * SCB:s företagsregister (lib/server/scb.ts), verksamhetsbeskrivningen och
 * Bolagsverkets reklamspärr för konkurrenterna ur Bolagsverket
 * (lib/server/bolagsverket.ts). Domänlogiken är vår: grind, indatavalidering,
 * vilka bolag som får namnges, källstämpling och ärlighet kring luckor.
 *
 * Namngivna bolag (dataspiken §2 och §6 fråga 4): bara aktiebolag (jurform
 * 41, 42, 43, 49) som är verksamma, tar emot reklam enligt SCB
 * (reklamSparrTyp 1) och har en känd storleksklass. Konkurrenterna måste
 * dessutom sakna reklamspärr hos Bolagsverket: en satt spärr där utesluter,
 * ett okänt värde (null) gör det inte, eftersom SCB:s uppgift redan är känd.
 * Beslut i docs/beslut.md 2026-10-04.
 *
 * Luckor (Datalöftet): AFR har ingen omsättning och ingen historik, så
 * medianen och tillväxtandelen har underlaget 0 och visas inte, och
 * `revenueKsek` är null. Antal anställda är storleksklassens nedre gräns,
 * som skärmen visar som klass, aldrig som ett exakt tal.
 *
 * Extern data är DATA: namn och beskrivningar rensas och kortas och används
 * aldrig som instruktion.
 */

/** Porten och sidan använder formen 12.345; fem siffror i följd godtas också. */
const SNI_PATTERN = /^(\d{2}\.\d{3}|\d{5})$/;
/** Tak på namngivna träffar. */
const MAX_NAMED_RESULTS = 50;
const MAX_COMPETITORS = 5;
/** Så många kandidater slås upp hos Bolagsverket för att hitta fem konkurrenter. */
const MAX_COMPETITOR_LOOKUPS = 10;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 200;

const SOURCE_NAME: Record<Locale, string> = {
  sv: "SCB:s företagsregister och Bolagsverket",
  en: "Statistics Sweden business register and Bolagsverket",
};

function requireSni(sniCode: unknown): string {
  if (typeof sniCode !== "string" || !SNI_PATTERN.test(sniCode.trim())) {
    throw new RegistryInputError("Ogiltig SNI-kod (förväntar formen 12.345).");
  }
  return sniCode.trim();
}

function requireCount(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value < 0) {
    throw new RegistryInputError(`${label} måste vara ett heltal >= 0.`);
  }
  return value;
}

const isAktiebolag = (unit: ScbLegalUnit) => unit.legalFormCode !== null && AKTIEBOLAG_JURFORM.has(unit.legalFormCode);

/** Får visas med namn: aktiebolag, verksamt, tar emot reklam enligt SCB, känd storlek. */
function isNameable(unit: ScbLegalUnit): boolean {
  return isAktiebolag(unit) && unit.active && unit.receivesAdvertising && classOf(unit) !== null;
}

function classOf(unit: ScbLegalUnit): { min: number; max: number } | null {
  return unit.employeeClass ? (EMPLOYEE_CLASSES[unit.employeeClass] ?? null) : null;
}

/**
 * Ett spritt, deterministiskt urval: sortering på en hash av org.nr i stället
 * för på org.nr, som skulle ge de äldsta bolagen. Samma bransch ger alltid
 * samma urval.
 */
function spreadKey(orgNr: string): number {
  let hash = 0x811c9dc5;
  for (const char of orgNr) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

const bySpread = (a: ScbLegalUnit, b: ScbLegalUnit) =>
  spreadKey(a.orgNr) - spreadKey(b.orgNr) || a.orgNr.localeCompare(b.orgNr);

/**
 * Konkurrenterna: de största namngivbara bolagen, med beskrivning från
 * Bolagsverket. Ett bolag med spärr, avregistrering eller utan beskrivning hos
 * Bolagsverket hoppas över. Går Bolagsverket inte att nå blir listan tom, och
 * resten av marknadsbilden visas ändå.
 */
async function findCompetitors(units: ScbLegalUnit[]): Promise<Competitor[]> {
  const candidates = units
    .filter(isNameable)
    .sort((a, b) => (classOf(b)?.min ?? -1) - (classOf(a)?.min ?? -1) || a.orgNr.localeCompare(b.orgNr))
    .slice(0, MAX_COMPETITOR_LOOKUPS);

  const competitors: Competitor[] = [];
  for (const unit of candidates) {
    if (competitors.length >= MAX_COMPETITORS) break;
    let found;
    try {
      [found] = await lookupOrganisation(unit.orgNr);
    } catch (error) {
      if (error instanceof RegistryInputError) continue;
      if (error instanceof RegistryTransportError) {
        // Bara våra egna texter, aldrig `cause`.
        console.error(`Registret: konkurrenterna kunde inte berikas (${error.name}: ${error.message}).`);
        return [];
      }
      throw error;
    }
    if (!found || found.advertisingBlock === true || found.deregistered || found.active === false) continue;
    const name = cleanText(found.name ?? unit.name, MAX_NAME_LENGTH);
    const description = cleanText(found.description ?? "", MAX_DESCRIPTION_LENGTH);
    if (name && description) competitors.push({ name, description });
  }
  return competitors;
}

export const liveRegistryProvider: RegistryProvider = {
  async searchCompanies(query: RegistryQuery): Promise<RegistryCompany[]> {
    await assertRegistryAccessAllowed();
    const sniCode = requireSni(query.sniCode);
    const min = requireCount(query.minEmployees, "minEmployees");
    const max = requireCount(query.maxEmployees, "maxEmployees");
    if (min !== undefined && max !== undefined && min > max) {
      throw new RegistryInputError("minEmployees får inte vara större än maxEmployees.");
    }

    const { units } = await fetchLegalUnitsBySni(sniCode);
    // En storleksklass tas med bara om hela intervallet ligger inom gränserna.
    return units
      .filter((unit) => {
        if (!isNameable(unit)) return false;
        const size = classOf(unit)!;
        return (min === undefined || size.min >= min) && (max === undefined || size.max <= max);
      })
      .sort(bySpread)
      .slice(0, MAX_NAMED_RESULTS)
      .flatMap((unit): RegistryCompany[] => {
        const name = cleanText(unit.name, MAX_NAME_LENGTH);
        if (!name) return [];
        return [
          {
            name,
            // Samma form som frågan, så att sidan visar koden som grundaren skrev den.
            sniCode,
            employees: classOf(unit)!.min,
            // AFR har ingen omsättning; årsredovisningarna (iXBRL) är inte byggda.
            revenueKsek: null,
            // Okänt län ger tom sträng, aldrig en gissning.
            county: unit.countyCode ? (COUNTY_NAMES[unit.countyCode] ?? "") : "",
          },
        ];
      });
  },

  async getMarketOverview(locale: Locale, sniCode?: string): Promise<MarketOverview> {
    await assertRegistryAccessAllowed();
    // Hela registret (över en miljon rader) gås aldrig igenom (registret.md, "SCB AFR").
    if (sniCode === undefined) {
      throw new RegistryInputError("Marknadsbilden kräver en SNI-kod.");
    }
    const sni = requireSni(sniCode);

    const listing = await fetchLegalUnitsBySni(sni);
    const activeAktiebolag = listing.units.filter((unit) => isAktiebolag(unit) && unit.active);

    // Regionandel: andelen i Stockholms län av de verksamma aktiebolag där sätets län är känt.
    const withCounty = activeAktiebolag.filter((unit) => unit.countyCode !== null);
    const regionCompanies = withCounty.length;
    const regionSharePercent = regionCompanies
      ? Math.round(
          (withCounty.filter((unit) => unit.countyCode === STOCKHOLM_COUNTY_CODE).length / regionCompanies) * 100,
        )
      : 0;

    return {
      companyCount: activeAktiebolag.length,
      medianRevenueKsek: 0,
      growthSharePercent: 0,
      regionSharePercent,
      // Hämtningsdatum är anropsdagen, aldrig hårdkodat.
      source: { namn: SOURCE_NAME[locale], hämtad: listing.fetchedAt },
      competitors: await findCompetitors(listing.units),
      basis: {
        // Omsättning och tillväxt kräver årsredovisningar (iXBRL), som inte är byggda: okänt.
        medianRevenueCompanies: 0,
        growthCompanies: 0,
        regionCompanies,
      },
    };
  },
};
