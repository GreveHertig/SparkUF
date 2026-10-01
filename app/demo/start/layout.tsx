"use client";

import type { ReactNode } from "react";
import { DemoTopBar } from "@/screens/AppShell";

/** Onboardingen: inget skal med meny, grundaren har ingen profil än. */
export default function DemoStartLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DemoTopBar />
      <main className="fdd-main fdd-main--narrow">{children}</main>
    </>
  );
}
