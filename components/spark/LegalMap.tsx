"use client";

import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { JuridisktKrav } from "@/core/domain";

const statusToneClasses: Record<JuridisktKrav["status"], string> = {
  uppfyllt: "bg-score-green-bg text-score-green",
  ej_uppfyllt: "bg-score-orange-bg text-score-orange",
  ej_tillämpligt: "bg-slate-100 text-slate-500",
};

/** Den juridiska kartan (avsnitt 8): status, källa och ansvarsbegränsning
 * (ansvarsbegränsningen visas av screens/Legal.tsx, inte här). */
export function LegalMap({ krav }: { krav: JuridisktKrav[] }) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      {krav.map((item) => (
        <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{item.rubrik}</p>
            <span
              className={cn("shrink-0 rounded-pill px-2 py-0.5 text-xs font-semibold uppercase", statusToneClasses[item.status])}
              style={{ letterSpacing: "var(--tracking-label)" }}
            >
              {t.legalPage.status[item.status]}
            </span>
          </div>
          <p className="text-sm leading-snug text-slate-600">{item.beskrivning}</p>
          <SourceTag source={item.källa} />
        </div>
      ))}
    </div>
  );
}
