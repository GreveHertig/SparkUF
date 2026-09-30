import { Score, type ScoreData } from "@/screens/Score";
import { liveEvidenceRepository } from "@/adapters/live/EvidenceRepository";
import { isPlaceholderError } from "@/core/errors";

/** Ett platshållarfel (stubbe eller tomt konto) blir `null` — skärmen visar
 * då "Kommer snart" i just det kortet. Ett äkta fel kastas vidare. */
function orNull<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((error) => {
    if (isPlaceholderError(error)) return null;
    throw error;
  });
}

/**
 * Poäng i /app (PR 4, docs/plan-en-design.md). Evidens är byggd, men ett nytt
 * konto utan projekt eller bevis ger `EmptyStateError` för poängen och
 * förslagen. De tre anropen fångas var för sig (platshållare per sektion),
 * så att historiken syns även när poängen saknas och tvärtom. Poängen räknas
 * av `calculateScore` i liveadaptern, aldrig här.
 */
export default async function LiveScorePage() {
  const [snapshot, suggestions, history] = await Promise.all([
    orNull(liveEvidenceRepository.getScoreSnapshot("sv")),
    orNull(liveEvidenceRepository.getSuggestions("sv")),
    orNull(liveEvidenceRepository.getScoreHistory("sv")),
  ]);

  const data: ScoreData = { snapshot, suggestions, history };

  return <Score data={data} />;
}
