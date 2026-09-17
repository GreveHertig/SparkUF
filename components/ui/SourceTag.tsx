"use client";

import * as Popover from "@radix-ui/react-popover";
import type { Källa } from "@/types/evidence";
import type { DataType } from "@/design/tokens";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import { formatDate } from "@/i18n/format";

type SourceTagProps = {
  source: Källa;
  /** Citat ur underlaget, om ett finns (från Bevis.citat). */
  quote?: string;
  dataType?: DataType;
  className?: string;
};

const toneClasses: Record<DataType, string> = {
  register: "bg-data-register-bg text-data-register",
  simulation: "bg-data-simulation-bg text-data-simulation",
  customer: "bg-data-customer-bg text-data-customer",
};

/** Källa + datum, i variant efter datatyp. Klick visar detaljer. */
export function SourceTag({
  source,
  quote,
  dataType = "register",
  className,
}: SourceTagProps) {
  const { locale, t } = useI18n();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t.common.sourceTag.openDetails}
          className={cn(
            "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
            "hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent",
            toneClasses[dataType],
            className,
          )}
        >
          <span>{source.namn}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(source.hämtad, locale)}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg"
        >
          <p className="font-semibold text-slate-900">{source.namn}</p>
          <p className="mt-0.5 text-slate-500">{formatDate(source.hämtad, locale)}</p>
          {quote && (
            <p className="mt-2 border-l-2 border-slate-200 pl-2 italic text-slate-600">
              <span className="not-italic font-medium text-slate-500">
                {t.common.sourceTag.quoteLabel}:{" "}
              </span>
              {quote}
            </p>
          )}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-accent-700 underline underline-offset-2"
            >
              {t.common.sourceTag.linkLabel}
            </a>
          )}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
