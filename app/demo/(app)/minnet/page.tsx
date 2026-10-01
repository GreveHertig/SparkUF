"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoMemoryRepository } from "@/adapters/demo/MemoryRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { Memory, type MemoryData } from "@/screens/Memory";

/** Minnet: tunn hämtare (PR 5, docs/plan-en-design.md) — all markup ligger i
 * den delade screens/Memory.tsx. */
export default function DemoMemoryPage() {
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
  return (
    <Memory
      key={entry}
      data={data}
      dataKind="example"
      onSaveBrainNotes={(notes) => demoMemoryRepository.setBrainNotes(notes)}
    />
  );
}
