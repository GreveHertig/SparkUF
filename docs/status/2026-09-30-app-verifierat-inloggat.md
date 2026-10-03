## /app verifierat inloggat (2026-09-30, direkt på `design/en-design`)
Första gången `/app` kördes inloggad på riktigt: testkontot finns i Supabase (`APP_TEST_USER_EMAIL`/`APP_TEST_USER_PASSWORD`, bara i `.env.local`, namnen i `.env.example`). `.env.local` stod redan i `.gitignore` (kontrollerat med `git check-ignore`).

### Så såg `/app` ut inloggat (före fixarna)
Playwright, 1440 och 390 px, mot både `pnpm dev` och `pnpm build && pnpm start`:
- **`/app` Hem: 500.** Den misstänkta buggen från PR 3 är **bekräftad**. Next kastar "Functions cannot be passed directly to Client Components … `journeyStepHref={function journeyStepHref}`", i serverloggen och i webbläsaren.
- **`/app/juridik?bolagsform=…`: 500.** Miljön saknar `GEMINI_API_KEY`, och `LegalAdvisorError` kastades vidare som en helsideskrasch.
- **Hem efter första fixen, bara i produktionsbygget:** tolv länkar till `/app/resan/1–12`. Sidorna finns inte, så Next förhämtade alla tolv, fick 404 och blev hängande (sidan nådde aldrig `networkidle`). `pnpm dev` visade inte felet, `pnpm start` gjorde det.
- **Fungerade:** `/app/poang`, `/app/minnet` och `/app/juridik` utan val gav 200. Skalet fungerar: "Poäng —" (luckan, ingen nolla), "Steg 01 av 12 · Om dig" (Resans `getSteps` svarar på riktigt), profilen "—", Logga ut. Sidorna visar "Kommer snart" där adaptrarna är stubbar eller kontot är tomt. Pulsen visar "Ingen signal än."

### Klart
- **Hem lagad:** `AppHome` tar `journeyBasePath: string | null` i stället för funktionen `journeyStepHref`, samma mönster som `Legal`s `basePath`. Demot skickar `FONDA_DEMO_PATHS.journey`, så länkarna blir desamma som förut. `/app` skickar `null` tills Resans sidor finns (PR 9): stegen visas då utan länk (`<span class="fdd-stepper__link">`) i stället för tolv länkar till 404. Hover-ringen gäller bara `a.fdd-stepper__link`, så en icke-länk ser inte klickbar ut.
- **Gemini-cache på `/app/juridik`:** `app/(app)/app/juridik/legalMapCache.ts` lägger `unstable_cache` runt `liveLegalAdvisor.getLegalMap`, i rutten. Eriks adapter rörs inte.
  - **Cachetid 7 dygn.** Fakta i kartan (myndighet, källa, datum) kommer ur den kuraterade koden, aldrig ur modellen; Gemini skriver bara rubrik och beskrivning. Svaret beror bara på bolagsformen, inte på användaren, så det blir fyra delade poster. Juridisk information av det här slaget ändras sällan, och när den kuraterade koden ändras byts nyckeln: fingeravtrycket av `KURERADE_KÄLLOR` och `LEGAL_TOPICS` ingår, så en ändrad källa används direkt även om `unstable_cache` annars överlever en ny driftsättning. Fel cachas inte. Taggen `legal-map` kan tömmas med `revalidateTag`.
  - **Varför inte `"use cache"`:** det kräver `cacheComponents: true` för hela appen, en global ändring som rör allas sidor. `unstable_cache` fungerar i Next 16 men är ersatt av `"use cache"`. Byt när appen går över till Cache Components.
- **Juridik kraschar inte längre när Gemini fallerar.** `LegalAdvisorError` loggas på servern, och kartans ruta visar "Kartan kunde inte hämtas just nu. Försök igen om en stund." (`legalPage.loadFailed`, sv/en, `role="alert"`). Feltexten visas aldrig. Andra fel kastas vidare. Ansvarsbegränsningen visas fortfarande. PR 5 hade valt att kasta vidare; det här ändrar det beslutet.
- **Inloggat e2e-test:** `@playwright/test` (devDependency), `playwright.config.ts` och `e2e/app.spec.ts`, körs med `pnpm test:e2e`.
  - Testet loggar in med testkontot, öppnar Hem, Poäng, Minnet, Juridik och Juridik med vald bolagsform i 1440 och 390 px, och kräver 200, rätt `h1`, Logga ut, inga `pageerror` och inga `console.error`.
  - Utan `E2E_BASE_URL` bygger och startar testet en egen produktionsserver på port 3300 (det var den som hittade 404-felet); med `E2E_BASE_URL` körs det mot en server som redan är igång.
  - Saknas testkontot hoppas testerna över. Vitest exkluderar `e2e/`.
  - **Bevisat att testet fångar buggen:** en funktion-prop återinfördes tillfälligt i `/app` Hem, och testet föll med status 500.
  - Dessutom ett billigt vakttest i `app/(app)/app/page.test.tsx`: Hems rutt skickar inga funktioner som props till `AppHome`.
