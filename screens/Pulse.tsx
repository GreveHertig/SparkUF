"use client";

import { ComingSoon } from "@/components/ui/ComingSoon";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import type { DataType } from "@/design/tokens";
import { PageHead } from "./blocks/PageBlocks";

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
 */
export function Pulse({ data }: { data: PulseData }) {
  const { t } = useI18n();
  const { signals } = data;
  const latest = signals?.[0];

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
      ) : (
        <ul className="fdd-signals" data-tour-id="pulse-list">
          {signals.map((signal, index) => (
            <li key={`${signal.headline}-${index}`} className="fd-panel fdd-signal">
              {/* Bara kategorin: adapterns fasta "3 dagar sedan" stämde inte med
                  källans datum (docs/buggar-2026-09.md punkt 11). Datumet står i källan. */}
              <p className="fdd-signal__meta">
                <span className="fdd-signal__category">{signal.category}</span>
              </p>
              <p className="fdd-signal__headline">{signal.headline}</p>
              <p className="fd-nextstep__why">
                {t.common.pulseWhyItMattersPrefix} {signal.whyItMatters}
              </p>
              <SourceTag source={signal.source} dataType={data.sourceDataType} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
