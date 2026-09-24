"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { FriDemoBar } from "./_components/FriDemoBar";
import { FriTour } from "./_components/FriTour";
import { retainFriDemo, useFriDemoReady } from "./_lib/friDemoIsolation";
import "./fri-demo.css";

/**
 * Rot för kopian av demot: växlar demo-lagret till kopians egen nyckel
 * (se _lib/friDemoIsolation.ts) och bär demoraden och rundturen, precis som
 * demots egna layouter.
 *
 * Innehållet renderas först när växlingen är gjord. Då kan ingen sida hämta
 * data ur det riktiga demots läge, och server och klient renderar samma
 * tomma skal vid hydreringen.
 */
export default function FriDemoRootLayout({ children }: { children: ReactNode }) {
  const ready = useFriDemoReady();

  useLayoutEffect(() => retainFriDemo(), []);

  return (
    <div className="fri">
      {ready && (
        <>
          {children}
          <FriDemoBar />
          <FriTour />
        </>
      )}
    </div>
  );
}
