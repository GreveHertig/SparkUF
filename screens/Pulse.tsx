"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import { PageHead, Pill } from "./blocks/PageBlocks";

/**
 * Datan skärmen behöver, redan hämtad och språkvald av den monterande routen.
 * `signals: null` när signalerna inte gick att hämta (platshållarfel): listan
 * visar då "Kommer snart", och rubriken blir sidans namn. En tom lista är ett
 * ärligt tomläge ("Ingen signal än"), inte en lucka.
 *
 * `sourceDataType` sätter källtaggarnas datatyp (docs/beslut.md, 2026-10-01):
 * demot skickar `"example"` (påhittade signaler, etiketten "Exempel"), `/app`
 * skickar `"media"` (artiklar, etiketten "Media"). Utelämnad blir taggen
 * `SourceTag`s standard, `"register"`, som bara får användas för register.
 */
export type PulseData = {
  signals: PulseSignal[] | null;
  sourceDataType?: DataType;
};

/**
 * Pulsen: signalflödet, nyast först. Rubriken är den senaste signalen. Markup
 * flyttad rakt av från demots `app/demo/(app)/pulsen/page.tsx` (steg 6,
 * docs/plan-en-design.md).
 *
 * Risker (signaler med `risk`) visas först, under "Risker att bevaka", sedan
 * möjligheter (`opportunity`), sedan nyheterna. Varje risk och möjlighet har
 * område, förslag och en utfällbar spelbok (i18n, märkt som ogranskad
 * vägledning). Finns varken risker eller möjligheter (som i demot i dag) ser
 * sidan ut precis som förut: en lista, ingen extra rubrik.
 */
export function Pulse({ data }: { data: PulseData }) {
  const { t } = useI18n();
  const { signals } = data;
  const latest = signals?.[0];
  const risks = signals?.filter((signal) => signal.risk) ?? [];
  const opportunities =
    signals?.filter((signal) => signal.opportunity && !signal.risk) ?? [];
  const news =
    signals?.filter((signal) => !signal.risk && !signal.opportunity) ?? [];

  return (
    <div className="fdd-page">
      <PageHead
        context={latest?.category}
        title={latest?.headline ?? t.pulsePage.title}
        lede={latest?.whyItMatters ?? t.pulsePage.subtitle}
      />

      {signals === null ? (
        <ComingSoon />
      ) : signals.length === 0 ? (
        <p className="fdd-muted">{t.pulsePage.emptyState}</p>
      ) : risks.length === 0 && opportunities.length === 0 ? (
        <SignalList
          signals={news}
          dataType={data.sourceDataType}
          tourId="pulse-list"
        />
      ) : (
        <>
          {risks.length > 0 && (
            <section className="fdd-block" aria-labelledby="fdd-pulse-risks">
              <h2 id="fdd-pulse-risks" className="fdd-block__title">
                {t.pulsePage.risksTitle}
              </h2>
              <p className="fdd-muted">{t.pulsePage.risksIntro}</p>
              <SignalList
                signals={risks}
                dataType={data.sourceDataType}
                tourId="pulse-list"
              />
            </section>
          )}
          {opportunities.length > 0 && (
            <section
              className="fdd-block"
              aria-labelledby="fdd-pulse-opportunities"
            >
              <h2 id="fdd-pulse-opportunities" className="fdd-block__title">
                {t.pulsePage.opportunitiesTitle}
              </h2>
              <p className="fdd-muted">{t.pulsePage.opportunitiesIntro}</p>
              <SignalList
                signals={opportunities}
                dataType={data.sourceDataType}
                tourId={risks.length === 0 ? "pulse-list" : undefined}
              />
            </section>
          )}
          {news.length > 0 && (
            <section className="fdd-block" aria-labelledby="fdd-pulse-news">
              <h2 id="fdd-pulse-news" className="fdd-block__title">
                {t.pulsePage.newsTitle}
              </h2>
              <SignalList signals={news} dataType={data.sourceDataType} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SignalList({
  signals,
  dataType,
  tourId,
}: {
  signals: PulseSignal[];
  dataType?: DataType;
  tourId?: string;
}) {
  const { t } = useI18n();
  const p = t.pulsePage;
  return (
    <ul className="fdd-signals" data-tour-id={tourId}>
      {signals.map((signal, index) => {
        // En signal är en risk, en möjlighet eller en vanlig nyhet. Risken vinner om båda skulle vara satta.
        const insight = signal.risk
          ? {
              label: p.riskLabel,
              tone: "orange" as const,
              texts: p.riskAreas[signal.risk.area],
              actions: signal.risk.actions,
              impactTitle: p.playbook.riskImpactTitle,
              solveTitle: p.playbook.riskSolveTitle,
            }
          : signal.opportunity
            ? {
                label: p.opportunityLabel,
                tone: "green" as const,
                texts: p.opportunityAreas[signal.opportunity.area],
                actions: signal.opportunity.actions,
                impactTitle: p.playbook.opportunityImpactTitle,
                solveTitle: p.playbook.opportunitySolveTitle,
              }
            : null;
        return (
          <li
            key={`${signal.headline}-${index}`}
            className="fd-panel fdd-signal"
          >
            {/* Bara kategorin: adapterns fasta "3 dagar sedan" stämde inte med
                källans datum (docs/buggar-2026-09.md punkt 11). Datumet står i källan. */}
            <p className="fdd-signal__meta">
              {insight ? (
                <>
                  <Pill tone={insight.tone}>{insight.label}</Pill>{" "}
                  <span className="fdd-signal__category">
                    {insight.texts.name}
                  </span>
                </>
              ) : (
                <span className="fdd-signal__category">{signal.category}</span>
              )}
            </p>
            <p className="fdd-signal__headline">{signal.headline}</p>
            <p className="fd-nextstep__why">
              {t.common.pulseWhyItMattersPrefix} {signal.whyItMatters}
            </p>
            {insight && insight.actions.length > 0 && (
              <div className="fdd-risk-actions">
                <p className="fdd-label">{p.actionsTitle}</p>
                <ul>
                  {insight.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {insight && (
              <details className="fdd-playbook">
                <summary>{p.playbook.toggle}</summary>
                <div className="fdd-playbook__body">
                  <p className="fdd-label">{insight.impactTitle}</p>
                  <ul>
                    {insight.texts.playbook.impact.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="fdd-label">{insight.solveTitle}</p>
                  <ol>
                    {insight.texts.playbook.solve.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                  <p className="fdd-muted fdd-playbook__note">
                    {p.playbook.note}
                  </p>
                </div>
              </details>
            )}
            <SourceTag source={signal.source} dataType={dataType} />
          </li>
        );
      })}
    </ul>
  );
}
