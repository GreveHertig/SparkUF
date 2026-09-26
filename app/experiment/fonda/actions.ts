"use server";

import { headers } from "next/headers";
import { joinWaitlist } from "@/app/(marketing)/actions";
import { checkRateLimit } from "@/lib/server/rateLimit";
import { HONEYPOT_FIELD } from "./_lib/waitlist";

/**
 * Väntelistan på /experiment/fonda. Ett tunt lager framför Oskars
 * joinWaitlist (app/(marketing)/actions.ts, orörd), som validerar och
 * skriver via public.join_waitlist. Här läggs bara spamskyddet till:
 * ett honeypot-fält och en spärr per IP. Ingen text lämnar servern, bara
 * koder som klienten slår upp i i18n.
 */

export type FondaWaitlistErrorCode = "email_invalid" | "unexpected" | "rate_limited";

export type FondaWaitlistState =
  | { status: "joined" }
  | { status: "error"; code: FondaWaitlistErrorCode }
  | undefined;

// Best-effort i minnet (lib/server/rateLimit.ts): överlever inte omstart och
// delas inte mellan serverinstanser. Räcker för att stoppa en enkel loop.
const LIMITS = { perHour: 5, perDay: 20 };

/** Besökarens IP enligt proxyn framför Next (första adressen i x-forwarded-for). */
function clientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip")?.trim() || "unknown";
}

export async function joinFondaWaitlist(
  _prevState: FondaWaitlistState,
  formData: FormData,
): Promise<FondaWaitlistState> {
  // Ett ifyllt honeypot-fält betyder en bot. Den får samma svar som en
  // människa, så att den inte lär sig något, men inget sparas.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return { status: "joined" };
  }

  try {
    checkRateLimit(`waitlist:${clientIp(await headers())}`, LIMITS);
  } catch {
    return { status: "error", code: "rate_limited" };
  }

  const result = await joinWaitlist(undefined, formData);
  if (result?.joined) return { status: "joined" };
  if (result?.fieldError) return { status: "error", code: result.fieldError };
  return { status: "error", code: "unexpected" };
}
