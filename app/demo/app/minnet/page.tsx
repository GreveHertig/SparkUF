"use client";

import { useEffect, useState } from "react";
import { Memory, type MemoryData } from "@/screens/Memory";
import { useI18n } from "@/i18n/context";
import { demoMemoryRepository } from "@/adapters/demo/MemoryRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoMemoryPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
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
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Memory data={data} onSaveBrainNotes={(notes) => demoMemoryRepository.setBrainNotes(notes)} />;
}
