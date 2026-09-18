import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/server/supabase";
import { NotAuthenticatedError } from "@/core/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Data Access Layer för inloggning (Next-dokumentets mönster,
 * node_modules/next/dist/docs/01-app/02-guides/authentication.md,
 * "Creating a Data Access Layer (DAL)"). Den BINDANDE sessionskontrollen —
 * proxy.ts (projektroten) gör bara en optimistisk, tidig omdirigering.
 */

export type CurrentUser = { id: string; email: string | null };

/**
 * `cache()` delar ett enda `getUser()`-anrop per rendering: layouten och
 * flera liveadaptrar (t.ex. Hem-sidans `Promise.all` mot Resan/Evidens/
 * Pulsen) kan alla anropa den här utan att göra separata nätverksanrop till
 * Supabase Auth i samma render-pass.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  // getUser() valideras mot Supabase Auth-servern. getSession() läser bara
  // sessionscookien rakt av och duger INTE som säkerhetskontroll.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});

/**
 * Används av route-filer/layouter (app/(app)/layout.tsx). Körs i varje
 * Server Component-render — kan inte kringgås av klientsidig navigering,
 * till skillnad från en kontroll som bara sitter i en layout som cachats
 * (Next-dokumentets varning under "Layouts and auth checks").
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/logga-in");
  return user;
}

/**
 * Används av de fem liveadaptrarna (adapters/live/*.ts). Kastar i stället
 * för att omdirigera — en adapter ska inte styra navigering, bara vägra
 * hämta data. proxy.ts + requireUser() har redan skickat en obehörig
 * användare vidare innan en adapter nås i normalfallet; det här är sista
 * spärren (utöver RLS, som gäller oavsett).
 */
export async function requireSupabaseUser(): Promise<{
  supabase: SupabaseClient;
  userId: string;
}> {
  const [supabase, user] = await Promise.all([createSupabaseServerClient(), getCurrentUser()]);
  if (!user) throw new NotAuthenticatedError();
  return { supabase, userId: user.id };
}
