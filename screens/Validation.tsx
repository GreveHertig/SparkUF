"use client";

import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LockedState } from "@/components/ui/LockedState";
import { SourceTag } from "@/components/ui/SourceTag";
import { KpiRow } from "@/components/spark/KpiRow";
import { KpiTile } from "@/components/spark/KpiTile";
import { SimulationCard } from "@/components/spark/SimulationCard";
import { VerdictCard } from "@/components/spark/VerdictCard";
import { cn } from "@/design/cn";
import { useI18n, type Locale } from "@/i18n/context";
import { formatCount, formatDate } from "@/i18n/format";
import type { Källa } from "@/core/domain";
import type { CampaignRow, OutreachStatus } from "@/ports/OutreachProvider";
import type { JourneyStepVerdict } from "@/ports/JourneyRepository";
import type { Simulation } from "@/ports/SimulationProvider";
import type { ResponseCard, ValidationAssumption } from "@/adapters/demo/OutreachProvider";

export type ValidationData = {
  /** Hela kontaktlistan (avsnitt 6, tidigare Kunder) — inget tappas i
   * hopslagningen, se docs/status.md. */
  rows: CampaignRow[];
  /** `CampaignRow` bär ingen egen källa (avsnitt 14.3) — samma mönster som
   * `MarketData.outreachSource` (Marknad-sidan), Datalöftet kräver ändå en
   * källa på kontaktade/svar/svarsfrekvens. */
  outreachSource: Källa | null;
  /** Utskicksperioden, för del 1:s "antal kontaktade med datumintervall" —
   * `null` innan kontaktlistan är byggd. */
  contactedDateRange: { startIso: string; endIso: string } | null;
  /** Öppningsfrekvensen, del 1:s fjärde nyckeltal (jämförelsetal) —
   * `null`/`null` tills utskicket är igång. Se docs/status.md för varför
   * det här ersätter ett branschsnitt som inte finns som riktig data. */
  openRate: number | null;
  openRateSource: Källa | null;
  /** "Antagandena som prövades" (del 2) — [] innan steg 06 är nått. */
  assumptions: ValidationAssumption[];
  /** Svaren från namngivna personer (del 3) — [] innan första svaret kommit in. */
  responses: ResponseCard[];
  /** Domen (del 4) — `null` innan steg 06 är nått. */
  verdict: JourneyStepVerdict | null;
  /** Totalpoängen vid domen (`JourneyStepDetail.scoreDelta.total`) — läst,
   * aldrig räknad här. `VerdictCard` behöver den för nivåfärgen. */
  verdictScoreTotal: number | null;
  /** Betalningstoleranssimuleringen (avsnitt 2.2, steg 04) — null innan steget är nått. */
  simulation: Simulation | null;
};

const statusToneClasses: Record<OutreachStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-slate-100 text-slate-600",
  opened: "bg-data-register-bg text-data-register",
  responded: "bg-data-customer-bg text-data-customer",
};

function computeOutreachStats(rows: CampaignRow[]) {
  const contacted = rows.filter((row) => row.status !== "draft").length;
  const responded = rows.filter((row) => row.status === "responded").length;
  return { contacted, responded };
}

function dateRangeLabel(range: { startIso: string; endIso: string }, locale: Locale): string {
  return `${formatDate(range.startIso, locale)} – ${formatDate(range.endIso, locale)}`;
}

/** Valideringen (uppgift 3): Kunder och valideringen hopslagna — allt som
 * prövats mot verkliga kunder, samlat på en sida i den ordning uppdraget
 * angav (nyckeltal → antaganden → svar → domen), plus den fullständiga
 * kontaktlistan bevarad (inget tappas). */
