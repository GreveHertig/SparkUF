import { expect, test, type Page } from "@playwright/test";
import { sv } from "../i18n/sv";
import { en } from "../i18n/en";

// Röktester av demots huvudflöde i en riktig Next-server, på svenska och
// engelska: startsidan, demots start, onboardingen (båda ingångarna), Resan
// och språkbytet. Ingen inloggning och ingen .env.local behövs.
//
// Varje test börjar på startsidan och klickar sig fram. Inga djupa länkar
// (`page.goto("/demo/resan")`): en hård laddning av en nästlad demorutt kan
// skicka tillbaka till /demo/start (se docs/status.md, hydreringen vid hård
// sidladdning). Varje test får en ny webbläsarkontext, alltså tom
// localStorage: demot börjar om från början och språket är svenska.
//
// Texterna läses ur i18n-filerna, så testerna följer med när en text ändras.

const DICTIONARIES = { sv, en } as const;
type Locale = keyof typeof DICTIONARIES;
type Dictionary = (typeof DICTIONARIES)[Locale];

// Samtalet i onboardingen spelar upp sig självt (ungefär 2,3 sekunder per
// fråga, screens/OnboardingProfile.tsx). Ingång A har fem frågor.
const CONVERSATION_TIMEOUT = 30_000;

/** Samlar sidfel och console.error. Testet kräver att listan är tom i slutet. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    // `next dev` spelar upp serverns egna loggar i webbläsaren med en
    // "Server"-etikett. De är inte klientfel (samma undantag som app.spec.ts).
    if (message.text().startsWith("%c%s%c") && message.text().includes(" Server ")) return;
    errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

function languageSwitch(page: Page, t: Dictionary) {
  return page.getByRole("group", { name: t.common.languageSwitch.label }).first();
}

/** Byter språk med växeln på sidan och väntar tills det nya språket syns. */
async function switchLanguage(page: Page, from: Locale, to: Locale) {
  const group = languageSwitch(page, DICTIONARIES[from]);
  await group.getByRole("button", { name: DICTIONARIES[from].common.languageSwitch[to], exact: true }).click();
  const toGroup = languageSwitch(page, DICTIONARIES[to]);
  await expect(
    toGroup.getByRole("button", { name: DICTIONARIES[to].common.languageSwitch[to], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
}

/** Startsidan på valt språk. Svenska är standard; engelska väljs med växeln. */
async function openLanding(page: Page, locale: Locale) {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: sv.site.hero.titleStart })).toBeVisible();
  if (locale === "en") await switchLanguage(page, "sv", "en");
  const t = DICTIONARIES[locale];
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${t.site.hero.titleStart} ${t.site.hero.titleEm}`);
}

/** "Se demot" på startsidan leder till onboardingens val av ingång. */
async function startDemo(page: Page, t: Dictionary) {
  const demoLink = page.getByRole("link", { name: new RegExp(t.site.demoLink.label) }).first();
  await expect(demoLink).toHaveAttribute("href", "/demo");
  await demoLink.click();
  await page.waitForURL("**/demo/start");
  await expect(page.getByRole("heading", { level: 1, name: t.onboarding.entry.title })).toBeVisible();
}

/** Väntar ut profilsamtalet och går vidare till demots Hem. */
async function finishProfileConversation(page: Page, t: Dictionary) {
  await page.waitForURL("**/demo/start/profil");
  await expect(page.getByRole("heading", { level: 1, name: t.onboarding.profile.title })).toBeVisible();
  const continueLink = page.getByRole("link", { name: t.onboarding.profile.continueCta, exact: true });
  await expect(continueLink).toBeVisible({ timeout: CONVERSATION_TIMEOUT });
  await continueLink.click();
  await page.waitForURL((url) => url.pathname === "/demo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    `${t.homePage.heroHeadingBefore} ${t.homePage.heroHeadingEmphasis} ${t.homePage.heroHeadingAfter}`,
  );
}

/** Startsidan → demot → ingång A → Hem, utan djupa länkar. */
async function reachDemoHome(page: Page, locale: Locale) {
  const t = DICTIONARIES[locale];
  await openLanding(page, locale);
  await startDemo(page, t);
  await page.getByRole("link", { name: new RegExp(t.onboarding.entry.noIdea.cta) }).click();
  await finishProfileConversation(page, t);
}

function demoMenu(page: Page, t: Dictionary) {
  return page.getByRole("navigation", { name: t.site.demo.navLabel });
}

/** Resan via demomenyn: fyra faser och tolv steg. */
async function openJourney(page: Page, t: Dictionary) {
  await demoMenu(page, t).getByRole("link", { name: t.appShell.nav.journey, exact: true }).click();
  await page.waitForURL("**/demo/resan");
  await expectJourney(page, t);
}

/** Öppnar en sida via demomenyn och kontrollerar att menyn markerar den. */
async function openViaMenu(page: Page, t: Dictionary, label: string, path: string) {
  const link = demoMenu(page, t).getByRole("link", { name: label, exact: true });
  await link.click();
  await page.waitForURL(`**${path}`);
  await expect(link).toHaveAttribute("aria-current", "page");
}

/** Demoradens skärmläsartext, t.ex. "Moment 2 av 30". Antalet moment kontrolleras inte. */
function positionPattern(t: Dictionary, current: number): RegExp {
  const escaped = t.site.demo.bar.position.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace("{current}", String(current)).replace("{total}", "\\d+"));
}

async function expectJourney(page: Page, t: Dictionary) {
  await expect(demoMenu(page, t).getByRole("link", { name: t.appShell.nav.journey, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const phases = page.locator("main").getByRole("heading", { level: 2 });
  await expect(phases).toHaveText(Object.values(t.journeyPage.phaseNames));
  await expect(page.locator("main a.fdd-stepcard")).toHaveCount(12);
  await expect(page.locator("main a.fdd-stepcard").first()).toHaveAttribute("href", "/demo/resan/1");
}

for (const locale of ["sv", "en"] as const) {
  const t = DICTIONARIES[locale];

  test.describe(`demot på ${locale}`, () => {
    test("ingång A: startsidan, profilsamtalet, Hem och Resan", async ({ page }) => {
      const errors = collectErrors(page);

      await reachDemoHome(page, locale);
      await openJourney(page, t);

      expect(errors).toEqual([]);
    });

    test("ingång B: idégenomlysningen, profilsamtalet och Hem", async ({ page }) => {
      const errors = collectErrors(page);

      await openLanding(page, locale);
      await startDemo(page, t);
      await page.getByRole("link", { name: new RegExp(t.onboarding.entry.hasIdea.cta) }).click();
      await page.waitForURL("**/demo/start/ide");
      await expect(page.getByRole("heading", { level: 1, name: t.onboarding.idea.title })).toBeVisible();
      await expect(page.getByRole("heading", { name: t.onboarding.idea.weaknessTitle })).toBeVisible();
      await page.getByRole("link", { name: t.onboarding.idea.continueCta }).click();
      await finishProfileConversation(page, t);

      expect(errors).toEqual([]);
    });

    test("Poäng och Marknad via menyn, och demoraden låser upp Marknad", async ({ page }) => {
      const errors = collectErrors(page);
      await reachDemoHome(page, locale);

      // Poäng: nedbrytningen finns, och menyn markerar sidan.
      await openViaMenu(page, t, t.appShell.nav.score, "/demo/poang");
      await expect(page.locator("main").getByRole("heading", { level: 2, name: t.scorePage.breakdownTitle })).toBeVisible();

      // Marknad är låst till efter steg 02 i början av Saras resa.
      await openViaMenu(page, t, t.appShell.nav.market, "/demo/marknad");
      await expect(page.getByRole("heading", { level: 1, name: t.marketPage.title })).toBeVisible();
      await expect(page.locator("main")).toContainText(`${t.homePage.unlocksAfterStepBefore} 02`);
      await expect(page.locator("main").getByRole("heading", { name: t.marketPage.kpiTitleExample })).toHaveCount(0);

      // Demoraden: "Nästa" flyttar fram ett moment.
      const bar = page.getByRole("region", { name: t.site.demo.bar.label });
      await expect(bar).toContainText(positionPattern(t, 1));
      await bar.getByRole("button", { name: t.site.demo.bar.next }).click();
      await expect(bar).toContainText(positionPattern(t, 2));

      // "Hoppa till steg" till steg 03 låser upp Marknad utan att lämna sidan.
      await bar.getByRole("button", { name: t.demoBar.jumpToStep }).click();
      await page.locator(".fdd-jump__item").filter({ has: page.locator(".fdd-jump__step", { hasText: /^03$/ }) }).first().click();
      await expect(bar).toContainText(`${t.demoBar.stepLabel} 03`);
      expect(new URL(page.url()).pathname).toBe("/demo/marknad");
      await expect(page.locator("main").getByRole("heading", { level: 2, name: t.marketPage.kpiTitleExample })).toBeVisible();
      await expect(page.locator("main")).not.toContainText(`${t.homePage.unlocksAfterStepBefore} 02`);

      expect(errors).toEqual([]);
    });
  });
}

test.describe("språkbyte i demot", () => {
  test("växeln översätter Resan direkt, och språket följer med i menyn", async ({ page }) => {
    const errors = collectErrors(page);

    await reachDemoHome(page, "sv");
    await openJourney(page, sv);

    await switchLanguage(page, "sv", "en");
    await page.waitForURL("**/demo/resan");
    await expectJourney(page, en);

    // Språket sparas: Hem via menyn är fortfarande på engelska.
    await demoMenu(page, en).getByRole("link", { name: en.appShell.nav.home, exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/demo");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${en.homePage.heroHeadingBefore} ${en.homePage.heroHeadingEmphasis} ${en.homePage.heroHeadingAfter}`,
    );

    // Och tillbaka till svenska.
    await switchLanguage(page, "en", "sv");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${sv.homePage.heroHeadingBefore} ${sv.homePage.heroHeadingEmphasis} ${sv.homePage.heroHeadingAfter}`,
    );

    expect(errors).toEqual([]);
  });

  test("språket från startsidan följer med in i onboardingen", async ({ page }) => {
    const errors = collectErrors(page);

    await openLanding(page, "en");
    await startDemo(page, en);
    await expect(languageSwitch(page, en).getByRole("button", { name: en.common.languageSwitch.en, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // Byte mitt i onboardingen översätter valet av ingång direkt.
    await switchLanguage(page, "en", "sv");
    await expect(page.getByRole("heading", { level: 1, name: sv.onboarding.entry.title })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(sv.onboarding.entry.noIdea.cta) })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
