"use client";

import { useEffect, useState } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { useI18n } from "@/i18n/context";
import { getScoreLevel } from "@/score/levels";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import { fill } from "@/app/experiment/fonda/_lib/fill";
import { PartsList, ScoreDelta, ScoreFigure } from "../../_components/DemoBlocks";
import { ScoreHistory } from "../../_components/ScoreHistory";
import { mentionsConcept } from "../../_lib/concepts";

type ScoreData = { snapshot: ScoreSnapshot; suggestions: ScoreSuggestion[]; history: number[] };

/** Poäng i kopian: nivån, delarna med källa, historiken och "Höj din poäng". */
export default function FondaDemoScorePage() {
  const { t, locale } = useI18n();
  const copy = t.experimentFonda.demo;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<ScoreData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoEvidenceRepository.getSuggestions(locale),
      demoEvidenceRepository.getScoreHistory(locale),
    ]).then(([snapshot, suggestions, history]) => {
      if (!cancelled) setData({ snapshot, suggestions, history });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  const { snapshot, suggestions, history } = data;
  const level = getScoreLevel(snapshot.total);

  return (
    <div className="fdd-page">
      <header className="fdd-head">
        <p className="fdd-head__date">{t.scorePage.title}</p>
        <h1 className="fd-h2">{t.score.levels[level.key].name}</h1>
        <p className="fd-lede">{t.score.levels[level.key].message}</p>
      </header>

      <div className="fdd-hero">
        <section aria-labelledby="fdd-breakdown-title" className="fd-panel" data-tour-id="score-breakdown">
          <div className="fdd-scorehead">
            <ScoreFigure snapshot={snapshot} />
            <ScoreDelta snapshot={snapshot} />
          </div>
          <h2 id="fdd-breakdown-title" className="fdd-label">
            {t.scorePage.breakdownTitle}
          </h2>
          <PartsList snapshot={snapshot} />
        </section>

        <section aria-labelledby="fdd-history-title" className="fd-panel fdd-historycard">
          <h2 id="fdd-history-title" className="fdd-label">
            {copy.historyLabel}
          </h2>
          <ScoreHistory history={history} />
          <p className="fdd-muted">{t.scorePage.subtitle}</p>
        </section>
      </div>

      <section aria-labelledby="fdd-suggestions-title" className="fdd-block" data-tour-id="score-suggestions">
        <div className="fdd-block__head">
          <h2 id="fdd-suggestions-title" className="fdd-block__title">
            {t.scorePage.suggestionsTitle}
          </h2>
          <p className="fdd-muted">{t.scorePage.suggestionsSortNote}</p>
        </div>
        <ol className="fdd-suggestions">
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.partId}-${suggestion.label}`} className="fdd-suggestion">
              <span className="fdd-suggestion__gain">{fill(copy.pointsGain, { points: suggestion.pointsGain })}</span>
              <div className="fdd-suggestion__body">
                <p className="fdd-suggestion__label">{suggestion.label}</p>
                <p className="fdd-muted">{suggestion.explanation}</p>
                {mentionsConcept(suggestion.explanation) && <ConceptBadge className="fdd-suggestion__concept" />}
              </div>
              <div className="fdd-suggestion__meta">
                <span className={`fdd-gap fdd-gap--${suggestion.gapType}`}>
                  {t.scorePage.gapType[suggestion.gapType]}
                </span>
                <span className="fdd-muted">
                  ~{suggestion.estimatedMinutes} {t.scorePage.estimatedMinutesUnit}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
