## PR 11: Onboarding, städning, flikarna och exempelkällorna (2026-09-30, direkt på `design/en-design`)
Elfte och sista steget i `docs/plan-en-design.md`. `origin/prototyp` fanns redan i grenen. Fyra kodcommits och docs: onboardingen (`744bcf9`), städningen (`a92e613`), flikarna (`6d8674b`) och exempelkällorna (`36c838c`, egen commit så att den kan granskas och backas för sig). **Migrationen är klar**, utom Pulsen (steg 6, Bruno).

### Klart
- **Onboardingen:** `screens/OnboardingEntry`, `OnboardingIdea` och `OnboardingProfile` är ersatta av markupen från `/demo/start`, `/demo/start/ide` och `/demo/start/profil`, flyttad rakt av.
  - Props: `OnboardingEntry({ basePath, onChoose? })`, `OnboardingIdea({ data: { screening }, continueHref })`, `OnboardingProfile({ data: { script }, continueHref, onContinue? })`.
  - Demots tre sidor är tunna hämtare.
  - `/start` använder samma skärmar och demots stil (`site.css`, `DemoTopBar dataKind="live"` med utloggning). `requireUser()` står kvar i layouten.
  - Platshållare per sektion: Projekt och Profil är stubbar, så idégenomlysningens fem sektioner och samtalets två delar visar "Kommer snart" var för sig. Alla sektioner kommer ur samma anrop och saknas därför tillsammans. Demots data används aldrig.
- **Städningen.** Kontrollerat med grep att inget importerade dem innan de togs bort:
  - `components/spark`: `ChatMessage`, `DemoBar`, `JourneyRail`, `KpiRow`, `KpiTile`, `LegalMap`, `NavIcon`, `PromptBox`, `ScorePanel`, `ScoreRing`, `SidebarRestart`, `SimulationCard`, `SuggestionList`, `TimeSkip`, `ToolRunCard`, `TourOverlay` (med test)
  - `components/ui`: `BarChart`, `Card`, `Sparkline`
  - `journeyStepPath` i `app/demo/_lib/paths.ts`
  - i18n-nycklar som bara de använde: `appShell.profileMenuLabel`/`tagline`/`restartDemo`, `journeyPage.openStep`, `demoBar.phaseLabel` och onboardingens tre `eyebrow`
  - `DemoBlocks.tsx` exporterar bara `PageHead`, åt demots Pulsen-sida.
- **Fonda-namnen i koden är borta:** `DEMO_PATHS`, `DEMO_BASE`, `DemoBar`, `DemoTour`, `toDemoPath`, `demoTourCopy`, `DEMO_HREF`, `PRIVACY_HREF`, `TOUR_TITLES`/`TOUR_BODIES` och `DemoXxxPage`/`DemoLayout`. `fondaDemoIsolation.ts` är borttagen.
- **Demots läge** sparas under `spark:demo` (`adapters/demo/demoStore.ts`, `DEMO_STATE_KEY`).
  - Hur det läses in: `skipHydration`. Demots layout anropar `hydrateDemoStore()` och renderar först när `useDemoStoreHydrated()` är sant, samma tomma skal på servern som förut.
  - Gamla lägen: `spark:fonda-demo-state` flyttas en gång till `spark:demo` och tas bort (en nyare `spark:demo` skrivs aldrig över). Det gamla demots `spark:demo-state` läses aldrig.
  - Trasiga lägen: lagringen fångar trasig JSON och blockerad lagring. `sanitizePersisted` behåller bara fält med rätt typ, begränsar `beatIndex` och `tourStepIndex` och slår av en rundtur utan giltigt stopp eller i Jonas scenario. Ett trasigt läge ger utgångsläget, aldrig ett fel. Provat i webbläsaren med gammal nyckel, trasig JSON och fel typer: inga sidfel.
