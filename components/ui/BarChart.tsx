"use client";

import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatCount } from "@/i18n/format";

export type BarChartBar = {
  label: string;
  value: number;
};

/**
 * Minimal horisontell stapeldiagram, samma "ingen dependency"-princip som
 * Sparkline (recharts är inte en dependency i den här kodbasen, se
 * DESIGN.md/status.md "Tokenbyte"). Etiketter och tal är riktig text i DOM:en
 * (inte inbränt i en SVG), bara staplarnas fyllnad är dekorativ.
 */
export function BarChart({ bars, className }: { bars: BarChartBar[]; className?: string }) {
  const { locale } = useI18n();
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-3">
          <p className="font-numeric w-28 shrink-0 text-xs text-slate-600">{bar.label}</p>
          <div className="h-3 flex-1 overflow-hidden rounded-pill" style={{ backgroundColor: "var(--slate-100)" }}>
            <div
              aria-hidden="true"
              className="h-full rounded-pill"
              style={{ width: `${(bar.value / max) * 100}%`, backgroundColor: "var(--accent-600)" }}
            />
          </div>
          <p className="font-numeric w-8 shrink-0 text-right text-xs font-semibold text-slate-900">
            {formatCount(bar.value, locale)}
          </p>
        </div>
      ))}
    </div>
  );
}
