"use client";

import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import type { ProfileSummary, TraceEvent } from "@/ports/MemoryRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { demoMemoryRepository } from "@/adapters/demo/MemoryRepository";
import { FriPageHead } from "../../_components/FriParts";

type MemoryData = { profile: ProfileSummary; brainNotes: string; trace: TraceEvent[] };

/** Minnet i kopian: samma profil, anteckningar och spår som /demo/app/minnet (screens/Memory). */
export default function FriMemoryPage() {
  const { t, locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<MemoryData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoMemoryRepository.getProfileSummary(locale),
      demoMemoryRepository.getBrainNotes(),
      demoMemoryRepository.getTraceEvents(locale),
    ]).then(([profile, brainNotes, trace]) => {
      if (!cancelled) setData({ profile, brainNotes, trace });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;
  return <MemoryBody key={`${entry}-${locale}`} data={data} locale={locale} t={t} />;
}

function MemoryBody({ data, locale, t }: { data: MemoryData; locale: "sv" | "en"; t: ReturnType<typeof useI18n>["t"] }) {
  const [notes, setNotes] = useState(data.brainNotes);
  return (
    <>
      <FriPageHead title={`${data.profile.name}, ${data.profile.role}`} lead={data.profile.bio} />
      <Tabs.Root defaultValue="profile" className="fri-section-demo">
        <Tabs.List className="fri-tabs">
          {(["profile", "brain", "trace"] as const).map((tab) => (
            <Tabs.Trigger key={tab} value={tab}>
              {t.memoryPage.tabs[tab]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="profile" className="fri-tab-panel">
          <div className="fri-two-col">
            <section className="fri-ruled">
              <p className="fri-mono fri-muted">{t.memoryPage.profileBackgroundLabel}</p>
              <p style={{ marginTop: 12, fontSize: "1.5rem", fontWeight: 560, letterSpacing: "-0.02em" }}>{data.profile.name}</p>
              <p className="fri-muted">{data.profile.role}</p>
              <p style={{ marginTop: 12, maxWidth: "56ch" }}>{data.profile.bio}</p>
            </section>
            <section className="fri-ruled">
              <p className="fri-mono fri-muted">{t.memoryPage.profileResourcesLabel}</p>
              <ul className="fri-reasons">
                <li>{data.profile.time}</li>
                <li>{data.profile.money}</li>
                <li>{data.profile.risk}</li>
              </ul>
            </section>
          </div>
        </Tabs.Content>

        <Tabs.Content value="brain" className="fri-tab-panel">
          <p className="fri-muted" style={{ fontSize: "0.92rem" }}>
            {t.memoryPage.brainHint}
          </p>
          <textarea
            className="fri-textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => demoMemoryRepository.setBrainNotes(notes)}
            rows={7}
            aria-label={t.memoryPage.tabs.brain}
          />
        </Tabs.Content>

        <Tabs.Content value="trace" className="fri-tab-panel">
          {data.trace.length === 0 ? (
            <p className="fri-muted">{t.memoryPage.traceEmpty}</p>
          ) : (
            <ol className="fri-trace">
              {data.trace.map((event) => (
                <li key={event.id}>
                  <span className="fri-mono fri-muted">{formatDate(event.timestampIso, locale)}</span>
                  <span>{event.description}</span>
                </li>
              ))}
            </ol>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}
