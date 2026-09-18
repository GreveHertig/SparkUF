import type { Dictionary } from "@/i18n/dictionary";
import type { AuthFormErrorCode, SignInFieldErrorCode, SignUpFieldErrorCode } from "./actions";

type ErrorKey = keyof Dictionary["auth"]["errors"];

// Record<..., ErrorKey> (inte en generisk funktion) så TypeScript vägrar
// kompilera om en ny felkod läggs till i actions.ts utan en motsvarande
// i18n-nyckel här.
export const signInFieldErrorKeys: Record<SignInFieldErrorCode, ErrorKey> = {
  email_invalid: "emailInvalid",
  password_required: "passwordRequired",
};

export const signUpFieldErrorKeys: Record<SignUpFieldErrorCode, ErrorKey> = {
  name_too_short: "nameTooShort",
  email_invalid: "emailInvalid",
  password_too_short: "passwordTooShort",
  password_needs_letter: "passwordNeedsLetter",
  password_needs_number: "passwordNeedsNumber",
};

export const formErrorKeys: Record<AuthFormErrorCode, ErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_in_use: "emailInUse",
  unexpected: "unexpected",
};
