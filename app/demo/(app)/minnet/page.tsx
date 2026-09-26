"use client";

import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import { demoMemoryRepository } from "@/adapters/demo/MemoryRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import type { ProfileSummary, TraceEvent } from "@/ports/MemoryRepository";
import { PageHead } from "../../_components/DemoBlocks";

type MemoryData = { profile: ProfileSummary; brainNotes: string; trace: TraceEvent[] };

/** Minnet: flikarna Profilen, Hjärnan (går att skriva i) och Spåret. */
export default function FondaDemoMemoryPage() {
  const { locale } = useI18n();
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
  // Anteckningarna nollställs när personan byts, som i originalet.
  return <Memory key={entry} data={data} />;
}

function Memory({ data }: { data: MemoryData }) {
  const { t, locale } = useI18n();
  const copy = t.memoryPage;
  const [notes, setNotes] = useState(data.brainNotes);

  return (
    <div className="fdd-page">
      <PageHead title={`${data.profile.name}, ${data.profile.role}`} lede={data.profile.bio} />

      <Tabs.Root defaultValue="profile" className="fdd-memory">
        <Tabs.List className="fdd-segmented" aria-label={t.appShell.nav.memory}>
          {(["profile", "brain", "trace"] as const).map((tab) => (
            <Tabs.Trigger key={tab} value={tab} className="fdd-segmented__item">
              {copy.tabs[tab]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="profile" className="fdd-memory__panel">
          <div className="fdd-two">
            <section className="fd-panel" aria-labelledby="fdd-mem-bg">
              <h2 id="fdd-mem-bg" className="fdd-label">
                {copy.profileBackgroundLabel}
              </h2>
              <p className="fdd-panel__title">{data.profile.name}</p>
              <p className="fdd-muted">{data.profile.role}</p>
              <p className="fdd-body">{data.profile.bio}</p>
            </section>
            <section className="fd-panel" aria-labelledby="fdd-mem-res">
              <h2 id="fdd-mem-res" className="fdd-label">
                {copy.profileResourcesLabel}
              </h2>
              <ul className="fd-checks fd-checks--small">
                <li>{data.profile.time}</li>
                <li>{data.profile.money}</li>
                <li>{data.profile.risk}</li>
              </ul>
            </section>
          </div>
        </Tabs.Content>

        <Tabs.Content value="brain" className="fdd-memory__panel">
          <div className="fd-panel">
            <label htmlFor="fdd-brain" className="fdd-muted">
              {copy.brainHint}
            </label>
            <textarea
              id="fdd-brain"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => demoMemoryRepository.setBrainNotes(notes)}
              rows={7}
              className="fdd-textarea"
            />
          </div>
        </Tabs.Content>

        <Tabs.Content value="trace" className="fdd-memory__panel">
          {data.trace.length === 0 ? (
            <p className="fdd-muted">{copy.traceEmpty}</p>
          ) : (
            <ol className="fdd-trace">
              {data.trace.map((event) => (
                <li key={event.id}>
                  <time dateTime={event.timestampIso} className="fdd-trace__date">
                    {formatDate(event.timestampIso, locale)}
                  </time>
                  <span>{event.description}</span>
                </li>
              ))}
            </ol>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
