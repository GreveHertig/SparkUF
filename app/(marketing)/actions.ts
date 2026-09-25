"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/server/supabase";

/**
 * Server Action för väntelistan på landningssidan (funktionen
 * public.join_waitlist, supabase/migrations/20260924120000_waitlist.sql). Samma mönster som
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
    // Via funktionen, inte direkt mot tabellen: besökare har inga rättigheter
    // på public.waitlist. Funktionen ger samma svar för en adress som redan
    // står på listan som för en ny (on conflict do nothing) och returnerar
    // ingenting, så fältet kan inte användas för att ta reda på vilka
    // adresser som finns där.
    const { error } = await supabase.rpc("join_waitlist", { p_email: parsed.data.email });

    if (error) {
      return { formError: "unexpected" };
    }
  } catch {
    // T.ex. saknade Supabase-variabler. Landningssidan ska inte krascha.
    return { formError: "unexpected" };
  }

  return { joined: true };
}
