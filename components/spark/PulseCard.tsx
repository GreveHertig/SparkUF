"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { SourceTag } from "@/components/ui/SourceTag";
import { cn } from "@/design/cn";
import type { DataType } from "@/design/tokens";
import { useI18n } from "@/i18n/context";
import type { Källa } from "@/types/evidence";

type PulseCardProps = {
  category: string;
  headline: string;
  whyItMatters: string;
  timestamp: string;
  source: Källa;
  dataType?: DataType;
  className?: string;
};

/** Kategori, signal, "varför det spelar roll för dig", källa och tid. */
export function PulseCard({
  category,
  headline,
  whyItMatters,
  timestamp,
  source,
  dataType = "register",
  className,
}: PulseCardProps) {
  const { t } = useI18n();

  return (
    <div className={cn("rounded-md border border-slate-200 bg-white p-4 shadow-lg", className)}>
      <div className="flex items-center justify-between">
        <Eyebrow>{category}</Eyebrow>
        <span className="text-xs text-slate-600">{timestamp}</span>
      </div>
      <p className="mt-2 text-base font-semibold text-slate-900">{headline}</p>
      <p className="mt-2 text-sm leading-snug text-slate-600">
        <span className="font-medium text-slate-700">
          {t.common.pulseWhyItMattersPrefix}{" "}
        </span>
        {whyItMatters}
      </p>
      <div className="mt-3">
        <SourceTag source={source} dataType={dataType} />
      </div>
    </div>
  );
}
