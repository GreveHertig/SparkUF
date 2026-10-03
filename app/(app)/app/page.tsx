import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { livePlanRepository } from "@/adapters/live/PlanRepository";
import { isPlaceholderError } from "@/core/errors";
import { optional } from "./_lib/optional";
import { pickWeekPulse } from "@/core/weekPulse";

const JOURNEY_BASE_PATH = "/app/resan";

/**
 * Resans `getHomeSummary` ger handlingskortet, och `sinceLastTime` är null
 * tills Utskick och svar är byggd (docs/moduler/resan.md); AppHome visar då
 * "Kommer snart" i den rutan. Evidens kan vara klar men ändå sakna bevis för
 * ett nytt konto (EmptyStateError). Pulsen och Resans `getSteps` är byggda och
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

  const [pulseSignals, journeySteps, planItems] = await Promise.all([
    livePulseProvider.getSignals("sv"),
    liveJourneyRepository.getSteps("sv"),
    // Min plan kompletterar sidan: saknas tabellen, eller går den inte att
    // läsa, visas inget kort och resten av Hem som förut.
    optional(livePlanRepository.getItems(), "Hem: Min plan"),
  ]);

  // Nästa uppgift: den öppna med närmast sista dag (Pulsen v3), annars den
  // första öppna (getItems ger de öppna först, äldst först).
  const open = planItems?.filter((item) => !item.done) ?? [];
  const nextItem =
    [...open].filter((item) => item.due).sort((a, b) => a.due!.date.localeCompare(b.due!.date))[0] ?? open[0];
  const planNext = nextItem
    ? {
        text: nextItem.text,
        context: nextItem.context,
        planHref: `${JOURNEY_BASE_PATH}#min-plan`,
        helpHref: `/app/medgrundaren?task=${encodeURIComponent(nextItem.id)}`,
        ...(nextItem.due ? { due: nextItem.due } : {}),
      }
    : null;

  // "Veckans puls" i stället för "Dagens signal" (Pulsen v3).
  const weekPulse = { signals: pickWeekPulse(pulseSignals, todayIso), pulseHref: "/app/pulsen" };

  // Handlingskortet gäller Resans aktuella steg (samma som `getHomeSummary`
  // bygger på). Utan kort eller aktuellt steg ingen länk, aldrig en gissning.
  const currentStep = journeySteps.find((step) => step.status === "current");
  const nextStepHref = homeSummary && currentStep ? `${JOURNEY_BASE_PATH}/${currentStep.stepNumber}` : undefined;

  // Pulsens källa är en artikel (domän och hämtdatum), inte ett register:
  // datatypen "media" (docs/beslut.md, 2026-10-01). "Sedan sist" är null
  // tills Utskick och svar finns; sätt då `sinceLastTime: "user"` eller
  // "customer" här (källgenomgången, fynd 5 i docs/status.md).
  const data: AppHomeData = {
    todayIso,
    score,
    homeSummary,
    pulseSignals,
    journeySteps,
    sourceDataTypes: { pulse: "media" },
  };

  return (
    <AppHome
      data={data}
      dataKind="live"
      nextStepHref={nextStepHref}
      journeyBasePath={JOURNEY_BASE_PATH}
      scoreHref="/app/poang"
      // Layouten släpper bara in den som är klar med onboardingen.
      profileAnswersHref="/app/minnet"
      planNext={planNext}
      weekPulse={weekPulse}
    />
  );
}
