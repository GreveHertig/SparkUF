"use client";

import { Eyebrow } from "@/components/ui/Eyebrow";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

type NextStepCardProps = {
  eyebrow: string;
  title: string;
  why: string;
  doneItems: string[];
  actionLabel: string;
  onAction?: () => void;
  className?: string;
};

/** Handlingssteg: en tydlig uppgift, en rad om varför, och klara delmoment med bockar. */
export function NextStepCard({
  eyebrow,
  title,
  why,
  doneItems,
  actionLabel,
  onAction,
  className,
}: NextStepCardProps) {
  const { t } = useI18n();

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-6", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <p className="mt-2 text-xl font-bold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{why}</p>
      {doneItems.length > 0 && (
        <div className="mt-4">
          <p
            className="text-xs font-semibold uppercase text-slate-400"
            style={{ letterSpacing: "var(--tracking-label)" }}
          >
            {t.common.doneItemsLabel}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {doneItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-paper-50 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
      >
        {actionLabel}
      </button>
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
