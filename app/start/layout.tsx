import type { ReactNode } from "react";
// Demots stil är appens stil (docs/plan-en-design.md), som i app/(app)/layout.tsx.
import "@/design/site.css";
import { DemoTopBar } from "@/screens/AppShell";
import { SignOutButton } from "@/components/spark/SignOutButton";
import { requireUser } from "@/lib/server/session";

// Onboardingens layout för plattformen (avsnitt 6): samma topprad som
// /demo/start, utan flikrad (grundaren har ingen profil eller poäng förrän
// onboardingen är klar) och utan demorad och fiktionsmärke.
export default async function StartLayout({ children }: { children: ReactNode }) {
  // Bindande sessionskontroll (docs/arkitektur.md) — samma mönster som
  // app/(app)/layout.tsx. proxy.ts matchar redan /start/:path*, men en
  // matcher-ändring får aldrig vara den enda vakten.
  await requireUser();

  return (
    <div className="fd">
      <div className="fdd">
        <DemoTopBar dataKind="live" headerRight={<SignOutButton />} />
        <main className="fdd-main fdd-main--narrow">{children}</main>
      </div>
    </div>
  );
}
