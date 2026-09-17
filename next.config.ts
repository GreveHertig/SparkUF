import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js dev-indikatorn (nere till vänster som standard) täcker annars
  // demoradens ◀ Bakåt-knapp i `next dev` (avsnitt 9.1) — flyttad ur vägen.
  // Påverkar bara utvecklingsläget, inte `next build`/`next start`.
  devIndicators: {
    position: "top-right",
  },
};

export default nextConfig;
