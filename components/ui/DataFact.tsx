"use client";

import type { Källa } from "@/types/evidence";
import type { DataType } from "@/design/tokens";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";
import { SourceTag } from "./SourceTag";

type DataFactProps = {
  label: string;
  /** Ett tal formateras via Intl. En redan formaterad sträng (t.ex. från
   * formatSek) renderas som den är. */
  value: number | string;
  unit?: string;
  source: Källa;
  quote?: string;
  dataType?: DataType;
  className?: string;
};

/** Ett påstående med siffra + SourceTag. Används för alla siffror i gränssnittet. */
export function DataFact({
  label,
  value,
  unit,
  source,
  quote,
  dataType = "register",
  className,
}: DataFactProps) {
  const { locale } = useI18n();
  const displayValue = typeof value === "number" ? formatCount(value, locale) : value;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-slate-900">
        {displayValue}
        {unit && <span className="ml-1 text-base font-medium text-slate-600">{unit}</span>}
      </p>
      <SourceTag source={source} quote={quote} dataType={dataType} />
    </div>
  );
}
