import type { ReactNode } from "react";
import { cn } from "@/design/cn";

/** Tät rad med 4–6 KpiTile (designuppdatering: high-tech dashboard), högst
 * upp på Hem och Poäng. Bara layout — innehållet skickas in av anroparen. */
export function KpiRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>{children}</div>
  );
}
