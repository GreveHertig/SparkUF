import { expect, test, type Page } from "@playwright/test";

const email = process.env.APP_TEST_USER_EMAIL;
const password = process.env.APP_TEST_USER_PASSWORD;

test.skip(!email || !password, "APP_TEST_USER_EMAIL/APP_TEST_USER_PASSWORD saknas i .env.local (se .env.example).");

// Varje /app-sida som finns, och onboardingen på /start. Juridik både utan och med vald bolagsform: med
// val anropas liveadaptern (cachad, se app/(app)/app/juridik/legalMapCache.ts).
const PAGES = [
  { path: "/app", heading: /./ },
  { path: "/app/poang", heading: "Poäng" },
  { path: "/app/minnet", heading: /./ },
  { path: "/app/juridik", heading: "Juridik" },
  { path: "/app/juridik?bolagsform=enskild_firma", heading: "Enskild firma" },
  { path: "/app/validering", heading: "Valideringen" },
  // Marknad både utan och med vald bransch. Testkontot står inte på Registrets
  // allowlist: sidan får visa låst läge eller "Registret är inte öppet än",
  // aldrig registerdata (se testet nedan).
  { path: "/app/marknad", heading: "Marknad" },
  { path: "/app/marknad?sni=69.201", heading: "Marknad" },
  // Resan, ett olåst steg och ett låst. Testkontot står på steg 01, så
  // rubriken är stegets namn; det låsta steget 12 visar låst läge.
  { path: "/app/resan", heading: /./ },
  { path: "/app/resan/1", heading: /./ },
  { path: "/app/resan/12", heading: /./ },
  // PR 10: Medgrundaren (ingen port för samtalet, Kommer snart per sektion).
  { path: "/app/medgrundaren", heading: "Medgrundaren" },
  // Bygg: testkontot står på steg 01, så sidan är låst till steg 07.
  { path: "/app/bygg", heading: "Bygg" },
  // Steg 6: Pulsen. Rubriken är den senaste signalen, eller sidans namn när
  // kontot inte har några signaler (inget aktivt projekt).
  { path: "/app/pulsen", heading: /./ },
  // Affärsplanen: ingen hopsamling i /app än, Kommer snart i varje avsnitt.
  { path: "/app/affarsplan", heading: "Affärsplanen" },
  // PR 11: onboardingen, samma skärmar som /demo/start. Profil och Projekt
  // är stubbar, så idégenomlysningen och samtalet visar Kommer snart.
  { path: "/start", heading: "Var står du idag?" },
  { path: "/start/ide", heading: "Idén, granskad" },
  { path: "/start/profil", heading: "Berätta om dig" },
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

test.describe("/app/marknad och licensgrinden", () => {
  test.beforeEach(async ({ page }) => {
    await logIn(page);
  });

  test("testkontot ser inga registersiffror", async ({ page }) => {
    await page.goto("/app/marknad?sni=69.201", { waitUntil: "networkidle" });
    const main = page.locator("main");
    // Antingen låst till steg 02 eller stängd grind; båda saknar registerdata.
    await expect(main).toContainText(/Låses upp efter steg 02|Registret är inte öppet än/);
    await expect(main.locator(".fdd-figures, .fdd-bars")).toHaveCount(0);
    await expect(main).not.toContainText(/Baserat på|Mkr|Bolag i registret/);
  });
});

test.describe("/app/resan", () => {
  test.beforeEach(async ({ page }) => {
    await logIn(page);
  });

  test("stegen i Hem och Resan länkar till sidor som finns", async ({ page }) => {
    await page.goto("/app", { waitUntil: "networkidle" });
    await expect(page.locator("a.fdd-stepper__link")).toHaveCount(12);
    await page.locator("a.fdd-stepper__link").first().click();
    await page.waitForURL("**/app/resan/1");
    await expect(page.getByRole("link", { name: /Tillbaka till Resan/ })).toBeVisible();
  });

  test("ett ogiltigt steg ger 404", async ({ page }) => {
    const response = await page.goto("/app/resan/13");
    expect(response?.status()).toBe(404);
  });

  // PR 11: flikarna är tända. Steg 6: Pulsen också, så alla elva leder till sidor.
  test("flikarna i /app leder till sidor som finns, Pulsen också", async ({ page }) => {
    await page.goto("/app", { waitUntil: "networkidle" });
    const tabs = page.getByRole("navigation", { name: "Meny" }).locator("a");
    await expect(tabs).toHaveCount(11);
    const hrefs = await tabs.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toContain("/app/pulsen");
    for (const href of hrefs) {
      const response = await page.request.get(href!);
      expect(response.status(), `status för ${href}`).toBe(200);
    }
    await page.getByRole("navigation", { name: "Meny" }).getByRole("link", { name: "Minnet" }).click();
    await page.waitForURL("**/app/minnet");
  });
});
