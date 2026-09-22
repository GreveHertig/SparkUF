"use client";

import { Card } from "@/components/ui/Card";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { KpiRow } from "@/components/spark/KpiRow";
import { KpiTile } from "@/components/spark/KpiTile";
import { ScorePanel } from "@/components/spark/ScorePanel";
import { SuggestionList } from "@/components/spark/SuggestionList";
import { getScoreLevel } from "@/score/levels";
import { useI18n } from "@/i18n/context";
import type { ScoreSnapshot } from "@/core/domain";
import type { ScoreSuggestion } from "@/core/score";

export type ScoreData = {
  snapshot: ScoreSnapshot;
  suggestions: ScoreSuggestion[];
  /** Totalpoängen genom resan hittills, för KPI-radens sparkline
   * (designuppdatering: high-tech dashboard). */
  scoreHistory: number[];
};

/** Poäng (avsnitt 6, 7.6): de åtta delarna med nedbrytning, källor och
 * "Höj din poäng", sorterat efter poäng per minut. */
export function Score({ data }: { data: ScoreData }) {
  const { t } = useI18n();
  const { snapshot, suggestions, scoreHistory } = data;
  const unlockedCount = snapshot.parts.length;
  const totalPartsCount = unlockedCount + snapshot.lockedParts.length;
  const bestSuggestion = suggestions[0];
  const deltaLabel = `${snapshot.delta > 0 ? "+" : "−"}${Math.abs(snapshot.delta)}`;
  const level = getScoreLevel(snapshot.total);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <EditorialHeading as="h1">{t.score.levels[level.key].name}</EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.score.levels[level.key].message}</p>
      </div>

      <KpiRow>
        <KpiTile
          label={t.kpi.scoreLabel}
          value={snapshot.total}
          unit="/ 100"
          trend={scoreHistory}
          delta={snapshot.delta !== 0 ? { value: deltaLabel, direction: snapshot.delta > 0 ? "up" : "down" } : undefined}
        />
        <KpiTile label={t.kpi.scoreDeltaLabel} value={snapshot.delta !== 0 ? deltaLabel : "0"} />
        <KpiTile label={t.kpi.unlockedPartsLabel} value={`${unlockedCount}/${totalPartsCount}`} />
        {bestSuggestion && (
          <KpiTile
            label={t.kpi.bestSuggestionLabel}
            value={`+${bestSuggestion.pointsGain}`}
            unit={t.scorePage.pointsPerMinuteUnit}
          />
        )}
      </KpiRow>

      <div data-tour-id="score-breakdown">
        <ScorePanel snapshot={snapshot} title={t.scorePage.breakdownTitle} history={scoreHistory} />
      </div>

      <div data-tour-id="score-suggestions">
        <Card
          title={t.scorePage.suggestionsTitle}
          right={<span className="text-xs text-slate-500">{t.scorePage.suggestionsSortNote}</span>}
        >
          <SuggestionList suggestions={suggestions} />
        </Card>
      </div>
    </div>
  );
}
