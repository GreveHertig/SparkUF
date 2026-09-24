"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoPulseProvider } from "@/adapters/demo/PulseProvider";
import { FriSource } from "../../_components/FriSource";
import { FriPageHead } from "../../_components/FriParts";

/** Pulsen i kopian: samma signaler som /demo/app/pulsen (screens/Pulse). */
export default function FriPulsePage() {
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
    <>
      <FriPageHead
        kicker={latest?.category}
        title={latest?.headline ?? t.pulsePage.title}
        lead={latest?.whyItMatters ?? t.pulsePage.subtitle}
      />
      {signals.length === 0 ? (
        <p className="fri-muted fri-section-demo">{t.pulsePage.emptyState}</p>
      ) : (
        <ul className="fri-pulse fri-section-demo" data-tour-id="pulse-list">
          {signals.map((signal, index) => (
            <li key={`${signal.headline}-${index}`} className="fri-ruled">
              <p className="fri-mono fri-muted" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "var(--ink)" }}>{signal.category}</span>
                <span>{signal.timestamp}</span>
              </p>
              <p style={{ marginTop: 12, fontSize: "1.2rem", fontWeight: 540, letterSpacing: "-0.012em", lineHeight: 1.3 }}>
                {signal.headline}
              </p>
              <p className="fri-muted" style={{ marginTop: 8 }}>
                <span style={{ color: "var(--ink)" }}>{t.common.pulseWhyItMattersPrefix} </span>
                {signal.whyItMatters}
              </p>
              <div style={{ marginTop: 14 }}>
                <FriSource source={signal.source} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
