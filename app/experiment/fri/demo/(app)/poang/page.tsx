"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { getScoreLevel } from "@/score/levels";
import { FriSuggestions } from "../../_components/FriBlocks";
import { FriSource } from "../../_components/FriSource";

type ScoreData = { snapshot: ScoreSnapshot; suggestions: ScoreSuggestion[]; scoreHistory: number[] };

// Staplarnas längd är delens vikt (högsta vikten = hela bredden) och fyllnaden
// är poängen i delen, så både vikt och utfall syns i samma form.
const MAX_WEIGHT = 18;

/** Poäng i kopian: samma innehåll som /demo/app/poang (screens/Score), ny form. */
export default function FriDemoScorePage() {
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<ScoreData | null>(null);

  // Samma hämtning som app/demo/app/poang/page.tsx, ur samma adapter.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoEvidenceRepository.getSuggestions(locale),
      demoEvidenceRepository.getScoreHistory(locale),
    ]).then(([snapshot, suggestions, scoreHistory]) => {
      if (!cancelled) setData({ snapshot, suggestions, scoreHistory });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;
  const { snapshot, suggestions, scoreHistory } = data;
  const level = getScoreLevel(snapshot.total);
  const unlockedCount = snapshot.parts.length;
  const totalParts = unlockedCount + snapshot.lockedParts.length;
  const best = suggestions[0];
  const deltaLabel = snapshot.delta === 0 ? "0" : `${snapshot.delta > 0 ? "+" : "−"}${Math.abs(snapshot.delta)}`;

  return (
    <>
      <section>
        <h1 className="fri-h1-demo">{t.score.levels[level.key].name}</h1>
        <p className="fri-lead" style={{ marginTop: 18 }}>
          {t.score.levels[level.key].message}
        </p>
      </section>

      <dl className="fri-kpis">
        <div className="fri-ruled">
          <dt className="fri-muted">{t.kpi.scoreLabel}</dt>
          <dd className="fri-fact-num">
            {snapshot.total}
            <small>/100</small>
          </dd>
        </div>
        <div className="fri-ruled">
          <dt className="fri-muted">{t.kpi.scoreDeltaLabel}</dt>
          <dd className="fri-fact-num" style={{ color: snapshot.delta < 0 ? "var(--signal-ink)" : undefined }}>
            {deltaLabel}
          </dd>
          {snapshot.delta !== 0 && (
            <dd className="fri-muted" style={{ marginTop: 8, fontSize: "0.92rem" }}>
              {snapshot.deltaReason}
            </dd>
          )}
        </div>
        <div className="fri-ruled">
          <dt className="fri-muted">{t.kpi.unlockedPartsLabel}</dt>
          <dd className="fri-fact-num">
            {unlockedCount}
            <small>/{totalParts}</small>
          </dd>
        </div>
        {best && (
          <div className="fri-ruled">
            <dt className="fri-muted">{t.kpi.bestSuggestionLabel}</dt>
            <dd className="fri-fact-num">
              +{best.pointsGain}
              <small>{t.scorePage.pointsPerMinuteUnit}</small>
            </dd>
            <dd className="fri-muted" style={{ marginTop: 8, fontSize: "0.92rem" }}>
              {best.label}
            </dd>
          </div>
        )}
      </dl>

      <section className="fri-section-demo" data-tour-id="score-breakdown">
        <h2 className="fri-h2-demo">{t.scorePage.breakdownTitle}</h2>
        <div className="fri-breakdown">
          {snapshot.parts.map((part) => (
            <div key={part.name} className="fri-bd-row">
              <span className="fri-bd-name" style={{ fontWeight: 540 }}>
                {part.name}
              </span>
              <span className="fri-bd-pts">
                {part.points}
                <span className="fri-muted">/{part.weight}</span>
              </span>
              <span className="fri-bd-bar" aria-hidden="true">
                <span className="fri-bd-weight" style={{ width: `${(part.weight / MAX_WEIGHT) * 100}%` }} />
                <span className="fri-bd-fill" style={{ width: `${(part.points / MAX_WEIGHT) * 100}%` }} />
              </span>
              <span className="fri-bd-src">
                <FriSource source={part.source} dataType={part.dataType} />
              </span>
            </div>
          ))}
          {snapshot.lockedParts.map((part) => (
            <div key={part.name} className="fri-bd-row locked">
              <span className="fri-bd-name fri-muted">{part.name}</span>
              <span className="fri-bd-pts fri-muted">
                {t.homePage.unlocksAfterStepBefore} {part.unlocksAfterStep}
              </span>
            </div>
          ))}
        </div>
      </section>

      {scoreHistory.length >= 2 && <FriHistory history={scoreHistory} />}

      <section className="fri-section-demo" data-tour-id="score-suggestions">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <h2 className="fri-h2-demo">{t.scorePage.suggestionsTitle}</h2>
          <span className="fri-muted" style={{ fontSize: "0.92rem" }}>
            {t.scorePage.suggestionsSortNote}
          </span>
        </div>
        <FriSuggestions suggestions={suggestions} />
      </section>
    </>
  );
}

/** Totalpoängen moment för moment, ur motorns historik (inga påhittade punkter).
 * Linjen ritas i en utsträckt SVG; etiketter och slutpunkt ligger i HTML så att
 * de inte förvrängs när diagrammet får en annan höjd på mobil. */
function FriHistory({ history }: { history: number[] }) {
  const { t } = useI18n();
  const width = 1000;
  const height = 100;
  const x = (index: number) => (history.length === 1 ? 0 : (index / (history.length - 1)) * width);
  const y = (value: number) => (1 - value / 100) * height;
  const path = history.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(2)}`).join(" ");
  const last = history[history.length - 1];

  return (
    <section className="fri-section-demo">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h2 className="fri-h2-demo">{t.experimentFreeDemo.historyTitle}</h2>
        <span className="fri-muted" style={{ fontSize: "0.92rem", maxWidth: "52ch" }}>
          {t.experimentFreeDemo.historyNote}
        </span>
      </div>
      <div className="fri-chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${t.experimentFreeDemo.historyTitle}: ${history.join(", ")}`}
        >
          {[0, 50, 100].map((tick) => (
            <line
              key={tick}
              x1={0}
              x2={width}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path
            d={path}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {[0, 50, 100].map((tick) => (
          <span key={tick} className="tick" style={{ top: `${100 - tick}%` }} aria-hidden="true">
            {tick}
          </span>
        ))}
        <span className="end" style={{ left: "100%", top: `${100 - last}%` }} aria-hidden="true" />
      </div>
    </section>
  );
}
