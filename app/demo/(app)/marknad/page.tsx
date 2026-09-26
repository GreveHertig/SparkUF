"use client";

import { useEffect, useState } from "react";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n, type Locale } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { formatCount, formatSek } from "@/i18n/format";
import { demoRegistryProvider, SARA_INDUSTRY_LABEL, SARA_MARKET_SNI_CODE } from "@/adapters/demo/RegistryProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { demoOutreachProvider, outreachSource } from "@/adapters/demo/OutreachProvider";
import { getCurrentStepNumber, useDemoStore } from "@/adapters/demo/demoStore";
import type { Källa } from "@/core/domain";
import type { MarketOverview, RegistryCompany } from "@/ports/RegistryProvider";
import type { CampaignRow } from "@/ports/OutreachProvider";
import type { Simulation } from "@/ports/SimulationProvider";
import {
  ExampleLabel,
  Figures, Locked, PageHead, SimulationBlock } from "../../_components/DemoBlocks";
import { SIZE_CLASSES } from "../../_lib/sizeClass";

type MarketData = {
  overview: MarketOverview;
  simulation: Simulation;
  companies: RegistryCompany[];
  campaign: CampaignRow[];
  outreachSource: Källa;
  industryLabel: string;
};

type M = Dictionary["marketPage"];

// Storleksklasser, aldrig exakta tal (samma indelning som screens/Market.tsx).

function basedOn(m: M, n: number, total: number, locale: Locale): string {
  return `${m.basedOnLabel} ${formatCount(n, locale)} ${m.ofLabel} ${formatCount(total, locale)} ${m.companiesUnit}.`;
}

/**
 * Marknad: registrets nyckeltal med urval och källa, storleks-
 * fördelningen, utskickets svar, datalagren, konkurrenterna och
 * simuleringen, som alltid hålls åtskild från registret.
 */
