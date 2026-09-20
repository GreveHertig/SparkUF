"use client";

import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PulseCard } from "@/components/spark/PulseCard";
import { useI18n } from "@/i18n/context";
import type { PulseSignal } from "@/core/domain";

export type PulseData = {
  signals: PulseSignal[];
};

/** Pulsen (avsnitt 6, 9.5): signalflödet, nyast först. */
export function Pulse({ data }: { data: PulseData }) {
  const { t } = useI18n();
  // Rubriken beskriver den senaste, mest relevanta signalen (avsnitt 9.5:
  // "nyast först") i stället för att upprepa "Pulsen" (uppgift 2).
  const latest = data.signals[0];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        {latest && <Eyebrow>{latest.category}</Eyebrow>}
        <EditorialHeading as="h1" className={latest ? "mt-2" : undefined}>
          {latest?.headline ?? t.pulsePage.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{latest?.whyItMatters ?? t.pulsePage.subtitle}</p>
      </div>

      {data.signals.length === 0 ? (
        <p className="text-sm text-slate-600">{t.pulsePage.emptyState}</p>
      ) : (
        <div data-tour-id="pulse-list" className="flex flex-col gap-3">
          {data.signals.map((signal, index) => (
            <PulseCard
              key={`${signal.headline}-${index}`}
              category={signal.category}
              headline={signal.headline}
              whyItMatters={signal.whyItMatters}
              timestamp={signal.timestamp}
              source={signal.source}
            />
          ))}
        </div>
      )}
    </div>
  );
}
