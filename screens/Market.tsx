"use client";

import { BarChart } from "@/components/ui/BarChart";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { LockedState } from "@/components/ui/LockedState";
import { SourceTag } from "@/components/ui/SourceTag";
import { KpiRow } from "@/components/spark/KpiRow";
import { KpiTile } from "@/components/spark/KpiTile";
import { SimulationCard } from "@/components/spark/SimulationCard";
import { useI18n, type Locale } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { formatCount, formatSek } from "@/i18n/format";
import type { Källa } from "@/types/evidence";
import type { MarketOverview, RegistryCompany } from "@/ports/RegistryProvider";
import type { CampaignRow } from "@/ports/OutreachProvider";
import type { Simulation } from "@/ports/SimulationProvider";

export type MarketData = {
  overview: MarketOverview;
  simulation: Simulation;
  /** Registrets urval (avsnitt 6): 20 av 312 byråer, för storleksfördelningen. */
  companies: RegistryCompany[];
  /** [] innan kontaktlistan är byggd (steg 04) — se `computeOutreachStats`. */
  campaign: CampaignRow[];
  /** `CampaignRow` bär ingen egen källa (avsnitt 14.3) — Datalöftet kräver
   * ändå en källa på svarsfrekvensen, så anroparen skickar med den. */
  outreachSource: Källa;
  /** Branschordet för det aktiva scenariot (uppgift 2: innehållsburet
   * sidhuvud) — ingen port för "vilken bransch" finns, så anroparen skickar
   * med det, samma mönster som `outreachSource`. */
  industryLabel: string;
};

type MarketPageDict = Dictionary["marketPage"];

const SIZE_BUCKETS = [
  { key: "oneToFour", min: 1, max: 4 },
  { key: "fiveToNine", min: 5, max: 9 },
  { key: "tenToNineteen", min: 10, max: 19 },
  { key: "twentyToFortyNine", min: 20, max: 49 },
  { key: "fiftyPlus", min: 50, max: Infinity },
] as const;

/** Storleksklasser, aldrig exakta tal (docs/dataspiken.md: "SCB ger klasser,
 * inte siffror") — bucketar det demot råkar ha exakta tal för internt. */
function computeSizeDistribution(companies: RegistryCompany[], buckets: MarketPageDict["distribution"]["sizeBuckets"]) {
  return SIZE_BUCKETS.map((bucket) => ({
    label: buckets[bucket.key],
    count: companies.filter((company) => company.employees >= bucket.min && company.employees <= bucket.max).length,
  }));
}

function basedOn(t: MarketPageDict, n: number, m: number, locale: Locale): string {
  return `${t.basedOnLabel} ${formatCount(n, locale)} ${t.ofLabel} ${formatCount(m, locale)} ${t.companiesUnit}.`;
}

/** Innehållsburen rubrik (uppgift 2): branschen plus storleksspannet i
 * urvalet, t.ex. "Redovisningsbyråer, 5–20 anställda" — hämtat ur det
 * aktiva scenariots data, aldrig hårdkodat. */
function marketHeadline(data: MarketData, m: MarketPageDict): string {
  const { companies, industryLabel } = data;
  if (companies.length === 0) return industryLabel;
  const employeeCounts = companies.map((company) => company.employees);
  const min = Math.min(...employeeCounts);
  const max = Math.max(...employeeCounts);
  const range = min === max ? `${min}` : `${min}–${max}`;
  return `${industryLabel}, ${range} ${m.distribution.employeesUnit}`;
}

function computeOutreachStats(campaign: CampaignRow[]) {
  if (campaign.length === 0) return null;
  const contacted = campaign.filter((row) => row.status !== "draft").length;
  const responded = campaign.filter((row) => row.status === "responded").length;
  return { total: campaign.length, contacted, responded };
}

/** Marknad (avsnitt 6, Datalöftet uppdrag 1.2): nyckeltal, datalagren bakom
 * dem, storleksfördelningen och utskickets svarsfrekvens — allt med källa och
 * urval, aldrig ett tal som ser ut att gälla hela marknaden när det gäller ett
 * urval. Simuleringen (Hiasynth) hålls alltid visuellt och textuellt åtskild
 * från registerfakta, via `SimulationCard`. */