export default function FondaDemoMarketPage() {
  const { t, locale } = useI18n();
  const m = t.marketPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  // Som i originalet: marknadsbilden finns bara i Saras scenario, från steg 03.
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
      if (cancelled) return;
      setData({
        overview,
        simulation,
        companies,
        campaign,
        outreachSource: outreachSource[locale],
        industryLabel: SARA_INDUSTRY_LABEL[locale],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, locale, beatIndex]);

  if (!unlocked) {
    return (
      <div className="fdd-page">
        <PageHead title={m.title} lede={m.subtitle} />
        <Locked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 02`} />
      </div>
    );
  }
  if (!data) return null;

  const { overview, simulation, companies, campaign } = data;
  const sizes = companies.map((company) => company.employees);
  const title =
    companies.length === 0
      ? data.industryLabel
      : `${data.industryLabel}, ${Math.min(...sizes)}–${Math.max(...sizes)} ${m.distribution.employeesUnit}`;

  const distribution = SIZE_CLASSES.map((bucket) => ({
    label: m.distribution.sizeBuckets[bucket.key],
    count: companies.filter((c) => c.employees >= bucket.min && c.employees <= bucket.max).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((bucket) => bucket.count));
  const dominant = distribution.reduce((best, bucket) => (bucket.count > best.count ? bucket : best), distribution[0]);
  const dominantPercent = companies.length > 0 ? Math.round((dominant.count / companies.length) * 100) : 0;

  const contacted = campaign.filter((row) => row.status !== "draft").length;
  const responded = campaign.filter((row) => row.status === "responded").length;

  return (
    <div className="fdd-page">
      <PageHead title={title} lede={m.subtitle} />

      <section className="fdd-block" aria-labelledby="fdd-market-kpi">
        <h2 id="fdd-market-kpi" className="fdd-block__title">
          {m.kpiTitle}
        </h2>
        <ExampleLabel />
        <Figures
          tourId="market-kpi"
          items={[
            {
              label: m.companyCountLabel,
              value: formatCount(overview.companyCount, locale),
              unit: m.companyCountUnit,
              description: m.companyCountDescription,
              source: overview.source,
            },
            {
              label: m.medianRevenueLabel,
              value: formatSek(overview.medianRevenueKsek * 1000, locale),
              description: overview.basis
                ? basedOn(m, overview.basis.medianRevenueCompanies, overview.companyCount, locale)
                : undefined,
              source: overview.source,
            },
            {
              label: m.growthShareLabel,
              value: overview.growthSharePercent,
              unit: "%",
              description: overview.basis
                ? basedOn(m, overview.basis.growthCompanies, overview.companyCount, locale)
                : undefined,
              source: overview.source,
            },
            {
              label: m.regionShareLabel,
              value: overview.regionSharePercent,
              unit: "%",
              description: overview.basis
                ? basedOn(m, overview.basis.regionCompanies, overview.companyCount, locale)
                : undefined,
              source: overview.source,
            },
          ]}
        />
      </section>

      <div className="fdd-hero">
        <section className="fd-panel" aria-labelledby="fdd-market-dist" data-tour-id="market-distribution">
          <div className="fdd-panel__head">
            <h2 id="fdd-market-dist" className="fdd-panel__title">
              {m.distribution.title}
            </h2>
            <span className="fdd-muted">
              {m.distribution.sniLabel} {companies[0]?.sniCode ?? ""}
            </span>
          </div>
          <ul className="fdd-bars">
            {distribution.map((bucket) => (
              <li key={bucket.label} className="fdd-bars__row">
                <span className="fdd-bars__label">{bucket.label}</span>
                <span className="fdd-bars__track" aria-hidden="true">
                  <span style={{ width: `${(bucket.count / maxCount) * 100}%` }} />
                </span>
                <span className="fdd-bars__value">{formatCount(bucket.count, locale)}</span>
              </li>
            ))}
          </ul>
          {companies.length > 0 && (
            <p className="fdd-muted">
              {m.distribution.mostCommonLabel} {dominant.label}: {formatCount(dominant.count, locale)}{" "}
              {m.companiesUnit} {m.ofLabel} {formatCount(companies.length, locale)} ({dominantPercent} %).{" "}
              {basedOn(m, companies.length, overview.companyCount, locale)}
            </p>
          )}
          <SourceTag source={overview.source} />
        </section>

        <div className="fdd-stack">
          <section className="fd-panel" aria-labelledby="fdd-market-outreach" data-tour-id="market-outreach">
            <h2 id="fdd-market-outreach" className="fdd-panel__title">
              {m.outreach.title}
            </h2>
            {campaign.length === 0 ? (
              <Locked hint={m.outreach.notBuiltYet} />
            ) : contacted === 0 ? (
              <Locked hint={m.outreach.notSentYet} />
            ) : (
              <>
                <dl className="fdd-pairs">
                  <div>
                    <dt>{m.outreach.contactedLabel}</dt>
                    <dd>
                      {formatCount(contacted, locale)} / {formatCount(campaign.length, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{m.outreach.respondedLabel}</dt>
                    <dd>{formatCount(responded, locale)}</dd>
                  </div>
                  <div>
                    <dt>{m.outreach.responseRateLabel}</dt>
                    <dd>{Math.round((responded / contacted) * 100)} %</dd>
                  </div>
                </dl>
                <SourceTag source={data.outreachSource} dataType="customer" />
              </>
            )}
          </section>

          <section className="fd-panel" aria-labelledby="fdd-market-layers" data-tour-id="market-datalayers">
            <h2 id="fdd-market-layers" className="fdd-panel__title">
              {m.dataLayers.title}
            </h2>
            <ul className="fdd-layers">
              <li>
                <p className="fdd-layers__name">{m.dataLayers.registerName}</p>
                <p className="fdd-muted">{m.dataLayers.registerNote}</p>
                <SourceTag source={overview.source} />
              </li>
              <li>
                <p className="fdd-layers__name">{m.dataLayers.annualReportName}</p>
                <p className="fdd-muted">{m.dataLayers.annualReportNote}</p>
                <SourceTag source={overview.source} />
              </li>
              <li>
                <p className="fdd-layers__name">{m.dataLayers.simulationName}</p>
                <p className="fdd-muted">{m.dataLayers.simulationNote}</p>
                <span className="fdd-inline">
                  <SourceTag source={simulation.source} dataType="simulation" />
                  <ConceptBadge />
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="fdd-block" aria-labelledby="fdd-market-comp" data-tour-id="market-competitors">
        <h2 id="fdd-market-comp" className="fdd-block__title">
          {m.competitorsTitle}
        </h2>
        <ExampleLabel />
        <ul className="fdd-cells">
          {overview.competitors.map((competitor) => (
            <li key={competitor.name}>
              <p className="fdd-cells__title">{competitor.name}</p>
              <p className="fdd-muted">{competitor.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="fdd-block" aria-labelledby="fdd-market-sim" data-tour-id="market-simulation">
        <h2 id="fdd-market-sim" className="fdd-block__title">
          {m.simulationTitle}
        </h2>
        <SimulationBlock simulation={simulation} />
      </section>
    </div>
  );
}
