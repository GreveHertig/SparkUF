"use client";

import { DataFact } from "@/components/ui/DataFact";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { SimulationCard } from "@/components/spark/SimulationCard";
import { useI18n } from "@/i18n/context";
import type { MarketOverview } from "@/ports/RegistryProvider";
import type { Simulation } from "@/ports/SimulationProvider";

export type MarketData = {
  overview: MarketOverview;
  simulation: Simulation;
};

/** Marknad (avsnitt 6): registerbilden och simuleringar, tydligt åtskilda —
 * simuleringen renderas alltid via `SimulationCard` (avsnitt 2.2, 8): etikett,
 * population, källa och osäkerhetsintervall syns alltid, aldrig bara en
 * färgskillnad. */
export function Market({ data, notInScenario }: { data: MarketData | null; notInScenario?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <Eyebrow>{t.appShell.nav.market}</Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {t.marketPage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.marketPage.subtitle}</p>
      </div>

      {!data ? (
        <LockedState
          unlockHint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 02`}
        />
      ) : (
        <>
          <section data-tour-id="market-register" className="flex flex-col gap-3">
            <Eyebrow>{t.marketPage.registerTitle}</Eyebrow>
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
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

          <section data-tour-id="market-competitors" className="flex flex-col gap-3">
            <Eyebrow>{t.marketPage.competitorsTitle}</Eyebrow>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {data.overview.competitors.map((competitor) => (
                <div key={competitor.name} className="rounded-lg border border-slate-200 bg-white p-3.5">
                  <p className="text-sm font-semibold text-slate-900">{competitor.name}</p>
                  <p className="mt-1 text-sm leading-snug text-slate-600">{competitor.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section data-tour-id="market-simulation" className="flex flex-col gap-2.5">
            <Eyebrow>{t.marketPage.simulationTitle}</Eyebrow>
            <SimulationCard simulation={data.simulation} />
          </section>
        </>
      )}
    </div>
  );
}
