import type { NextConfig } from "next";

// GitHub Codespaces: proxyn framför porten skriver om `Origin` till
// `localhost:<port>` men skickar Codespaces-adressen i `x-forwarded-host`.
// Next ser då olika värdar och avbryter varje Server Action ("Invalid Server
// Actions request", E80). Bara i Codespaces (CODESPACES är satt där) räknas
// de lokala portarna och Codespaces-domänen som säkra ursprung. På Vercel är
// variabeln inte satt, och där gäller Nexts vanliga CSRF-skydd oförändrat.
const codespacesOrigins = process.env.CODESPACES
  ? [
      "localhost:3000",
      "localhost:3200",
      `*.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev"}`,
    ]
  : undefined;

const nextConfig: NextConfig = {
  // Next.js dev-indikatorn (nere till vänster som standard) täcker annars
  // demoradens ◀ Bakåt-knapp i `next dev` (avsnitt 9.1) — flyttad ur vägen.
  // Påverkar bara utvecklingsläget, inte `next build`/`next start`.
  devIndicators: {
    position: "top-right",
  },
  ...(codespacesOrigins && {
    experimental: {
      serverActions: { allowedOrigins: codespacesOrigins },
    },
  }),
};

export default nextConfig;
