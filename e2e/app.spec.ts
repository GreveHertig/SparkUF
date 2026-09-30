import { expect, test, type Page } from "@playwright/test";

const email = process.env.APP_TEST_USER_EMAIL;
const password = process.env.APP_TEST_USER_PASSWORD;

test.skip(!email || !password, "APP_TEST_USER_EMAIL/APP_TEST_USER_PASSWORD saknas i .env.local (se .env.example).");

// Varje /app-sida som finns. Juridik både utan och med vald bolagsform: med
// val anropas liveadaptern (cachad, se app/(app)/app/juridik/legalMapCache.ts).
const PAGES = [
  { path: "/app", heading: /./ },
  { path: "/app/poang", heading: "Poäng" },
  { path: "/app/minnet", heading: /./ },
  { path: "/app/juridik", heading: "Juridik" },
  { path: "/app/juridik?bolagsform=enskild_firma", heading: "Enskild firma" },
  { path: "/app/validering", heading: "Valideringen" },
] as const;

async function logIn(page: Page) {
  await page.goto("/logga-in");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname.startsWith("/app"));
}

test.describe("/app inloggad", () => {
  test.beforeEach(async ({ page }) => {
    await logIn(page);
  });

  for (const { path, heading } of PAGES) {
    test(`${path} renderar utan fel`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        // `next dev` spelar upp serverns egna loggar i webbläsaren med en
        // "Server"-etikett (t.ex. Juridiks medvetna console.error när Gemini
        // inte svarar). De är inte klientfel; ett renderingsfel syns ändå
        // som pageerror ovan.
        if (message.text().startsWith("%c%s%c") && message.text().includes(" Server ")) return;
        errors.push(`console.error: ${message.text()}`);
      });

      const response = await page.goto(path, { waitUntil: "networkidle" });

      expect(response?.status(), `status för ${path}`).toBe(200);
      expect(new URL(page.url()).pathname).toBe(path.split("?")[0]);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      // Skalet: sidhuvudets poäng och utloggningen finns på varje sida.
      await expect(page.getByRole("button", { name: /Logga ut/ })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
