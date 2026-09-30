"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { formatCount, formatDate } from "@/i18n/format";
import type { DataKind, Källa } from "@/core/domain";
import { sizeClassFor } from "@/core/sizeClass";
import { outreachStats } from "@/core/validation";
import type { CampaignRow, OutreachStatus, ResponseCard, ValidationAssumption } from "@/ports/OutreachProvider";
import type { Simulation } from "@/ports/SimulationProvider";
import { ExampleLabel, Figures, SimulationBlock, VerdictBlock, type Figure } from "./blocks/DataBlocks";
import { Locked, PageHead, Pill, type PillTone } from "./blocks/PageBlocks";

/** Domen som Valideringen visar den: poängen vid domen, utslaget och motiveringen. */
export type ValidationVerdict = {
  score: number;
  headline: string;
  reasoning: string;
};

/**
 * Datan skärmen behöver, redan hämtad av den monterande routen. Platshållare
 * per sektion (docs/plan-en-design.md): `null` betyder att just den datan
 * saknas (stubbe eller platshållarfel) och ger "Kommer snart" i den
 * sektionen. En tom lista och `"notReached"` betyder att steget inte är nått
 * än; sektionen visas då inte, som i demot.
 */
export type ValidationData = {
  /** Hela kontaktlistan. `null` ger "Kommer snart" i nyckeltalen och i listan. */
  rows: CampaignRow[] | null;
  /** `CampaignRow` bär ingen egen källa; källan för kontaktade, svar och svarsfrekvens. */
  outreachSource: Källa | null;
  /** Utskicksperioden, visas under "Kontaktade". */
  dateRange: { startIso: string; endIso: string } | null;
  /** Öppningsfrekvensen visas bara när både talet och källan finns. */
  openRate: number | null;
  openRateSource: Källa | null;
  assumptions: ValidationAssumption[] | null;
  responses: ResponseCard[] | null;
  verdict: ValidationVerdict | null | "notReached";
  simulation: Simulation | null | "notReached";
};

/** Låst läge för hela sidan. Demot räknar ut det ur sitt moment, /app ur Resans steg. */
export type ValidationLock = { unlocksAfterStep: number } | "notInScenario" | null;

const statusTone: Record<OutreachStatus, PillTone> = {
  draft: "neutral",
  sent: "neutral",
  opened: "register",
  responded: "customer",
};

/**
 * Validering: nyckeltalen, antagandena som prövades, svaren från namngivna
 * företag, hela kontaktlistan, domen och simuleringen. Markup flyttad rakt av
 * från demots `app/demo/(app)/validering/page.tsx` (PR 7,
 * docs/plan-en-design.md). Antal anställda visas som storleksklass, aldrig
 * som exakt tal (docs/buggar-2026-09.md punkt 13).
 */
export function Validation({
  data,
  dataKind,
  locked,
}: {
  data: ValidationData;
  dataKind: DataKind;
  locked: ValidationLock;
}) {
  const { t, locale } = useI18n();
  const v = t.validationPage;

  if (locked) {
    return (
      <div className="fdd-page">
        <PageHead title={v.title} lede={v.subtitle} />
        <Locked
          hint={
            locked === "notInScenario"
              ? t.homePage.notInThisScenario
              : `${t.homePage.unlocksAfterStepBefore} ${String(locked.unlocksAfterStep).padStart(2, "0")}`
          }
        />
      </div>
    );
  }

  const stats = data.rows ? outreachStats(data.rows) : null;
  const source = data.outreachSource ?? undefined;

  const figures: Figure[] = [];
  if (stats) {
    figures.push(
      {
        label: v.contactedLabel,
        value: stats.contacted,
        description: data.dateRange
          ? `${formatDate(data.dateRange.startIso, locale)} - ${formatDate(data.dateRange.endIso, locale)}`
          : undefined,
        source,
        dataType: "customer",
      },
      { label: v.respondedLabel, value: stats.responded, source, dataType: "customer" },
    );
    if (stats.responseRate !== null) {
      figures.push({ label: v.responseRateLabel, value: stats.responseRate, unit: "%", source, dataType: "customer" });
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
  }

  return (
    <div className="fdd-page">
      <PageHead title={v.title} lede={v.subtitle} />

      <section className="fdd-block" aria-labelledby="fdd-val-kpi">
        <h2 id="fdd-val-kpi" className="fdd-block__title">
          {v.kpiTitle}
        </h2>
        {stats ? <Figures tourId="validation-kpi" items={figures} /> : <ComingSoon />}
      </section>

      {data.verdict !== "notReached" && (
        <section className="fdd-block" aria-labelledby="fdd-val-verdict" data-tour-id="validation-verdict">
          <h2 id="fdd-val-verdict" className="fdd-block__title">
            {v.verdictTitle}
          </h2>
          {data.verdict ? (
            <>
              <VerdictBlock
                score={data.verdict.score}
                headline={data.verdict.headline}
                reasoning={data.verdict.reasoning}
              />
              {stats && stats.responseRate !== null && (
                <p className="fdd-muted">
                  {v.confidencePrefix} {formatCount(stats.responded, locale)} {t.marketPage.ofLabel}{" "}
                  {formatCount(stats.contacted, locale)} {v.confidenceContactedUnit} ({stats.responseRate} %{" "}
                  {v.confidenceRateSuffix}).
                </p>
              )}
            </>
          ) : (
            <ComingSoon />
          )}
        </section>
      )}

      {(data.assumptions === null || data.assumptions.length > 0) && (
        <section className="fdd-block" aria-labelledby="fdd-val-assumptions" data-tour-id="validation-assumptions">
          <h2 id="fdd-val-assumptions" className="fdd-block__title">
            {v.assumptionsTitle}
          </h2>
          {data.assumptions ? (
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
          ) : (
            <ComingSoon />
          )}
        </section>
      )}

      {(data.responses === null || data.responses.length > 0) && (
        <section className="fdd-block" aria-labelledby="fdd-val-responses">
          <h2 id="fdd-val-responses" className="fdd-block__title">
            {v.responsesTitle}
          </h2>
          {data.responses ? (
            <>
              <ExampleLabel dataKind={dataKind} />
              <ul className="fdd-quotes" data-tour-id="validation-responses">
                {data.responses.map((response) => (
                  <li key={response.companyName} className="fd-panel fdd-quote">
                    <div className="fdd-quote__head">
                      <div>
                        <p className="fdd-rows__title">{response.companyName}</p>
                        <p className="fdd-muted">
                          {response.county}, {sizeClassFor(response.employees)?.range ?? "–"}{" "}
                          {t.site.registry.employeesUnit}, {formatDate(response.dateIso, locale)}
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
            </>
          ) : (
            <ComingSoon />
          )}
        </section>
      )}

      <section className="fdd-block" aria-labelledby="fdd-val-table" data-tour-id="validation-table">
        <h2 id="fdd-val-table" className="fdd-block__title">
          {v.tableTitle}
        </h2>
        {data.rows ? (
          <>
            <ExampleLabel dataKind={dataKind} />
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
          </>
        ) : (
          <ComingSoon />
        )}
      </section>

      {data.simulation !== "notReached" && (
        <section className="fdd-block" aria-labelledby="fdd-val-sim">
          <h2 id="fdd-val-sim" className="fdd-block__title">
            {/* Demots rubrik nämner byråer (Saras scenario); /app får en neutral. */}
            {dataKind === "example" ? v.simulationTitle : v.simulationTitleLive}
          </h2>
          {data.simulation ? <SimulationBlock simulation={data.simulation} /> : <ComingSoon />}
        </section>
      )}
    </div>
  );
}
