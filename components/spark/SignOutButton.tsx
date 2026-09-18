"use client";

import { signOut } from "@/app/(auth)/actions";
import { useI18n } from "@/i18n/context";

/**
 * Utloggningsknapp för AppShells `headerRight`-slot — bara /app skickar in
 * den (se app/(app)/layout.tsx); /demo/app skickar ingenting, precis som för
 * `headerLeft`/`bottomBar` sedan tidigare sessioner. Anropar Server Action
 * signOut() direkt via ett formulär, inget klientsidigt Supabase-anrop.
 */
export function SignOutButton() {
  const { t } = useI18n();

  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        {t.auth.signOutCta}
      </button>
    </form>
  );
}
