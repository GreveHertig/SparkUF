import { AppHome, type AppHomeData } from "@/screens/AppHome";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { liveJourneyRepository } from "@/adapters/live/JourneyRepository";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { livePulseProvider } from "@/adapters/live/PulseProvider";
import { NotImplementedError } from "@/core/errors";

// Alla tre liveadaptrar är stubbar (docs/moduler/resan.md,
// evidens-och-poang.md, webbresearch-och-pulsen.md) — sidan visar "Kommer
// snart" i stället för att krascha, tills P1 bygger dem en i taget.
// JSX konstrueras aldrig inuti try/catch (react-hooks/error-boundaries).
export default async function LiveAppHomePage() {
  let data: AppHomeData | null = null;

  try {
    const [journey, score, pulse, scoreHistory] = await Promise.all([
      liveJourneyRepository.getHomeSummary("sv"),
      liveEvidenceRepository.getScoreSnapshot("sv"),
      livePulseProvider.getTodaysSignal("sv"),
      liveEvidenceRepository.getScoreHistory("sv"),
    ]);
    data = {
      todayIso: journey.todayIso,
      score,
      nextStep: journey.nextStep,
      sinceLastTime: journey.sinceLastTime,
      pulse,
      scoreHistory,
    };
  } catch (error) {
    if (!(error instanceof NotImplementedError)) throw error;
  }

  if (!data) {
    return <ComingSoon />;
  }

  return <AppHome data={data} />;
}
