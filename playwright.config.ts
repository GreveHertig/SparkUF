import { defineConfig, devices } from "@playwright/test";

// Tester i en riktig Next-server (`pnpm test:e2e`). De fångar det `pnpm test`
// inte kan: fel som bara Next ger vid rendering, som en funktion skickad från
// en Server Component till en klientkomponent.
// - e2e/demo.spec.ts: demots huvudflöde på sv och en. Körs alltid.
// - e2e/app.spec.ts: /app inloggad. Testkontot läses ur .env.local
//   (APP_TEST_USER_*, se .env.example) och finns aldrig i koden. Saknas det
//   hoppas de testerna över.
// - e2e/onboarding.spec.ts: onboardingen från kärnfrågorna till Minnet, med
//   ett eget testkonto (APP_ONBOARDING_USER_*) som återställs före varje körning.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ingen .env.local (t.ex. i CI): testerna av /app hoppas över, se e2e/app.spec.ts.
}

// `pnpm build` kräver Supabase-adressen och anon-nyckeln (sidorna under /app
// läser dem vid förrenderingen). Finns de byggs och startas en produktionsserver.
// Annars, t.ex. i en molnsession utan .env.local, körs `next dev`: demot
// behöver ingen Supabase, och testerna av /app hoppas ändå över.
const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// E2E_BASE_URL pekar mot en server som redan kör; annars startas en.
const externalBaseUrl = process.env.E2E_BASE_URL;
const port = 3300;

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: externalBaseUrl ?? `http://localhost:${port}`,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobil", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: hasSupabase ? `pnpm build && pnpm start -p ${port}` : `pnpm dev -p ${port}`,
        // Startsidan är statisk och kräver ingen Supabase.
        url: `http://localhost:${port}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 600_000,
      },
});
