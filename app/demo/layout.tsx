"use client";

import { useLayoutEffect, type ReactNode } from "react";
import "@/design/site.css";
import { FondaDemoBar } from "./_components/FondaDemoBar";
import { FondaTour } from "./_components/FondaTour";
import { retainFondaDemo, useFondaDemoReady } from "./_lib/fondaDemoIsolation";

/**
 * Rot för demot: växlar demo-lagret till demots egen nyckel
 * (se _lib/fondaDemoIsolation.ts) och bär demoraden och rundturen, precis
 * som det riktiga demots layouter gör.
 *
 * Innehållet renderas först när växlingen är gjord. Då kan ingen sida hämta
 * data ur det riktiga demots läge, och server och klient renderar samma
 * tomma skal vid hydreringen.
 */
export default function FondaDemoLayout({ children }: { children: ReactNode }) {
  const ready = useFondaDemoReady();

  useLayoutEffect(() => retainFondaDemo(), []);

  if (!ready) return null;

  return (
    <div className="fd">
      <div className="fdd">
        {children}
        <FondaDemoBar />
        <FondaTour />
      </div>
    </div>
  );
}
