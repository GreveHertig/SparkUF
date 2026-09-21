import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { isPlaceholderError } from "@/core/errors";

// Pulsen är fortfarande en stub (docs/moduler/webbresearch-och-pulsen.md,
// NotImplementedError). Resan och Evidens kan vara klara men ändå sakna
// data för ett nytt konto (EmptyStateError — t.ex. inga bevis samlade än).
// Båda felen visar "Kommer snart" i stället för att krascha
// (isPlaceholderError, core/errors.ts). JSX konstrueras aldrig inuti
// try/catch (react-hooks/error-boundaries).
export default async function LiveAppHomePage() {
  let data: AppHomeData | null = null;

  try {
    const [journey, score, pulseSignals, scoreHistory, suggestions, journeySteps] = await Promise.all([
      liveJourneyRepository.getHomeSummary("sv"),
      liveEvidenceRepository.getScoreSnapshot("sv"),
      livePulseProvider.getSignals("sv"),
      liveEvidenceRepository.getScoreHistory("sv"),
      liveEvidenceRepository.getSuggestions("sv"),
      liveJourneyRepository.getSteps("sv"),
    ]);
    data = {
      todayIso: journey.todayIso,
      score,
      nextStep: journey.nextStep,
      sinceLastTime: journey.sinceLastTime,
      pulseSignals,
      scoreHistory,
      suggestions,
      journeySteps,
    };
  } catch (error) {
    if (!isPlaceholderError(error)) throw error;
  }

  if (!data) {
    return <ComingSoon />;
  }

  return <AppHome data={data} journeyStepHref={(stepNumber) => `/app/resan/${stepNumber}`} />;
}
