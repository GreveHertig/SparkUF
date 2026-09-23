import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Sändspärr (docs/moduler/utskick-och-svar.md): inga mejlpaket i repot.
// Komplement till lib/server/noMailer.guard.test.ts. Täcker bara statiska imports;
// dynamisk import() och fetch mot mejl-API:er fångas av vakttestet.
const mailPattern = {
  group: [
    "nodemailer",
    "nodemailer-*",
    "googleapis",
    "@googleapis/*",
    "@sendgrid/*",
    "resend",
    "postmark",
    "mailgun*",
    "@aws-sdk/client-ses*",
  ],
  message:
    "Sändning är avstängd tills Theodor och grundaren uttryckligen sagt ja. Se docs/moduler/utskick-och-svar.md, Sändspärr.",
};

// Registercachen (lib/server/registryCache.ts) bär service role-nyckeln och går
// förbi RLS. Bara registrets liveadapter och tester får importera den
// (docs/beslut.md 2026-09-23, docs/arkitektur.md avsnitt 9).
const registryCachePattern = {
  group: ["**/lib/server/registryCache", "./registryCache"],
  message:
    "Registercachen (service role) importeras bara av adapters/live/RegistryProvider.ts. Se docs/arkitektur.md, avsnitt 9.",
};
const registryCacheImporters = ["adapters/live/RegistryProvider.ts", "**/*.test.ts"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Demon importerar aldrig liveadaptrar (CLAUDE.md, avsnitt Arkitektur;
  // docs/uppdrag.md 14.6) — så att demot aldrig kan läcka nycklar eller
  // röra riktig data.
  {
    files: ["app/demo/**/*.{ts,tsx}", "adapters/demo/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            mailPattern,
            registryCachePattern,
            {
              group: [
                "@/adapters/live",
                "@/adapters/live/*",
                "@/adapters/live/**",
                "**/adapters/live/*",
                "**/adapters/live/**",
              ],
              message: "Demon importerar aldrig liveadaptrar. Se CLAUDE.md, avsnitt Arkitektur.",
            },
          ],
        },
      ],
    },
  },
  // Sändspärr och registercachen: se mailPattern och registryCachePattern ovan.
  // Gäller alla filer utom demofilerna, som har egen regel (flat config ersätter
  // regelns inställningar, slår inte ihop dem).
  {
    ignores: ["app/demo/**", "adapters/demo/**", ...registryCacheImporters],
    rules: {
      "no-restricted-imports": ["error", { patterns: [mailPattern, registryCachePattern] }],
    },
  },
  {
    files: registryCacheImporters,
    ignores: ["app/demo/**", "adapters/demo/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [mailPattern] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
