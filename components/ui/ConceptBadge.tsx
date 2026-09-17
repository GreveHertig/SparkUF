"use client";

import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

/** "Koncept · partnerskap utforskas" — allt som rör Hiasynth eller Lovable. */
export function ConceptBadge({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center self-start rounded-pill border border-dashed border-data-simulation px-2.5 py-1 text-xs font-semibold uppercase text-data-simulation",
        className,
      )}
      style={{ letterSpacing: "var(--tracking-label)" }}
    >
      {t.common.conceptBadge}
    </span>
  );
}
