"use client";

import { useEffect, useState } from "react";
import { SourceTag } from "@/components/ui/SourceTag";
import { useI18n } from "@/i18n/context";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { PulseSignal } from "@/core/domain";
import { PageHead } from "../../_components/DemoBlocks";

/** Pulsen i kopian: signalflödet, nyast först. Rubriken är den senaste signalen. */
export default function FondaDemoPulsePage() {
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [signals, setSignals] = useState<PulseSignal[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoPulseProvider.getSignals(locale).then((result) => {
      if (!cancelled) setSignals(result);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!signals) return null;
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
              <p className="fdd-signal__meta">
                <span className="fdd-signal__category">{signal.category}</span>
                <span className="fdd-muted">{signal.timestamp}</span>
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
