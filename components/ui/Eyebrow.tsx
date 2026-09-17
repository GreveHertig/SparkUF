import type { ReactNode } from "react";
import { cn } from "@/design/cn";

type EyebrowProps = {
  children: ReactNode;
  tone?: "default" | "accent";
  className?: string;
};

/** Versal etikett med teckenavstånd, t.ex. "STEG 05 · SAMTALEN". */
export function Eyebrow({ children, tone = "default", className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold uppercase",
        tone === "accent" ? "text-accent-700" : "text-slate-500",
        className,
      )}
      style={{ letterSpacing: "var(--tracking-label)" }}
    >
      {children}
    </span>
  );
}
