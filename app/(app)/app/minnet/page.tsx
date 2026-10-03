import { Memory, type MemoryData } from "@/screens/Memory";
import { liveMemoryRepository } from "@/adapters/live/MemoryRepository";
import { orNull } from "../_lib/orNull";
import { liveEvidenceRecorder } from "@/adapters/live/EvidenceRecorder";
import { stockholmToday } from "@/adapters/live/evidenceScore";
import { saveBrainNotes, saveFitAnswer, saveRemainingAnswer } from "./actions";

/**
 * Minnet i /app (PR 5, docs/plan-en-design.md). Liveadaptern är byggd, men en
 * profil som inte är ifylld ger `EmptyStateError`. De tre anropen fångas var
 * för sig (platshållare per sektion), så att Hjärnan och Spåret syns även när
 * profilen saknas. Minnet har inget låst läge, varken i demot eller här.
 */
export default async function LiveMemoryPage() {
  const [profile, brainNotes, trace, fitEvidence, remaining] = await Promise.all([
    orNull(liveMemoryRepository.getProfileSummary("sv")),
    orNull(liveMemoryRepository.getBrainNotes()),
    orNull(liveMemoryRepository.getTraceEvents("sv")),
    // Passform från profilen (docs/bevislagring.md 5.1). Utan aktivt projekt
    // finns inget att spara beviset på, och rutan visar "Kommer snart".
    orNull(liveEvidenceRecorder.listEvidence("fit", "sv")),
    // Frågorna som återstår från profilsamtalet (spec v4 §3.2).
    orNull(liveMemoryRepository.getPendingOnboardingQuestions("sv")),
  ]);

  const data: MemoryData = { profile, brainNotes, trace };

  return (
    <Memory
      data={data}
      dataKind="live"
      onSaveBrainNotes={saveBrainNotes}
      fit={{ evidence: fitEvidence, onSave: saveFitAnswer, scoreHref: "/app/poang" }}
      remaining={{ questions: remaining, onSave: saveRemainingAnswer, todayIso: stockholmToday() }}
    />
  );
}