- **Flikarna i `/app`** länkar till sina sidor. `AppShell` fick `unavailableTabs`. `/app` skickar `["pulsen"]` (`UNAVAILABLE_TABS` i `app/(app)/layout.tsx`), så Pulsen är inaktiv. **Tänd Pulsen när Bruno har byggt `/app/pulsen`:** ta bort `"pulsen"` ur listan och rätta testerna (`app/(app)/layout.test.tsx`, e2e "flikarna i /app …", 10 → 11 länkar).
- **Exempelkällorna** (del 4, beslut av grundaren):
  - Ny datatyp `"example"` i `design/tokens.ts`. `SourceTag` visar den med etiketten "Exempel ·" först och fiktionsmärkets streckade kant, aldrig registrets grå.
  - `adapters/demo/exampleSource.ts` ger källan "Påhittad data, steg 04" ("Made-up data, step 04"), "…, idégenomlysningen" eller "…, Höj din poäng". Datumet är scenariots datum för steget.
  - **Affärsplanen:** dessa påståenden är tillbaka, med exempelkälla i stället för lånad källa:
    - stegens höjdpunkter (steg 01, 02, 04, 07, 08, 11, 12)
    - stegets dom utan utskick
    - den skarpare idén och Jonas antaganden
    - konkurrenternas beskrivningar
    - förslagens förklaringar i Riskerna
  - **Färdighetsgraden** är densamma som före PR 10 i varje fotograferat moment: Sara 2, 3, 5, 6, 6, 8 av 9 och Jonas 1, 2, 2, 4 av 9. Den enda statusskillnaden mot före PR 10 är Jonas "Kunden och problemet", som är tunt i stället för saknas. Steg 04:s kundprofil krävde tidigare Registret, som Jonas inte har.
  - **Marknad:** `MarketData.competitorsSource` (valfri), satt av demot till "Påhittad data, steg 03".
  - **Bygg:** `BuildData.creditsSource` (valfri), satt av demot till "Påhittad data, steg 10", steget där bygget körs.
  - **Medgrundaren:** `CofounderMoment.itemSources` och `CofounderContextItem.source` (valfria). Demot sätter en exempelkälla på bubblor, verktygskörningar och rader i "Sedan tidigare" som innehåller en siffra. Stegnummer ("steg 06") räknas inte som siffror.
  - **Buggen i luckan:** `BusinessPlanData.completedStepNumbers`. En lucka från ett klart steg säger "Steg N är klart, men gav inget underlag med källa till det här avsnittet." i stället för "Underlag saknas — kommer från steg N". Demot skickar de klara stegen, `/app` inga.
  - **I `/app`** sätts ingen exempelkälla. Vakttestet `app/(app)/app/noExampleSources.test.ts` går igenom `app/(app)`, `app/start`, `adapters/live` och `lib/server`. Ruttesterna för Marknad och Bygg kontrollerar att ingen "Exempel"-tagg syns.
- **Tester:**
  - skärmtester för onboardingen (3 filer, ett nytt fall var) och `AppShell` (1 nytt), plus 2 nya i `BusinessPlan.test.tsx`
  - ruttester: `app/start/start.test.tsx` (9) och de uppdaterade för layouten, Marknad och Bygg
  - `adapters/demo/demoStore.test.ts` (11) och `adapters/demo/businessPlan.test.ts` (9, omskriven: exempel bara med exempelkälla, aldrig registrets eller en poängdels)
  - 7 nya i `app/demo/demo.test.tsx`
  - e2e: `/start`, `/start/ide` och `/start/profil` i `PAGES`, plus "flikarna i /app leder till sidor som finns, och Pulsen är inaktiv"
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px). Sara vid beat 0, 9, 17, 25 och 37 och Jonas vid 0 och 12, 80 bilder av `/demo`, `/demo/start`, `/demo/start/ide`, `/demo/start/profil`, `/demo/affarsplan`, `/demo/marknad`, `/demo/bygg` och `/demo/medgrundaren`:
  - efter del 1–3: alla 80 identiska med före (AE 0)
  - efter del 4: `/demo`, `/demo/start`, idégenomlysningen och profilsamtalet fortfarande identiska i alla lägen. Skiljer sig gör bara det del 4 ändrar: affärsplanen (alla 14), Marknad från steg 03 (8), Bygg när credits finns (4) och Medgrundaren där "Sedan tidigare" har siffror (10).
