"use client";

import { useEffect, useState } from "react";
import { Score, type ScoreData } from "@/screens/Score";
import { useI18n } from "@/i18n/context";
import { demoEvidenceRepository } from "@/adapters/demo/EvidenceRepository";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoScorePage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<ScoreData | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      demoEvidenceRepository.getScoreSnapshot(locale),
      demoEvidenceRepository.getSuggestions(locale),
      demoEvidenceRepository.getScoreHistory(locale),
    ]).then(([snapshot, suggestions, scoreHistory]) => {
      if (!cancelled) setData({ snapshot, suggestions, scoreHistory });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Score data={data} />;
}