export function Validation({ data, notInScenario }: { data: ValidationData; notInScenario?: boolean }) {
  const { locale, t } = useI18n();
  const v = t.validationPage;
  const { contacted, responded } = computeOutreachStats(data.rows);
  const responseRate = contacted > 0 ? Math.round((responded / contacted) * 100) : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <EditorialHeading as="h1">{v.title}</EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{v.subtitle}</p>
      </div>

      {data.rows.length === 0 ? (
        <LockedState
          unlockHint={notInScenario ? t.homePage.notInThisScenario : `${t.homePage.unlocksAfterStepBefore} 03`}
        />
      ) : (
        <>
          <section data-tour-id="validation-kpi" className="flex flex-col gap-3">
            <Eyebrow>{v.kpiTitle}</Eyebrow>
            <KpiRow>
              <KpiTile
                label={v.contactedLabel}
                value={contacted}
                description={data.contactedDateRange ? dateRangeLabel(data.contactedDateRange, locale) : undefined}
                source={data.outreachSource ?? undefined}
                dataType="customer"
              />
              <KpiTile
                label={v.respondedLabel}
                value={responded}
                source={data.outreachSource ?? undefined}
                dataType="customer"
              />
              {responseRate !== null && (
                <KpiTile
                  label={v.responseRateLabel}
                  value={responseRate}
                  unit="%"
                  source={data.outreachSource ?? undefined}
                  dataType="customer"
                />
              )}
              {data.openRate !== null && data.openRateSource && (
                <KpiTile
                  label={v.openRateLabel}
                  value={data.openRate}
                  unit="%"
                  source={data.openRateSource}
                  dataType="customer"
                />
              )}
            </KpiRow>
          </section>

          {data.assumptions.length > 0 && (
            <section data-tour-id="validation-assumptions" className="flex flex-col gap-2">
              <Eyebrow>{v.assumptionsTitle}</Eyebrow>
              <div className="flex flex-col gap-2">
                {data.assumptions.map((assumption) => (
                  <div
                    key={assumption.id}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{assumption.text}</p>
                      <p className="mt-1 text-sm text-slate-600">{assumption.basis}</p>
                      <div className="mt-2">
                        <SourceTag source={assumption.source} dataType="customer" />
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 self-start rounded-pill px-2.5 py-1 text-xs font-semibold uppercase",
                        assumption.verdict === "confirmed"
                          ? "bg-score-green-bg text-score-green"
                          : "bg-score-orange-bg text-score-orange",
                      )}
                      style={{ letterSpacing: "var(--tracking-label)" }}
                    >
                      {v.assumptionVerdict[assumption.verdict]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.responses.length > 0 && (
            <section data-tour-id="validation-responses" className="flex flex-col gap-2.5">
              <Eyebrow>{v.responsesTitle}</Eyebrow>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.responses.map((response) => (
                  <div key={response.companyName} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{response.companyName}</p>
                        <p className="font-numeric text-xs text-slate-500">
                          {response.county} · {response.employees} · {formatDate(response.dateIso, locale)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold uppercase",
                          response.verdict === "confirms"
                            ? "bg-score-green-bg text-score-green"
                            : "bg-score-orange-bg text-score-orange",
                        )}
                        style={{ letterSpacing: "var(--tracking-label)" }}
                      >
                        {v.responseVerdict[response.verdict]}
                      </span>
                    </div>
                    <p className="text-sm italic leading-snug text-slate-700">&quot;{response.quote}&quot;</p>
                    <p className="font-numeric text-xs text-slate-500">
                      {v.priceTestedLabel}: {formatCount(response.priceTestedKr, locale)} kr
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section data-tour-id="validation-table" className="flex flex-col gap-2.5">
            <Eyebrow>{v.tableTitle}</Eyebrow>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                    <th className="px-3 py-2">{v.tableCompany}</th>
                    <th className="px-3 py-2">{v.tableSni}</th>
                    <th className="px-3 py-2">{v.tableEmployees}</th>
                    <th className="px-3 py-2">{v.tableRevenue}</th>
                    <th className="px-3 py-2">{v.tableStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.companyName} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="px-3 py-2 font-medium text-slate-900">{row.companyName}</td>
                      <td className="font-numeric px-3 py-2 text-slate-600">{row.sniCode}</td>
                      <td className="font-numeric px-3 py-2 text-slate-600">{row.employees}</td>
                      <td className="font-numeric px-3 py-2 text-slate-600">
                        {formatCount(row.revenueKsek, locale)} tkr
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-pill px-2 py-0.5 text-xs font-semibold uppercase",
                            statusToneClasses[row.status],
                          )}
                          style={{ letterSpacing: "var(--tracking-label)" }}
                        >
                          {v.status[row.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {data.verdict && data.verdictScoreTotal !== null && (
            <section data-tour-id="validation-verdict" className="flex flex-col gap-2.5">
              <Eyebrow>{v.verdictTitle}</Eyebrow>
              <VerdictCard score={data.verdictScoreTotal} headline={data.verdict.headline} reasoning={data.verdict.reasoning} />
              {responseRate !== null && (
                <p className="text-xs text-slate-500">
                  {v.confidencePrefix} {formatCount(responded, locale)} {t.marketPage.ofLabel}{" "}
                  {formatCount(contacted, locale)} {v.confidenceContactedUnit} ({responseRate} %{" "}
                  {v.confidenceRateSuffix}).
                </p>
              )}
            </section>
          )}

          {data.simulation && (
            <section className="flex flex-col gap-2.5">
              <Eyebrow>{v.simulationTitle}</Eyebrow>
              <SimulationCard simulation={data.simulation} className="max-w-xl" />
            </section>
          )}
        </>
      )}
    </div>
  );
}
