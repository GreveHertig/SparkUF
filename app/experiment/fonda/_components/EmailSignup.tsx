"use client";

import { useActionState, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { joinFondaWaitlist, type FondaWaitlistErrorCode, type FondaWaitlistState } from "../actions";
import { HONEYPOT_FIELD } from "../_lib/waitlist";

export const FONDA_PRIVACY_HREF = "/experiment/fonda/integritet";

type MessageKey = keyof Pick<Dictionary["experimentFonda"]["close"], "invalid" | "unexpected" | "rateLimited">;

// Record så att TypeScript vägrar kompilera om en ny felkod läggs till i
// actions.ts utan en text (samma mönster som app/(marketing)/WaitlistForm.tsx).
const errorKeys: Record<FondaWaitlistErrorCode, MessageKey> = {
  email_invalid: "invalid",
  unexpected: "unexpected",
  rate_limited: "rateLimited",
};

const initialState: FondaWaitlistState = undefined;

/**
 * Väntelistan: ett mejlfält kopplat till Server Action joinFondaWaitlist
 * (../actions.ts), som går via Oskars joinWaitlist och public.join_waitlist.
 * Adressen kontrolleras i webbläsaren innan den skickas; servern
 * kontrollerar den igen. Samma tack oavsett om adressen redan fanns.
 */
export function EmailSignup() {
  const { t } = useI18n();
  const copy = t.experimentFonda.close;
  const [state, formAction, pending] = useActionState(joinFondaWaitlist, initialState);
  const [clientInvalid, setClientInvalid] = useState(false);
  // Ett nytt serverfel visas tills besökaren ändrar adressen.
  const [dismissedState, setDismissedState] = useState<FondaWaitlistState>(undefined);
  const inputId = useId();
  const statusId = useId();
  const privacyId = useId();

  const joined = state?.status === "joined";
  const serverError = state?.status === "error" && state !== dismissedState ? state.code : null;
  const invalid = clientInvalid || serverError === "email_invalid";
  const message = joined
    ? copy.joined
    : clientInvalid
      ? copy.invalid
      : serverError
        ? copy[errorKeys[serverError]]
        : null;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const input = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const ok = input.value.trim() !== "" && input.checkValidity();
    if (!ok) {
      // Stoppar Server Action: inget skickas förrän adressen ser giltig ut.
      event.preventDefault();
      setClientInvalid(true);
      input.focus();
      return;
    }
    setClientInvalid(false);
  }

  return (
    <div className="fd-form">
      {!joined && (
        <form action={formAction} onSubmit={onSubmit} noValidate aria-busy={pending || undefined} className="fd-form__fields">
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
              maxLength={254}
              placeholder={copy.placeholder}
              aria-describedby={`${statusId} ${privacyId}`}
              aria-invalid={invalid || undefined}
              onChange={() => {
                if (clientInvalid) setClientInvalid(false);
                if (serverError) setDismissedState(state);
              }}
              className={cn("fd-input", invalid && "fd-input--invalid")}
            />
            <button type="submit" disabled={pending} className="fd-btn fd-btn--primary">
              {pending ? copy.submitting : copy.submit}
            </button>
          </div>
          {/* Honeypot: utanför skärmen, inte nåbar med tabb och dold för skärmläsare. */}
          <div className="fd-hp" aria-hidden="true">
            <label>
              {copy.honeypotLabel}
              <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
        </form>
      )}
      {/* Alltid monterad, så att skärmläsare läser upp varje nytt meddelande. */}
      <p id={statusId} role="status" aria-live="polite" className="fd-form__status">
        {message && (
          <span className={cn(!joined && "fd-form__error", joined && "fd-form__done")}>{message}</span>
        )}
      </p>
      <p id={privacyId} className="fd-form__help">
        {copy.privacyNote}{" "}
        <Link href={FONDA_PRIVACY_HREF} className="fd-form__link">
          {copy.privacyLink}
        </Link>
      </p>
    </div>
  );
}
