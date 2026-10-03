import { expect, test, type Page } from "@playwright/test";

// Onboardingen enligt spec v4 §4, från inloggning till Minnet: kärnfrågorna
// (val), startkortet, "Till appen" och Återstår i Minnet. Kräver ett eget
// testkonto som INTE är klart med onboardingen och inte har något aktivt
// projekt (ingång A). Onboardingen går inte att göra om, så kontot måste
// återställas i SQL Editor före varje körning:
//   update public.profiles
//     set onboarding_entry = null, onboarding_completed_at = null,
//         onboarding_version = null, onboarding_answers = '{}'::jsonb
//     where user_id = '<kontots id>';
// Är kontot redan klart hoppas testet över, med samma hänvisning.

const email = process.env.APP_ONBOARDING_USER_EMAIL;
const password = process.env.APP_ONBOARDING_USER_PASSWORD;

test.skip(!email || !password, "APP_ONBOARDING_USER_EMAIL/APP_ONBOARDING_USER_PASSWORD saknas i .env.local (se .env.example).");
// Ett konto, ett flöde: kör bara i ett projekt, annars krockar körningarna.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 800, "Onboardingflödet körs bara i desktop-projektet (ett konto).");

async function logIn(page: Page) {
  await page.goto("/logga-in");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => url.pathname.startsWith("/app") || url.pathname.startsWith("/start"));
}

test("kärnfrågor, startkort, Till appen och Återstår i Minnet", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  await logIn(page);
  await page.goto("/start/profil", { waitUntil: "networkidle" });
  test.skip(
    new URL(page.url()).pathname.startsWith("/app"),
    "Testkontot är redan klart med onboardingen. Återställ det i SQL Editor (se filhuvudet).",
  );

  await expect(page.getByRole("heading", { level: 1, name: "Berätta om dig" })).toBeVisible();
  await expect(page.getByText("Fråga 1 av 4")).toBeVisible();

  // Fyra val. Varje svar sparas direkt, och nästa fråga kommer efter sparandet.
  await page.getByRole("button", { name: "Jobbar" }).click();
  await expect(page.getByText("Fråga 2 av 4")).toBeVisible();
  await page.getByRole("button", { name: "3–6 timmar" }).click();
  await expect(page.getByText("Fråga 3 av 4")).toBeVisible();

  // Avbryt och fortsätt: svaren står kvar efter en omladdning.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Fråga 3 av 4")).toBeVisible();

  await page.getByRole("button", { name: "Inget" }).click();
  await expect(page.getByText("Fråga 4 av 4")).toBeVisible();
  await page.getByRole("button", { name: "Nej" }).click();

  // Startkortet, byggt bara på svaren.
  await expect(page.getByRole("heading", { name: "Din startram" })).toBeVisible();
  await expect(page.getByText("39–78 timmar")).toBeVisible();
  await expect(page.getByText("Din första uppgift")).toBeVisible();
  await expect(page.getByText("3 frågor återstår.", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Till appen" }).click();
  await page.waitForURL((url) => url.pathname === "/app");

  // /start är stängt efteråt.
  await page.goto("/start/profil");
  await page.waitForURL((url) => url.pathname === "/app");

  // Minnet: svaren med etiketter och de tre återstående frågorna.
  await page.goto("/app/minnet", { waitUntil: "networkidle" });
  const answers = page.getByRole("region", { name: "Dina svar" });
  await expect(answers).toContainText("Jobbar");
  await expect(answers).toContainText("3–6 timmar");
  const remaining = page.getByRole("region", { name: "Återstår" });
  await expect(remaining.getByRole("group")).toHaveCount(3);

  // Ett svar under Återstår flyttar frågan till Dina svar.
  await remaining.getByRole("button", { name: "Ja" }).click();
  await expect(remaining.getByRole("group")).toHaveCount(2);
  await expect(answers).toContainText("Känner du någon som driver ett företag");

  expect(errors).toEqual([]);
});
