"use client";

import { useId, useState, type FormEvent } from "react";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";

type Status = "idle" | "invalid" | "sent";

/**
 * Ett enda mejlfält. Medvetet inte kopplat till något: inskicket valideras
 * lokalt och bekräftar sedan uttryckligen att inget sparades, så att sidan
 * aldrig påstår att en adress tagits emot.
 */
export function SignupForm({ className }: { className?: string }) {
  const { t } = useI18n();
  const copy = t.experimentLanding.close;
  const [status, setStatus] = useState<Status>("idle");
  const inputId = useId();
  const helpId = useId();
  const statusId = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    setStatus(input.checkValidity() && input.value.trim() !== "" ? "sent" : "invalid");
  }

  return (
    <form noValidate onSubmit={onSubmit} className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-[0.95rem] text-slate-200">
        {copy.emailLabel}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-describedby={`${helpId} ${statusId}`}
          aria-invalid={status === "invalid" || undefined}
          onChange={() => status !== "idle" && setStatus("idle")}
          className={cn(
            "h-12 min-w-0 flex-1 rounded-pill border bg-white px-5 text-base text-ink-900 placeholder:text-slate-600",
            status === "invalid" ? "border-score-red-bg" : "border-transparent",
          )}
        />
        <button
          type="submit"
          className="xl-press h-12 shrink-0 whitespace-nowrap rounded-pill bg-paper-50 px-6 text-base text-ink-900 hover:bg-accent-100"
        >
          {copy.submit}
        </button>
      </div>
      <p id={helpId} className="text-sm text-slate-300">
        {copy.emailHelp}
      </p>
      <p id={statusId} role="status" className="min-h-[1.25rem] text-sm">
        {status === "invalid" && <span className="text-score-red-bg">{copy.invalid}</span>}
        {status === "sent" && <span className="text-paper-50">{copy.sentNotConnected}</span>}
      </p>
    </form>
  );
}
