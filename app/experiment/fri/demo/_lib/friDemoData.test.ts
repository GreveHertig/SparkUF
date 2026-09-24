import { afterEach, describe, expect, it } from "vitest";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { saraBeats } from "@/adapters/demo/sara";
import { homeDataFor, scoreDataFor } from "./friDemoData";

// Paritet: kopians data (eget moment-läge) ska vara identisk med vad de
// riktiga demoadaptrarna ger för samma moment. Demots läge sätts bara här,
// i testets egen jsdom-miljö.
const SAMPLE_BEATS = [0, 4, 9, 14, saraBeats.length - 1];

afterEach(() => {
  useDemoStore.setState({ beatIndex: 0, entry: "noIdea" });
});

describe("friDemoData speglar demoadaptrarna", () => {
  for (const beatIndex of SAMPLE_BEATS) {
    for (const locale of ["sv", "en"] as const) {
      it(`moment ${beatIndex} (${locale})`, async () => {
        useDemoStore.setState({ beatIndex, entry: "noIdea" });

        const [summary, score, pulse, history, suggestions, steps] = await Promise.all([
          demoJourneyRepository.getHomeSummary(locale),
          demoEvidenceRepository.getScoreSnapshot(locale),
          demoPulseProvider.getSignals(locale),
          demoEvidenceRepository.getScoreHistory(locale),
          demoEvidenceRepository.getSuggestions(locale),
          demoJourneyRepository.getSteps(locale),
        ]);

        const home = homeDataFor(beatIndex, locale);
        expect(home.score).toEqual(score);
        expect(home.scoreHistory).toEqual(history);
        expect(home.nextStep).toEqual(summary.nextStep);
        expect(home.sinceLastTime).toEqual(summary.sinceLastTime);
        expect(home.suggestions).toEqual(suggestions);
        expect(home.pulseSignals).toEqual(pulse);
        expect(home.journeySteps).toEqual(steps);

        const scorePage = scoreDataFor(beatIndex, locale);
        expect(scorePage.snapshot).toEqual(score);
        expect(scorePage.suggestions).toEqual(suggestions);
      });
    }
  }
});
