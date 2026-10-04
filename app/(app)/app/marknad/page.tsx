import { Market, type MarketData, type MarketLock, type MarketRegistry } from "@/screens/Market";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveRegistryProvider } from "@/adapters/live/RegistryProvider";
import { isPlaceholderError, RegistryLockedError, RegistryTransportError } from "@/core/errors";
import { assertRegistryAccessAllowed } from "@/lib/server/registryAccess";
import { orNull } from "../_lib/orNull";
import { saveMarketEvidence } from "./actions";

/** Samma gräns som demot: marknadsbilden öppnas när steg 02 är klart. */
const UNLOCKS_AFTER_STEP = 2;
/** Samma form som Registret-adaptern kräver (adapters/live/RegistryProvider.ts). */
const SNI_PATTERN = /^\d{2}\.\d{3}$/;
const BASE_PATH = "/app/marknad";

/**
 * SCB:s lista för en bransch gås igenom sida för sida (20–40 sekunder för en
 * stor bransch, docs/dataspiken.md, "Vad en kundlista kostar") så länge inget
 * cachas. Gränsen på plattformen höjs därför för just den här sidan.
 */
export const maxDuration = 60;

/**
 * Marknad i /app (PR 8, docs/plan-en-design.md). Låst och olåst kommer ur
 * Resans steg; i låst läge görs inga andra anrop.
 *
 * Licensgrinden (docs/moduler/registret.md): registerdelen hämtas bara om
 * grinden släpper igenom användaren. Rutten frågar grinden först, också
 * innan någon bransch är vald, så att den som inte står på allowlisten ser
 * "Registret är inte öppet än" direkt och aldrig får branschväljaren.
 * Adaptern kör samma grind en gång till som första sats i varje metod.
 * Ingen cache här: registersvaren får aldrig delas mellan användare.
 *
 * Ingen port ger användarens bransch, så den väljs i adressen (`?sni=69.201`),
 * samma öppna uppgift som bolagsformen i Juridik (plan-en-design.md, beslut 5).
 * Porten bär inga räkenskapsår, så medianomsättningen visas som en lucka.
 * Utskicket har ingen källa i porten och sändspärren gäller, och simuleringen
 * saknar en fråga som inte är skriven för Saras scenario: båda visar "Kommer snart".
 */
export default async function LiveMarketPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const requested = (await searchParams).sni;
  const raw = typeof requested === "string" ? requested.trim() : "";
  const sni = SNI_PATTERN.test(raw) ? raw : null;

  const steps = await orNull(liveJourneyRepository.getSteps("sv"));
  // Okända steg (platshållarfel) ger inget låst läge; sektionerna visar då sina egna luckor.
  const locked: MarketLock =
    steps && steps.find((step) => step.stepNumber === UNLOCKS_AFTER_STEP)?.status !== "done"
      ? { unlocksAfterStep: UNLOCKS_AFTER_STEP }
      : null;

  const registry: MarketRegistry = locked ? "notChosen" : await loadRegistry(sni);
  const overview = typeof registry === "object" ? registry.overview : null;

  const data: MarketData = {
    industryLabel: null,
    registry,
    outreach: null,
    simulation: null,
    // Konkurrenternas namn och beskrivningar kommer ur samma registeranrop som
    // nyckeltalen, så de bär samma källa (källgenomgången 2026-10-01). Bara
    // när registret faktiskt svarat: en stängd grind ger ingen källa och
    // inga konkurrenter.
    ...(overview && { competitorsSource: { source: overview.source, dataType: "register" as const } }),
  };

  return (
    <Market
      data={data}
      dataKind="live"
      locked={locked}
      sniPicker={{ basePath: BASE_PATH, current: sni, invalid: raw !== "" && sni === null }}
      evidence={{ onSave: saveMarketEvidence, scoreHref: "/app/poang" }}
    />
  );
}

async function loadRegistry(sni: string | null): Promise<MarketRegistry> {
  try {
    await assertRegistryAccessAllowed();
  } catch (error) {
    if (error instanceof RegistryLockedError) return "closed";
    throw error;
  }
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
