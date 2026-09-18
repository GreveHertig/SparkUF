"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { AuthError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/server/supabase";
import { safeNextPath } from "@/lib/safeNextPath";

/**
 * Server Actions för /logga-in och /skapa-konto (uppdrag 14.4). Ingen text
 * lämnar servern — fältfel och formulärfel returneras som KODER, aldrig
 * färdiga meningar (CLAUDE.md: "Ingen hårdkodad text"). Klienten
 * (LogInForm.tsx, SignUpForm.tsx) slår upp koden i t.auth.errors via
 * errorMessages.ts. Supabases råa felmeddelanden visas aldrig rakt av — de
 * kan avslöja om ett konto finns eller inte, eller läcka interna detaljer.
 */

export type SignInFieldErrorCode = "email_invalid" | "password_required";

export type SignUpFieldErrorCode =
  | "name_too_short"
  | "email_invalid"
  | "password_too_short"
  | "password_needs_letter"
  | "password_needs_number";

export type AuthFormErrorCode = "invalid_credentials" | "unexpected";

export type SignInFieldErrors = Partial<Record<"email" | "password", SignInFieldErrorCode[]>>;
export type SignUpFieldErrors = Partial<Record<"name" | "email" | "password", SignUpFieldErrorCode[]>>;

export type SignInFormState =
  | {
      fieldErrors?: SignInFieldErrors;
      formError?: AuthFormErrorCode;
    }
  | undefined;

export type SignUpFormState =
  | {
      fieldErrors?: SignUpFieldErrors;
      formError?: AuthFormErrorCode;
      /** Supabase-projektet har e-postbekräftelse påslagen — kontot är
       * skapat men ingen session finns än. Inte ett fel. */
      checkEmail?: boolean;
    }
  | undefined;

const SignUpSchema = z.object({
  name: z.string().trim().min(2, { error: "name_too_short" }),
  email: z.email({ error: "email_invalid" }).trim(),
  password: z
    .string()
    .min(8, { error: "password_too_short" })
    .regex(/[a-zA-Z]/, { error: "password_needs_letter" })
    .regex(/[0-9]/, { error: "password_needs_number" }),
});

const SignInSchema = z.object({
  email: z.email({ error: "email_invalid" }).trim(),
  password: z.string().min(1, { error: "password_required" }),
});

function readNext(formData: FormData): string {
  const value = formData.get("next");
  return safeNextPath(typeof value === "string" ? value : null);
}

/** Supabases egna felkoder (@supabase/auth-js), aldrig dess meddelandetext. */
function mapAuthError(error: AuthError): AuthFormErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "invalid_credentials";
    default:
      return "unexpected";
  }
}

/** true för Supabases "kontot finns redan"-koder. */
function isAccountExistsError(error: AuthError): boolean {
  return error.code === "user_already_exists" || error.code === "email_exists";
}

export async function signUp(_prevState: SignUpFormState, formData: FormData): Promise<SignUpFormState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as SignUpFieldErrors };
  }

  const next = readNext(formData);
  const supabase = await createSupabaseServerClient();
  const { name, email, password } = parsed.data;
  // `name` läggs i auth.users.raw_user_meta_data — handle_new_user()-
  // triggern (supabase/migrations/) läser den när profiles-raden skapas.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    // Kontot finns redan (Supabase: user_already_exists/email_exists) ger
    // AVSIKTLIGT samma svar som en lyckad registrering ("kolla din mejl"),
    // aldrig ett distinkt felmeddelande — annars kan formuläret användas för
    // att lista ut vilka e-postadresser redan har konton (kontouppräkning).
    // security-reviewer, Session P1.
    if (isAccountExistsError(error)) {
      return { checkEmail: true };
    }
    return { formError: mapAuthError(error) };
  }

  if (!data.session) {
    return { checkEmail: true };
  }

  redirect(next);
}

export async function signIn(_prevState: SignInFormState, formData: FormData): Promise<SignInFormState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as SignInFieldErrors };
  }

  const next = readNext(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { formError: mapAuthError(error) };
  }

  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/logga-in");
}
