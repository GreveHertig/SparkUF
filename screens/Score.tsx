"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { fill } from "@/i18n/fill";
import { getScoreLevel } from "@/score/levels";
import { mentionsConcept } from "@/core/concepts";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import { ScoreDelta, ScoreFigure } from "./blocks/ScoreFigure";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen
 * (via en EvidenceRepository-adapter). Skärmen vet inte om datan kom från
 * /demo eller /app (avsnitt 14.1).
 *
 * Varje fält är nullbart för sig (platshållare per sektion, PR 3/PR 4,
 * docs/plan-en-design.md): `null` betyder att adaptern kastade ett
 * platshållarfel för just det anropet, och bara det kortet visar då
 * `ComingSoon`. En tom lista (`[]`) är något annat — ett ärligt tomt läge,
 * t.ex. liveadapterns `getSuggestions` som ännu inte har skrivna förslag.
 */
export type ScoreData = {
  snapshot: ScoreSnapshot | null;
  suggestions: ScoreSuggestion[] | null;
  history: number[] | null;
};

/** Totalpoängen moment för moment som en enkel linje på skalan 0-100.
 * Ritas ur datan; talen finns också som text för skärmläsare. */
function ScoreHistory({ history }: { history: number[] }) {
  if (history.length === 0) return null;

  const width = 320;
  const height = 120;
  const pad = 6;
  const step = history.length > 1 ? (width - pad * 2) / (history.length - 1) : 0;
  const y = (value: number) => pad + (1 - value / 100) * (height - pad * 2);
  const points = history.map((value, index) => `${pad + index * step},${y(value)}`).join(" ");
  const last = history[history.length - 1];

  return (
    <figure className="fdd-history">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {[25, 50, 75].map((value) => (
          <line key={value} x1={0} x2={width} y1={y(value)} y2={y(value)} className="fdd-history__grid" />
        ))}
        <polyline points={points} className="fdd-history__line" vectorEffect="non-scaling-stroke" />
        <circle cx={pad + (history.length - 1) * step} cy={y(last)} r={4} className="fdd-history__dot" />
      </svg>
      <figcaption className="fd-sr-only">{history.join(", ")}</figcaption>
    </figure>
  );
}

/** De upplåsta delarna med källa, och de låsta med när de låses upp. */
function PartsList({ snapshot }: { snapshot: ScoreSnapshot }) {
  const { t } = useI18n();
  const locked = [...snapshot.lockedParts].sort((a, b) => a.unlocksAfterStep - b.unlocksAfterStep);

  return (
    <ul className="fd-parts">
      {snapshot.parts.map((part) => (
        <li key={part.name} className="fd-part">
          <div className="fd-part__row">
            <span className="fd-part__name">{part.name}</span>
            <span className="fd-part__points">
              {part.points}
              <span className="fd-part__weight">/{part.weight}</span>
            </span>
          </div>
          <span className="fd-part__bar" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.max(0, part.points) / part.weight})` }} />
          </span>
          <SourceTag source={part.source} dataType={part.dataType} className="fd-part__source" />
        </li>
      ))}
      {locked.map((part) => (
        <li key={part.name} className="fd-part fd-part--locked">
          <div className="fd-part__row">
            <span className="fd-part__name">{part.name}</span>
          </div>
          <span className="fd-part__lockedlabel">
            {fill(t.site.demo.unlocksAfter, { step: String(part.unlocksAfterStep).padStart(2, "0") })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Poäng (avsnitt 6, 7.6): nivån, delarna med källa, historiken och "Höj din
 * poäng". Markup flyttad rakt av från demots `app/demo/(app)/poang/page.tsx`
 * (PR 4, docs/plan-en-design.md).
 */
export function Score({ data }: { data: ScoreData }) {
  const { t } = useI18n();
  const copy = t.site.demo;
  const { snapshot, suggestions, history } = data;
  const level = snapshot ? getScoreLevel(snapshot.total) : null;

  return (
    <div className="fdd-page">
      <header className="fdd-head">
        {level ? (
          <>
            <p className="fdd-head__date">{t.scorePage.title}</p>
            <h1 className="fd-h2">{t.score.levels[level.key].name}</h1>
            <p className="fd-lede">{t.score.levels[level.key].message}</p>
          </>
        ) : (
          // Ingen poäng att visa nivån för — sidans namn blir rubriken, aldrig
          // en påhittad nivå.
          <h1 className="fd-h2">{t.scorePage.title}</h1>
        )}
      </header>

      <div className="fdd-hero">
        <section aria-labelledby="fdd-breakdown-title" className="fd-panel" data-tour-id="score-breakdown">
          {snapshot ? (
            <>
              <div className="fdd-scorehead">
                <ScoreFigure snapshot={snapshot} />
                <ScoreDelta snapshot={snapshot} />
              </div>
              <h2 id="fdd-breakdown-title" className="fdd-label">
                {t.scorePage.breakdownTitle}
              </h2>
              <PartsList snapshot={snapshot} />
            </>
          ) : (
            <>
              <h2 id="fdd-breakdown-title" className="fdd-label">
                {t.scorePage.breakdownTitle}
              </h2>
              <ComingSoon />
            </>
          )}
        </section>

        <section aria-labelledby="fdd-history-title" className="fd-panel fdd-historycard">
          <h2 id="fdd-history-title" className="fdd-label">
            {copy.historyLabel}
          </h2>
          {history === null ? (
            <ComingSoon />
          ) : history.length === 0 ? (
            <p className="fdd-muted">{t.scorePage.noHistory}</p>
          ) : (
            <ScoreHistory history={history} />
          )}
          <p className="fdd-muted">{t.scorePage.subtitle}</p>
        </section>
      </div>

      <section aria-labelledby="fdd-suggestions-title" className="fdd-block" data-tour-id="score-suggestions">
        <div className="fdd-block__head">
          <h2 id="fdd-suggestions-title" className="fdd-block__title">
            {t.scorePage.suggestionsTitle}
          </h2>
          {suggestions && suggestions.length > 0 && <p className="fdd-muted">{t.scorePage.suggestionsSortNote}</p>}
        </div>
        {suggestions === null ? (
          <ComingSoon />
        ) : suggestions.length === 0 ? (
          <p className="fdd-muted">{t.scorePage.noSuggestions}</p>
        ) : (
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
        )}
      </section>
    </div>
  );
}
