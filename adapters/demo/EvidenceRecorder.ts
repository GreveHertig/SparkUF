import type { EvidenceRecorder, EvidenceView, RecordEvidenceInput } from "@/ports/EvidenceRecorder";
import type { Locale } from "@/i18n/context";
import { PHASE_UNLOCKED_PARTS, type ScorePartId } from "@/core/score";
import { useDemoStore } from "./demoStore";
import { engineFor } from "./journeyEngine";

// Demots poäng är manusstyrd per moment (uppdrag 9.1) och ska gå att räkna
// för hand ur scenariofilen (sara.ts/jonas.ts). Om demot sparade bevis vid
// klick skulle rundturen och manuset glida isär. Därför sparar demoadaptern
// ingenting: den svarar med det aktuella momentets poäng
// (docs/bevislagring.md 4.3). Demot importerar aldrig liveadaptern.

function currentEngineAndBeat() {
  const { beatIndex, entry } = useDemoStore.getState();
  const engine = engineFor(entry);
  return { engine, beatIndex, beat: engine.getBeatAt(beatIndex) };
}

export const demoEvidenceRecorder: EvidenceRecorder = {
  async recordEvidence(input: RecordEvidenceInput, locale: Locale) {
    const { engine, beatIndex } = currentEngineAndBeat();
    return {
      status: "recorded" as const,
      evidenceId: `demo-${input.kind}`,
      snapshot: engine.getScoreSnapshotForBeat(beatIndex, locale),
    };
  },

  async retractEvidence(_evidenceId: string, _reason: string, locale: Locale) {
    const { engine, beatIndex } = currentEngineAndBeat();
    return engine.getScoreSnapshotForBeat(beatIndex, locale);
  },

  async listEvidence(partId: ScorePartId, locale: Locale): Promise<EvidenceView[]> {
    const { beat } = currentEngineAndBeat();
    // En låst del har inga bevis att visa, bara "Låses upp efter steg X".
    if (!PHASE_UNLOCKED_PARTS[beat.phase].includes(partId)) return [];
    const part = beat.partsByLocale[locale].find((candidate) => candidate.partId === partId);
    if (!part) return [];
    // Scenariots bevis har ingen sort, så delens namn får stå som etikett.
    // Inget av dem kan återkallas: demot sparar ingenting.
    return part.items.map(
      (item, index): EvidenceView => ({
        id: `demo-${beat.id}-${partId}-${index + 1}`,
        partId,
        kind: null,
        kindLabel: part.label,
        source: item.source,
        enteredBy: "system",
        selfReported: false,
        status: "counted",
        canRetract: false,
      }),
    );
  },
};
