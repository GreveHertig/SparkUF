import type { ReactNode } from "react";
import { cn } from "@/design/cn";

type EyebrowProps = {
  children: ReactNode;
  /** "light" används på mörka ytor (sidomeny, hero, demorad). */
  tone?: "default" | "accent" | "light";
  className?: string;
};

const toneClasses = {
  default: "text-slate-600",
  accent: "text-accent-700",
  light: "text-slate-300",
} as const;

/** Versal etikett med teckenavstånd, t.ex. "STEG 05 · SAMTALEN". */
export function Eyebrow({ children, tone = "default", className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold uppercase",
        toneClasses[tone],
        className,
      )}
      style={{ letterSpacing: "var(--tracking-label)" }}
    >
      {children}
    </span>
  );
}
