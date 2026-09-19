import type { ReactNode } from "react";
import { PublicHeader } from "@/components/spark/PublicHeader";
import { PublicFooter } from "@/components/spark/PublicFooter";

/** Delad ram för de publika sidorna (/, /priser) — se docs/uppdrag.md avsnitt 6. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
