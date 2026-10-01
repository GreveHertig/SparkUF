"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/context";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { Score, type ScoreData } from "@/screens/Score";

/** Poäng: tunn hämtare (PR 4, docs/plan-en-design.md) — all markup ligger i
 * den delade screens/Score.tsx. */
export default function DemoScorePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);
  const [data, setData] = useState<ScoreData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoEvidenceRepository.getSuggestions(locale),
      demoEvidenceRepository.getScoreHistory(locale),
    ]).then(([snapshot, suggestions, history]) => {
      if (!cancelled) setData({ snapshot, suggestions, history });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex, entry]);

  if (!data) return null;

  return <Score data={data} />;
}
