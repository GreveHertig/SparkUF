import { cn } from "@/design/cn";

/** Markören "4 dagar senare" i demot (uppdrag 8, 9.1). */
export function TimeSkip({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-1", className)}>
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
      <span
        className="shrink-0 text-xs font-semibold uppercase text-slate-500"
        style={{ letterSpacing: "var(--tracking-label)" }}
      >
        {label}
      </span>
      <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
    </div>
  );
}
