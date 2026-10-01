"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { ConceptBadge } from "@/components/ui/ConceptBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n, type Locale } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { formatCount, formatSek } from "@/i18n/format";
import type { DataKind, Källa } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import { formatFiscalYearSpan, type FiscalYearSpan } from "@/core/fiscalYear";
import { dominantBucket, employeeSpan, sizeDistribution } from "@/core/market";
import { outreachStats } from "@/core/validation";
import type { CampaignRow } from "@/ports/OutreachProvider";
import type { MarketOverview, RegistryCompany } from "@/ports/RegistryProvider";
import type { Simulation } from "@/ports/SimulationProvider";
import { ExampleLabel, Figures, SimulationBlock, type Figure } from "./blocks/DataBlocks";
import { Locked, PageHead } from "./blocks/PageBlocks";

/**
 * Registerdelen av sidan. Ett objekt bär datan, där varje fält kan saknas för
 * sig (`null` ger "Kommer snart" i just den sektionen). De andra lägena bär
 * ingen data alls, så en stängd licensgrind kan aldrig visa en registersiffra:
 *
 * - `"closed"`: licensgrinden är stängd (`RegistryLockedError`).
 * - `"failed"`: registret svarade med ett fel. Feltexten visas aldrig.
 * - `"notChosen"`: ingen bransch vald än (bara /app, se `SniPicker`).
 */
export type MarketRegistry =
  | "closed"
  | "failed"
  | "notChosen"
  | {
      overview: MarketOverview | null;
      /** Urvalet storleksfördelningen och rubrikens spann räknas på. */
      companies: RegistryCompany[] | null;
      /**
       * Räkenskapsåren medianomsättningen bygger på. Porten bär dem inte än,
       * så `null` är det vanliga: då visas luckan i stället för medianen.
       */
      medianRevenueFiscalYears: FiscalYearSpan | null;
    };

/**
 * Datan skärmen behöver, redan hämtad av den monterande routen. Platshållare
 * per sektion (docs/plan-en-design.md): `null` ger "Kommer snart" i just den
 * sektionen.
 */
export type MarketData = {
  /** Branschens namn i rubriken. Demot har Saras; /app har inget än och visar sidans namn. */
  industryLabel: string | null;
  registry: MarketRegistry;
  /** Kontaktlistan och dess källa kommer ur samma utskick och gatas tillsammans. */
  outreach: { rows: CampaignRow[]; source: Källa } | null;
  simulation: Simulation | null;
  /** Källan för konkurrenternas beskrivningar, när porten inte bär någon.
   * Bara demot sätter den: beskrivningarna är exempeldata och får en
   * exempelkälla (PR 11), aldrig registrets. */
  competitorsSource?: { source: Källa; dataType: DataType };
  /** Källan för registrets siffror, när den inte är registrets egen. Bara
   * demot sätter den: demots registersiffror är påhittade och får en
   * exempelkälla, aldrig registrets grå tagg. */
  registrySource?: RegistryTag;
};

/** Låst läge för hela sidan. Demot räknar ut det ur sitt moment, /app ur Resans steg. */
export type MarketLock = { unlocksAfterStep: number } | "notInScenario" | null;

/**
 * Branschväljaren i /app (`?sni=69.201`). Ingen port ger användarens bransch
 * än; valet finns bara i adressen, samma öppna uppgift som bolagsformen i
 * Juridik (docs/plan-en-design.md, beslut 5). `invalid` betyder att adressen
 * hade en kod med fel form; den visas inte tillbaka.
 */
export type SniPicker = { basePath: string; current: string | null; invalid: boolean };

type M = Dictionary["marketPage"];
type RegistryTag = { source: Källa; dataType: DataType };

function basedOn(m: M, n: number, total: number, locale: Locale): string {
  return `${m.basedOnLabel} ${formatCount(n, locale)} ${m.ofLabel} ${formatCount(total, locale)} ${m.companiesUnit}.`;
}

