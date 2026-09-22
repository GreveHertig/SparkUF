"use client";

import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import type { Simulation } from "@/ports/SimulationProvider";

/**
 * Hiasynth-resultat (avsnitt 2.2, 8): alltid märkt Simulering, med
 * populationens storlek, källorna och osäkerhetsintervallet synliga — aldrig
 * bara en färgskillnad. Ger aldrig poäng (7.4), blandas aldrig ihop med
 * registerfakta (SourceTag/ConceptBadge bär den distinktionen visuellt).
 */
export function SimulationCard({ simulation, className }: { simulation: Simulation; className?: string }) {
  const { locale, t } = useI18n();

  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-data-simulation bg-data-simulation-bg/30 p-4",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Eyebrow>{simulation.question}</Eyebrow>
        <ConceptBadge />
      </div>
      <p className="font-numeric mt-2 text-xl text-slate-900">{simulation.result}</p>
      <p className="mt-1 text-sm text-slate-600">{simulation.uncertaintyRangeLabel}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="font-numeric text-sm text-slate-700">
          {t.common.simulationPopulationLabel}: {formatCount(simulation.populationSize, locale)}
        </p>
        <SourceTag source={simulation.source} dataType="simulation" />
      </div>
    </div>
  );
}
