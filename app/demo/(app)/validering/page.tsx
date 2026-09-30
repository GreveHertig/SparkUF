"use client";

import { useEffect, useState } from "react";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { formatCount, formatDate } from "@/i18n/format";
import {
  demoOutreachProvider,
  getResponseCards,
  getValidationAssumptions,
  outreachDateRange,
  outreachOpenRate,
  outreachOpenRateSource,
  outreachSource,
  type ResponseCard,
  type ValidationAssumption,
} from "@/adapters/demo/OutreachProvider";
import { demoSimulationProvider, simulationQuestions } from "@/adapters/demo/SimulationProvider";
import { demoJourneyRepository } from "@/adapters/demo/JourneyRepository";
import { getCurrentStepNumber, useDemoStore } from "@/adapters/demo/demoStore";
import type { Källa } from "@/core/domain";
import type { CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import type { JourneyStepVerdict } from "@/ports/JourneyRepository";
import type { Simulation } from "@/ports/SimulationProvider";
import {
  ExampleLabel,
  Figures,
  Locked,
  PageHead,
  Pill,
  SimulationBlock,
  VerdictBlock,
  type Figure,
  type PillTone,
} from "../../_components/DemoBlocks";
import { sizeClassFor } from "../../_lib/sizeClass";

type ValidationData = {
  rows: CampaignRow[];
  source: Källa | null;
  dateRange: { startIso: string; endIso: string } | null;
  openRate: number | null;
  openRateSource: Källa | null;
  assumptions: ValidationAssumption[];
  responses: ResponseCard[];
  verdict: JourneyStepVerdict | null;
  verdictScore: number | null;
  simulation: Simulation | null;
};

const statusTone: Record<OutreachStatus, PillTone> = {
  draft: "neutral",
  sent: "neutral",
  opened: "register",
  responded: "customer",
};

/**
 * Validering: nyckeltalen, antagandena som prövades, svaren från
 * namngivna företag, hela kontaktlistan, domen och simuleringen. Samma urval
 * per steg som det riktiga demots route.
 */
export default function FondaDemoValidationPage() {
  const { t, locale } = useI18n();
  const v = t.validationPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const [data, setData] = useState<ValidationData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const step = notInScenario ? 0 : getCurrentStepNumber();
    const showSimulation = !notInScenario && step >= 4;
    const showOutreach = !notInScenario && step >= 5;
    const showVerdict = !notInScenario && step >= 6;
    Promise.all([
      demoOutreachProvider.getCampaign(locale),
      getResponseCards(locale),
      getValidationAssumptions(locale),
      showSimulation ? demoSimulationProvider.simulate(simulationQuestions.tolerance[locale], locale) : null,
      showVerdict ? demoJourneyRepository.getStepDetail(6, locale) : null,
    ]).then(([rows, responses, assumptions, simulation, stepDetail]) => {
      if (cancelled) return;
      setData({
        rows,
        source: rows.length > 0 ? outreachSource[locale] : null,
        dateRange: showOutreach ? outreachDateRange : null,
        openRate: showOutreach ? outreachOpenRate : null,
        openRateSource: showOutreach ? outreachOpenRateSource[locale] : null,
        assumptions,
        responses,
        verdict: stepDetail?.verdict ?? null,
        verdictScore: stepDetail?.scoreDelta?.total ?? null,
        simulation,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, notInScenario]);

  if (!data) return null;

  if (data.rows.length === 0) {
    return (
      <div className="fdd-page">
        <PageHead title={v.title} lede={v.subtitle} />
        <Locked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 03`} />
      </div>
    );
  }

  const contacted = data.rows.filter((row) => row.status !== "draft").length;
  const responded = data.rows.filter((row) => row.status === "responded").length;
  const responseRate = contacted > 0 ? Math.round((responded / contacted) * 100) : null;
  const source = data.source ?? undefined;

  const figures: Figure[] = [
    {
      label: v.contactedLabel,
      value: contacted,
      description: data.dateRange
        ? `${formatDate(data.dateRange.startIso, locale)} - ${formatDate(data.dateRange.endIso, locale)}`
        : undefined,
      source,
      dataType: "customer",
    },
    { label: v.respondedLabel, value: responded, source, dataType: "customer" },
  ];
  if (responseRate !== null) {
    figures.push({ label: v.responseRateLabel, value: responseRate, unit: "%", source, dataType: "customer" });
  }
  if (data.openRate !== null && data.openRateSource) {
    figures.push({
      label: v.openRateLabel,
      value: data.openRate,
      unit: "%",
      source: data.openRateSource,
      dataType: "customer",
    });
  }

  return (
    <div className="fdd-page">
      <PageHead title={v.title} lede={v.subtitle} />

      <section className="fdd-block" aria-labelledby="fdd-val-kpi">
        <h2 id="fdd-val-kpi" className="fdd-block__title">
          {v.kpiTitle}
        </h2>
        <Figures tourId="validation-kpi" items={figures} />
      </section>

      {data.verdict && data.verdictScore !== null && (
        <section className="fdd-block" aria-labelledby="fdd-val-verdict" data-tour-id="validation-verdict">
          <h2 id="fdd-val-verdict" className="fdd-block__title">
            {v.verdictTitle}
          </h2>
          <VerdictBlock score={data.verdictScore} headline={data.verdict.headline} reasoning={data.verdict.reasoning} />
          {responseRate !== null && (
            <p className="fdd-muted">
              {v.confidencePrefix} {formatCount(responded, locale)} {t.marketPage.ofLabel}{" "}
              {formatCount(contacted, locale)} {v.confidenceContactedUnit} ({responseRate} % {v.confidenceRateSuffix}).
            </p>
          )}
        </section>
      )}

      {data.assumptions.length > 0 && (
        <section className="fdd-block" aria-labelledby="fdd-val-assumptions" data-tour-id="validation-assumptions">
          <h2 id="fdd-val-assumptions" className="fdd-block__title">
            {v.assumptionsTitle}
          </h2>
          <ul className="fdd-rows">
            {data.assumptions.map((assumption) => (
              <li key={assumption.id} className="fdd-rows__item">
                <div className="fdd-rows__main">
                  <p className="fdd-rows__title">{assumption.text}</p>
                  <p className="fdd-muted">{assumption.basis}</p>
                  <SourceTag source={assumption.source} dataType="customer" />
                </div>
                <Pill tone={assumption.verdict === "confirmed" ? "green" : "orange"}>
                  {v.assumptionVerdict[assumption.verdict]}
                </Pill>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.responses.length > 0 && (
        <section className="fdd-block" aria-labelledby="fdd-val-responses">
          <h2 id="fdd-val-responses" className="fdd-block__title">
            {v.responsesTitle}
          </h2>
          <ExampleLabel dataKind="example" />
          <ul className="fdd-quotes" data-tour-id="validation-responses">
            {data.responses.map((response) => (
              <li key={response.companyName} className="fd-panel fdd-quote">
                <div className="fdd-quote__head">
                  <div>
                    <p className="fdd-rows__title">{response.companyName}</p>
                    <p className="fdd-muted">
                      {response.county}, {sizeClassFor(response.employees)?.range ?? "–"} {t.site.registry.employeesUnit},{" "}
                      {formatDate(response.dateIso, locale)}
                    </p>
                  </div>
                  <Pill tone={response.verdict === "confirms" ? "green" : "orange"}>
                    {v.responseVerdict[response.verdict]}
                  </Pill>
                </div>
                <blockquote className="fdd-quote__text">”{response.quote}”</blockquote>
                <p className="fdd-muted">
                  {v.priceTestedLabel}: {formatCount(response.priceTestedKr, locale)} kr
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="fdd-block" aria-labelledby="fdd-val-table" data-tour-id="validation-table">
        <h2 id="fdd-val-table" className="fdd-block__title">
          {v.tableTitle}
        </h2>
        <ExampleLabel dataKind="example" />
        <div className="fdd-table">
          <table>
            <thead>
              <tr>
                <th scope="col">{v.tableCompany}</th>
                <th scope="col">{v.tableSni}</th>
                <th scope="col" className="fdd-num">
                  {v.tableEmployees}
                </th>
                <th scope="col" className="fdd-num">
                  {v.tableRevenue}
                </th>
                <th scope="col">{v.tableStatus}</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.companyName}>
                  <td>{row.companyName}</td>
                  <td className="fdd-muted">{row.sniCode}</td>
                  <td className="fdd-num">{sizeClassFor(row.employees)?.range ?? "–"}</td>
                  <td className="fdd-num">{formatCount(row.revenueKsek, locale)} tkr</td>
                  <td>
                    <Pill tone={statusTone[row.status]}>{v.status[row.status]}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {data.simulation && (
        <section className="fdd-block" aria-labelledby="fdd-val-sim">
          <h2 id="fdd-val-sim" className="fdd-block__title">
            {v.simulationTitle}
          </h2>
          <SimulationBlock simulation={data.simulation} />
        </section>
      )}
    </div>
  );
}
