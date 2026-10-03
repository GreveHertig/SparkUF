## E2E-röktester för demots huvudflöde (2026-10-02, gren `bakgrund/e2e-demoflode`, PR mot `prototyp`)
Bakgrundsjobb (session 2). Bara `e2e/`, `playwright.config.ts` och den här filen är ändrade.

### Klart
- **Nya `e2e/demo.spec.ts`:** åtta tester per projekt (desktop och mobil), alltså 16 körningar. Sex fanns i första versionen, och tillägget nedan lade till två.
  - Ingång A på sv och en: startsidan, "Se demot", valet av ingång, profilsamtalet, Hem och Resan via demomenyn (fyra faser, tolv stegkort, menyn markerar Resan).
  - Ingång B på sv och en: idégenomlysningen, profilsamtalet och Hem.
  - Språkbyte: Resan översätts direkt när man byter språk, språket ligger kvar på Hem och går att byta tillbaka. Ett språk som valts på startsidan gäller också i onboardingen, och ett byte där översätter valet av ingång.
  - Varje test kräver att inga sidfel och inga `console.error` uppstår.
- **Tillägg samma dag:** två tester till, ett per språk, alltså åtta per projekt och 16 körningar totalt. Det besöker Poäng och Marknad via menyn. Marknad är låst till efter steg 02, demoradens "Nästa" flyttar fram ett moment, och "Hoppa till steg" till steg 03 låser upp Marknad utan att lämna sidan. Stabilitet: 48 av 48 gröna med `--repeat-each=3 --workers=2`.
- **Inga djupa länkar.** Varje test börjar på `/` och klickar sig fram, så den kända hydreringen vid hård sidladdning av nästlade demorutter undviks.
- **Texterna läses ur `i18n/sv.ts` och `i18n/en.ts`.** Ingen text är hårdkodad i testerna.
- **`playwright.config.ts`:** servern startas nu alltid, inte bara när det finns ett testkonto.
  - Med Supabase-variablerna körs `pnpm build && pnpm start`, som förut.
  - Utan dem körs `pnpm dev`. `pnpm build` kräver Supabase-variablerna, och demot behöver dem inte.
  - Servern räknas som klar när `/` svarar (tidigare `/logga-in`).
  - `E2E_BASE_URL` gäller som förut.
  - `e2e/app.spec.ts` är orörd och hoppas fortfarande över utan testkonto.
- **Stabilitet:** 48 av 48 gröna med `--repeat-each=4 --workers=2` mot en produktionsserver, och 12 av 12 gröna via `pnpm dev`. Varje test får en ny webbläsarkontext, så demot och språket börjar alltid från början.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (1208 gröna, 42 skippade) och `pnpm build`. Bygget kördes med platshållare för de två publika Supabase-variablerna i skalet, eftersom molnsessionen inte har någon `.env.local`.

### Kända problem
- **Profilsamtalet tar cirka 12 sekunder i ingång A**, eftersom det spelar upp sig självt med timers i `screens/OnboardingProfile.tsx`. Testerna väntar upp till 30 sekunder och använder inga fasta pauser.
- **Hydreringen vid hård sidladdning är inte omprövad.** Testerna går runt den och visar inte om den finns kvar.
- **Webbläsaren i molnmiljön matchar inte Playwright 1.63.** Den förinstallerade Chromium är build 1194, men 1.63 vill ha 1243. Testerna kördes här via en symlänk i `PLAYWRIGHT_BROWSERS_PATH` (scratchpad, inte committad). Lokalt räcker `pnpm exec playwright install chromium`.
- **Fynd utanför uppgiften, inte rättade:**
  - `<html lang="sv">` i `app/layout.tsx` är fast och ändras inte när man väljer engelska.
  - Profilsamtalets underrubrik säger "Klicka på svaret för att gå vidare" (`onboarding.profile.subtitle`), men samtalet går vidare av sig självt och det finns inget att klicka på.

### Beslut (session 2, utan tillsyn)
- Engelska väljs med växeln på startsidan, inte genom att skriva till localStorage. Det är så en besökare gör, och det testar växeln.
- Testerna kontrollerar struktur och översatta rubriker: fyra faser, tolv steg, rubriker ur i18n. Personans data (namn, siffror) kontrolleras inte, så att en ändrad demodata inte fäller testerna.
- `pnpm dev` används som reserv när Supabase-variablerna saknas, i stället för platshållare i konfigurationen. Då skapas aldrig ett bygge med falska värden som någon senare kan starta av misstag.

### Beslut (Theo 2026-10-02)
- Reserven till `pnpm dev` i `playwright.config.ts` behålls. `pnpm test:e2e` får inte kräva `.env.local`, eftersom Bruno och Oskar inte har några nycklar. Demotesterna ska gå att köra utan nycklar. Testerna av `/app` hoppas över tills ett testkonto finns.

### Återstår
- Fler demoytor i e2e: Medgrundaren, Validering, Pulsen, Minnet, Juridik, Bygg, Affärsplanen, och demoradens "Byt ingång" och "Börja om".
- Om CI sätts upp (Eriks beslut) kan `pnpm test:e2e` köras där utan hemligheter. Demotesterna kräver inga.
