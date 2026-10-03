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
  example: "border-dashed border-slate-400! bg-white text-slate-700",
  media: "bg-data-media-bg text-data-media",
  user: "bg-data-user-bg text-data-user",
};

/**
 * Källa + datum, i variant efter datatyp. Ett tomt `hämtad` betyder att
 * datumet inte är känt (till exempel ett onboardingsvar som sparades utan
 * tid): då visas källan utan datum, aldrig ett påhittat. Klick visar detaljer.
 * Simuleringar (uppdrag 2.2) bär alltid den synliga etiketten "Simulering",
 * utöver den egna färgen — aldrig bara en färgskillnad. Påhittad exempeldata
 * i demot (`"example"`, PR 11) bär på samma sätt etiketten "Exempel" och
 * fiktionsmärkets streckade kant, så att den aldrig ser ut som en
 * myndighetskälla. Nyhetskällor (`"media"`) och användarens egen uppgift
 * (`"user"`) bär också en etikett och en egen ton. Bara `"register"` är grå
 * och utan etikett. Hela uppsättningen: docs/beslut.md, 2026-10-01.
 */
export function SourceTag({
  source,
  quote,
  dataType = "register",
  className,
}: SourceTagProps) {
  const { locale, t } = useI18n();
  const labels: Partial<Record<DataType, string>> = {
    simulation: t.common.simulationLabel,
    example: t.common.exampleSourceLabel,
    media: t.common.mediaSourceLabel,
    user: t.common.userSourceLabel,
  };
  const label = labels[dataType];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={t.common.sourceTag.openDetails}
          className={cn(
            "font-numeric inline-flex w-fit shrink-0 items-center gap-1 self-start rounded-sm border border-black/5 px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
            "hover:opacity-80 focus-visible:outline-2 focus-visible:outline-accent",
            toneClasses[dataType],
            className,
          )}
          style={{ transitionDuration: "var(--motion-fast)", transitionTimingFunction: "var(--ease-standard)" }}
        >
          {label && (
            <>
              <span className="font-semibold uppercase">{label}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{source.namn}</span>
          {source.hämtad && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatDate(source.hämtad, locale)}</span>
            </>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 max-w-xs rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg"
        >
          <p className="font-semibold text-slate-900">{source.namn}</p>
          {source.hämtad && <p className="mt-0.5 text-slate-600">{formatDate(source.hämtad, locale)}</p>}
          {quote && (
            <p className="mt-2 border-l-2 border-slate-200 pl-2 italic text-slate-600">
              <span className="not-italic font-medium text-slate-600">
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
