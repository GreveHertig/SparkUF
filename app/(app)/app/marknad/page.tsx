import { Market, type IndustryChoice, type MarketData, type MarketLock, type MarketRegistry, type SniPicker } from "@/screens/Market";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { getLiveIndustryName, liveRegistryProvider, searchLiveIndustries } from "@/adapters/live/RegistryProvider";
import { liveEvidenceRecorder } from "@/adapters/live/EvidenceRecorder";
import { isPlaceholderError, RegistryLockedError, RegistryTransportError } from "@/core/errors";
import { assertRegistryAccessAllowed } from "@/lib/server/registryAccess";
import { orNull } from "../_lib/orNull";
import { chooseIndustry } from "./actions";

/** Samma gräns som demot: marknadsbilden öppnas när steg 02 är klart. */
const UNLOCKS_AFTER_STEP = 2;
/** Samma form som Registret-adaptern kräver (adapters/live/RegistryProvider.ts). */
const SNI_PATTERN = /^\d{2}\.\d{3}$/;
const BASE_PATH = "/app/marknad";
const JOURNEY_PATH = "/app/resan";
const MAX_QUERY = 80;

type SearchParams = { [key: string]: string | string[] | undefined };
const single = (value: string | string[] | undefined) => (typeof value === "string" ? value.trim() : "");

/**
 * Marknad i /app (PR 8; steg 03 kopplat 2026-10-04). Låst och olåst kommer ur
 * Resans steg; i låst läge görs inga andra anrop.
 *
 * Licensgrinden (docs/moduler/registret.md): registerdelen hämtas bara om
 * grinden släpper igenom användaren. Rutten frågar grinden först, också
 * innan någon bransch är vald, så att den som inte står på allowlisten ser
 * "Registret är inte öppet än" direkt och aldrig får branschväljaren.
 * Adaptern kör samma grind en gång till som första sats i varje metod.
 * Ingen cache här: registersvaren får aldrig delas mellan användare.
 *
 * Branschen: `?sni=69.201` i adressen, eller sökning på namn (`?q=`) ur SCB:s
 * kodtabell. Utan någon av dem öppnas grundarens valda bransch, alltså den
 * som det senaste giltiga registerbeviset gäller ("sni:69.201"). "Det här är
 * min bransch" sparar antalet som bevis (`chooseIndustry`) och klarar steg 03.
 */
export default async function LiveMarketPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = single(params.sni);
  const requested = SNI_PATTERN.test(raw) ? raw : null;
  const query = single(params.q).slice(0, MAX_QUERY);

  const steps = await orNull(liveJourneyRepository.getSteps("sv"));
  // Okända steg (platshållarfel) ger inget låst läge; sektionerna visar då sina egna luckor.
  const locked: MarketLock =
    steps && steps.find((step) => step.stepNumber === UNLOCKS_AFTER_STEP)?.status !== "done"
      ? { unlocksAfterStep: UNLOCKS_AFTER_STEP }
      : null;

  const access = locked ? "locked" : await registryAccess();
  const chosen = access === "open" ? await chosenIndustry() : null;
  const sni = requested ?? (raw === "" && !query ? chosen : null);

  const registry: MarketRegistry =
    access === "locked" ? "notChosen" : access === "closed" ? "closed" : await loadRegistry(sni);
  const overview = typeof registry === "object" ? registry.overview : null;

  const [industryName, results] =
    access === "open"
      ? await Promise.all([sni ? quiet(getLiveIndustryName(sni)) : null, query ? quiet(searchLiveIndustries(query)) : null])
      : [null, null];

  const data: MarketData = {
    industryLabel: industryName && sni ? `${industryName} (${sni})` : null,
    registry,
    outreach: null,
    simulation: null,
    // Konkurrenternas namn och beskrivningar kommer ur samma registeranrop som
    // nyckeltalen, så de bär samma källa (källgenomgången 2026-10-01). Bara
    // när registret faktiskt svarat: en stängd grind ger ingen källa och
    // inga konkurrenter.
    ...(overview && { competitorsSource: { source: overview.source, dataType: "register" as const } }),
  };

  const sniPicker: SniPicker = {
    basePath: BASE_PATH,
    current: sni,
    invalid: raw !== "" && requested === null,
    search: { query, results },
  };

  const industryChoice: IndustryChoice | undefined =
    overview && sni
      ? {
          sniCode: sni,
          chosen: chosen === sni,
          hasCompanies: overview.companyCount > 0,
          action: chooseIndustry,
          outcome: outcomeOf(single(params.sparad)),
          journeyHref: JOURNEY_PATH,
        }
      : undefined;

  return (
    <Market
      data={data}
      dataKind="live"
      locked={locked}
      sniPicker={sniPicker}
      industryChoice={industryChoice}
    />
  );
}

function outcomeOf(value: string): IndustryChoice["outcome"] {
  const step = /^steg(\d{1,2})$/.exec(value);
  if (step) return { kind: "stepDone", stepNumber: Number(step[1]) };
  if (value === "1") return { kind: "saved" };
  if (value === "fel") return { kind: "failed" };
  return null;
}

async function registryAccess(): Promise<"open" | "closed"> {
  try {
    await assertRegistryAccessAllowed();
    return "open";
  } catch (error) {
    if (error instanceof RegistryLockedError) return "closed";
    throw error;
  }
}

/** Branschen som grundarens senaste giltiga registerbevis gäller, eller null. */
async function chosenIndustry(): Promise<string | null> {
  const views = await orNull(liveEvidenceRecorder.listEvidence("market", "sv"));
  const current = (views ?? []).filter(
    (view) =>
      view.kind === "registerMarketCount" &&
      view.enteredBy === "system" &&
      (view.status === "counted" || view.status === "capped") &&
      (view.subjectRef ?? "").startsWith("sni:"),
  );
  const latest = current[current.length - 1];
  const sni = latest?.subjectRef?.slice("sni:".length) ?? null;
  return sni && SNI_PATTERN.test(sni) ? sni : null;
}

/** Ett fel i en hjälpdel (branschnamn, sökning) får aldrig fälla sidan. */
async function quiet<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    if (!isPlaceholderError(error) && !(error instanceof RegistryTransportError)) throw error;
    return null;
  }
}

async function loadRegistry(sni: string | null): Promise<MarketRegistry> {
  if (!sni) return "notChosen";

  const [overview, companies] = await Promise.allSettled([
    liveRegistryProvider.getMarketOverview("sv", sni),
    liveRegistryProvider.searchCompanies({ sniCode: sni }),
  ]);
  const failures = [overview, companies].flatMap((result) => (result.status === "rejected" ? [result.reason] : []));
  // Grinden kan ha stängts mellan frågan ovan och anropen: då visas ingenting.
  if (failures.some((error) => error instanceof RegistryLockedError)) return "closed";
  const transportError = failures.find((error) => error instanceof RegistryTransportError);
  if (transportError) {
    // Bara namn och meddelande (våra egna texter), aldrig `cause`, som kan bära registrets svar.
    console.error(`Registret: marknadsbilden kunde inte hämtas (${transportError.name}: ${transportError.message}).`);
    return "failed";
  }
  const realError = failures.find((error) => !isPlaceholderError(error));
  if (realError) throw realError;

  return {
    overview: overview.status === "fulfilled" ? overview.value : null,
    companies: companies.status === "fulfilled" ? companies.value : null,
    medianRevenueFiscalYears: null,
  };
}