- **Skärmbilder efter fixarna** (produktionsbygget, 1440 och 390 px): alla fem sidor ger 200 utan 404 eller hängande förfrågningar. Juridik med val visar felrutan (ingen nyckel här).
- **`/security-review`:** inga fynd. Kontrollerat: den delade cachen (vitlistad nyckel, ingen session i det cachade anropet), att felet aldrig når klienten, att inga inloggningsuppgifter finns i spårade filer, och licensgrinden: ingen `/app`-sida använder `RegistryProvider`.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (674 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (10 av 10, mot både `pnpm dev` och `pnpm start`).

### Genomgång av "Kända problem"
**Åtgärdat i den här sessionen:**
- **PR 5, felet i Hem:** bekräftat och lagat (se ovan).
- **PR 5, ett Gemini-anrop per sidladdning:** cachat i 7 dygn.
- **PR 4 och PR 5, `/app` inte fotograferat:** fotograferat och täckt av e2e-testet.

**Redan lösta, ingen ändring behövdes:**
- **PR 4, `uppdrag.md` och `CLAUDE.md`:** rättades i PR 5.
- **PR 4, "Nuläge" i `plan-en-design.md`:** rättades i PR 5.
- **PR 5, "Tre av åtta":** rättat 2026-09-30 i Juridik-sektionen.
- **Tokenbytet, mappen `design/fonts/jetbrains-mono/`:** finns inte längre.
- **Session 2, "−0" i Poängrörelse-kortet:** `AppHome` är omskriven sedan dess (PR 3).

**Lämnas kvar:**
- **Juridik bara på svenska:** `getLegalMap` tar inget `locale`. Oskars ärende i Juridik-modulen.
- **Pulsen gör Hem långsamt första gången varje dag:** att strömma Pulsen med Suspense är ett eget beslut (Pulsen-sektionen). Ingen försening syntes här, eftersom testkontot inte har någon idé att söka på.
- **Flikarna i `/app` är inerta:** tänds när sidorna finns (PR 4:s beslut). Bara Hem länkar, därför ser Hem ut som vald på alla sidor.
- **Registrets, Utskicks, Domens, Dataspikens och SCB-spårets punkter:** andras moduler.
- **Demots luckor** (Jonas resa, byte av ingång, rundturens rutor, hydreringen vid hård sidladdning): demots ägare, utanför `/app`.
- **`rls.live.test.ts` kan inte köras:** kräver två testkonton (A och B). Bara ett finns.
- **`pnpm build` utan `.env.local`:** kräver Supabase-variablerna. Inte undersökt här.
- **Gamla cachar i `.next/`:** inget fel i koden, se respektive sektion.

### Går fortfarande inte att verifiera
- **Juridik-kartan med riktig Gemini-data:** ingen `GEMINI_API_KEY` i den här miljön. Därför är inte heller cachens träff i produktion sedd (koden och testet med mockar är det).
- **Sidor med riktig data:** testkontot är tomt, så alla sektioner som kräver bevis, profil eller Hjärna visar sina tomlägen. Att spara Hjärnan (Server Action) är inte klickat igenom inloggat.
- **Demots skärmbilder är inte omtagna pixel för pixel.** Demots markup är oförändrad (samma länk, samma barn) och hover-ändringen gäller bara `a.fdd-stepper__link`. Det är täckt av `app/demo/demo.test.tsx` och `screens/AppHome.test.tsx`.

### Beslut nästa session behöver känna till
- **`AppHome`s props:** `{ data; dataKind; onNextStep?; journeyBasePath: string | null; scoreHref }`.
- **Skärmar får bara serialiserbara props från `/app`-rutterna.** E2e-testet fångar det nu. Kör `pnpm test:e2e` när en `/app`-sida ändras.
- **Nya `/app`-sidor läggs till i `PAGES` i `e2e/app.spec.ts`.**
- **När Resans sidor finns i `/app` (PR 9):** skicka `journeyBasePath="/app/resan"`.
