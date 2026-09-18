"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

type ToolRunCardProps = {
  label: string;
  steps: string[];
  className?: string;
};

/** Medgrundaren kör ett verktyg: delmoment med bockar, t.ex. "Hämtar från
 * Bolagsverket…". Demot visar alltid ett redan avslutat körförlopp — alla
 * delmoment är klara. */
export function ToolRunCard({ label, steps, className }: ToolRunCardProps) {
  const { t } = useI18n();

  return (
    <div className={cn("rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4", className)}>
      <Eyebrow>
        {t.cofounderPage.toolRunningLabel}: {label}
      </Eyebrow>
      <ul className="mt-3 flex flex-col gap-1.5">
        {steps.map((step) => (
          <li key={step} className="flex items-center gap-2 text-sm text-slate-700">
            <CheckIcon />
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-score-green"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
