"use client";

import { useActionState } from "react";
import { TextField } from "@/components/ui/TextField";
import { useI18n } from "@/i18n/context";
import type { Dictionary } from "@/i18n/dictionary";
import { cn } from "@/design/cn";
import {
  joinWaitlist,
  type WaitlistFieldErrorCode,
  type WaitlistFormErrorCode,
  type WaitlistFormState,
} from "./actions";

type ErrorKey = keyof Dictionary["landingPage"]["waitlist"]["errors"];

// Record (inte en generisk funktion) så TypeScript vägrar kompilera om en ny
// felkod läggs till i actions.ts utan en motsvarande i18n-nyckel, samma
// mönster som app/(auth)/errorMessages.ts.
const errorKeys: Record<WaitlistFieldErrorCode | WaitlistFormErrorCode, ErrorKey> = {
  email_invalid: "emailInvalid",
  unexpected: "unexpected",
};

const initialState: WaitlistFormState = undefined;

/**
 * Väntelistan: ett mejlfält, inget annat. Används två gånger på
 * landningssidan (hero och avslutande sektionen). Ett vitt kort så att
 * TextField (byggd för ljus botten) går att återanvända oförändrad på de
 * mörka ytorna.
 */
export function WaitlistForm({ className }: { className?: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);
  const copy = t.landingPage.waitlist;

  return (
    <div className={cn("rounded-lg bg-white p-5 text-left shadow-xl", className)}>
      {state?.joined ? (
        <p className="text-sm font-medium text-slate-900" role="status">
          {copy.joined}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          <TextField
            label={copy.label}
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state?.fieldError ? copy.errors[errorKeys[state.fieldError]] : undefined}
          />
          {state?.formError && (
            <p className="text-sm font-medium text-score-red" role="alert">
              {copy.errors[errorKeys[state.formError]]}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {copy.submitCta}
          </button>
          <p className="text-xs leading-snug text-slate-500">{copy.privacyNote}</p>
        </form>
      )}
    </div>
  );
}