/**
 * Marknad: registrets nyckeltal med urval och källa, storleksfördelningen,
 * utskickets svar, datalagren, konkurrenterna och simuleringen, som alltid
 * hålls åtskild från registret. Markup flyttad rakt av från demots
 * `app/demo/(app)/marknad/page.tsx` (PR 8, docs/plan-en-design.md).
 *
 * Omsättning visas bara med räkenskapsåret, eller spannet av år, den avser.
 * Saknas året visas luckan (Datalöftet: ingen siffra utan källa och datum).
 */
export function Market({
  data,
  dataKind,
  locked,
  sniPicker,
}: {
  data: MarketData;
  dataKind: DataKind;
  locked: MarketLock;
  sniPicker?: SniPicker;
}) {
  const { t, locale } = useI18n();
  const m = t.marketPage;
  const subtitle = dataKind === "example" ? m.subtitleExample : m.subtitle;

  if (locked) {
    return (
      <div className="fdd-page">
        <PageHead title={m.title} lede={subtitle} />
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

  const registry = typeof data.registry === "object" ? data.registry : null;
  const overview = registry?.overview ?? null;
  const registryTag: RegistryTag | null = overview
    ? (data.registrySource ?? { source: overview.source, dataType: "register" })
    : null;
  const companies = registry?.companies ?? null;
  const span = companies ? employeeSpan(companies) : null;
  const title = !data.industryLabel
    ? m.title
    : span
      ? `${data.industryLabel}, ${span.min}–${span.max} ${m.distribution.employeesUnit}`
      : data.industryLabel;

  /** Registersektionerna utan data: samma läge i varje sektion, aldrig en siffra. */
  const registryGap =
    data.registry === "closed" ? (
      <Locked hint={m.registryClosed} />
    ) : data.registry === "failed" ? (
      <p className="fdd-muted" role="alert">
        {m.registryLoadFailed}
      </p>
    ) : data.registry === "notChosen" ? (
      <Locked hint={m.sniChooseFirst} />
    ) : (
      <ComingSoon />
    );

  return (
    <div className="fdd-page">
      <PageHead title={title} lede={subtitle} />

      {sniPicker && data.registry !== "closed" && <SniForm picker={sniPicker} m={m} />}

      <section className="fdd-block" aria-labelledby="fdd-market-kpi">
        <h2 id="fdd-market-kpi" className="fdd-block__title">
          {dataKind === "example" ? m.kpiTitleExample : m.kpiTitle}
        </h2>
        {overview && registry ? (
          <>
            <ExampleLabel dataKind={dataKind} />
            <Figures
              tourId="market-kpi"
              items={kpiFigures(m, overview, registryTag, registry.medianRevenueFiscalYears, dataKind, t.common, locale)}
            />
          </>
        ) : (
          registryGap
        )}
      </section>

      <div className="fdd-hero">
        <section className="fd-panel" aria-labelledby="fdd-market-dist" data-tour-id="market-distribution">
          <div className="fdd-panel__head">
            <h2 id="fdd-market-dist" className="fdd-panel__title">
              {m.distribution.title}
            </h2>
            {companies && (
              <span className="fdd-muted">
                {m.distribution.sniLabel} {companies[0]?.sniCode ?? ""}
              </span>
            )}
          </div>
          {companies && overview ? (
            <Distribution companies={companies} overview={overview} tag={registryTag} m={m} locale={locale} />
          ) : (
            registryGap
          )}
        </section>

        <div className="fdd-stack">
          <section className="fd-panel" aria-labelledby="fdd-market-outreach" data-tour-id="market-outreach">
            <h2 id="fdd-market-outreach" className="fdd-panel__title">
              {m.outreach.title}
            </h2>
            {data.outreach ? <Outreach outreach={data.outreach} m={m} locale={locale} /> : <ComingSoon />}
          </section>

          <section className="fd-panel" aria-labelledby="fdd-market-layers" data-tour-id="market-datalayers">
            <h2 id="fdd-market-layers" className="fdd-panel__title">
              {m.dataLayers.title}
            </h2>
            <ul className="fdd-layers">
              <li>
                <p className="fdd-layers__name">{m.dataLayers.registerName}</p>
                <p className="fdd-muted">{m.dataLayers.registerNote}</p>
                {registryTag && <SourceTag source={registryTag.source} dataType={registryTag.dataType} />}
              </li>
              <li>
                <p className="fdd-layers__name">{m.dataLayers.annualReportName}</p>
                <p className="fdd-muted">{m.dataLayers.annualReportNote}</p>
                {registryTag && <SourceTag source={registryTag.source} dataType={registryTag.dataType} />}
              </li>
              <li>
                <p className="fdd-layers__name">{m.dataLayers.simulationName}</p>
                <p className="fdd-muted">{m.dataLayers.simulationNote}</p>
                <span className="fdd-inline">
                  {data.simulation && <SourceTag source={data.simulation.source} dataType="simulation" />}
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
        {overview ? (
          <>
            <ExampleLabel dataKind={dataKind} />
            <ul className="fdd-cells">
              {overview.competitors.map((competitor) => (
                <li key={competitor.name}>
                  <p className="fdd-cells__title">{competitor.name}</p>
                  <p className="fdd-muted">{competitor.description}</p>
                  {data.competitorsSource && (
                    <SourceTag source={data.competitorsSource.source} dataType={data.competitorsSource.dataType} />
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          registryGap
        )}
      </section>

      <section className="fdd-block" aria-labelledby="fdd-market-sim" data-tour-id="market-simulation">
        <h2 id="fdd-market-sim" className="fdd-block__title">
          {m.simulationTitle}
        </h2>
        {data.simulation ? <SimulationBlock simulation={data.simulation} /> : <ComingSoon />}
      </section>
    </div>
  );
}

/**
 * Nyckeltalen. Ett underlag på 0 bolag betyder att siffran är okänd (porten,
 * `MarketOverview.basis`), och medianomsättningen visas bara med spannet av
 * räkenskapsår den bygger på: i båda fallen visas luckan, aldrig en nolla.
 */
function kpiFigures(
  m: M,
  overview: MarketOverview,
  tag: RegistryTag | null,
  medianYears: FiscalYearSpan | null,
  dataKind: DataKind,
  common: Dictionary["common"],
  locale: Locale,
): Figure[] {
  const { basis } = overview;
  const gap = (label: string, description: string): Figure => ({ label, value: "—", description });

  const median: Figure =
    basis && basis.medianRevenueCompanies === 0
      ? gap(m.medianRevenueLabel, m.basisMissing)
      : !medianYears
        ? gap(m.medianRevenueLabel, common.fiscalYearMissing)
        : {
            label: m.medianRevenueLabel,
            value: formatSek(overview.medianRevenueKsek * 1000, locale),
            unit: `(${common.fiscalYearLabel} ${formatFiscalYearSpan(medianYears)})`,
            description: basis ? basedOn(m, basis.medianRevenueCompanies, overview.companyCount, locale) : undefined,
            source: tag?.source,
            dataType: tag?.dataType,
          };

  const share = (label: string, value: number, basisCount: number | undefined): Figure =>
    basisCount === 0
      ? gap(label, m.basisMissing)
      : {
          label,
          value,
          unit: "%",
          description: basisCount !== undefined ? basedOn(m, basisCount, overview.companyCount, locale) : undefined,
          source: tag?.source,
          dataType: tag?.dataType,
        };

  return [
    {
      label: dataKind === "example" ? m.companyCountLabel : m.companyCountLabelLive,
      value: formatCount(overview.companyCount, locale),
      unit: m.companyCountUnit,
      description: dataKind === "example" ? m.companyCountDescription : m.companyCountDescriptionLive,
      source: tag?.source,
      dataType: tag?.dataType,
    },
    median,
    share(m.growthShareLabel, overview.growthSharePercent, basis?.growthCompanies),
    share(m.regionShareLabel, overview.regionSharePercent, basis?.regionCompanies),
  ];
}

function Distribution({
  companies,
  overview,
  tag,
  m,
  locale,
}: {
  companies: RegistryCompany[];
  overview: MarketOverview;
  tag: RegistryTag | null;
  m: M;
  locale: Locale;
}) {
  const distribution = sizeDistribution(companies);
  const maxCount = Math.max(1, ...distribution.map((bucket) => bucket.count));
  const dominant = dominantBucket(distribution, companies.length);
  return (
    <>
      <ul className="fdd-bars">
        {distribution.map((bucket) => (
          <li key={bucket.key} className="fdd-bars__row">
            <span className="fdd-bars__label">{m.distribution.sizeBuckets[bucket.key]}</span>
            <span className="fdd-bars__track" aria-hidden="true">
              <span style={{ width: `${(bucket.count / maxCount) * 100}%` }} />
            </span>
            <span className="fdd-bars__value">{formatCount(bucket.count, locale)}</span>
          </li>
        ))}
      </ul>
      {dominant && (
        <p className="fdd-muted">
          {m.distribution.mostCommonLabel} {m.distribution.sizeBuckets[dominant.key]}:{" "}
          {formatCount(dominant.count, locale)} {m.companiesUnit} {m.ofLabel} {formatCount(companies.length, locale)} (
          {dominant.percent} %). {basedOn(m, companies.length, overview.companyCount, locale)}
        </p>
      )}
      {tag && <SourceTag source={tag.source} dataType={tag.dataType} />}
    </>
  );
}

function Outreach({
  outreach,
  m,
  locale,
}: {
  outreach: { rows: CampaignRow[]; source: Källa };
  m: M;
  locale: Locale;
}) {
  const { rows, source } = outreach;
  const stats = outreachStats(rows);
  if (rows.length === 0) return <Locked hint={m.outreach.notBuiltYet} />;
  if (stats.responseRate === null) return <Locked hint={m.outreach.notSentYet} />;
  return (
    <>
      <dl className="fdd-pairs">
        <div>
          <dt>{m.outreach.contactedLabel}</dt>
          <dd>
            {formatCount(stats.contacted, locale)} / {formatCount(rows.length, locale)}
          </dd>
        </div>
        <div>
          <dt>{m.outreach.respondedLabel}</dt>
          <dd>{formatCount(stats.responded, locale)}</dd>
        </div>
        <div>
          <dt>{m.outreach.responseRateLabel}</dt>
          <dd>{stats.responseRate} %</dd>
        </div>
      </dl>
      <SourceTag source={source} dataType="customer" />
    </>
  );
}

/** Ett vanligt GET-formulär: valet hamnar i adressen och kräver ingen JavaScript. */
function SniForm({ picker, m }: { picker: SniPicker; m: M }) {
  return (
    <form className="fdd-sni" method="get" action={picker.basePath}>
      <label className="fdd-sni__label" htmlFor="fdd-sni-input">
        {m.sniPickerLabel}
      </label>
      <div className="fdd-sni__row">
        <input
          id="fdd-sni-input"
          className="fdd-input"
          name="sni"
          inputMode="decimal"
          pattern="\d{2}\.\d{3}"
          placeholder="69.201"
          defaultValue={picker.current ?? ""}
          aria-describedby="fdd-sni-hint"
          aria-invalid={picker.invalid || undefined}
          required
        />
        <button type="submit" className="fd-btn fd-btn--primary fd-btn--sm">
          {m.sniPickerSubmit}
        </button>
      </div>
      <p id="fdd-sni-hint" className="fdd-muted" role={picker.invalid ? "alert" : undefined}>
        {picker.invalid ? m.sniInvalid : picker.current === null ? m.sniPrompt : null}
      </p>
    </form>
  );
}
