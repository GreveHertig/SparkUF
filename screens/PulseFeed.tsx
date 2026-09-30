"use client";

import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import { PageHead } from "@/app/demo/_components/DemoBlocks";

/**
 * Pulsen: signalflödet, nyast först. Rubriken är den senaste signalen.
 *
 * Delad skärm för `/demo/pulsen` och `/app/pulsen` — vet inte varifrån
 * signalerna kommer (demoadapter eller liveadapter). Markupen flyttades
 * oförändrad från demosidan. Förutsätter `.fd .fdd`-omslaget, som båda
 * layouterna redan har.
 */
export function PulseFeed({ signals }: { signals: PulseSignal[] }) {
  const { t } = useI18n();
  const latest = signals[0];

  return (
    <div className="fdd-page">
      <PageHead
        context={latest?.category}
        title={latest?.headline ?? t.pulsePage.title}
        lede={latest?.whyItMatters ?? t.pulsePage.subtitle}
      />

      {signals.length === 0 ? (
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
              <SourceTag source={signal.source} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
