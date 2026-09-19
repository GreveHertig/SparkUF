import type { EvidenceRepository } from "@/ports/EvidenceRepository";
import type { Locale } from "@/i18n/context";
import { deriveSuggestions, ALL_PART_IDS, PHASE_UNLOCKED_PARTS, type ScorePartId } from "@/core/score";
import { useDemoStore } from "./demoStore";
import { engineFor } from "./journeyEngine";

// Poängen sätts aldrig direkt i mockdata (avsnitt 7.1) — den räknas av
// calculateScore (core/score.ts) från det aktuella momentets bevis i
// sara.ts/jonas.ts. `useDemoStore.getState()` läser demomotorns läge
// utanför React, precis som Zustand är avsett att användas. `engineFor`
// (adapters/demo/journeyEngine.ts) väljer Saras eller Jonas motor ur
// `entry` (avsnitt 2.1).
export const demoEvidenceRepository: EvidenceRepository = {
  async getScoreSnapshot(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    return engineFor(entry).getScoreSnapshotForBeat(beatIndex, locale);
  },

  async getSuggestions(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    const engine = engineFor(entry);
    const phase = engine.getBeatAt(beatIndex).phase;
    const unlocked = new Set(PHASE_UNLOCKED_PARTS[phase]);
    const lockedPartIds = ALL_PART_IDS.filter((id: ScorePartId) => !unlocked.has(id));
    return deriveSuggestions(engine.suggestionCandidates[locale], lockedPartIds);
  },

  async getScoreHistory(locale: Locale) {
    const { beatIndex, entry } = useDemoStore.getState();
    return engineFor(entry).getScoreHistoryUpToBeat(beatIndex, locale);
  },
};
