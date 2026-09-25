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
export function EmailSignup() {
  const { t } = useI18n();
  const copy = t.experimentFonda.close;
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
    <form noValidate onSubmit={onSubmit} className="fd-form">
      <label htmlFor={inputId} className="fd-form__label">
        {copy.emailLabel}
      </label>
      <div className="fd-form__row">
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder={copy.placeholder}
          aria-describedby={`${helpId} ${statusId}`}
          aria-invalid={status === "invalid" || undefined}
          onChange={() => status !== "idle" && setStatus("idle")}
          className={cn("fd-input", status === "invalid" && "fd-input--invalid")}
        />
        <button type="submit" className="fd-btn fd-btn--primary">
          {copy.submit}
        </button>
      </div>
      <p id={helpId} className="fd-form__help">
        {copy.help}
      </p>
      <p id={statusId} role="status" className="fd-form__status">
        {status === "invalid" && <span className="fd-form__error">{copy.invalid}</span>}
        {status === "sent" && <span>{copy.sent}</span>}
      </p>
    </form>
  );
}
