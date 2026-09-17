# Status — Spark UF-prototypen

Uppdateras i slutet av varje session: klart, återstår, kända problem, beslut nästa session behöver känna till.

## Verkliga sökvägar (logiska `src/`-vägar i docs/uppdrag.md → faktiska vägar i repot)
Repot har inget `src/`-prefix. Kartan:

| Logisk väg (uppdraget) | Verklig väg |
|---|---|
| `src/design/` | `design/` |
| `src/components/ui/` | `components/ui/` |
| `src/components/spark/` | `components/spark/` |
| `src/demo/` | `adapters/demo/` (scenariodata) + `app/demo/` (routes) — se Session A |
| `src/score/` | `score/` *(bara `levels.ts` hittills — se nedan)* |
| `src/i18n/` | `i18n/` |
| `core/`, `ports/`, `adapters/demo/`, `adapters/live/`, `screens/` | Matchar avsnitt 14.2 rakt av, inget `src/`-prefix. Se `docs/arkitektur.md`. |

Sedan tidigare (fanns innan sessionerna startade, inte skapade av Session 1): `types/{evidence,legal,bygg}.ts`, `lib/schemas/evidence.ts`, `lib/demo-data/mock.ts`, platshållarsidorna `app/(marketing)/page.tsx`, `app/demo/page.tsx`, `app/(app)/app/page.tsx`.

## Session 1 — Grund och designsystem (klar)

### Klart
- **Tokens:** `design/tokens.css` (CSS-variabler, källan) + `design/tokens.ts` (samma värden typat för JS/SVG). Färgskalor (slate 50–950, accent 50–900), poängnivåtoner, datatypstoner, spacing, radier, rörelsetokens (respekterar `prefers-reduced-motion`).
- **Typsnitt:** Manrope (variabel 400–800) + Instrument Serif Italic, självhostade `.woff2`-filer i `design/fonts/`, laddade via `next/font/local` i `design/fonts.ts`. Verifierat i kompilerad CSS: inga anrop till Google Fonts, varken vid `next build` eller `next dev`.
- **Loggan:** `components/ui/Logo.tsx` — ordmärket spårat ur `public/brand/spark-logo.png` med `potrace` till en inbäddad SVG-path (ingen originalvektor fanns, se `DESIGN.md` för de två tidigare försök som inte höll). Två toner via prop, `fill="currentColor"`, ingen extern bildresurs. **TODO i koden:** ersätt med grundarnas original-SVG när den finns.
- **i18n:** `i18n/dictionary.ts` (typad form), `sv.ts` + `en.ts` (båda `satisfies Dictionary`), `i18n/context.tsx` (`LocaleProvider`/`useI18n`, sparar val i `localStorage` via `useSyncExternalStore`), `i18n/format.ts` (`Intl`-formatering av belopp/datum), `components/ui/LanguageSwitch.tsx`.
- **Score-nivåer:** `score/levels.ts` — den visuella tabellen från uppdrag 7.5 (tröskel → ton → i18n-nyckel). Inte `calculateScore` — det byggs i Session 2 och bör återanvända den här filen.
- **Elva grundkomponenter**, alla i `/designsystem`:
  - `components/ui/`: Eyebrow, EditorialHeading (+ `.Em`), SourceTag, DataFact, ConceptBadge, DemoDataBadge, LockedState (+ LanguageSwitch, Logo som extra byggblock)
  - `components/spark/`: ScoreBadge, VerdictCard, NextStepCard, PulseCard
- **`/designsystem`** (`app/designsystem/page.tsx`): färgskalor, typspecimen, spacing/radie/rörelseskala, alla elva komponenter i sina tillstånd, med en fungerande live SV/EN-växel.
- **Nya beroenden:** `@radix-ui/react-popover`, `framer-motion`. Dev: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`. `@types/node` uppgraderad `^20` → `^22` (vitest 5 kräver det som peer dependency).
- **Nya npm-scripts:** `typecheck` (`tsc --noEmit`), `test` (`vitest run`).
- **Test:** `score/levels.test.ts` — täcker alla tröskelvärden i 7.5, att poängen aldrig klämmer till 0, och klämning över 100.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` går alla igenom utan fel eller varningar.

