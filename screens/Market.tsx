"use client";

import { DataFact } from "@/components/ui/DataFact";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SourceTag } from "@/components/ui/SourceTag";
import { LockedState } from "@/components/ui/LockedState";
import { useI18n } from "@/i18n/context";
import type { MarketOverview } from "@/ports/RegistryProvider";
import type { Simulation } from "@/ports/SimulationProvider";

export type MarketData = {
  overview: MarketOverview;
  simulation: Simulation;
};

/** Marknad (avsnitt 6): registerbilden och simuleringar, tydligt åtskilda —
 * simuleringen bär alltid ConceptBadge-liknande märkning via `SourceTag`s
 * `dataType="simulation"` (visar alltid "Simulering" som text, inte bara färg). */
export function Market({ data }: { data: MarketData | null }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <Eyebrow>{t.appShell.nav.market}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.marketPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.marketPage.subtitle}</p>
      </div>

      {!data ? (
        <LockedState unlockHint={`${t.homePage.unlocksAfterStepBefore} 02`} />
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <Eyebrow>{t.marketPage.registerTitle}</Eyebrow>
            <div className="grid grid-cols-2 gap-6 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-4">
              <DataFact
                label={t.marketPage.companyCountLabel}
                value={data.overview.companyCount}
                source={data.overview.source}
              />
              <DataFact
                label={t.marketPage.medianRevenueLabel}
                value={`${(data.overview.medianRevenueKsek / 1000).toFixed(1).replace(".", ",")} Mkr`}
                source={data.overview.source}
              />
              <DataFact
                label={t.marketPage.growthShareLabel}
                value={data.overview.growthSharePercent}
                unit="%"
                source={data.overview.source}
              />
              <DataFact
                label={t.marketPage.regionShareLabel}
                value={data.overview.regionSharePercent}
                unit="%"
                source={data.overview.source}
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <Eyebrow>{t.marketPage.competitorsTitle}</Eyebrow>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {data.overview.competitors.map((competitor) => (
                <div key={competitor.name} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{competitor.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{competitor.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <Eyebrow>{t.marketPage.simulationTitle}</Eyebrow>
            <div className="rounded-lg border border-dashed border-data-simulation bg-data-simulation-bg/30 p-5">
              <p className="text-sm font-medium text-slate-700">{data.simulation.question}</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{data.simulation.result}</p>
              <p className="mt-1 text-sm text-slate-600">{data.simulation.uncertaintyRangeLabel}</p>
              <div className="mt-3">
                <SourceTag source={data.simulation.source} dataType="simulation" />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