export function Market({ data, notInScenario }: { data: MarketData | null; notInScenario?: boolean }) {
  const { locale, t } = useI18n();
  const m = t.marketPage;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <EditorialHeading as="h1">{data ? marketHeadline(data, m) : m.title}</EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{m.subtitle}</p>
      </div>

      {!data ? (
        <LockedState
          unlockHint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 02`}
        />
      ) : (
        <MarketBody data={data} m={m} locale={locale} />
      )}
    </div>
  );
}

function MarketBody({ data, m, locale }: { data: MarketData; m: MarketPageDict; locale: Locale }) {
  const { overview, simulation, companies, campaign, outreachSource } = data;
  const sniCode = companies[0]?.sniCode ?? "";
  const distribution = computeSizeDistribution(companies, m.distribution.sizeBuckets);
  const dominant = distribution.reduce((best, bucket) => (bucket.count > best.count ? bucket : best), distribution[0]);
  const dominantPercent = companies.length > 0 ? Math.round((dominant.count / companies.length) * 100) : 0;
  const outreachStats = computeOutreachStats(campaign);

  return (
    <>
      <section data-tour-id="market-kpi" className="flex flex-col gap-3">
        <Eyebrow>{m.kpiTitle}</Eyebrow>
        <KpiRow>
          <KpiTile
            label={m.companyCountLabel}
            value={overview.companyCount}
            unit={m.companyCountUnit}
            description={m.companyCountDescription}
            source={overview.source}
          />
          <KpiTile
            label={m.medianRevenueLabel}
            value={formatSek(overview.medianRevenueKsek * 1000, locale)}
            description={overview.basis ? basedOn(m, overview.basis.medianRevenueCompanies, overview.companyCount, locale) : undefined}
            source={overview.source}
          />
          <KpiTile
            label={m.growthShareLabel}
            value={overview.growthSharePercent}
            unit="%"
            description={overview.basis ? basedOn(m, overview.basis.growthCompanies, overview.companyCount, locale) : undefined}
            source={overview.source}
          />
          <KpiTile
            label={m.regionShareLabel}
            value={overview.regionSharePercent}
            unit="%"
            description={overview.basis ? basedOn(m, overview.basis.regionCompanies, overview.companyCount, locale) : undefined}
            source={overview.source}
          />
        </KpiRow>
      </section>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[2fr_316px]">
        <section data-tour-id="market-distribution">
          <Card
            title={m.distribution.title}
            right={
              <span className="font-numeric text-xs text-slate-500">
                {m.distribution.sniLabel} {sniCode}
              </span>
            }
          >
            <BarChart bars={distribution.map((bucket) => ({ label: bucket.label, value: bucket.count }))} />
            {companies.length > 0 && (
              <p className="mt-3 text-sm text-slate-600">
                {m.distribution.mostCommonLabel} {dominant.label} — {formatCount(dominant.count, locale)} {m.companiesUnit}{" "}
                {m.ofLabel} {formatCount(companies.length, locale)} ({dominantPercent} %).{" "}
                {basedOn(m, companies.length, overview.companyCount, locale)}
              </p>
            )}
            <div className="mt-3">
              <SourceTag source={overview.source} />
            </div>
          </Card>
        </section>

        <div className="flex flex-col gap-[18px]">
          <section data-tour-id="market-outreach">
            <Card title={m.outreach.title}>
              {!outreachStats ? (
                <LockedState unlockHint={m.outreach.notBuiltYet} />
              ) : outreachStats.contacted === 0 ? (
                <LockedState unlockHint={m.outreach.notSentYet} />
              ) : (
                <div className="flex flex-col gap-3">
                  <dl className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-600">{m.outreach.contactedLabel}</dt>
                      <dd className="font-numeric font-semibold text-slate-900">
                        {formatCount(outreachStats.contacted, locale)} / {formatCount(outreachStats.total, locale)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-600">{m.outreach.respondedLabel}</dt>
                      <dd className="font-numeric font-semibold text-slate-900">
                        {formatCount(outreachStats.responded, locale)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-slate-600">{m.outreach.responseRateLabel}</dt>
                      <dd className="font-numeric font-semibold text-slate-900">
                        {Math.round((outreachStats.responded / outreachStats.contacted) * 100)}%
                      </dd>
                    </div>
                  </dl>
                  <SourceTag source={outreachSource} dataType="customer" />
                </div>
              )}
            </Card>
          </section>

          <section data-tour-id="market-datalayers">
            <Card title={m.dataLayers.title}>
              <div className="flex flex-col gap-3">
                <DataLayerRow name={m.dataLayers.registerName} note={m.dataLayers.registerNote} source={overview.source} />
                <DataLayerRow
                  name={m.dataLayers.annualReportName}
                  note={m.dataLayers.annualReportNote}
                  source={overview.source}
                />
                <DataLayerRow
                  name={m.dataLayers.simulationName}
                  note={m.dataLayers.simulationNote}
                  source={simulation.source}
                  dataType="simulation"
                />
              </div>
            </Card>
          </section>
        </div>
      </div>

      <section data-tour-id="market-competitors">
        <Card title={m.competitorsTitle}>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm bg-slate-200 sm:grid-cols-3">
            {overview.competitors.map((competitor) => (
              <div key={competitor.name} className="bg-white p-3.5">
                <p className="text-sm text-slate-900">{competitor.name}</p>
                <p className="mt-1 text-sm leading-snug text-slate-600">{competitor.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section data-tour-id="market-simulation" className="flex flex-col gap-2.5">
        <Eyebrow>{m.simulationTitle}</Eyebrow>
        <SimulationCard simulation={simulation} />
      </section>
    </>
  );
}

function DataLayerRow({
  name,
  note,
  source,
  dataType = "register",
}: {
  name: string;
  note: string;
  source: MarketOverview["source"];
  dataType?: "register" | "simulation";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-600">{note}</p>
      </div>
      <SourceTag source={source} dataType={dataType} />
    </div>
  );
}