### Beslut nästa session behöver känna till
- **Mappstruktur** följer tabellen ovan — `src/`-prefixet i uppdraget är alltid logiskt.
- **Tokens-namngivning:** rådata i `design/tokens.css` har INGA `--color-`/`--radius-`-prefix (t.ex. `--slate-50`, `--r-md`) för att undvika cirkulära `@theme inline`-referenser i `app/globals.css`. Wire in nya tokens på samma sätt — se kommentaren överst i `design/tokens.css` och avsnittet i `DESIGN.md`.
- **Typsnittsvariabler** (`--font-sans`, `--font-serif-italic`) ska INTE läggas i `@theme inline` — de sätts av `next/font/local` via klasser på `<html>` och används direkt som `var(--font-sans)`. Se `DESIGN.md`.
- **`score/levels.ts`** finns redan — `calculateScore` i Session 2 ska importera tröskelvärdena härifrån, inte duplicera dem.
- **Egennamn** (Bolagsverket, Hiasynth, m.fl.) hör hemma i `Källa.namn`/källdata, inte i i18n-ordböckerna (uppdrag avsnitt 4).
- **`zustand`/`recharts`** är medvetet inte tillagda än. Session 2 lägger till `zustand` för demo-store; `recharts` läggs till när ett diagram faktiskt behövs.
- **Radix + Framer Motion** är nu i projektet — återanvänd dem (t.ex. Radix Dialog/Tabs för `/app/minnet`s flikar i senare sessioner) i stället för att bygga egna primitiver.

### Kända problem / medvetna begränsningar
- Loggan är en spårad vektor (potrace), inte grundarnas original. Se TODO i `components/ui/Logo.tsx`.
- `--motion-*`-CSS-variablerna används hittills bara på ett fåtal ställen (SourceTag, LanguageSwitch, NextStepCard-knappen); `ScoreBadge`s räkneanimation använder motsvarande värden via `design/tokens.ts` (JS-sidan) eftersom Framer Motion behöver tal, inte CSS-strängar.
- Sidomenyns navigeringsposter (Medgrundaren, Resan, Poäng, m.fl.) är medvetet inerta (ingen `href`) i `app/(app)/layout.tsx` tills respektive sida byggs — bara "Hem" länkar någonstans.

### Granskningsrunda (efter grundarens genomgång i webbläsare)
Grundaren hittade fel som textbaserad verifiering missade: dark-on-dark rubrik (Tailwind-klasskrock, inte en färgfråga), pillar som stretchade till full bredd (flex/grid `align-items: stretch`), och — vid kontrollräkning — att `accent-500` och sex av score-/datatypstonerna faktiskt inte klarade WCAG AA. Allt är fixat och dokumenterat i `DESIGN.md` under "Granskningsrunda". **Lärdom för kommande sessioner:** verifiera kontrast med uträknade tal, inte ögonmått, och testa alla nya komponenter i minst en flex-col/grid-förälder innan de anses klara.

Loggan gick igenom tre iterationer (SVG-text, CSS-mask, till sist `potrace`-spårad vektor) — se `DESIGN.md`. Om ett liknande "bild/färg syns inte som väntat"-fel dyker upp igen: misstänk källordning/laddningsordning innan du misstänker att värdet är fel.

### `/app` Hem — förhandsgranskning (byggd i förtid)
På grundarens begäran, för att bedöma designen i en verklig vy: `app/(app)/layout.tsx` (sidomeny + sidhuvud) och `app/(app)/app/page.tsx`, mot Saras steg 05 (uppdrag 9.3), byggda bara med designsystemets komponenter. Mockdata i `app/(app)/sara-mock.ts` — **session 3 ska ersätta den filen med den riktiga demomotorn, inte bygga vidare på den.**

**`/app` är en statisk förhandsvisning, inte en fungerande sida.** Ingen demomotor, ingen navigering utöver "Hem", ingen state — allt är hårdkodad mockdata renderad en gång. Godkänd av grundaren 2026-09-17 som en riktning för designsystemet, inte som en granskning av Saras faktiska innehåll (det äger Session 3).

