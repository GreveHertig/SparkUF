"use client";

import { useId, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n/context";

type Status = "idle" | "invalid" | "sent";

/**
 * Ett enda mejlfält, medvetet inte kopplat till något. Inskicket valideras
 * lokalt och säger sedan uttryckligen att inget sparades.
 */
export function FreeSignup() {
  const { t } = useI18n();
  const copy = t.experimentFree.signup;
  const [status, setStatus] = useState<Status>("idle");
  const inputId = useId();
  const helpId = useId();
  const statusId = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    setStatus(input.value.trim() !== "" && input.checkValidity() ? "sent" : "invalid");
  }

  return (
    <form noValidate onSubmit={onSubmit}>
      <label htmlFor={inputId} className="fri-mono" style={{ fontSize: "0.75rem" }}>
        {copy.emailLabel}
      </label>
      <div className="fri-form-row">
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="fri-input"
          aria-describedby={`${helpId} ${statusId}`}
          aria-invalid={status === "invalid" || undefined}
          onChange={() => status !== "idle" && setStatus("idle")}
        />
        <button type="submit" className="fri-btn fri-btn-ink">
          {copy.submit}
        </button>
      </div>
      <p id={helpId} style={{ marginTop: 12, fontSize: "0.92rem" }}>
        {copy.help}
      </p>
      <p id={statusId} role="status" style={{ minHeight: "1.5em", marginTop: 6, fontWeight: 560 }}>
        {status === "invalid" && copy.invalid}
        {status === "sent" && copy.sent}
      </p>
    </form>
  );
}
