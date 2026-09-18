import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import type { Locale } from "@/i18n/context";
import { useDemoStore } from "./demoStore";
import { getScoreSnapshotForBeat } from "./sara";

// Poängen sätts aldrig direkt i mockdata (avsnitt 7.1) — den räknas av
// calculateScore (core/score.ts) från det aktuella momentets bevis i
// sara.ts. `useDemoStore.getState()` läser demomotorns läge utanför React,
// precis som Zustand är avsett att användas.
export const demoEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    return getScoreSnapshotForBeat(beatIndex, locale);
  },
};