**Känd brist att åtgärda:** `NextStepCard`s knapptext ("Öppna steg 05") matchar inte uppgiften som visas ("Gå igenom svaren och förbered steg 06"). Byt antingen knapptexten till att spegla uppgiften (t.ex. "Granska svaren") eller uppgiftens titel till att spegla steg 05 rakt av — bestäm vilket när `sara-mock.ts` ersätts i Session 3, och håll `actionLabel` och `title` semantiskt i synk i alla framtida `NextStepCard`-anrop.

### Återstår (andra sessioner)
Se `docs/sessioner.md` — Session 2 (poängmotor + demomotor) är nästa. Resten av `/app/*`, `/start/*` och landningssidan är inte byggda.

## Session A — Arkitektur (klar, med ett undantag — se "Kända problem")

### Klart
- **`core/domain.ts`, `core/errors.ts`:** delade domäntyper (`Profile`, `ScoreSnapshot`, `NextStep`, `SinceLastTime`, `PulseSignal`) och `NotImplementedError`. Återexporterar `types/evidence.ts`, `types/legal.ts`, `types/bygg.ts` **oförändrade** — grundaren bad uttryckligen att de filerna inte flyttas eller skrivs om, så `core/domain.ts` importerar dem i stället för att duplicera dem.
- **`ports/*.ts`:** alla 12 modulerna i uppdrag 14.3 som TypeScript-gränssnitt (Profil, Projekt och idé, Resan, Evidens och poäng, Minnet, Medgrundaren, Registret, Webbresearch, Pulsen, Simuleringar, Utskick och svar, Juridisk koll, Bygg).
- **`adapters/demo/*.ts`:** en demoadapter per port. Fyra av dem (`ProfileRepository`, `JourneyRepository`, `EvidenceRepository`, `PulseProvider`) har riktigt innehåll — Saras data, migrerad från den gamla `app/(app)/sara-mock.ts` till `adapters/demo/sara.ts`. Övriga åtta returnerar minimal men typkorrekt platshållardata tills en skärm faktiskt behöver dem.
- **`adapters/live/*.ts`:** alla 12 kastar `NotImplementedError` med hänvisning till sitt kommande `docs/moduler/<modul>.md`.
- **`screens/AppHome.tsx`, `screens/AppShell.tsx`:** den tidigare statiska `/app`-förhandsvisningen omgjord till delade skärmar som tar emot data via props — ingen kunskap om demo/live.
- **`components/ui/ComingSoon.tsx`:** nytt formgivet tillstånd (i18n-nycklar `comingSoon.*` tillagda i `dictionary.ts`/`sv.ts`/`en.ts`), visas av en route när en liveadapter kastar `NotImplementedError`.
- **Montering:**
  - `/demo/app` (`app/demo/app/layout.tsx`, `page.tsx`, `loading.tsx`): demoadaptrarna, anropas direkt från klienten. **Rättat i efterhand:** anropades ursprungligen med `use()` (memoiserat per `locale` via `useMemo`), vilket kraschade med "An unknown Component is an async Client Component" när språket byttes. Bytt till `useEffect`/`useState` med `[locale]` som beroende — se "Kända problem" och `docs/arkitektur.md` avsnitt 7.
  - `/app` (`app/(app)/layout.tsx`, `app/(app)/app/page.tsx`): liveadaptrarna, async Server Components. Sidhuvudet visar en neutral platshållare (`—`/`—`, ingen poängbricka) om profil/poäng inte är byggda; själva sidan visar `<ComingSoon />`. Berördes inte av `use()`-buggen (ingen klientsidig `use()` här).
  - `app/(app)/sara-mock.ts` är borttagen (ersatt av `adapters/demo/sara.ts`) — inget annat importerade den.
