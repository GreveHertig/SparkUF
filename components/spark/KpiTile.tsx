"use client";

import type { ReactNode } from "react";
import { Sparkline } from "@/components/ui/Sparkline";
import { SourceTag } from "@/components/ui/SourceTag";
import type { DataType } from "@/design/tokens";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import type { Källa } from "@/types/evidence";

type KpiTileProps = {
  label: string;
  /** Ett tal formateras via Intl. En redan formaterad sträng renderas som den är. */
  value: number | string;
  unit?: string;
  /** Riktning på en liten deltachip, t.ex. "+4" eller "−2". Ingen chip om utelämnad. */
  delta?: { value: string; direction: "up" | "down" | "flat" };
  /** Kronologisk punktserie — visas bara om en genuin sekvens finns
   * (designbeslut: ingen påhittad sparkline-form, se DESIGN.md). */
  trend?: number[];
  /** Källa krävs alltid för en siffra (CLAUDE.md) — utelämnas bara för
   * härledda mätetal som inte har en egen källa (t.ex. "antal upplåsta delar",
   * som redan är sourced via de underliggande delarna på samma sida). */
  source?: Källa;
  /** Kort förklarande mening under talet, t.ex. urvalet bakom ett medianvärde
   * ("Baserat på 194 av 312 bolag"). Utelämnad om talet inte behöver den. */
  description?: string;
  dataType?: DataType;
  icon?: ReactNode;
  className?: string;
};

const deltaToneClasses = {
  up: "text-score-green",
  down: "text-score-red",
  flat: "text-slate-500",
} as const;

/** Tät KPI-ruta för instrumentpanelsraden (designuppdatering: high-tech
 * dashboard). Se DESIGN.md för varför bara vissa mätetal har en sparkline. */
export function KpiTile({
  label,
  value,
  unit,
  delta,
  trend,
  source,
  description,
  dataType = "register",
  className,
}: KpiTileProps) {
  const { locale } = useI18n();
  const displayValue = typeof value === "number" ? formatCount(value, locale) : value;

  return (
    <div className={cn("flex flex-col gap-1.5 rounded-md border border-slate-200 bg-white p-4 shadow-lg", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {trend && trend.length >= 2 && <Sparkline points={trend} tone="accent" />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className="font-numeric text-3xl font-semibold text-slate-900">
          {displayValue}
          {unit && <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>}
        </p>
        {delta && (
          <span className={cn("font-numeric text-xs font-semibold", deltaToneClasses[delta.direction])}>
            {delta.direction === "up" && "▲"}
            {delta.direction === "down" && "▼"}
            {delta.value}
          </span>
        )}
      </div>
      {description && <p className="text-xs leading-snug text-slate-600">{description}</p>}
      {source && (
        <div className="mt-0.5">
          <SourceTag source={source} dataType={dataType} />
        </div>
      )}
    </div>
  );
}
