"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/server/supabase";

/**
 * Server Action för väntelistan på landningssidan (tabellen public.waitlist,
 * supabase/migrations/20260924120000_waitlist.sql). Samma mönster som
 * app/(auth)/actions.ts: ingen text lämnar servern, bara koder som klienten
 * slår upp i i18n (CLAUDE.md: "Ingen hårdkodad text").
 */

export type WaitlistFieldErrorCode = "email_invalid";
export type WaitlistFormErrorCode = "unexpected";

export type WaitlistFormState =
  | {
      fieldError?: WaitlistFieldErrorCode;
      formError?: WaitlistFormErrorCode;
      joined?: boolean;
    }
  | undefined;

// 254 tecken och gemener speglar tabellens check-villkor.
const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { error: "email_invalid" })
    .pipe(z.email({ error: "email_invalid" })),
});

/** Postgres felkod för brutet unique-villkor: adressen finns redan. */
const UNIQUE_VIOLATION = "23505";

export async function joinWaitlist(
  _prevState: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const parsed = WaitlistSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldError: "email_invalid" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    // Ingen .select() efter insert: tabellen har ingen läspolicy, så att be
    // om raden tillbaka skulle ge fel.
    const { error } = await supabase.from("waitlist").insert({ email: parsed.data.email });

    // En adress som redan står på listan ger AVSIKTLIGT samma svar som en ny,
    // annars kan fältet användas för att ta reda på vilka adresser som finns
    // där. Samma skydd som signUp i app/(auth)/actions.ts.
    if (error && error.code !== UNIQUE_VIOLATION) {
      return { formError: "unexpected" };
    }
  } catch {
    // T.ex. saknade Supabase-variabler. Landningssidan ska inte krascha.
    return { formError: "unexpected" };
  }

  return { joined: true };
}
