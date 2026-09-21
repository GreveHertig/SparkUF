"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";
import type { ProfileSummary, TraceEvent } from "@/ports/MemoryRepository";

export type MemoryData = {
  profile: ProfileSummary;
  brainNotes: string;
  trace: TraceEvent[];
};

/** Minnet (avsnitt 6): flikarna Profilen, Hjärnan (går att skriva i) och
 * Spåret. */
export function Memory({ data, onSaveBrainNotes }: { data: MemoryData; onSaveBrainNotes: (notes: string) => void }) {
  const { locale, t } = useI18n();
  const [notes, setNotes] = useState(data.brainNotes);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-[18px]">
      <div>
        <Eyebrow>
          {data.profile.name} · {data.profile.role}
        </Eyebrow>
        <EditorialHeading as="h1" className="mt-2">
          {data.profile.bio}
        </EditorialHeading>
      </div>

      <Tabs.Root defaultValue="profile">
        <Tabs.List className="flex gap-1 border-b border-slate-200">
          {(["profile", "brain", "trace"] as const).map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className={cn(
                "px-4 py-2 text-sm font-medium text-slate-600 focus-visible:outline-2 focus-visible:outline-accent-300",
                "data-[state=active]:border-b-2 data-[state=active]:border-accent-600 data-[state=active]:font-semibold data-[state=active]:text-accent-700",
              )}
            >
              {t.memoryPage.tabs[tab]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="profile" className="pt-5">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-lg">
            <p className="text-lg font-bold text-slate-900">{data.profile.name}</p>
            <p className="text-sm text-slate-600">{data.profile.role}</p>
            <div className="mt-3">
              <Eyebrow>{t.memoryPage.profileBackgroundLabel}</Eyebrow>
              <p className="mt-1 text-sm leading-snug text-slate-700">{data.profile.bio}</p>
            </div>
            <div className="mt-3">
              <Eyebrow>{t.memoryPage.profileResourcesLabel}</Eyebrow>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-slate-700">
                <li>{data.profile.time}</li>
                <li>{data.profile.money}</li>
                <li>{data.profile.risk}</li>
              </ul>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="brain" className="pt-5">
          <p className="mb-2 text-xs text-slate-500">{t.memoryPage.brainHint}</p>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            onBlur={() => onSaveBrainNotes(notes)}
            rows={6}
            className="w-full rounded-lg border border-slate-200 bg-white p-3.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-accent-300"
          />
        </Tabs.Content>

        <Tabs.Content value="trace" className="pt-5">
          {data.trace.length === 0 ? (
            <p className="text-sm text-slate-600">{t.memoryPage.traceEmpty}</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {data.trace.map((event) => (
                <li key={event.id} className="flex gap-4 rounded-md border border-slate-200 bg-white p-3.5 shadow-lg">
                  <span className="w-24 shrink-0 text-xs text-slate-500">{formatDate(event.timestampIso, locale)}</span>
                  <span className="text-sm leading-snug text-slate-800">{event.description}</span>
                </li>
              ))}
            </ol>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
