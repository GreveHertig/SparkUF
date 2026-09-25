"use client";

import Link from "next/link";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

export const FONDA_DEMO_HREF = "/experiment/fonda/demo";

/** "Se demot", alltid med märkningen att demot visar fiktiv data. */
export function DemoLink({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useI18n();
  const copy = t.experimentFonda.demoLink;

  return (
    <Link href={FONDA_DEMO_HREF} className={cn("fd-btn fd-btn--primary fd-demolink", className)}>
      <span>{copy.label}</span>
      <span className={cn("fd-demolink__note", compact && "fd-sr-only")}>{copy.note}</span>
    </Link>
  );
}
