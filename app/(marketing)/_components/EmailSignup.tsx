"use client";

import { useActionState, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { cn } from "@/design/cn";
import { useI18n } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { joinLandingWaitlist, type LandingWaitlistErrorCode, type LandingWaitlistState } from "../landingActions";
import { suggestEmailFix } from "../_lib/emailTypos";
import { fill } from "@/i18n/fill";
import { HONEYPOT_FIELD } from "../_lib/waitlist";

export const FONDA_PRIVACY_HREF = "/integritet";

type MessageKey = keyof Pick<
  Dictionary["site"]["close"],
  "invalid" | "undeliverable" | "unexpected" | "rateLimited"
>;

// Record så att TypeScript vägrar kompilera om en ny felkod läggs till i
// actions.ts utan en text (samma mönster som app/(marketing)/WaitlistForm.tsx).
const errorKeys: Record<LandingWaitlistErrorCode, MessageKey> = {
  email_invalid: "invalid",
  email_undeliverable: "undeliverable",
  unexpected: "unexpected",
  rate_limited: "rateLimited",
};

const initialState: LandingWaitlistState = undefined;

/**
 * Väntelistan: ett mejlfält kopplat till Server Action joinLandingWaitlist
 * (../actions.ts), som går via Oskars joinWaitlist och public.join_waitlist.
 * Adressen kontrolleras i webbläsaren innan den skickas; servern
 * kontrollerar den igen och slår upp domänens MX-poster. Vanliga stavfel i
 * domänen ger ett klickbart "Menade du …?", som aldrig stoppar inskicket.
 * Samma tack oavsett om adressen redan fanns.
 */
export function EmailSignup() {
  const { t } = useI18n();
  const copy = t.site.close;
  const [state, formAction, pending] = useActionState(joinLandingWaitlist, initialState);
  const [clientInvalid, setClientInvalid] = useState(false);
  // Ett nytt serverfel visas tills besökaren ändrar adressen.
  const [dismissedState, setDismissedState] = useState<LandingWaitlistState>(undefined);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const statusId = useId();
  const privacyId = useId();

  const joined = state?.status === "joined";
  const serverError = state?.status === "error" && state !== dismissedState ? state.code : null;
  const invalid = clientInvalid || serverError === "email_invalid" || serverError === "email_undeliverable";
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

  function acceptSuggestion() {
    const input = inputRef.current;
    if (!input || !suggestion) return;
    input.value = suggestion;
    setSuggestion(null);
    setClientInvalid(false);
    if (serverError) setDismissedState(state);
    input.focus();
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
              ref={inputRef}
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
              onChange={(event) => {
                setSuggestion(suggestEmailFix(event.currentTarget.value));
                if (clientInvalid) setClientInvalid(false);
                if (serverError) setDismissedState(state);
              }}
              className={cn("fd-input", invalid && "fd-input--invalid")}
            />
            <button type="submit" disabled={pending} className="fd-btn fd-btn--primary">
              {pending ? copy.submitting : copy.submit}
            </button>
          </div>
          {suggestion && (
            <p className="fd-form__suggest">
              <button type="button" onClick={acceptSuggestion} className="fd-form__suggest-btn">
                {fill(copy.didYouMean, { email: suggestion })}
              </button>
            </p>
          )}
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
