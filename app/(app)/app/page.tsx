import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { isPlaceholderError } from "@/core/errors";

/**
 * Resans `getHomeSummary` är en permanent stub (docs/moduler/resan.md,
 * NotImplementedError). Evidens kan vara klar men ändå sakna bevis för ett
 * nytt konto (EmptyStateError). Pulsen och Resans `getSteps` är byggda och
 * kastar inga platshållarfel (getSteps ger alltid en full lista, getSignals
 * en ärlig tom lista) — deras anrop fångas alltså inte här, ett äkta fel
 * ska fortsätta kasta. `score`/`homeSummary` hämtas och fångas var för sig
 * (PR 3) så att en ensam stub inte släcker hela sidan — screens/AppHome.tsx
 * visar "Kommer snart" bara i den ruta som saknar sin data.
 */
export default async function LiveAppHomePage() {
  // Datum-delen bara (formatDate, i18n/format.ts, lägger själv till T00:00:00).
  const todayIso = new Date().toISOString().slice(0, 10);

  const score = await liveEvidenceRepository.getScoreSnapshot("sv").catch((error) => {
    if (isPlaceholderError(error)) return null;
    throw error;
  });

  const homeSummary = await liveJourneyRepository
    .getHomeSummary("sv")
    .then((journey) => ({ nextStep: journey.nextStep, sinceLastTime: journey.sinceLastTime }))
    .catch((error) => {
      if (isPlaceholderError(error)) return null;
      throw error;
    });

  const [pulseSignals, journeySteps] = await Promise.all([
    livePulseProvider.getSignals("sv"),
    liveJourneyRepository.getSteps("sv"),
  ]);

  const data: AppHomeData = { todayIso, score, homeSummary, pulseSignals, journeySteps };

  return (
    <AppHome data={data} dataKind="live" journeyStepHref={(stepNumber) => `/app/resan/${stepNumber}`} scoreHref="/app/poang" />
  );
}
