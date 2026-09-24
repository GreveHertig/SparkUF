"use client";

import { useEffect, useState } from "react";
import { useI18n, type Locale } from "@/i18n/context";
import { formatCount, formatDate } from "@/i18n/format";
import type { Källa } from "@/core/domain";
import type { CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import type { JourneyStepVerdict } from "@/ports/JourneyRepository";
import type { Simulation } from "@/ports/SimulationProvider";
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
import { useDemoStore, getCurrentStepNumber } from "@/adapters/demo/demoStore";
import { FriSource } from "../../_components/FriSource";
import { FriKpi, FriLocked, FriPageHead, FriSectionTitle, FriSimulation, FriStatus, FriVerdict } from "../../_components/FriParts";

type ValidationData = {
  rows: CampaignRow[];
  outreachSource: Källa | null;
  contactedDateRange: { startIso: string; endIso: string } | null;
  openRate: number | null;
  openRateSource: Källa | null;
  assumptions: ValidationAssumption[];
  responses: ResponseCard[];
  verdict: JourneyStepVerdict | null;
  verdictScoreTotal: number | null;
  simulation: Simulation | null;
};

const statusTone: Record<OutreachStatus, "muted" | "ok" | "signal"> = {
  draft: "muted",
  sent: "muted",
  opened: "ok",
  responded: "signal",
};

function dateRangeLabel(range: { startIso: string; endIso: string }, locale: Locale): string {
  return `${formatDate(range.startIso, locale)} – ${formatDate(range.endIso, locale)}`;
}

/** Valideringen i kopian: samma data och villkor som /demo/app/validering (screens/Validation). */
export default function FriValidationPage() {
  const { t, locale } = useI18n();
  const v = t.validationPage;
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const notInScenario = entry === "hasIdea";
  const [data, setData] = useState<ValidationData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentStep = notInScenario ? 0 : getCurrentStepNumber();
    const showSimulation = !notInScenario && currentStep >= 4;
    const showOutreachKpis = !notInScenario && currentStep >= 5;
    const showVerdict = !notInScenario && currentStep >= 6;
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
        outreachSource: rows.length > 0 ? outreachSource[locale] : null,
        responses,
        assumptions,
        simulation,
        contactedDateRange: showOutreachKpis ? outreachDateRange : null,
        openRate: showOutreachKpis ? outreachOpenRate : null,
        openRateSource: showOutreachKpis ? outreachOpenRateSource[locale] : null,
        verdict: stepDetail?.verdict ?? null,
        verdictScoreTotal: stepDetail?.scoreDelta?.total ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, notInScenario]);

  if (!data) return null;

  const contacted = data.rows.filter((row) => row.status !== "draft").length;
  const responded = data.rows.filter((row) => row.status === "responded").length;
  const responseRate = contacted > 0 ? Math.round((responded / contacted) * 100) : null;

  return (
    <>
      <FriPageHead title={v.title} lead={v.subtitle} />

      {data.rows.length === 0 ? (
        <div className="fri-section-demo">
          <FriLocked hint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 03`} />
        </div>
      ) : (
        <>
          <section className="fri-section-demo" data-tour-id="validation-kpi">
            <FriSectionTitle title={v.kpiTitle} />
            <dl className="fri-kpis" style={{ marginTop: 24 }}>
              <FriKpi
                label={v.contactedLabel}
                value={contacted}
                description={data.contactedDateRange ? dateRangeLabel(data.contactedDateRange, locale) : undefined}
                source={data.outreachSource ?? undefined}
                dataType="customer"
              />
              <FriKpi label={v.respondedLabel} value={responded} source={data.outreachSource ?? undefined} dataType="customer" />
              {responseRate !== null && (
                <FriKpi label={v.responseRateLabel} value={responseRate} unit="%" source={data.outreachSource ?? undefined} dataType="customer" />
              )}
              {data.openRate !== null && data.openRateSource && (
                <FriKpi label={v.openRateLabel} value={data.openRate} unit="%" source={data.openRateSource} dataType="customer" />
              )}
            </dl>
          </section>

          {data.assumptions.length > 0 && (
            <section className="fri-section-demo" data-tour-id="validation-assumptions">
              <FriSectionTitle title={v.assumptionsTitle} />
              <ul className="fri-legal">
                {data.assumptions.map((assumption) => (
                  <li key={assumption.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                      <p style={{ fontSize: "1.15rem", fontWeight: 540 }}>{assumption.text}</p>
                      <FriStatus tone={assumption.verdict === "confirmed" ? "ok" : "warn"}>{v.assumptionVerdict[assumption.verdict]}</FriStatus>
                    </div>
                    <p className="fri-muted" style={{ marginTop: 6 }}>
                      {assumption.basis}
                    </p>
                    <div style={{ marginTop: 12 }}>
                      <FriSource source={assumption.source} dataType="customer" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.responses.length > 0 && (
            <section className="fri-section-demo" data-tour-id="validation-responses">
              <FriSectionTitle title={v.responsesTitle} />
              <ul className="fri-quotes">
                {data.responses.map((response) => (
                  <li key={response.companyName}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                      <p style={{ fontWeight: 540 }}>{response.companyName}</p>
                      <FriStatus tone={response.verdict === "confirms" ? "ok" : "warn"}>{v.responseVerdict[response.verdict]}</FriStatus>
                    </div>
                    <p className="fri-mono fri-muted" style={{ marginTop: 4 }}>
                      {response.county} · {response.employees} · {formatDate(response.dateIso, locale)}
                    </p>
                    <blockquote>“{response.quote}”</blockquote>
                    <p className="fri-mono fri-muted">
                      {v.priceTestedLabel}: {formatCount(response.priceTestedKr, locale)} kr
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="fri-section-demo" data-tour-id="validation-table">
            <FriSectionTitle title={v.tableTitle} />
            <div className="fri-table-wrap">
              <table className="fri-table">
                <thead>
                  <tr>
                    <th>{v.tableCompany}</th>
                    <th>{v.tableSni}</th>
                    <th className="num">{v.tableEmployees}</th>
                    <th className="num">{v.tableRevenue}</th>
                    <th>{v.tableStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.companyName}>
                      <td style={{ fontWeight: 540 }}>{row.companyName}</td>
                      <td className="fri-mono">{row.sniCode}</td>
                      <td className="num fri-mono">{row.employees}</td>
                      <td className="num fri-mono">{formatCount(row.revenueKsek, locale)} tkr</td>
                      <td>
                        <FriStatus tone={statusTone[row.status]}>{v.status[row.status]}</FriStatus>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {data.verdict && data.verdictScoreTotal !== null && (
            <section className="fri-section-demo" data-tour-id="validation-verdict">
              <FriSectionTitle title={v.verdictTitle} />
              <div style={{ marginTop: 20 }}>
                <FriVerdict score={data.verdictScoreTotal} headline={data.verdict.headline} reasoning={data.verdict.reasoning} />
              </div>
              {responseRate !== null && (
                <p className="fri-muted" style={{ marginTop: 12, fontSize: "0.92rem" }}>
                  {v.confidencePrefix} {formatCount(responded, locale)} {t.marketPage.ofLabel} {formatCount(contacted, locale)}{" "}
                  {v.confidenceContactedUnit} ({responseRate} % {v.confidenceRateSuffix}).
                </p>
              )}
            </section>
          )}

          {data.simulation && (
            <section className="fri-section-demo">
              <FriSectionTitle title={v.simulationTitle} />
              <div style={{ marginTop: 20, maxWidth: 640 }}>
                <FriSimulation simulation={data.simulation} />
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
