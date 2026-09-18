import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-klient bunden till den inloggade användarens session (App Router:
 * Server Components, Server Actions, Route Handlers). Samma mönster som
 * lib/server/gemini.ts (`import "server-only"` överst — kraschar bygget om
 * en klientkomponent någonsin importerar den) men bär ingen hemlighet: URL
 * och anon-nyckeln är publika per Supabases design (se .env.example),
 * skyddet är RLS-policyerna i supabase/migrations/.
 *
 * Skapa en NY klient per anrop — dela aldrig en instans mellan requests
 * (@supabase/ssr:s egen varning i README).
 */

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY saknas. Sätt dem i .env.local (se .env.example) — skaffa på supabase.com (Project Settings → API).",
    );
  }
  return { url, anonKey };
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Anropad från en Server Component (t.ex. requireUser() i
          // app/(app)/layout.tsx) — bara Server Actions/Route Handlers får
          // sätta cookies i Next.js. proxy.ts (lib/server/supabaseProxy.ts)
          // förnyar och skriver tillbaka sessionscookien på varje
          // /app-/start-request, så det här är förväntat, inte ett fel.
        }
      },
    },
  });
}
