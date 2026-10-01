"use client";

import type { ReactNode } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import type { DataType } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import { getScoreLevel } from "@/score/levels";
import type { DataKind, Källa } from "@/core/domain";
import type { Simulation } from "@/ports/SimulationProvider";
import { levelTone } from "./ScoreFigure";

/**
 * Datablock som flera skärmar delar: exempeletiketten, nyckeltalen,
 * simuleringen och domen. Flyttade hit i PR 7 (docs/plan-en-design.md) från
 * `app/demo/_components/DemoBlocks.tsx` (borttagen i steg 6, när den sista
 * demosidan, Pulsen, var flyttad). Ligger under `screens/` — portregeln gäller.
 */

/**
 * Synlig etikett på block med påhittade företag, personer eller siffror
 * (Datalöftet, docs/uppdrag.md 1.2: påhittad data får aldrig se ut som
 * registerdata). Visas bara för `dataKind="example"`, som bara demot sätter;
 * riktig data (`"live"`) får ingen etikett.
 */
export function ExampleLabel({ dataKind }: { dataKind: DataKind }) {
  const { t } = useI18n();
  if (dataKind !== "example") return null;
  return <p className="fdd-example">{t.site.demo.exampleLabel}</p>;
}

export type Figure = {
  label: string;
  value: ReactNode;
  unit?: string;
  description?: string;
  source?: Källa;
  dataType?: DataType;
};

/** Nyckeltal i en rad med hårlinjer emellan. Varje tal bär sin källa. */
export function Figures({ items, tourId }: { items: Figure[]; tourId?: string }) {
  return (
    <dl className="fdd-figures" data-tour-id={tourId}>
      {items.map((item) => (
        <div key={item.label} className="fdd-figures__item">
          <dt>{item.label}</dt>
          <dd>
            {item.value}
            {item.unit && <span> {item.unit}</span>}
          </dd>
          {item.description && <p className="fdd-figures__desc">{item.description}</p>}
          {item.source && <SourceTag source={item.source} dataType={item.dataType} />}
        </div>
      ))}
    </dl>
  );
}

/** Simulering: alltid märkt Simulering och koncept, aldrig poäng. */
export function SimulationBlock({ simulation }: { simulation: Simulation }) {
  const { locale, t } = useI18n();
  return (
    <div className="fdd-sim">
      <div className="fdd-sim__head">
        <span className="fdd-pill fdd-pill--simulation">{t.common.simulationLabel}</span>
        <ConceptBadge />
      </div>
      <p className="fdd-sim__question">{simulation.question}</p>
      <p className="fdd-sim__result">{simulation.result}</p>
      <p className="fdd-muted">{simulation.uncertaintyRangeLabel}</p>
      <div className="fdd-sim__foot">
        <span className="fdd-muted">
          {t.common.simulationPopulationLabel}: {formatCount(simulation.populationSize, locale)}
        </span>
        <SourceTag source={simulation.source} dataType="simulation" />
      </div>
    </div>
  );
}

/** Domen: poängen vid domen, nivån, utslaget och motiveringen. */
export function VerdictBlock({ score, headline, reasoning }: { score: number; headline: string; reasoning: string }) {
  const { t } = useI18n();
  const level = getScoreLevel(score);
  return (
    <div className="fd-panel fdd-verdict">
      <div className="fdd-figure">
        <p className="fd-proof__number">
          <span>{score}</span>
          <span className="fd-proof__outof">{t.site.proof.outOf}</span>
        </p>
        <span className={cn("fd-level", levelTone[level.tone])}>{t.score.levels[level.key].name}</span>
      </div>
      <p className="fdd-verdict__headline">{headline}</p>
      <p className="fd-nextstep__why">{reasoning}</p>
    </div>
  );
}
