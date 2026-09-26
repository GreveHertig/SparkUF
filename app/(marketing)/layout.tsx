import type { ReactNode } from "react";
import "@/design/site.css";

/**
 * De publika sidorna. Startsidan (/) och /integritet har egna sidhuvuden och
 * sidfötter (design/site.css, skopat under .fd). /priser behåller den delade
 * ramen, se priser/layout.tsx.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children;
}
