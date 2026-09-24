"use client";

import { useEffect, useState } from "react";
import { useI18n, type Locale } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { formatCount, formatSek } from "@/i18n/format";
import type { Källa } from "@/types/evidence";
import type { MarketOverview, RegistryCompany } from "@/ports/RegistryProvider";
import type { CampaignRow } from "@/ports/OutreachProvider";
import type { Simulation } from "@/ports/SimulationProvider";
import { demoRegistryProvider, SARA_MARKET_SNI_CODE, SARA_INDUSTRY_LABEL } from "@/adapters/demo/RegistryProvider";
import { demoOutreachProvider, outreachSource } from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { useDemoStore, getCurrentStepNumber } from "@/adapters/demo/demoStore";
import { FriSource } from "../../_components/FriSource";
import { FriBarChart, FriKpi, FriLocked, FriPageHead, FriSectionTitle, FriSimulation } from "../../_components/FriParts";

type MarketData = {
  overview: MarketOverview;
  simulation: Simulation;
  companies: RegistryCompany[];
  campaign: CampaignRow[];
  outreachSource: Källa;
  industryLabel: string;
};

type MarketPageDict = Dictionary["marketPage"];

// Samma hjälpfunktioner som screens/Market (all härledning ur samma data).
const SIZE_BUCKETS = [
  { key: "oneToFour", min: 1, max: 4 },
  { key: "fiveToNine", min: 5, max: 9 },
  { key: "tenToNineteen", min: 10, max: 19 },
  { key: "twentyToFortyNine", min: 20, max: 49 },
  { key: "fiftyPlus", min: 50, max: Infinity },
] as const;

function computeSizeDistribution(companies: RegistryCompany[], buckets: MarketPageDict["distribution"]["sizeBuckets"]) {
  return SIZE_BUCKETS.map((bucket) => ({
    label: buckets[bucket.key],
    count: companies.filter((company) => company.employees >= bucket.min && company.employees <= bucket.max).length,
  }));
}

function basedOn(m: MarketPageDict, n: number, total: number, locale: Locale): string {
  return `${m.basedOnLabel} ${formatCount(n, locale)} ${m.ofLabel} ${formatCount(total, locale)} ${m.companiesUnit}.`;
}

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

