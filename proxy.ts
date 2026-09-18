import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@/lib/server/supabaseProxy";
import { safeNextPath } from "@/lib/safeNextPath";

// Next.js 16: `middleware.ts` är döpt om till `proxy.ts` (samma funktion,
// se node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// — AGENTS.md: läs den dokumentationen innan du ändrar den här filen).
//
// Tre skikt av skydd, ingen ensam tillräcklig (docs/arkitektur.md):
// 1. Den här filen — kör före varje matchad request, förnyar sessionen och
//    omdirigerar tidigt. `getUser()` gör ett nätverksanrop till Supabase Auth
//    (inte bara en cookie-avkodning) eftersom det är så Supabase själva
//    rekommenderar det — det är också det enda sättet att förnya en utgången
//    token. En matcher-ändring får ALDRIG vara den enda vakten mellan en
//    obehörig och /app.
// 2. `requireUser()` (lib/server/session.ts) i app/(app)/layout.tsx — körs i
//    varje Server Component-render, kan inte kringgås av klientsidig
//    navigering (Next-dokumentets "Layouts and auth checks"-varning).
// 3. RLS i databasen (supabase/migrations/) — den bindande spärren om de två
//    första på något sätt kringgås.
//
// matcher täcker bara plattformsroutes. /demo/* ska ALDRIG göra ett
// Supabase-anrop (CLAUDE.md: "Demon importerar aldrig liveadaptrar" — en
// demo som är beroende av nätverk och en inloggningssession är en egen
// risk), så /demo/* och /designsystem är medvetet uteslutna.
export const config = {
  matcher: ["/app/:path*", "/start/:path*", "/logga-in", "/skapa-konto"],
};

const AUTH_ROUTES = new Set(["/logga-in", "/skapa-konto"]);

export async function proxy(request: NextRequest) {
  const { supabase, applyPendingCookies } = createSupabaseProxyClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  if (!user && !isAuthRoute) {
    const loginUrl = new URL("/logga-in", request.url);
    loginUrl.searchParams.set("next", pathname);
    return applyPendingCookies(NextResponse.redirect(loginUrl));
  }

  if (user && isAuthRoute) {
    const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
    return applyPendingCookies(NextResponse.redirect(new URL(destination, request.url)));
  }

  return applyPendingCookies(NextResponse.next({ request }));
}
