import { defineConfig, devices } from "@playwright/test";

// Inloggade tester av /app i en riktig Next-server (`pnpm test:e2e`). De
// fångar det `pnpm test` inte kan: fel som bara Next ger vid rendering, som
// en funktion skickad från en Server Component till en klientkomponent.
// Testkontot läses ur .env.local (APP_TEST_USER_*, se .env.example) och
// finns aldrig i koden. Saknas det hoppas testerna över.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Ingen .env.local (t.ex. i CI): testerna hoppas över, se e2e/app.spec.ts.
}

const hasTestUser = Boolean(process.env.APP_TEST_USER_EMAIL && process.env.APP_TEST_USER_PASSWORD);
// E2E_BASE_URL pekar mot en server som redan kör; annars byggs och startas en.
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
  webServer:
    hasTestUser && !externalBaseUrl
      ? {
          command: `pnpm build && pnpm start -p ${port}`,
          url: `http://localhost:${port}/logga-in`,
          reuseExistingServer: !process.env.CI,
          timeout: 600_000,
        }
      : undefined,
});
