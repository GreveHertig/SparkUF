import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Request/response-bunden Supabase-klient för proxy.ts (projektroten).
 * Egen fil — importerar aldrig `next/headers`, proxyn kör utanför Reacts
 * server-komponentgraf. Inget `import "server-only"` här av samma skäl:
 * filen bär ingen hemlighet (bara den publika anon-nyckeln, se
 * lib/server/supabase.ts), och proxy.ts går inte genom
 * klient/server-komponentbygget som `server-only` skyddar mot.
 *
 * Cookies som Supabase vill skriva (ny/förnyad session) samlas i `pending`
 * i stället för att skrivas direkt på ett svar — proxy.ts vet inte förrän
 * efter `getUser()`-anropet om den till slut returnerar `NextResponse.next()`
 * eller en redirect, och båda måste bära cookies om en tokenförnyelse skett.
 *
 * `setAll` skriver ÄVEN de nya cookievärdena direkt på `request.cookies`
 * (inte bara i `pending`). Supabases refresh-tokens är engångs (se
 * @supabase/ssr:s README) — om proxyn förnyar sessionen men bara skriver
 * det nya värdet på UTGÅENDE svar, skulle samma requests nedströms
 * Server Component-rendering (via `NextResponse.next({ request })`) fortfarande
 * se det GAMLA, redan förbrukade tokenvärdet i sina cookies och misslyckas —
 * en falsk utloggning direkt efter en lyckad förnyelse. Att mutera
 * `request.cookies` innan `NextResponse.next({ request })` byggs är
 * Next-dokumentets och Supabases egna referensmönster för just det här.
 */

type PendingCookie = { name: string; value: string; options: CookieOptions };

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY saknas. Sätt dem i .env.local (se .env.example).",
    );
  }
  return { url, anonKey };
}

export function createSupabaseProxyClient(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const pending: PendingCookie[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        pending.push(...cookiesToSet);
      },
    },
  });

  return {
    supabase,
    /** Skriver eventuella väntande sessionscookies på det slutgiltiga svaret. */
    applyPendingCookies<T extends NextResponse>(response: T): T {
      for (const { name, value, options } of pending) {
        response.cookies.set(name, value, options);
      }
      return response;
    },
  };
}
