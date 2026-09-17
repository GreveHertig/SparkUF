"use client";

import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

/** Global etikett i demoläget — märker allt som inte är skarp data. */
export function DemoDataBadge({ className }: { className?: string }) {
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center self-start rounded-pill bg-slate-800 px-2.5 py-1 text-xs font-semibold uppercase text-paper-50",
        className,
      )}
      style={{ letterSpacing: "var(--tracking-label)" }}
    >
      {t.common.demoDataBadge}
    </span>
  );
}
