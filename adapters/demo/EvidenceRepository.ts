import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import type { Locale } from "@/i18n/context";
import { deriveSuggestions, ALL_PART_IDS, PHASE_UNLOCKED_PARTS, type ScorePartId } from "@/core/score";
import { useDemoStore } from "./demoStore";
import { getScoreSnapshotForBeat, getBeatAt, saraSuggestionCandidates } from "./sara";

// Poängen sätts aldrig direkt i mockdata (avsnitt 7.1) — den räknas av
// calculateScore (core/score.ts) från det aktuella momentets bevis i
// sara.ts. `useDemoStore.getState()` läser demomotorns läge utanför React,
// precis som Zustand är avsett att användas.
export const demoEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    return getScoreSnapshotForBeat(beatIndex, locale);
  },

  async getSuggestions(locale: Locale) {
    const { beatIndex } = useDemoStore.getState();
    const phase = getBeatAt(beatIndex).phase;
    const unlocked = new Set(PHASE_UNLOCKED_PARTS[phase]);
    const lockedPartIds = ALL_PART_IDS.filter((id: ScorePartId) => !unlocked.has(id));
    return deriveSuggestions(saraSuggestionCandidates[locale], lockedPartIds);
  },
};
