"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/design/cn";

type TextFieldProps = {
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

/**
 * Etikett + fält + hint/felmeddelande. Inget i designsystemet täckte ett
 * formulärfält innan /logga-in och /skapa-konto (Session P1) — se
 * DESIGN.md. `error`/`hint` är redan uppslagen text från anroparen (aldrig
 * en kod), samma princip som övriga komponenter — den här filen vet inget
 * om i18n.
 */
export function TextField({ label, hint, error, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = cn(hintId, errorId);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={fieldId}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400",
          "focus-visible:outline-2 focus-visible:outline-accent-300",
          error && "border-score-red",
          className,
        )}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-score-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
