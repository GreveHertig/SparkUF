import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