- **Inloggat:** `/start/ide` visar demots stil med "Kommer snart" i varje sektion. `/app` har tio länkade flikar och Pulsen inaktiv.
- **`/security-review`:** inga fynd. Kontrollerat:
  - att `/start` och `/app` fortfarande kräver `requireUser()`
  - att inga demoadaptrar eller exempelkällor används i `/start` och `/app`
  - att inget renderas som HTML och att inga nya `NEXT_PUBLIC_`-variabler finns
  - att det sparade läget bara kan ge kända fält med rätt typ
  - att länkarna byggs av fasta värden och att inga funktioner skickas från servern
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (828 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (42 av 42 mot produktionsbygget).

### Vad som står kvar, och varför
- **`/designsystem`** (Session 1) är den enda som använder `NextStepCard`, `ScoreBadge`, `VerdictCard`, `DataFact`, `DemoDataBadge` och `LockedState`, och den visar det gamla designsystemet. Den togs inte bort, eftersom den är en sida och inte en oanvänd fil. Om den ska tas bort eller skrivas om är ett eget beslut.
- **`PulseCard`**, `Eyebrow` och `EditorialHeading` används av `screens/Pulse.tsx` (Brunos), `ComingSoon`, inloggningen och `/priser`.
- **Klassprefixen `.fd`/`.fdd`** och rundturens gamla rutter i `adapters/demo/tourSteps.ts` (`/demo/app/…`, översatta av `toDemoPath`) är kvar. De syns inte och ingen annan kod är beroende av namnen.
- **Kommentarer om "det riktiga demot"** i `DemoBar.tsx`, `DemoTour.tsx` och `app/demo/(app)/layout.tsx` beskriver det gamla demot. Det är historik och rörs inte här.
- **Fonda i docs** (`docs/uppdrag.md`, `DESIGN.md`, `design-referens/fonda/`) handlar om designinspirationen, inte om koden.

### Beslut nästa session behöver känna till
- **Exempelkällor finns bara i demot.** En live-hopsamling för affärsplanen, eller en `/app`-sida, använder aldrig `exampleSource` eller datatypen `"example"`. Saknas verkligt underlag visas luckan. Vakttestet blir rött annars.
- **Exempelkällans namn** börjar alltid med "Påhittad data," / "Made-up data,". Testerna i `adapters/demo/businessPlan.test.ts` och `app/demo/demo.test.tsx` bygger på det.
- **Pulsen:** se ovan om att tända fliken.

### Återstår innan migrationen kan kallas helt klar
- **Pulsen** (steg 6, Bruno): `screens/Pulse.tsx` i demots stil, demots sida som tunn hämtare, `/app/pulsen`, fliken tänd. Därefter kan `DemoBlocks.tsx` och troligen `PulseCard` tas bort.
- **Val av bolagsform och bransch** i `/app` finns fortfarande bara i adressen (se beslut 5 i planen).

### Kända problem
- **Credits i `/app`:** om Byggs liveadapter en dag ger `creditsUsed` visas talet utan källa, eftersom porten inte bär någon. Porten behöver en källa, eller så ska talet inte visas.
- **Konkurrenternas beskrivningar i `/app`** kommer ur Registret och visas utan egen tagg. Sektionens registerkälla står i nyckeltalen.
- **Skärmbildsfällan:** `kill` via `pgrep -f "next…"` i samma skal dödar skalet självt (exit 144). Hitta pid med `ss -ltnp | grep :PORT` i stället.
