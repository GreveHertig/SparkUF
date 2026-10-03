## PR 7: Validering (2026-09-30, direkt på `design/en-design`)
Sjunde steget i `docs/plan-en-design.md`. `origin/prototyp` hade inget nytt att ta in (redan sammanslagen). En commit för koden och en för docs.

### Klart
- **`screens/Validation.tsx`** är omskriven. Den gamla Tailwind-skärmen (oanvänd sedan #25) är ersatt av markupen från `app/demo/(app)/validering/page.tsx`, flyttad rakt av. Demots sida är nu en tunn hämtare utan markup.
- **`ValidationData`, platshållare per sektion.** `null` ger "Kommer snart" i just den sektionen. En tom lista eller `"notReached"` betyder att steget inte är nått än, och då döljs sektionen som i demot.
  - `rows: null` ger luckan i både nyckeltalen och kontaktlistan, eftersom båda kommer ur samma anrop. Konfidensraden under domen visas då inte.
  - `assumptions`, `responses`, `verdict` och `simulation` kan saknas var för sig. En saknad kontaktlista släcker inte domen eller antagandena.
- **`ValidationLock = { unlocksAfterStep } | "notInScenario" | null`**, samma form som `LegalLock`. Demot räknar ut den som förut: tom kontaktlista ger låst till steg 03, och Jonas får "inte i scenariot".
- **Ny rutt `/app/validering`.** Låsningen kommer ur Resans `getSteps`: sidan är låst tills steg 03 är klart, och i låst läge görs inga andra anrop. Går stegen inte att läsa (platshållarfel) visas inget låst läge, och sektionerna visar sina egna luckor. Varje anrop fångas för sig med `orNull`, och äkta fel kastas vidare.
  - Kontaktlistan kommer ur `liveOutreachProvider.getCampaign`. Den kastar `OutreachSendDisabledError` (sändspärren), så nyckeltalen och listan visar "Kommer snart".
  - Antagandena och svaren har ingen portmetod och är alltid `null`.
  - Domen hämtas med `getStepDetail(6)` när steg 06 är nått. Liveadaptern ger ingen dom, så sektionen visar "Kommer snart".
  - Simuleringen är alltid `null`, se innehållsbesluten.
- **Licensgrinden:** `/app/validering` anropar inte Registret. Ruttestet mockar `liveRegistryProvider` med stängd grind och visar att den aldrig anropas, att inga registersiffror visas och att rutten inte importerar adaptern.
- **Byggstenar:** `ExampleLabel`, `Figures`, `SimulationBlock` och `VerdictBlock` är flyttade till `screens/blocks/DataBlocks.tsx`. `DemoBlocks.tsx` exporterar dem vidare åt Marknad och Resan/steget. `ExampleLabel.test.tsx` följde med och heter nu `DataBlocks.test.tsx`.
- **Ren logik till `core/`:** `sizeClass.ts` är flyttad från `app/demo/_lib/` (Marknad pekar om). Nyckeltalen ligger i `core/validation.ts` (`outreachStats`: kontaktade utan utkast, svar, svarsfrekvens), enligt punkt 5 i planen. Svarsfrekvensen är `null` när ingen är kontaktad, aldrig 0.
- **Ny i18n-nyckel** `validationPage.simulationTitleLive` (sv/en).
- **Tester:**
  - `screens/Validation.test.tsx` är omskriven (10 tester) och täcker låst läge, nyckeltalen med källa, storleksklass i stället för exakt antal, "Kommer snart" per sektion, dolda sektioner och exempeletiketten per `dataKind`.
  - `core/validation.test.ts` (3 tester).
  - `app/(app)/app/validering/page.test.tsx` (8 tester) täcker låst läge, sändspärren, domen från steg 06, riktig kontaktlista, stängd licensgrind, okända steg, äkta fel och att inga funktioner skickas som props.
  - Två nya tester i `app/demo/demo.test.tsx`: demots moment och Jonas.
  - `/app/validering` ligger nu i `PAGES` i `e2e/app.spec.ts`.
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px). `/demo/validering` är fotograferad vid beat 0, 9, 11, 12, 14, 16, 17, 19 och 37 (låst, steg 04, 05 och alla utskicksstadier, 06, slutet) och för Jonas. `/demo` är fotograferad vid beat 0, 17 och 37 och för Jonas. Alla 28 är pixel för pixel identiska med före (AE 0).
- **Inloggat:** testkontot står på steg 01, så `/app/validering` visar "Låses upp efter steg 03" (kontrollerat med skärmbild och sidans text).
- **`/security-review`:** inga fynd. Kontrollerat: att rutten ligger under `requireUser()` i `app/(app)/layout.tsx` och att Resans adapter själv kräver en session, att ingen demodata når `/app`, licensgrinden (inget registeranrop), sändspärren (bara `getCampaign`, som kastar), att inga felmeddelanden hamnar i props, att klientkomponenterna inte importerar serverkod, och att inget renderas som HTML.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (690 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (12 av 12, mot produktionsbygget).

### Vad som inte var en ren flytt (innehållsbeslut)
- **Inget låst läge för Registret.** Planen säger att Validering läser Registret och ska få ett läge som säger "Registret är inte öppet än". Men varken demosidan, porten eller adaptrarna läser Registret för Valideringen, eftersom kontaktlistan kommer ur Utskick. Ett sådant läge hade påstått något som inte stämmer. Grinden bevisas i stället med ruttestet. Planens regel är rättad.
- **Låsningen i `/app`** använder samma gräns som demot (steg 03 klart). Tidigare hade `/app/juridik` inget låst läge, med motiveringen att Resans liveadapter var en stubbe. Men `getSteps` är byggd, och det är bara `getHomeSummary` som är en stubbe.
- **Simuleringen hämtas inte i `/app`.** `SimulationProvider.simulate` kräver en fråga. Den enda som finns (`simulationQuestions.tolerance`) är skriven för Saras byråer och ligger i demoadaptern. Hiasynth är ett koncept och liveadaptern en stubbe, så sektionen visar "Kommer snart" utan att någon fråga hittas på.
- **Simuleringens rubrik i `/app`** är "Simulering: betalningstolerans" (ny nyckel). Demots rubrik nämner byråstorlek, alltså Saras scenario.
- **Exempeletiketten** styrs nu av `dataKind` i stället för att vara hårdkodad `"example"`.
- **Utskickets period, öppningsfrekvens och källa** är `null` i `/app`. Ingen port ger dem, och öppningsspårning ingår inte i MVP:n (sändspärren).

### Genomgång av "Kända problem": Valideringens exakta anställningstal
- **Vad det gällde:** buggpunkt 13 (`docs/buggar-2026-09.md`): Validering visade exakta antal anställda ("· 18"), men registret ger bara storleksklasser. Raden står i "/app verifierat inloggat" ("hör till Valideringens migration (PR 6) och Registret") och går tillbaka till Marknad-sessionen.
- **Inom sidans ansvar, och åtgärdat.** Demots sida visade redan storleksklass sedan #25, men den gamla `screens/Validation.tsx` visade `{row.employees}` och `{response.employees}` rakt av. Efter flytten finns bara en skärm, och den visar klassen (`core/sizeClass.ts`) i både `/demo` och `/app`, i tabellen och på svarskorten. Det täcks av skärmtestet, ruttestet och demotestet. Registret behövs inte för det, eftersom klassningen görs i gränssnittet.
- **Raden är inte borttagen ur den äldre sektionen.** `.gitattributes` (`merge=union`) förutsätter att ingen redigerar en annan sessions text, så den här sektionen är beslutet. Raden säger dessutom "PR 6", men Validering är PR 7 (PR 6 är Pulsen).

### Beslut nästa session behöver känna till
- **`Validation`s props:** `{ data: ValidationData; dataKind; locked: ValidationLock }`.
- **När Utskick får en port för svar och antaganden** (i dag demohjälpare i `adapters/demo/OutreachProvider.ts`, typerna i `ports/`): fyll `assumptions` och `responses` i `/app`-rutten. Skärmen behöver inte ändras.
- **När Resans liveadapter ger en dom och `scoreDelta`** visar `/app/validering` domen utan ändring i skärmen.
- **PR 8 (Marknad)** kan använda `core/sizeClass.ts` och `Figures` och `SimulationBlock` ur `screens/blocks/DataBlocks.tsx`.

### Kända problem / docs som inte stämmer
- **Omsättningen per bolag visas exakt** ("4 200 tkr"). Den kommer ur årsredovisningar, som är offentliga, och ingen regel i docs förbjuder det. Den är inte ändrad, men nämns här om samma princip som för anställda ska gälla.
- **"Utskick" räknas som byggt** i planens lista över liveadaptrar. Det gäller förberedelsen (`OutreachPrep`). `liveOutreachProvider` kastar sändspärren för alla metoder.
- **Skärmbildsfälla:** en `next start` som lever kvar på samma port efter en ny `pnpm build` serverar trasiga sidor. Stoppa servern före nästa bygge.