- **`eslint.config.mjs`:** `no-restricted-imports` för `app/demo/**` och `adapters/demo/**` blockerar import från `@/adapters/live/*`. Verifierad manuellt (tillfällig testfil, borttagen igen) — se `docs/arkitektur.md` avsnitt 6.
- **`docs/arkitektur.md`:** skriven, med faktiska sökvägar, textdiagram och steg-för-steg för att byta en stub mot en riktig adapter.
- **`.claude/agents/planner.md`, `code-reviewer.md`, `security-reviewer.md`:** hämtade från `github.com/affaan-m/ECC` (repot bytte namn från `everything-claude-code`, kanoniska engelska `agents/`-mappen, inte `.kiro/` eller de lokaliserade `docs/<språk>/agents/`-varianterna), visade för grundaren och placerade i `.claude/agents/` (grundaren körde kopieringen själv, se "Kända problem").
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` går alla igenom utan fel eller varningar. `pnpm build` + `next start` bekräftade i körning: `/app` renderar "Kommer snart", `/demo/app` renderar Saras riktiga data (poäng 43).

### Beslut nästa session behöver känna till
- **`types/evidence.ts`, `types/legal.ts`, `types/bygg.ts`, `lib/schemas/evidence.ts` rörs inte.** De ligger kvar där de är (inte i `core/`) och `core/domain.ts` återexporterar dem. Fråga grundaren igen om de någon gång ska flyttas fysiskt.
- **Locale i portarna:** metoder som returnerar text (`JourneyRepository.getHomeSummary`, `EvidenceRepository.getScoreSnapshot`, `PulseProvider.getTodaysSignal`, `CofounderAgent.sendMessage`) tar `locale: Locale` eftersom demot är helt klientbaserat och bilingualt fabricerat. Se motiveringen i `docs/arkitektur.md` avsnitt 7 innan du lägger till fler portmetoder.
- **Använd `useEffect`/`useState`, inte `use()`, för klientsidig demodata.** `app/demo/app/layout.tsx` och `page.tsx` hämtar demoadaptrarnas data i en `useEffect` med `[locale]` som beroende. Framtida demoroutes (Session 3 m.fl.) ska följa samma mönster — `use()` med en promise som byter identitet vid varje `locale`-ändring kraschade i en Client Component (se "Kända problem"). En konsekvens: `/demo/app` renderas nu tomt (`null`) tills effekten körts efter mount — sidan går inte längre att statiskt förhandsgranska med fullt innehåll direkt i den prerenderade HTML:en, bara efter hydrering. Det är en avsiktlig avvägning, inte en bugg.
- **`lib/demo-data/mock.ts` och `app/demo/page.tsx`** (Eriks ursprungliga scaffolding, från innan sessionerna) rördes inte — de hör inte till `/demo/app`. Avgör i en senare session om `lib/demo-data/mock.ts` fortfarande behövs.

### Kända problem
- Inga kvarstående.
- (Löst) Steg 6 klarades av: Claude Codes auto-läge-klassificerare blockerade `Write`/`Bash` mot `.claude/agents/` som "Self-Modification" — grundaren körde själv `cp`-kommandot med `!`-prefix.
- (Löst) `/demo/app` kraschade med "An unknown Component is an async Client Component" vid språkbyte till engelska (`use()` i `app/demo/app/layout.tsx`/`page.tsx` fick en ny promise-identitet varje gång `locale` ändrades). Fixat genom att byta till `useEffect`/`useState`. Regressionstest: `app/demo/app/locale-switch.test.tsx` — renderar skärmen, klickar EN och kontrollerar att det engelska innehållet visas utan att kasta. Verifierat mot `/app` att samma mönster inte finns där (async Server Components, inget klientsidigt `use()`).

## Session 2 — Poängmotor och demomotor (klar)

### Klart
- **`core/score.ts`:** `calculateScore` som ren funktion (avsnitt 7.1–7.4). Åtta delar med vikter (`SCORE_PART_WEIGHTS`, summerar till 100), fem faser med tak (`PHASE_TOTAL_CAP` 18/30/66/86/100) och upplåsningskarta (`PHASE_UNLOCKED_PARTS`). Regler implementerade: preliminär halv vikt för Marknad i Upptäck (7.3), avtagande värde i tre trappsteg (index 1–10 fullt värde, 11–19 · 0.25, 20+ · 0.05), motsägande bevis räknas fullt ut men ett skevt underlag (≥30 % motsägande) ger delen en 0.85-rabatt, simuleringar (`dataType: "simulation"`) ger alltid 0 poäng, minsta totalpoäng är 1, låsta delar returneras som `LockedScorePart` (aldrig en `ScorePart` med 0 poäng), och en upplåst del utan bevis kastar ett tydligt fel ("ingen poäng utan källa"). `deriveSuggestions` sorterar efter poäng/minut och filtrerar bort låsta delar. `core/score.test.ts` har ett test per regel i 7.7.
- **`i18n`:** ny `score.parts`-nyckel (de åtta delarnas namn — en enda källa, återanvänds av alla scenarier i stället för att varje scenario hårdkodar egna strängar) och en ny `demoBar`-nyckel (alla texter i demoraden), i `dictionary.ts`/`sv.ts`/`en.ts`.
- **Demomotor (Zustand + localStorage):** `adapters/demo/demoStore.ts` — `useDemoStore`, persisterad under nyckeln `spark:demo-state`. State: `beatIndex`, `entry`, `tourOn`, `collapsed`. Actions: `next`, `back`, `goTo`, `toggleTour`, `toggleCollapsed`, `setEntry`, `reset`.
- **`adapters/demo/testScenario.ts`:** ett **minimalt testscenario, 4 moment** (Profilsamtalet → Marknaden → Samtalen → Domen) som bygger `PartEvidence` per moment och kör dem genom `calculateScore`. **Inte** Saras eller Jonas riktiga scenario (uppdrag 9.3/9.4) — bara ett bevis på att demomotorn och poängmotorn hänger ihop. Sista momentet demonstrerar att poängen kan sjunka (samma sex kundsvar, tre omtolkas som `contradicts: true`).
- **`adapters/demo/EvidenceRepository.ts` och `JourneyRepository.ts`** omskrivna: läser `useDemoStore.getState().beatIndex` och räknar fram `ScoreSnapshot`/`JourneySummary` via `testScenario.ts`, i stället för hårdkodade värden. Portarnas signaturer är oförändrade.
- **`adapters/demo/sara.ts`** trimmad till `saraProfile` + `saraPulseSignal` — `saraJourneySummary`/`saraScoreSnapshot` togs bort som död kod nu när Evidence-/JourneyRepository inte längre använder dem (Session 3 bygger ändå ut filen på nytt till hela Saras scenario).
- **`components/spark/DemoBar.tsx`:** demoraden (avsnitt 9.1) — fast rad nederst i `/demo/app`, hopfällbar. ◀ Bakåt, Nästa ▶, "Hoppa till steg" (Radix Popover med alla fyra moment), Rundtur på/av, Byt ingång, Återställ (med `window.confirm`-bekräftelse). Tangentbord: `←`/`→` navigerar, `T` växlar rundtur, `R` återställer — en global keydown-lyssnare som ignorerar inmatningsfält och tangenter med modifierare.
- **`screens/AppShell.tsx`:** ny valfri `bottomBar`-slot, samma icke-demo-medvetna mönster som den befintliga `headerLeft` (som redan bär `DemoDataBadge`). Shellen vet fortfarande inte att den renderar en demorad.
- **`app/demo/app/layout.tsx` och `page.tsx`:** prenumererar nu även på `beatIndex` (utöver `locale`) så att `useEffect` hämtar om poäng och Nästa steg-kort när demoraden klickas.
- **`next.config.ts`:** `devIndicators.position: "top-right"`. Upptäckt under manuell verifiering: Next.js dev-indikatorn (nere till vänster som standard i `next dev`) låg exakt ovanpå demoradens ◀ Bakåt-knapp och blockerade klick. Påverkar bara `next dev`, inte `next build`/`next start`.
- **Tester:** `core/score.test.ts` (alla regler i 7.7), `app/demo/app/demo-bar.test.tsx` (Nästa ▶/◀ Bakåt ändrar Nästa steg-kortets titel), `app/demo/app/locale-switch.test.tsx` uppdaterad till det nya testscenariots innehåll.
- **Manuell verifiering i webbläsare** (headless Chromium via Playwright, `pnpm dev`): alla fyra moment, poängen 16 → 30 → 60 → 58 (matchar handräkning), `←`/`→`-tangenterna, "Hoppa till steg"-popovern, Återställ-bekräftelsen (avbruten utan att nollställa), localStorage-persistens över omladdning (`Ctrl+R`/reload behåller aktuellt moment), och att `/app` fortfarande visar "Kommer snart" helt opåverkat. Inga konsolfel.
- **Hittade och fixade en verklig WCAG AA-kontrastbrist under den manuella verifieringen:** `text-score-red` mot `ink-800` ger ~2.5:1 (kräver 4.5:1) — den tonen var i Session 1 bara kontrolleräknad mot `score-red-bg` (ljus yta), inte mot en mörk botten. Återställ-knappen använder nu `text-paper-50`; destruktiviteten kommuniceras av bekräftelsedialogen i stället för av färgen.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (17 tester, 4 filer) och `pnpm build` går alla igenom utan fel eller varningar.

### Beslut nästa session behöver känna till
- **`testScenario.ts` är bara ett wiring-bevis, inte Saras riktiga innehåll.** Session 3 bygger ut `adapters/demo/sara.ts` till alla 12 steg (uppdrag 9.3) och kan då ersätta `testScenario.ts` helt eller lägga scenariot bredvid det. Formen (`PartEvidence`, `Beat`, `getScoreSnapshotForBeat`/`getJourneySummaryForBeat`) är tänkt att återanvändas rakt av.
- **`calculateScore`s konstanter** (avtagande värde-trappan 1.0/0.25/0.05 vid index 10/19, skevhetströskel 30 % med 0.85-straff) är en rimlig, testad tolkning av 7.4:s text men **inte kalibrerad** mot Saras målpoäng (uppdrag 9.3, ±2). Session 3 justerar i första hand `EvidenceItem`-poängen i scenariot för att träffa målvärdena — ändra formlerna i `core/score.ts` bara om det verkligen krävs, och håll i så fall `core/score.test.ts` grönt (testerna beskriver reglerna, inte de exakta konstanterna).
- **Två filer äger poängen tillsammans:** `score/levels.ts` (Session 1) äger bara den visuella tröskeltabellen (7.5, används av `ScoreBadge`). `core/score.ts` (Session 2) äger själva beräkningen (7.2–7.4, 7.6). Dubblera inte tröskelvärden eller vikter mellan dem.
- **Delarnas namn** (Marknad, Konkurrens, …) flyttades från hårdkodad text i `sara.ts` till i18n `score.parts` — återanvänd den nyckeln för alla framtida scenarier, hårdkoda inte nya varianter.
- **`AppShell` har nu en `bottomBar`-slot** (samma mönster som `headerLeft`). Framtida fasta rader ska använda samma slot i stället för att AppShell får egen kunskap om demo/live.
- **`next.config.ts` har `devIndicators.position: "top-right"`** för att undvika kollisionen med demoradens vänstra knapp i `next dev` — rör den inte utan anledning.
- **"Byt ingång" i demoraden är bara kosmetiskt** (växlar `entry`-state, påverkar inget innehåll än) — Session 5 kopplar in Jonas scenario och gör den funktionell (se `docs/sessioner.md`).
- **Rundturen (`tourOn`) är bara ett på/av-state utan innehåll** — Session 7 bygger själva rundturen och binder den till momenten.

### Kända problem / medvetna begränsningar
- Vid det allra första momentet (ingen tidigare poäng) visar "Poängrörelse"-kortet "−0" utan text efter, eftersom `deltaReason` är tom och `previousTotal` saknas för det första momentet. En kosmetisk edge case i `screens/AppHome.tsx` (Session 1-kod), synlig här men inte orsakad av Session 2. Lämnas till poleringssessionen (7).
- `ScoreBadge`-instanserna i sidhuvudet och i "Poängrörelse"-kortet animerar oberoende av varandra (Session 1-design), så en skärmdump mitt i animationen kan visa två olika siffror ett ögonblick — de konvergerar alltid till samma slutvärde inom ~900 ms. Bekräftat med `pnpm dev` + fördröjd avläsning, inte en bugg i beräkningen.
- Demomotorns state delas mellan flikar via samma localStorage-nyckel men uppdateras inte i realtid mellan redan öppna flikar (samma begränsning som `i18n/context.tsx`s `locale` har sedan Session 1) — inget problem för en demo på ett möte.
