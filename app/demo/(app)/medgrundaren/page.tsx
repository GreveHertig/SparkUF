"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/context";
import { useDemoStore } from "@/adapters/demo/demoStore";
import { engineFor } from "@/adapters/demo/journeyEngine";
import { cofounderScript } from "@/adapters/demo/cofounderScript";
import { jonasCofounderScript } from "@/adapters/demo/jonasCofounderScript";
import { exampleSource } from "@/adapters/demo/exampleSource";
import type { TranscriptItem } from "@/ports/CofounderAgent";
import type { Locale } from "@/i18n/context";
import { Cofounder, type CofounderData } from "@/screens/Cofounder";
import { textHasFigure } from "@/core/figures";

function hasFigure(item: TranscriptItem, locale: Locale): boolean {
  if (item.kind === "message") return textHasFigure(item.text[locale]);
  if (item.kind === "tool") return textHasFigure(`${item.label[locale]} ${item.steps[locale].join(" ")}`);
  return false;
}

/**
 * Demots Medgrundare: plockar det aktuella momentet ur det förskrivna manuset
 * och det som redan är känt ur de passerade "efter"-momenten, och lämnar över
 * till skärmen (PR 10, docs/plan-en-design.md). Manuset stannar här, i demots
 * sida — skärmen vet inte att samtalet är förskrivet.
 */
export default function DemoCofounderPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const entry = useDemoStore((state) => state.entry);

  const data = useMemo<CofounderData>(() => {
    const engine = engineFor(entry);
    const script = entry === "hasIdea" ? jonasCofounderScript : cofounderScript;
    const currentBeat = engine.getBeatAt(beatIndex);
    const items = script[currentBeat.id] ?? [];
    return {
      context: engine.beats
        .slice(0, beatIndex)
        .filter((beat) => beat.momentKind === "after")
        .map((beat) => {
          const text = beat.traceSummary?.[locale] ?? `${beat.momentLabel[locale]}: ${beat.nextStep[locale].title}`;
          return {
            id: beat.id,
            text,
            // Sammanfattningarnas siffror är lika påhittade som manusets.
            source: textHasFigure(text)
              ? { source: exampleSource(locale, { step: beat.stepNumber }), dataType: "example" as const }
              : undefined,
          };
        }),
      moment: {
        label: `${String(currentBeat.stepNumber).padStart(2, "0")} · ${currentBeat.momentLabel[locale]}`,
        items,
        // Manusets siffror är påhittade: egen exempelkälla, aldrig registrets.
        itemSources: items.map((item) =>
          hasFigure(item, locale) ? { source: exampleSource(locale, { step: currentBeat.stepNumber }), dataType: "example" as const } : null,
        ),
      },
    };
  }, [locale, beatIndex, entry]);

  return <Cofounder data={data} />;
}
