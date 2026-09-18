"use client";

import Link from "next/link";
import { useActionState } from "react";
import { EditorialHeading } from "@/components/ui/EditorialHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextField } from "@/components/ui/TextField";
import { useI18n } from "@/i18n/context";
import { signIn, type SignInFormState } from "./actions";
import { formErrorKeys, signInFieldErrorKeys } from "./errorMessages";

const initialState: SignInFormState = undefined;

export function LogInForm({ next }: { next: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div>
        <Eyebrow>{t.auth.logIn.eyebrow}</Eyebrow>
        <EditorialHeading as="h1" className="mt-1 text-3xl">
          {t.auth.logIn.title}
        </EditorialHeading>
        <p className="mt-2 text-sm text-slate-600">{t.auth.logIn.subtitle}</p>
      </div>

      <input type="hidden" name="next" value={next} />

      <TextField
        label={t.auth.logIn.emailLabel}
        name="email"
        type="email"
        autoComplete="email"
        required
        error={
          state?.fieldErrors?.email?.[0] ? t.auth.errors[signInFieldErrorKeys[state.fieldErrors.email[0]]] : undefined
        }
      />
      <TextField
        label={t.auth.logIn.passwordLabel}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={
          state?.fieldErrors?.password?.[0]
            ? t.auth.errors[signInFieldErrorKeys[state.fieldErrors.password[0]]]
            : undefined
        }
      />

      {state?.formError && (
        <p className="text-sm font-medium text-score-red" role="alert">
          {t.auth.errors[formErrorKeys[state.formError]]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {t.auth.logIn.submitCta}
      </button>

      <p className="text-center text-sm text-slate-600">
        {t.auth.logIn.switchPrompt}{" "}
        <Link
          href={`/skapa-konto?next=${encodeURIComponent(next)}`}
          className="font-semibold text-accent-700 underline"
        >
          {t.auth.logIn.switchCta}
        </Link>
      </p>
    </form>
  );
}
