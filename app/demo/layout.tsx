"use client";

import { useLayoutEffect, type ReactNode } from "react";
import "@/design/site.css";
import { hydrateDemoStore, useDemoStoreHydrated } from "@/adapters/demo/demoStore";
import { DemoBar } from "./_components/DemoBar";
import { DemoTour } from "./_components/DemoTour";

/**
 * Rot för demot: läser in demots sparade läge (adapters/demo/demoStore.ts)
 * och bär demoraden och rundturen.
 *
 * Innehållet renderas först när läget är inläst. Då renderar server och
 * klient samma tomma skal vid hydreringen, och ingen sida hämtar data ur
 * utgångsläget innan det sparade läget är på plats.
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  const ready = useDemoStoreHydrated();

  useLayoutEffect(() => hydrateDemoStore(), []);

  if (!ready) return null;

  return (
    <div className="fd">
      <div className="fdd fdd--with-bar">
        {children}
        <DemoBar />
        <DemoTour />
      </div>
    </div>
  );
}