/** Marknaden i kopian: samma data och villkor som /demo/app/marknad (screens/Market). */
export default function FriMarketPage() {
  const { t, locale } = useI18n();
  const m = t.marketPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const unlocked = !notInScenario && getCurrentStepNumber() >= 3;
  const [data, setData] = useState<MarketData | undefined>(undefined);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    Promise.all([
      demoRegistryProvider.getMarketOverview(locale),
      demoSimulationProvider.simulate(simulationQuestions.time[locale], locale),
      demoRegistryProvider.searchCompanies({ sniCode: SARA_MARKET_SNI_CODE }),
      demoOutreachProvider.getCampaign(locale),
    ]).then(([overview, simulation, companies, campaign]) => {
      if (!cancelled) {
        setData({ overview, simulation, companies, campaign, outreachSource: outreachSource[locale], industryLabel: SARA_INDUSTRY_LABEL[locale] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, locale, beatIndex]);

  if (!unlocked) {
    return (
      <>
        <FriPageHead title={m.title} lead={m.subtitle} />
        <div className="fri-section-demo">
          <FriLocked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 02`} />
        </div>
      </>
    );
  }
  if (!data) return null;

  const { overview, simulation, companies, campaign } = data;
  const sniCode = companies[0]?.sniCode ?? "";
  const distribution = computeSizeDistribution(companies, m.distribution.sizeBuckets);
  const dominant = distribution.reduce((best, bucket) => (bucket.count > best.count ? bucket : best), distribution[0]);
  const dominantPercent = companies.length > 0 ? Math.round((dominant.count / companies.length) * 100) : 0;
  const outreach = computeOutreachStats(campaign);

  return (
    <>
      <FriPageHead title={marketHeadline(data, m)} lead={m.subtitle} />

      <section className="fri-section-demo" data-tour-id="market-kpi">
        <FriSectionTitle title={m.kpiTitle} />
        <dl className="fri-kpis" style={{ marginTop: 24 }}>
          <FriKpi label={m.companyCountLabel} value={overview.companyCount} unit={m.companyCountUnit} description={m.companyCountDescription} source={overview.source} />
          <FriKpi
            label={m.medianRevenueLabel}
            value={formatSek(overview.medianRevenueKsek * 1000, locale)}
            description={overview.basis ? basedOn(m, overview.basis.medianRevenueCompanies, overview.companyCount, locale) : undefined}
            source={overview.source}
          />
          <FriKpi
            label={m.growthShareLabel}
            value={overview.growthSharePercent}
            unit="%"
            description={overview.basis ? basedOn(m, overview.basis.growthCompanies, overview.companyCount, locale) : undefined}
            source={overview.source}
          />
          <FriKpi
            label={m.regionShareLabel}
            value={overview.regionSharePercent}
            unit="%"
            description={overview.basis ? basedOn(m, overview.basis.regionCompanies, overview.companyCount, locale) : undefined}
            source={overview.source}
          />
        </dl>
      </section>

      <div className="fri-two-col fri-section-demo">
        <section data-tour-id="market-distribution">
          <FriSectionTitle title={m.distribution.title} right={<span className="fri-mono">{m.distribution.sniLabel} {sniCode}</span>} />
          <FriBarChart bars={distribution.map((bucket) => ({ label: bucket.label, value: bucket.count }))} />
          {companies.length > 0 && (
            <p className="fri-muted" style={{ marginTop: 16 }}>
              {m.distribution.mostCommonLabel} {dominant.label} — {formatCount(dominant.count, locale)} {m.companiesUnit} {m.ofLabel}{" "}
              {formatCount(companies.length, locale)} ({dominantPercent} %). {basedOn(m, companies.length, overview.companyCount, locale)}
            </p>
          )}
          <div style={{ marginTop: 14 }}>
            <FriSource source={overview.source} />
          </div>
        </section>

        <div style={{ display: "grid", gap: 48, alignContent: "start" }}>
          <section data-tour-id="market-outreach">
            <h2 className="fri-ruled" style={{ fontSize: "1.1rem", fontWeight: 540 }}>
              {m.outreach.title}
            </h2>
            {!outreach ? (
              <div style={{ marginTop: 14 }}>
                <FriLocked hint={m.outreach.notBuiltYet} />
              </div>
            ) : outreach.contacted === 0 ? (
              <div style={{ marginTop: 14 }}>
                <FriLocked hint={m.outreach.notSentYet} />
              </div>
            ) : (
              <>
                <ul className="fri-row-list">
                  <li>
                    <span className="fri-muted">{m.outreach.contactedLabel}</span>
                    <span className="fri-mono">
                      {formatCount(outreach.contacted, locale)} / {formatCount(outreach.total, locale)}
                    </span>
                  </li>
                  <li>
                    <span className="fri-muted">{m.outreach.respondedLabel}</span>
                    <span className="fri-mono">{formatCount(outreach.responded, locale)}</span>
                  </li>
                  <li>
                    <span className="fri-muted">{m.outreach.responseRateLabel}</span>
                    <span className="fri-mono">{Math.round((outreach.responded / outreach.contacted) * 100)}%</span>
                  </li>
                </ul>
                <div style={{ marginTop: 12 }}>
                  <FriSource source={data.outreachSource} dataType="customer" />
                </div>
              </>
            )}
          </section>

          <section data-tour-id="market-datalayers">
            <h2 className="fri-ruled" style={{ fontSize: "1.1rem", fontWeight: 540 }}>
              {m.dataLayers.title}
            </h2>
            <ul className="fri-layers">
              <li>
                <p style={{ fontWeight: 540 }}>{m.dataLayers.registerName}</p>
                <p className="fri-muted">{m.dataLayers.registerNote}</p>
                <FriSource source={overview.source} />
              </li>
              <li>
                <p style={{ fontWeight: 540 }}>{m.dataLayers.annualReportName}</p>
                <p className="fri-muted">{m.dataLayers.annualReportNote}</p>
                <FriSource source={overview.source} />
              </li>
              <li>
                <p style={{ fontWeight: 540 }}>{m.dataLayers.simulationName}</p>
                <p className="fri-muted">{m.dataLayers.simulationNote}</p>
                <FriSource source={simulation.source} dataType="simulation" />
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="fri-section-demo" data-tour-id="market-competitors">
        <FriSectionTitle title={m.competitorsTitle} />
        <ul className="fri-pulse">
          {overview.competitors.map((competitor) => (
            <li key={competitor.name} className="fri-ruled">
              <p style={{ fontSize: "1.15rem", fontWeight: 540 }}>{competitor.name}</p>
              <p className="fri-muted" style={{ marginTop: 6 }}>
                {competitor.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="fri-section-demo" data-tour-id="market-simulation">
        <FriSectionTitle title={m.simulationTitle} />
        <div style={{ marginTop: 20 }}>
          <FriSimulation simulation={simulation} />
        </div>
      </section>
    </>
  );
}
