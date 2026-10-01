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

### Återstår (andra sessioner)
- **Saras och Jonas riktiga scenario** (uppdrag 9.3/9.4, alla 12 steg, båda språken) — Session 3 respektive 4. Testscenariot i `testScenario.ts` är bara ett wiring-bevis och ska ersättas eller kompletteras.
- **Kalibrering mot målpoängen ±2** (uppdrag 9.3/9.4) — görs när Saras/Jonas riktiga bevis skrivs, genom att justera `EvidenceItem`-poängen, inte formlerna i `core/score.ts`.
- **"Byt ingång" gjord funktionell** och **guidad rundtur med riktigt innehåll** — Session 5 respektive 7.
- **Resten av `/app/*`-sidorna** (Resan, Poäng, Marknad, Kunder, Pulsen, Minnet, Juridik, Bygg) — inte påbörjade, bara Hem finns som delad skärm (oförändrat sedan Session A).
- **Supabase, inloggning och liveadaptrar** — Session P1, oberoende av det här arbetet.

## Modul: Juridisk koll — liveadapter (klar, branch `modul/juridisk-koll`)

### Klart
- **`adapters/live/LegalAdvisor.ts`** byggd: validerar bolagsformen (kastar tydligt fel på ogiltigt värde, utan att anropa Gemini), filtrerar en kuraterad ämneskatalog för den bolagsformen, ber Gemini välja tillämpliga ämnen och formulera rubrik/beskrivning, validerar svaret mot ett strikt zod-schema, slår ihop dubbletter av samma ämne (ett "applicable"-svar vinner alltid över ett tidigare "not_applicable"), injicerar den kuraterade källan och validerar slutresultatet mot `JuridisktKravSchema` innan det returneras.
- **Gemini kan inte hitta på en källa, avgift, deadline eller myndighet.** `adapters/live/legalSchema.ts`s Gemini-svarsschema saknar strukturellt ett `källa`-fält och är `.strict()` — en smugglad källa (eller vilket extra fält som helst) gör att valideringen kastar i stället för att fältet tyst plockas bort. Källan injiceras alltid efteråt från `adapters/live/legalSources.ts`s `KURERADE_KÄLLOR`, keyed på ämnets `källId`. Verifierat med tester, se nedan.
- **`adapters/live/legalSources.ts`:** kuraterad, hårdkodad källista (Bolagsverket, Skatteverket, verksamt.se, IMY, EUR-Lex/GDPR, Konsumentverket, BFN, Riksdagen) och en sluten katalog med 14 juridiska ämnen kopplade till bolagsform. Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen hämtades och bekräftades innehållsmässigt via WebFetch 2026-09-17. Bolagsverket, verksamt.se och BFN kunde inte hämtas i samma session (verktygsblockering, inte nödvändigtvis fel adress) — flaggat i filens header och i `docs/moduler/juridisk-koll.md` för manuell kontroll.
- **`lib/server/gemini.ts`:** delad, tunn Gemini-klient (`@google/genai`, modell `gemini-2.5-flash`, `responseJsonSchema` från `z.toJSONSchema`). `import "server-only"` överst — kraschar bygget om en klientkomponent någonsin importerar den.
- **`core/errors.ts`:** ny `LegalAdvisorError` (ärver INTE `NotImplementedError` — en riktig Gemini-störning ska synas som ett fel, inte visas som "Kommer snart", se `docs/arkitektur.md` avsnitt 4).
- **Kontraktstestet** (`ports/LegalAdvisor.contract.test.ts`) kör nu både demo- och liveadaptern — Gemini-anropet mockas bort (`vi.mock("@/lib/server/gemini", ...)`) så CI inte behöver nätverk eller API-nyckel.
- **Nya tester:** `adapters/live/LegalAdvisor.test.ts` (ogiltig bolagsform, trasig JSON, okänt ämnes-id, smugglat fält, url i beskrivning, filtrering mot bolagsform, dubblettordning inklusive den blandade `applicable`/`not_applicable`-varianten, källinjicering), `adapters/live/legalSources.test.ts` (dataintegritet i den kuraterade listan), `lib/server/gemini.test.ts` (tydligt fel när `GEMINI_API_KEY` saknas). **`adapters/live/LegalAdvisor.live.test.ts`** är ett opt-in-test mot riktiga Gemini, `describe.skipIf(!process.env.GEMINI_API_KEY)` — körs inte i CI, kör manuellt med `GEMINI_API_KEY=... pnpm test adapters/live/LegalAdvisor.live.test.ts`.
- **Nya beroenden:** `@google/genai`, `server-only`.
- **`.env.example`** skapad (bara `GEMINI_API_KEY=`, inget värde) — `.gitignore` fick `!.env.example` så filen går att committa trots den generella `.env*`-regeln.
- **`vitest.config.mts`:** alias `server-only` → `test/stubs/server-only.ts` (en no-op-stub), annars kraschar hela testkörningen så fort något importerar serverkod som drar in `server-only`.
- **`eslint.config.mjs`:** `no-restricted-imports`-mönstren för demo-guarden utökade med `@/adapters/live/**`/`**/adapters/live/**` (utöver de befintliga `*`-varianterna) — en `*` i minimatch korsar inte `/`, så ett framtida nästlat `adapters/live/<mapp>/<fil>.ts` hade annars slunkit igenom guarden.
- **Granskat av code-reviewer- och security-reviewer-agenterna.** Security: inga blockerande fynd (nyckelhantering, prompt-injection-inneslutning och källinjicering håller end-to-end). Code review: en MEDIUM (dubblett-ordningen kunde tysta ner ett `applicable`-svar om det kom efter ett `not_applicable` för samma ämne) — fixad och testtäckt (se ovan); en LOW (en gren i koden är i dag oåtkomlig med den nuvarande katalogen — varje bolagsform matchar minst ett ämne — lämnad som avsiktlig framtidssäkring).
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (41 tester + 5 skippade opt-in-tester, alla filer) och `pnpm build` går alla igenom utan fel.

### Beslut nästa session (eller den som bygger `/app/juridik`) behöver känna till
- **Ingen skärm/route använder `liveLegalAdvisor` än.** Den är byggd och testad men inte kopplad in någonstans — `/app/juridik` finns inte. `docs/arkitektur.md` avsnitt 5 gäller rakt av när den sessionen kommer.
- **Juridiskt innehåll är INTE sakgranskat av jurist.** Ämneskatalogen (vilka ämnen som gäller per bolagsform) är en rimlig men overifierad tolkning. `kostnadKr`/`deadline`/`myndighet` lämnades medvetet tomma i stället för att låta Gemini gissa dem — fyll bara i med en verifierad källa för just den siffran.
- **Visa aldrig `LegalAdvisorError`s meddelande rakt av för användaren** när routen byggs — det kan innehålla fragment av Geminis råa (ogiltiga) svar via `z.prettifyError` (flaggat av security-reviewer-agenten).
- **Ansvarsbegränsningen** ("Spark ger vägledning, inte juridisk rådgivning...") är medvetet INTE i den här adaptern — den hör hemma som en i18n-nyckel (`sv.ts`/`en.ts`) som visas av UI:t på varje juridisk yta, inte hårdkodad i `adapters/live/LegalAdvisor.ts` (CLAUDE.md: ingen hårdkodad text).
- **Mönstret i `lib/server/gemini.ts`** (tunn SDK-inpackning, domänlogik i adaptern) är tänkt att återanvändas av `CofounderAgent`s liveadapter när den byggs.

### Kända problem / medvetna begränsningar
- **Rättat 2026-09-30:** av de åtta myndigheterna bland de kuraterade källorna är tre kontrollerade av en människa i webbläsaren 2026-09-30 (Bolagsverket, verksamt.se, BFN). Fem är enbart maskinellt hämtade, av Claude Code 2026-09-17 (Skatteverket, IMY, EUR-Lex, Konsumentverket, Riksdagen). Ingenting är granskat av jurist. Se `docs/beslut.md` (2026-09-30) och verifieringsloggen i `docs/moduler/juridisk-koll.md`.
- UF-företag (Ung Företagsamhet) finns inte som ett eget värde i `Bolagsform` — produkten heter Spark UF men typen har bara `enskild_firma`/`aktiebolag`/`handelsbolag`/`ekonomisk_forening`. Oklart om det är en avsiktlig avgränsning eller en lucka; flaggat, inte löst.
- `getLegalMap` tar inte emot `locale` (till skillnad från t.ex. `CofounderAgent.sendMessage`), så Gemini svarar bara på svenska i dag — se motiveringen i `docs/arkitektur.md` avsnitt 7 om framtida Gemini-svar bör följa användarens språk.

## Session 3 — Bredd: alla elva sidorna under /demo/app (klar, breddfokus)

Mål för sessionen: ingen sida i sidomenyn tom eller död, bredd före djup. Nio commits, en per sida plus en grundcommit.

### Klart
- **`adapters/demo/sara.ts` omskriven helt:** Saras fulla scenario (9.3), 13 beats täcker alla 12 officiella steg (steg 05 har två beats — utskicket och svaren — för att visa poängen stiga till 47 och sedan sjunka till 43). `SARA_STEPS` exporterar den kanoniska 12-stegslistan Resan-vyn använder. `testScenario.ts` (Session 2:s wiring-bevis) borttagen, allt pekar om till `sara.ts`.
- **Alla elva sidorna** finns som riktiga skärmar under `/demo/app` och länkas från `AppShell` (ny `navBasePath`-prop, aktiv sida markerad via `usePathname`): Hem, Medgrundaren, Resan, Resan/[steg], Poäng, Marknad, Kunder, Pulsen, Minnet, Juridik, Bygg.
- **Sju portar utökade** med nya metoder (liveadaptrarna kastar `NotImplementedError` som vanligt för de nya metoderna också): `JourneyRepository` (`getSteps`, `getStepDetail`), `EvidenceRepository` (`getSuggestions`), `RegistryProvider` (`getMarketOverview`), `OutreachProvider` (`getCampaign`), `PulseProvider` (`getSignals`), `MemoryRepository` (`getProfileSummary`, `locale` tillagd på `getTraceEvents`), `BuildProvider` (`getSpec`), `SimulationProvider` (`locale` tillagd på `simulate`).
- **Nya komponenter:** `ChatMessage`, `ToolRunCard`, `TimeSkip` (`components/spark/`), `LegalMap` (`components/spark/`). Ny `@radix-ui/react-tabs`-dependens för Minnets flikar.
- Verifierat: `pnpm typecheck`/`lint`/`test`/`build` gröna vid varje commit. Alla 14 routes svarar 200 (verifierat med `curl` mot `pnpm start`) — se "Kända problem" för vad som INTE är verifierat.

### Moment per steg — vad som faktiskt är byggt
- 9.1 beskriver tre moment per steg (Före/Körning/Efter). Det är **inte** byggt generellt — bara steg 05 har två beats (utskicket, svaren). Övriga elva steg har **ett** moment/beat vardera.
- `ToolRunCard` (körning-momentet i Medgrundaren) finns bara för steg 02, 03, 04, 05 (utskicket), 07, 09, 10, 12. Steg 01, 05 (svaren), 06, 08, 11 har bara chattmeddelanden, ingen verktygskörning.
- Resan/[steg] visar samma djup för alla 12 steg (`why`-text + 2–4 `highlights`-punkter ur `sara.ts`) — men steg 07–12 saknar egna dedikerade vyer utöver det, se nedan.

### Poängkalibrering
- Uppmätta totalsummor per beat (`calculateScore`, kontrollerat med ett tillfälligt testskript som inte ligger kvar i repot): 6, 14, 26, 27, 47, 43, 54, 60, 66, 70, 77, 88, 92.
- Målvärden (9.3): 6, 16, 24, 29, 47, 43, 54, 60, 66, 69, 78, 88, 91.
- Avvikelse per steg: 0, −2, +2, −2, 0, 0, 0, 0, 0, +1, −1, 0, +1 — alla inom uppdragets "högst ±2", de flesta exakta. Slutlig nedbrytning (steg 12) matchar 9.3 exakt på Passform 8, Konkurrens 7, Problem 16, Betalningsvilja 16, Produkt 12, Traktion 13, Genomförbarhet 8. Marknad landar på 12 i stället för 11 (+1) — enda avvikande delen i slutnedbrytningen.
- Metod: en eller ett fåtal `EvidenceItem` per del och beat (inte en post per enskilt kundsvar), utom steg 05 "svaren" där motsägelsen medvetet är uppdelad i en positiv och en negativ post (den negativa med **negativa poäng**) för att trigga både avtagande värde och det skeva underlagets 0,85-straff i `core/score.ts` på riktigt.

### Steg 07–12 — mindre djup än 03–06/09/10
- Steg 07 (Affärsfall och pris), 08 (Omfånget), 11 (Första kunderna) och 12 (Kapital) har **ingen egen sida eller dedikerad vy** — bara Nästa steg-kortet och highlights-texten på Resan/[steg], plus poängbidraget.
- Steg 09 (Det formella) och 10 (Live) har delvis egna vyer via Juridik respektive Bygg, men de sidorna visar bara slutresultatet (juridisk karta, byggstatus) — inte den svenska kalkylen från steg 07, MVP-omfångsbeslutet från steg 08 i detalj, 30-dagarsplanens kanaler från steg 11, eller ansökningsunderlaget från steg 12.
- Kunder-sidan visar bara utskicksstatus (draft/sent/opened/responded) — **inte** att 5 av byråerna blivit betalande kunder med 5 950 kr MRR (steg 11). Den siffran syns bara som text i highlights och i Traktion-delens poäng, ingen egen "betalande kund"-status i tabellen.

### Återstår
- **Onboarding (`/demo/start`, `/start`, `/start/profil`, `/start/ide`):** inte byggd. Demot hoppar rakt in i `/demo/app` vid `beatIndex` 0 i stället för att börja i profilsamtalet/idégenomlysningen som 9.1 beskriver.
- **Jonas (Persona B):** inte byggd alls — ingen data, inga sidor. "Byt ingång" i demoraden är fortfarande bara kosmetiskt (växlar `entry`-state, påverkar inget innehåll) — känt sedan Session 2, oförändrat.
- **Engelska texter:** all ny UI-text (i18n) och allt nytt scenarioinnehåll (`sara.ts`, `cofounderScript.ts`, `RegistryProvider`, `OutreachProvider`, `PulseProvider`, `SimulationProvider`) finns på båda språken, typtvingat via `Dictionary`. **Undantag:** Juridik-sidan är svensk-bara — `getLegalMap` tar fortfarande inte emot `locale` (samma kända begränsning som liveadaptern, se modulsessionens anteckning ovan). Inte manuellt klickigenomgången på engelska i en riktig webbläsare — bara verifierat att typerna går ihop.
- **Guidad rundtur, kalibrering mot Jonas, publika sidor utöver befintlig platshållare (`/`, `/priser`, `/logga-in`, `/skapa-konto`), `docs/demo-manus.md`:** inte påbörjat, oförändrat sedan tidigare sessioner.

### Kända problem
- **Ingen webbläsarverifiering.** Claude in Chrome-tillägget var inte anslutet i den här sessionen — allt är verifierat med `typecheck`/`lint`/`test`/`build` och `curl` (200 på alla routes), inte manuellt klickat igenom i en riktig webbläsare. Gör det först i nästa session innan mer byggs ovanpå, särskilt SV/EN-växeln och demoradens Nästa/Bakåt genom alla 13 beats.

## Designuppdatering — high-tech dashboard-uttryck

Grundarens uppdrag: ta uttrycket från tre referensbilder (tät instrumentpanel, KPI-rad med sparklines, centrerad promptruta), inte färgerna. Ren token-/komponentsession — inget innehåll ändrat. Full motivering i `DESIGN.md` under samma rubrik.

### Klart
- **Typsnitt:** Manrope → **Funnel Display** (`--font-sans`, motiverat i DESIGN.md), ny **JetBrains Mono** (`--font-mono`) för alla siffror. Båda självhostade `.woff2` under `design/fonts/`, hämtade ur `@fontsource-variable/*` (samma Google Fonts-källa som tidigare typsnitt, OFL-1.1) men **inte** tillagda som npm-beroenden — bara filerna kopierades in, exakt samma mönster som Manrope/Instrument Serif. Instrument Serif Italic oförändrad.
- **`.font-numeric`-utility** i `app/globals.css` (inte Tailwinds `.font-mono` — se DESIGN.md för varför) satt på alla siffror: `ScoreBadge`, `DataFact`, nya `KpiTile`, poäng/vikt-texter, tabellceller i Kunder, registersiffror i Marknad. Medvetet **inte** satt på meningar som råkar innehålla ett tal (t.ex. Pulsens tidsstämpel).
- **Nya komponenter:** `components/ui/Sparkline.tsx` (minimal inline-SVG, ingen ny dependency), `components/spark/KpiTile.tsx` + `KpiRow.tsx`, `components/spark/PromptBox.tsx`.
- **KPI-rader** på Hem (5 rutor) och Poäng (4 rutor). Sparkline bara på totalpoängen, som har en genuin flerpunktsserie (per-beat-historik, ny `EvidenceRepository.getScoreHistory`-portmetod — demo härleder ur `sara.ts`s nya `getScoreHistoryUpToBeat`, live kastar `NotImplementedError`). Övriga KPI:er utan sparkline snarare än en påhittad form.
- **Medgrundaren:** ny centrerad `PromptBox` under transkriptet — ljus, rundade hörn, tunn kant, mjuk skugga, liten rund accent-skickaknapp. Medvetet **inert** (disabled) eftersom demot är helt förskrivet, ingen ny funktion. `ChatMessage` slimmad (tätare padding/radavstånd), fortsatt bubbelbaserad.
- **Täthetspass:** padding/gap ner ett steg i alla kort och i `AppShell` (sidomeny, sidhuvud). Sidomenyns aktiva länk `bg-slate-700` → `bg-accent-600 text-white` (återanvänder Session 1:s kontrollräknade 5.01:1-kontrast, inga nya toner).
- **Verkligt fel hittat och fixat:** deltachippen i de nya KPI-rutorna visade `−0` vid det allra första momentet (samma rotorsak som det kända `−0`-felet i "Poängrörelse"-kortet, `docs/status.md` Session 2) — fixat genom att bara rendera chippen när `delta !== 0`.
- **Verifierat:** `pnpm typecheck`/`lint`/`test`/`build` gröna. **Webbläsarverifiering genomförd** (Playwright, headless Chromium mot `pnpm dev`) — alla elva `/demo/app`-sidor + `/resan/[steg]`, på **både sv och en**, inga konsol-/sidfel på någon av de 22 kombinationerna. Detta var en explicit känd lucka från Session 3 (EN aldrig klickad igenom i en riktig webbläsare) — nu täppt till, åtminstone för den här designuppdateringen.

### Beslut nästa session behöver känna till
- **`--font-mono` mappas inte in i `@theme inline`** i `app/globals.css`, av samma skäl som `--font-sans`/`--font-serif-italic` sedan Session 1. Siffror får typsnittet via `.font-numeric`-klassen, inte Tailwinds `font-mono`-utility.
- **Sparkline-data måste vara genuin.** Lägg aldrig till en sparkline i `KpiTile` utan en riktig flerpunktsserie bakom — se databeslutet i DESIGN.md. Fler serier (t.ex. öppningsfrekvens över tid) kräver att adaptern faktiskt modellerar historik, inte bara ett nu-värde.
- **`PromptBox` är avsiktligt inert.** Om Medgrundaren någon gång får riktig inmatning (utanför den förskrivna demon) är det en separat, större uppgift — inte något den här sessionen förberedde funktionellt.
- **Juridik-sidan är fortfarande svensk-bara** (`getLegalMap` tar inte `locale`, känt sedan tidigare session) — synligt i EN-skärmdumparna, inte adresserat här, inte i scope för en designsession.

### Kända problem / medvetna begränsningar
- **KPI-raden duplicerar viss information** som redan visas i korten nedanför (t.ex. "Vad som hänt sedan sist" på Hem). Avsiktligt — en dashboards KPI-rad är en sammanfattning. Flagga till grundaren om det känns för upprepande i en riktig genomgång.
- Ingen ny `recharts`-dependency — `Sparkline` är en egen minimal SVG-komponent. Om fler/mer avancerade diagram behövs (interaktiva, tooltip, zoom) är `recharts` fortfarande rätt val då, inte en utökning av `Sparkline`.

## Session P2 — Moduldokument, kontraktstester, Tavily-skelett, bygga-en-modul (klar, branch `plattform-p2`)

Mål: dokumentera alla 12 moduler enligt 14.5, bygga kontraktstester per port
som redan idag går gröna mot demo och automatiskt börjar pröva liveadaptern
den dagen den slutar vara en stub, förbereda Tavily-serverstrukturen, och
skriva den generella "stub → klar modul"-guiden. Sju commits, planerade med
planner-agenten och godkända av grundaren innan kod skrevs.

### Klart
- **`ports/testContract.ts`:** `describeContract`/`contractIt` — kör samma
  svit mot en ports demo- och liveadapter. `contractIt` fångar
  `NotImplementedError` och kallar vitest 5:s dynamiska `ctx.skip()`, så en
  kontraktstestfil skrivs en gång och gäller automatiskt både idag (demo
  grön, live skippad) och den dag liveadaptern är klar (live börjar prövas
  på riktigt, ingen omskrivning av testfilen krävs). Två regler dokumenterade
  i filen: aldrig egen try/catch runt en `contractIt`-body, och negativa
  tester måste kontrollera feltypen (`.rejects.toBeInstanceOf`) — annars blir
  de falskt gröna mot en stubbe. Bevisat mot en redan byggd liveadapter
  (`ports/LegalAdvisor.contract.test.ts` skrevs om till mönstret först).
- **Kontraktstester för alla 12 portar** (`ports/<Port>.contract.test.ts`):
  Registret och Utskick och svar (steg 05) byggda först enligt prioritet,
  sedan de återstående nio. Prövar kontraktet (form, invarianter, källa på
  varje påstående) — inte Saras specifika scenarioinnehåll. 34 nya
  live-tester skippar sig själva idag (alla liveadaptrar utom LegalAdvisor
  är fortfarande stubbar).
- **`ports/stubStatus.test.ts`:** ett litet vakttest, skilt från
  kontraktstesterna — failar högljutt om en av de 11 obyggda liveadaptrarna
  slutar kasta `NotImplementedError` utan att raden tagits bort här (vilket
  tvingar fram en samtidig uppdatering av `docs/moduler/<modul>.md` och
  `docs/status.md`, se `docs/bygga-en-modul.md` steg 7 och 10).
  *Senare:* listan är i dag 7 helstubbar (Medgrundaren, Webbresearch,
  Pulsen, Simuleringar, Utskick och svar, Bygg, Domen) plus 3 partiella metoder
  (`PARTIELLA_STUBBAR`); övriga har byggts eller grindats sedan dess.
- **`docs/moduler/*.md` — alla 12 moduler har nu ett dokument.** De två
  prioriterade (`registret.md`, `utskick-och-svar.md`) skrevs först och mest
  utförligt. De nio återstående: `profil.md`, `projekt-och-ide.md`,
  `resan.md`, `evidens-och-poang.md`, `minnet.md`, `medgrundaren.md`,
  `webbresearch-och-pulsen.md` (ett dokument för både `ResearchProvider` och
  `PulseProvider` — de delar redan samma `DOC`-hänvisning i koden),
  `simuleringar.md`, `bygg.md`. Alla följer 14.5s sjupunktsstruktur och
  samma stil som den handskrivna `juridisk-koll.md` (facit för sessionen).
  Simuleringar och Bygg flaggade som **avsiktligt permanenta stubbar** tills
  ett Hiasynth- respektive Lovable-partnerskap ingås (uppdrag 2.2, 2.3) —
  skiljer sig från övriga moduler, som väntar på kod, dataavtal eller en
  OAuth-uppsättning.
- **`lib/server/tavily.ts` + test:** server-only-klientskelett, speglar
  `lib/server/gemini.ts`. `search()` kontrollerar `TAVILY_API_KEY` och
  kastar sedan `NotImplementedError` — ingen riktig sökning än.
  `TAVILY_API_KEY` tillagd i `.env.example` utan värde. Gemini-klienten
  rördes inte (redan klar sedan Juridisk koll-sessionen).
  *Senare:* inte längre ett skelett — byggd till riktig klient i
  "Modul: Utskick — mejlsökning och utkast" nedan.
- **`docs/bygga-en-modul.md`:** generell steg-för-steg-guide (branch →
  läs kontraktet → bygg → nycklar → tre testlager → extern data är data →
  granskning → dokumentation → avslutning → checklista), med Juridisk koll
  som verkligt genomfört exempel. `docs/arkitektur.md` avsnitt 5 kortat till
  en hänvisning hit; avsnitt 3 uppdaterat (moduldokumenten finns nu).
- **Bekräftat, inget kodarbete krävdes:** alla 12 liveadaptrar kastade redan
  korrekt `NotImplementedError` med hänvisning till sitt (nu existerande)
  moduldokument innan sessionen började — uppdragets punkt 3 var redan
  uppfylld i koden.
- Granskat av code-reviewer- och security-reviewer-agenterna mot hela
  sessionens diff. Security: inga blockerande fynd. Code review: APPROVE,
  en LOW (`TavilySearchInput` exporterad men oanvänd i skelettet) — fixad
  med en förklarande kommentar.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (89 tester gröna,
  39 skippade — förväntat, de obyggda liveadaptrarnas kontraktstester),
  `pnpm build` går alla igenom utan fel.

### Beslut nästa session (eller den som bygger en modul) behöver känna till
- **`docs/bygga-en-modul.md` är nu den kanoniska guiden** för att gå från
  stub till klar liveadapter — `docs/arkitektur.md` avsnitt 5 är bara en
  kort hänvisning dit. Följ den, inklusive att ta bort modulens rad ur
  `ports/stubStatus.test.ts` och uppdatera moduldokumentets statusavsnitt i
  samma commit som liveadaptern blir klar.
- **Kontraktstestens skip-mönster har en känd, dokumenterad begränsning**
  (code-reviewer-fyndet ovan, inte ett fel i den här sessionen): `contractIt`
  kan inte skilja "hela adaptern är en avsiktlig stub" från "en enskild
  metod i en annars byggd (`påbörjad`) adapter kastar `NotImplementedError`
  av misstag". Ingen modul är i det läget än (LegalAdvisor är helt byggd,
  resten helt ostubbade), men **var extra uppmärksam på det** första gången
  en modul byggs delvis — en metod som av misstag kastar
  `NotImplementedError` skulle tystas som "fortfarande en stub" i stället
  för att faila.
- **Registret och Utskick och svar är inte kod-blockerade, de väntar på
  affärsbeslut:** Registret på ett dataavtal (Bolagsverket/SCB), Utskick och
  svar på en Gmail OAuth-uppsättning **och** ett beslut om `opened`-status
  ens går att mäta live utan en GDPR-problematisk spårpixel (flaggat i
  `docs/moduler/utskick-och-svar.md`) — ta upp det med grundaren innan den
  modulen byggs, det kan påverka portens kontrakt.
- **Medgrundaren-porten saknar ett verktygsanropslager** (function calling
  mot andra portar) — `sendMessage` returnerar i dag bara text.
  `docs/moduler/medgrundaren.md` flaggar det som en öppen designfråga att
  lösa med grundaren innan liveadaptern byggs.
- **Projekt och idé-porten saknar troligen en skrivmetod** — `getProject()`
  är allt som finns idag; idégenomlysningen (uppdrag 2.1) som ska *sätta*
  ett projekt är inte kopplad till porten än. Bygg den här modulen
  tillsammans med onboardingen, inte isolerat.

### Kända problem
- Inga nya. `.mcp.json` (otrackad i arbetskatalogen) rördes inte, utanför
  uppdraget.

### Återstår (andra sessioner)
- Alla 12 liveadaptrar väntar fortfarande på att byggas (Session P1 för
  Profil/Projekt/Resan/Evidens/Minnet via Supabase och inloggning, separata
  modulsessioner för Medgrundaren, Registret, Webbresearch/Pulsen, Utskick
  och svar — Simuleringar och Bygg förblir avsiktligt stubbar).
- Se `docs/uppdrag.md` avsnitt 13 och `docs/sessioner.md` för resten av
  sessionsplanen.

## Session 5 — Onboarding (avgränsad: bara onboardingen, inte hela sessionsmallens Jonas-scope)

Grundaren bad specifikt om onboardingen (val av ingång, profilsamtalet, idégenomlysningen) den här sessionen — inte hela `docs/sessioner.md`s Session 5-mall, som också ber om Jonas fulla 12-stegsresa och en fungerande "Byt ingång". Det skiljer sig medvetet, flaggat och godkänt av grundaren innan bygget startade.

### Klart
- **Portar utökade:** `ProfileRepository.getOnboardingScript(entry, locale)` (profilsamtalets frågor + klickbara svarsförslag) och `ProjectRepository.getIdeaScreening(locale)` (idégenomlysningen). Liveadaptrarna kastar `NotImplementedError` som vanligt.
- **`core/domain.ts`:** ny delad typ `OnboardingEntry` ("noIdea"/"hasIdea") — flyttad hit från `demoStore.ts`s lokala `DemoEntry` (portar får inte bero på en demo-bara typ).
- **`adapters/demo/demoStore.ts`:** ny `onboardingDone`-flagga (persisterad), `completeOnboarding()`-action. `reset()` nollställer den också.
- **Tre nya delade skärmar** (`screens/`): `OnboardingEntry` (två valkort, ren navigation, ingen data att hämta), `OnboardingProfile` (chatt med klickbara svarsförslag — varje klick lägger till svaret i chatten och i en "profilen så här långt"-lista), `OnboardingIdea` (antaganden med testbar/kräver-kundsamtal-etikett, registerbild via `DataFact`, Medgrundarens raka omdöme, den skarpare versionen). Alla tre har komponenttester.
- **Demoinnehåll:** Saras profilsamtal i `adapters/demo/ProfileRepository.ts` återanvänder hennes redan skrivna svar (samma innehåll som `cofounderScript.ts`s `"01-om-dig"`, medvetet duplicerat i en annan datastruktur — se nedan). Jonas kortare passform-samtal (nya, fiktiva resurssiffror — 9.4 angav inga) och hela hans idégenomlysning (`adapters/demo/ProjectRepository.ts`: fem antaganden, fiktiv registerbild för padelhallar — 412 bolag, fallande nyregistreringar, ökande nedläggningar — svaghetsomdöme och den skarpare B2B-idén) ligger där också.
- **Routes:**
  - `/demo/start`, `/demo/start/profil`, `/demo/start/ide` — klientkomponenter (samma `useEffect`/`useState`-mönster som `/demo/app`, se Session A), egen `app/demo/start/layout.tsx` utan `AppShell`-sidomeny men **med `DemoBar`** (avsnitt 9.1: demoraden ska fungera under onboardingen också).
  - `/start`, `/start/profil`, `/start/ide` — **async Server Components**, samma `try/catch`-mönster som `(app)/app/page.tsx` (avsnitt 4 i `docs/arkitektur.md`): `NotImplementedError` visar `<ComingSoon />`. `locale` hårdkodas till `"sv"` (samma precedent som `(app)/layout.tsx`) eftersom serverkomponenter inte har klientens i18n-kontext.
  - `/demo/app`s layout skickar tillbaka till `/demo/start` om `onboardingDone` är `false` (avsnitt 9.1: demot ska alltid börja i onboardingen). Kollen körs i en effekt efter klienthydrering, inte i själva renderingen (zustand `persist` hydrerar asynkront).
  - **`app/demo/page.tsx`** (Eriks ursprungliga platshållare, `lib/demo-data/mock.ts`) ersatt med en ren redirect till `/demo/start`. `lib/demo-data/mock.ts` självt är orört men inte längre importerat någonstans.
- **`DemoBar` fungerar nu även på `/demo/start`-sidorna:** visar "Onboarding" i stället för steg/fas/moment där (`usePathname` avgör), ◀ Bakåt/Nästa ▶ och piltangenterna är inaktiva utanför `/demo/app` (beat-navigering betyder inget under onboardingen), och "Hoppa till steg" markerar nu onboardingen klar och navigerar in i `/demo/app` — en genväg för en presentatör som vill hoppa förbi onboardingen.
- **i18n:** ny `onboarding`-nyckel (entry/profile/idea, sv+en) och `demoBar.onboardingLabel`.
- **Tester:** `screens/OnboardingEntry.test.tsx`, `OnboardingProfile.test.tsx`, `OnboardingIdea.test.tsx`. Fixade två redan existerande `/demo/app`-tester (`demo-bar.test.tsx`, `locale-switch.test.tsx`) som gick sönder av layoutens nya `useRouter()`-anrop — mockar nu `next/navigation` och kör `completeOnboarding()` i `beforeEach` (de testar appen, inte onboardingen).
- Verifierat: `pnpm typecheck`/`lint`/`test` (nu 49 tester, 5 skippade) och `pnpm build` gröna. `pnpm start` + `curl` mot alla nya och befintliga routes: 200 överallt, `/demo` → 307 → `/demo/start` bekräftat, `/start/profil` visar korrekt "Kommer snart" (bekräftar att `try/catch`-mönstret funkar även för de nya live-portmetoderna).

### Beslut nästa session behöver känna till
- **Saras onboarding-Q&A är medvetet duplicerat innehåll**, inte samma källa som `cofounderScript.ts`s `"01-om-dig"` — olika datastruktur (`OnboardingQuestion` vs `TranscriptItem`, klickbart svarsförslag vs redan avklarat transkript). Om de någonsin ska slås ihop till en källa, avgör det i en egen uppgift, inte i förbifarten.
- **Jonas resurssiffror** (kvällar/helger, 50 000 kr) är påhittade av den här sessionen — 9.4 angav inga. Ändra fritt om grundaren vill ha andra tal.
- **`/start`s Server Component-mönster** (try/catch innan JSX, `locale` hårdkodad) är tänkt att återanvändas rakt av när fler `/start`-undersidor byggs — se `docs/arkitektur.md` avsnitt 4–5.

## Formgivningspass mot artefakten + rundturen låst för Sara (klar, gren `prototyp`)

Två uppgifter från grundaren: (1) matcha originalets formgivning (`design-referens/artefakt/`) — sidomeny, kort, nyckeltal, källchips, avstånd/maxbredd — utan att röra innehåll eller sidstruktur; (2) rundtursknappen ska vara låst/dold för Jonas, aldrig starta Saras rundtur ovanpå hans sidor. Full motivering i `DESIGN.md` under samma rubrik — den här posten sammanfattar.

### Klart
- **Sidomenyn ljus**, ny token `--sidebar-bg` (`design/tokens.css`/`app/globals.css`, artefaktens `color-mix(ground 80%, ink)`). Aktiv sida: vit pill + skugga (`bg-white text-slate-900 shadow-lg`) i stället för `bg-accent-600 text-white`. Hover: `hover:bg-slate-800/[0.06]` (artefaktens navy-vid-6%-wash). `Logo` bytt till default `tone="dark"`. `border-r border-slate-200` tillagd, bredd `w-56`→`w-60`. **Demoraden rördes inte** (ingen motsvarighet i artefakten, avsiktligt kvar mörk).
- **Korten:** ~30 ställen i `screens/*.tsx` och `components/{ui,spark}/*.tsx` — vita kortytor `rounded-lg`(16px)→`rounded-md`(10px) + `shadow-lg` tillagd (artefaktens `.card`); streckade/sunkna ytor (`LockedState`, `ToolRunCard`, `SimulationCard`, låsta rutor) bara radien fixad, ingen skugga (matchar att artefaktens inset-rutor aldrig har `box-shadow`). Medveten förenkling: en enda radie rakt igenom i stället för artefaktens två (`--radius`/`--r-sm`) — se DESIGN.md.
- **Nyckeltalen:** `KpiTile`s tal `text-2xl`→`text-3xl` (närmare artefaktens 29px), padding `p-3`→`p-4`. `ScoreBadge`/`VerdictCard`s poängpill rördes inte (annan komponentform än artefaktens ring, utanför uppdragets "nyckeltal"-punkt).
- **Källchipsen** (`SourceTag.tsx`): `rounded-pill`→`rounded-sm` (artefaktens rundade rektangel, inte piller), `border border-black/5` tillagd, `font-numeric` (mono-roll). Padding redan nära artefaktens. **Färgkodningen per datatyp behölls** (egen innehållsdistinktion, inte dekoration) — bara form/kant/typsnitt matchat, inte hela färgsystemet.
- **Maxbredd/avstånd:** alla elva `/demo/app`-sidor (under `AppShell`) satta till samma `max-w-[1080px] gap-[18px]` (artefaktens enda `--maxw:1080px`/`.stack{gap:18px}`), i stället för elva olika `max-w-2xl`…`max-w-5xl`. Onboardingskärmarna (`/demo/start/*`) rördes inte — utanför `AppShell`, ingen artefaktmotsvarighet.
- **Rundturen låst för Jonas** (`adapters/demo/demoStore.ts`): `toggleTour` är nu no-op om `entry === "hasIdea"` (går bara att slå PÅ i Sara-läget) i stället för att tyst tvinga om `entry` till "noIdea". `setEntry` slår alltid av en pågående rundtur. Säkerheten ligger i storen — tangentbordsgenvägen `T` skyddas automatiskt utan egen kod i `DemoBar.tsx`. `DemoBar.tsx`: knappen är en riktig `disabled`-knapp med `title`-förklaring (ny i18n `demoBar.tourLocked`/`tourLockedHint`) när Jonas är vald, inte en klickbar som gör ingenting.
- **Manuell webbläsarverifiering genomförd** (Playwright via `npx --yes -p playwright`, Chromium-binären fanns redan cachad — `chromium-cli` fanns inte i miljön). Skärmdumpar av Hem/Marknad/Resan och den låsta rundtursknappen bekräftade med ögon: ljus sidomeny, vit aktiv-pill, kortskuggor, större KPI-tal, rundade-rektangel-chips. Bekräftat att den låsta knappen faktiskt är `disabled` (Playwright vägrar klicka), har rätt `title`, och att varken klick eller `T`-tangenten sätter `tourOn` i Jonas-läge.
- **Ett fel hittat och fixat under verifieringen:** ett första försök satte `aria-label` på den låsta knappen till hela förklaringstexten, vilket bytte knappens tillgängliga namn — fixat till bara `title` (hover), aria-namnet kommer nu från den synliga knapptexten.
- Verifierat: `pnpm typecheck`/`lint`/`test` (373 gröna, 36 skippade som väntat) och `pnpm build` gröna, både före och efter aria-fixet.

### Vad som inte kunde föras över (rapporterat till grundaren)
Se `DESIGN.md` för full motivering. Fem delar av originalet, alla utanför uppdragets fem punkter eller för att de hade krävt strukturändringar: (1) sidomenyns sidfot (avatar + "Börja om"-länk — bor hos oss i sidhuvud/demorad), (2) topbarens ringformade poängindikator + blurrad bakgrund (annan komponentform än vår `ScoreBadge`-pill), (3) hela Medgrundarens chattspråk (`.bubble`/`.citat`/`.tool`/`.thinking` — inte nämnt i uppdragets fem punkter), (4) tabellens interna mono/versal-typografi i Valideringen (bara ytterwrappern fick radie/skugga), (5) mobilanpassningen (`.side{display:none}` + pill-meny — en interaktionsfunktion, inte ren omstyling).

### Beslut nästa session behöver känna till
- **`--sidebar-bg`** är en ny, komponentspecifik token (samma mönster som `--scrim`) — bara sidomenyn använder den.
- **Enhetlig kortradie (`rounded-md`, 10px)** är nu standard för alla vita/streckade "kort"-ytor i `/demo/app` — nya kort ska följa samma mönster (`rounded-md border border-slate-200 bg-white shadow-lg` för elevated, samma utan `shadow-lg` för sunkna/streckade ytor), inte `rounded-lg`.
- **`max-w-[1080px] gap-[18px]`** är nu den enhetliga sidwrappern för alla `AppShell`-sidor under `/demo/app` — nya sidor ska återanvända den, inte hitta på en egen maxbredd.
- **Källchipsens färgkodning per datatyp är en medveten avvikelse från artefakten** (se DESIGN.md) — ändra den inte till en enda neutral ton utan att fråga, den bär riktig information (källans typ).
- **Rundturens säkerhet ligger i `demoStore.ts`s `toggleTour`/`setEntry`**, inte bara i `DemoBar.tsx`s UI — framtida anrop till `toggleTour()` någon annanstans i kodbasen är redan skyddade, ingen egen guard behövs vid varje anropsställe.
- **Port 3000 kan vara upptagen av en gammal `next start`-process** i den här miljön (kvar sedan tidigare) — `pnpm dev` startar då tyst om till 3001. Kolla `pnpm dev`s egen loggrad ("using available port …") om en manuell webbläsarkörning ger 500:or som inte går att förklara av kodändringar.

### Kända problem / medvetna begränsningar
- Inga nya. De fem "inte överförda"-punkterna ovan är avsiktliga avgränsningar, inte kända buggar.

### Kända problem / medvetna begränsningar
- **Jonas fulla 12-stegsresa är inte byggd** — bara idégenomlysningen och det kortare passform-samtalet. Efter entry B:s onboarding fortsätter demot ändå in i Saras `/demo/app`-scenario (det enda som finns), vilket är sakligt fel (profilen pratar om padelhallar, appen visar Kvittojakten). En riktig demo bör inte visa entry B ännu utan att förklara det här, förrän Jonas resa är byggd.
- **"Byt ingång" i demoraden är fortfarande bara delvis kosmetiskt** — den styr nu vilket onboarding-flöde som visas (fungerande), men inget i `/demo/app` bryr sig om `entry` (samma begränsning som sedan Session 2).
- **Ingen manuell webbläsarverifiering** den här sessionen — inget webbläsarverktyg var anslutet. Verifierat i stället med `curl` (alla routes 200, redirect och `ComingSoon`-fallback bekräftade) och komponenttester som faktiskt klickar igenom interaktionen i jsdom. Klicka igenom `/demo/start` → `/demo/start/profil` → `/demo/app` och `/demo/start` → `/demo/start/ide` → `/demo/start/profil` i en riktig webbläsare, båda språken, innan nästa session bygger vidare.
- **`getIdeaScreening` är bara läsning, ingen skrivmetod.** Session P2 (ovan) flaggade redan innan den här sessionen att `ProjectRepository` saknar ett sätt att *sätta* det valda/skarpare projektet. Onboardingen visar nu genomlysningen men sparar den inte till porten — samma lucka kvarstår, bara mer konkret nu.

## Session P1 — Plattformsskelett: Supabase, RLS, inloggning, fem liveadaptrar

Två PR:ar mot `prototyp`, planerade med planner-agenten och godkända av
grundaren (sex öppna beslut, D1–D6) innan kod skrevs: **PR 1**
(`plattform-p1`, #5) — datamodell, RLS, inloggning. **PR 2**
(`plattform-p1-adaptrar`, gren ur `plattform-p1`) — de fem liveadaptrarna.
`/demo/*` helt orört i båda.

### Klart

- **`supabase/migrations/`:** tolv tabeller (`profiles`, `projects`,
  `journey_steps`, `evidence`, `score_snapshots`, `brain_notes`,
  `trace_events`, `companies`, `outreach_messages`, `responses`,
  `legal_items`, `pulse_signals`), RLS påslaget på alla, policyer
  begränsade till `auth.uid() = user_id` (`companies` är delad
  registerdata, läsbar för alla inloggade, ingen skrivpolicy). Sammansatta
  främmande nycklar `(child_id, user_id) → (id, user_id)` hindrar att en
  rad hängs på någon annans projekt/utskick. En `handle_new_user()`-trigger
  skapar `profiles`-raden automatiskt vid signup. Ett CI-test
  (`supabase/migrations/migrations.test.ts`) hävdar statiskt att varje
  `create table` har en matchande RLS-policy — körbart utan Docker/databas.
  **Migreringarna är INTE körda mot en riktig databas** (ingen Docker i den
  här sandboxen, inget länkat projekt) — se "Beslut nästa session" nedan.
- **Inloggning:** Supabase Auth på `/logga-in` och `/skapa-konto`
  (`app/(auth)/actions.ts`, Server Actions + `useActionState` + zod).
  Fält-/formulärfel returneras som koder, aldrig text
  (`app/(auth)/errorMessages.ts` binder kod → i18n-nyckel med en
  `Record`-typ som failar kompileringen om en ny kod saknar sin nyckel).
  Supabases råa felmeddelanden visas aldrig. Ett upptaget konto vid
  registrering ger AVSIKTLIGT samma "kolla din mejl"-svar som en ny
  registrering (skydd mot kontouppräkning, fixat under den fristående
  säkerhetsgranskningen — se nedan). `?next=` saneras av
  `lib/safeNextPath.ts` (delad med `proxy.ts`).
- **Route-skydd, tre lager** (`docs/arkitektur.md` avsnitt 8): `proxy.ts`
  (Next 16:s ersättning för `middleware.ts`, optimistisk omdirigering +
  sessionsförnyelse), `lib/server/session.ts`s `requireUser()`/
  `requireSupabaseUser()` (bindande, i `app/(app)/layout.tsx` OCH
  `app/start/layout.tsx`), RLS i databasen.
  `components/ui/TextField.tsx` (ny formulärprimitiv, se `DESIGN.md`) och
  en ny `headerRight`-slot i `screens/AppShell.tsx`
  (`components/spark/SignOutButton.tsx`).
- **`core/errors.ts`:** `NotAuthenticatedError` (en adapter kastar,
  navigerar aldrig själv) och `EmptyStateError` + `isPlaceholderError`
  (modulen är byggd men just den här användaren har ingen data än — samma
  "Kommer snart"-yta som `NotImplementedError`).
- **`core/journey.ts`:** delad upplåsningslogik
  (`deriveStepStatus`/`deriveCurrentStepNumber`/`scorePhaseForStep`) och de
  12 stegens metadata (`JOURNEY_STEP_META`, bara siffror — titel/ingress
  ligger i en ny i18n-nyckel, `journeySteps`). **Avsiktligt INTE delad med
  demot** — grundaren bad uttryckligen att `adapters/demo/JourneyRepository.ts`
  inte skulle röras i den här sessionen, så dess lokala `statusFor` är kvar
  och duplicerar samma regel. Se `docs/moduler/resan.md`.
- **Fem liveadaptrar mot Supabase**, alla läser/skriver bara den inloggade
  användarens egna rader via `requireSupabaseUser()` — ingen service-role-
  nyckel används någonstans i P1:
  - **Profil** (påbörjad) — `getProfile` klar. `getOnboardingScript`
    medvetet kvar som stub (olöst designbeslut: Gemini-samtal eller
    fritext).
  - **Projekt och idé** (påbörjad) — `getProject` klar (returnerar `null`
    för inget aktivt projekt). `getIdeaScreening` medvetet kvar som stub
    (i praktiken Medgrundaren/Gemini-analys, porten saknar en skrivmetod).
  - **Resan** (påbörjad) — `getSteps`/`getStepDetail` klara. `getHomeSummary`
    medvetet kvar som stub: `JourneySummary.sinceLastTime` kräver Utskick
    och svar (inte byggd), och "opened" som mätvärde är redan flaggat som
    en olöst GDPR-fråga som P1 inte ska föregripa.
  - **Evidens och poäng** (klar) — `getScoreSnapshot` hämtar `evidence`-
    rader och skickar dem genom `calculateScore` (aldrig egen räkning,
    bevisat med ett test som jämför mot ett direkt `calculateScore`-anrop).
    `getScoreHistory` äkta historik eller tom lista. `getSuggestions`
    returnerar medvetet `[]` — förslagstext är produktinnehåll, inte
    mekaniskt härledbart utan att uppfinna siffror.
  - **Minnet** (klar) — alla fyra metoder, inklusive `setBrainNotes`
    (plattformens första ovaliderade skrivning: längdgräns, ren text,
    skriv-läs-rundtur testad).
  - `ports/stubStatus.test.ts` har en ny `PARTIELLA_STUBBAR`-lista för de
    fyra metoder ovan som medvetet fortsätter kasta `NotImplementedError`
    i en annars påbörjad/klar adapter (P2:s dokumenterade blinda fläck).
- **`test/stubs/supabaseFake.ts`:** en minimal, uttryckligen avgränsad
  fejkad PostgREST-kedja (`select`/`eq`/`order`/`limit`/`maybeSingle`/
  `single`/`insert`/`upsert`, flerkolumns-`order()` som en sammansatt
  nyckel). Alla fem portarnas kontraktstester mockar `@/lib/server/session`
  med den — liveadaptrarna prövas nu på riktigt i CI, utan nätverk.
- **`adapters/live/rls.live.test.ts`** (opt-in, uppgift 6): loggar in som
  två riktiga testkonton och bevisar per användarägd tabell att den ena
  varken kan läsa, ändra, radera eller utge sig för att äga den andras
  rader. Skippar sig självt utan `SUPABASE_TEST_USER_A/B_EMAIL/PASSWORD`
  (alltid i CI) — grundaren kör det manuellt efter `supabase link` +
  `supabase db push`.
- **Granskning:** code-reviewer-agenten (APPROVE, en MEDIUM om att
  uppdatera den här filen — åtgärdas i och med den här commiten) och en
  fristående säkerhetsgranskning (`/security-review`, tre sub-agenter:
  identifiering, false-positive-filtrering) på PR 1:s diff. Tre fynd, alla
  åtgärdade i samma PR (commit `ceeab0c`): kontouppräkning vid registrering
  (ett upptaget konto gav ett skiljbart fel — fixat till samma
  "kolla din mejl"-svar), `app/start/layout.tsx` saknade helt
  `requireUser()` trots att en tidigare commits meddelande påstod att
  `/start` hade samma skydd som `/app`, och en tokenförnyelse i `proxy.ts`
  som bara skrevs till svaret och inte till den inkommande requesten
  (kunde ge en falsk utloggning direkt efter en lyckad förnyelse).
- Verifierat vid varje commit: `pnpm typecheck`/`lint`/`test`/`build` gröna.
  Manuell verifiering (`pnpm build` + `pnpm start` + `curl`): `/app`,
  `/start`, `/start/*` → 307 till `/logga-in?next=...`, `/logga-in`/
  `/skapa-konto` renderar, `/demo/*` helt opåverkat.

### Beslut nästa session behöver känna till

- **Migreringarna är skrivna men inte tillämpade.** Grundaren behöver köra
  `supabase link --project-ref <projekt>` och `supabase db push` (eller
  klistra in SQL-filerna i Supabase-dashboardens SQL-redigerare) innan
  `/logga-in`/`/skapa-konto` fungerar mot en riktig databas, och innan
  `adapters/live/rls.live.test.ts` kan köras. Beslutat med grundaren (D1)
  som ett medvetet avsteg, inte en glömd uppgift.
- **E-postbekräftelse är kvar påslagen i Supabase-projektet** (grundarens
  beslut, D4) — en ny användare får inte en session direkt efter
  `/skapa-konto`, utan ett "kolla din mejl"-läge. Koden hanterar båda
  vägarna (`SignUpForm.tsx`).
- **`core/journey.ts` och `adapters/demo/JourneyRepository.ts` duplicerar
  samma upplåsningsregel med flit** (D3 — grundaren ville inte att demot
  skulle röras). En framtida session kan slå ihop dem genom att låta
  demoadaptern importera `core/journey.ts` i stället för sin lokala
  `statusFor` — inte gjort här.
- **Fyra metoder är medvetna, dokumenterade stubbar** i annars påbörjade/
  klara adaptrar: `ProfileRepository.getOnboardingScript`,
  `ProjectRepository.getIdeaScreening`, `JourneyRepository.getHomeSummary`,
  och (oförändrat sedan tidigare) hela Medgrundaren/Registret/Webbresearch/
  Pulsen/Simuleringar/Utskick och svar/Bygg. Se respektive
  `docs/moduler/<modul>.md` för vad som blockerar varje.
- **`EvidenceRepository.getSuggestions` returnerar `[]`.** Förslagstext
  (förklaring, uppskattad tid per lucka) är skrivet produktinnehåll —
  bygg den tillsammans med en session som faktiskt skriver det innehållet,
  gissa den inte fram mekaniskt.
- **`adapters/live/supabase.live.test.ts` (end-to-end genom adaptrarna,
  inte bara mot rå-klienten) byggdes INTE.** `lib/server/supabase.ts`
  kräver `next/headers`, som inte finns utanför en Next-request — att
  fejka det korrekt är en egen uppgift. `rls.live.test.ts` provar i stället
  databasens RLS-policyer direkt med samma frågor adaptrarna kör, vilket
  bedömdes vara rätt avvägning för uppgift 6.
- **Två PR:ar, `plattform-p1` (#5) och `plattform-p1-adaptrar`** (gren ur
  `plattform-p1`, öppnas som en egen PR när adaptrarna är klara) —
  `plattform-p1-adaptrar`s diff mot `prototyp` innehåller därför båda
  PR:arnas commits tills PR 1 är mergead. Slå ihop PR 1 först för en ren
  diff i PR 2, eller granska PR 2 som "allt ovanpå PR 1".

### Kända problem / medvetna begränsningar

- **En layout re-renderas inte garanterat vid klientsidig navigering
  mellan syskonrutter** (Next-dokumentets egen varning) — `requireUser()`
  i `app/start/layout.tsx` är därför inte en garanti vid varje
  `/start`-undernavigering utan en full sidladdning. Ofarligt i dag
  (`/start` har ingen liveadapter kopplad än), men en framtida session som
  kopplar in `getOnboardingScript`/`getIdeaScreening` bör lägga den
  bindande kontrollen nära datahämtningen också (Next-mönstret "Auth
  checks in page components"), se `docs/arkitektur.md` avsnitt 8.
- **`test/stubs/supabaseFake.ts` kan glida semantiskt från riktig
  PostgREST.** Adapterfrågorna hålls medvetet enkla (en tabell, `eq`/
  `order`, inga joins/RPC:er) för att minska den risken —
  `rls.live.test.ts` är sanningen den dagen det är osäkert.
- Inga nya problem i övrigt. `.mcp.json` (otrackad) rördes inte.

### Återstår (andra sessioner)

- Applicera migreringarna mot en riktig Supabase-databas och kör
  `rls.live.test.ts` manuellt (grundaren).
- De fyra medvetna metod-stubbarna ovan, var och en beror på ett separat
  beslut eller en separat modul (Medgrundaren för profilsamtal/
  idégenomlysning, Utskick och svar för "Vad hänt sedan sist").
- Resten av `/app/*`-sidorna (Resan, Poäng, Marknad, Kunder, Pulsen,
  Minnet, Juridik, Bygg) — portarna och nu fem liveadaptrar finns, men
  ingen route eller skärm är kopplad ihop än utöver Hem.
- Övriga sju moduler (Medgrundaren, Registret, Webbresearch/Pulsen,
  Simuleringar, Utskick och svar, Bygg) — se `docs/uppdrag.md` avsnitt 13
  och `docs/sessioner.md`.

## Session — Saras steg 01–06 i djup (klar, gren `prototyp`)

Uppdrag: bygg Saras steg 01–06 i djup, inte bara i bredd (uppdrag 9.1) —
tre klickbara moment per steg (före/körning/efter), kalibrera poängen mot
9.3, gör nedgången i steg 05 pedagogisk, bygg ut simuleringsytorna i steg
03/04/06, verifiera att demot alltid startar i onboardingen och att allt
finns på båda språken. Tre commits: portar/komponenter/simulering,
innehållet i `sara.ts` + de kringliggande demoadaptrarna, sist UI-wiring
på Resan/[steg] och en `−0`-fix på Hem/Poäng.

### Klart

- **`adapters/demo/sara.ts` omstrukturerad:** steg 01–06 har nu 20 beats i
  stället för 6 — varje steg är `<id>-fore`/`<id>-korning`/`<id>-efter`
  (`makeStepBeats`-hjälparen), steg 05 en egen femdelad form
  (`05a-utskicket-{fore,korning,efter}` + `05b-svaren-{korning,efter}`).
  Poängen ändras aldrig i före/körning (samma `PartEvidence` som
  föregående stegs efter-moment, kopierat rakt av) — bara `-efter` bär ny
  evidens. Steg 07–12 orörda i sak (bara ett nytt `momentKind: "after"`
  tillagt på varje, `Beat`-typen kräver det nu).
- **Kalibrering (uppdrag 9.3, högst ±2):** 6, 14 (−2), 24, 27 (−2), 47,
  43, 54 — steg 01, 03, 05 (både 47 och 43) och 06 träffar målvärdena
  exakt. Steg 02 och 04 är matematiskt tvungna till −2 inom nuvarande
  fasarkitektur: Passform är låst vid sitt facit-värde 8 (rör man det
  spricker steg 12:s redan godkända slutnedbrytning) och Marknad är
  hård-kappad vid sin vikt 12, så det enda röbara i de två stegen är
  Konkurrens — och den är redan i sitt tak (8) vid steg 04. Fixet som
  faktiskt gjordes: steg 03:s egna Konkurrens-bevis sänktes från 7 till 5
  poäng (en isolerad ändring, bara det beatet — flyttade steg 03 från +2
  till exakt 24) medan steg 04 och alla senare steg behåller sina
  ursprungliga bevis. Verifierat med ett tillfälligt testskript (inte
  kvarlämnat) att steg 07–12 ger exakt samma totalsummor som innan
  ändringen (60, 66, 70, 77, 88, 92) — ingen cascading-effekt.
- **Steg 05:s nedgång (avsnitt 9.1, punkt 3):** `05b-svaren-efter`s
  highlights förklarar regeln konkret i stället för att bara säga att
  poängen sjunker: Betalningsvilja bygger på två bevisposter (+9 för de
  sex positiva, −3 för de tre som säger nej), en av två (50 %) motsäger
  vilket är över 30 %-tröskeln, så hela delen straffas 15 %:
  `(9 − 3) × 0,85 ≈ 5`. Siffrorna är verifierade mot `core/score.ts`s
  faktiska beräkning, inte påhittade för att låta pedagogiska.
- **`SimulationCard`** (`components/spark/SimulationCard.tsx`) — fanns i
  komponenttabellen (uppdrag 8) men var aldrig byggd. Visar alltid
  Simulering-etiketten, populationens storlek, källan och
  osäkerhetsintervallet. `Market`-vyn visade tidigare INTE
  populationsstorleken alls — en verklig lucka mot uppdrag 2.2/kravet i
  den här sessionen, nu fixad. Wire:ad in på Marknad (steg 03, befintlig
  simulering), Kunder (steg 04, ny simulering om betalningstolerans per
  byråstorlek — `adapters/demo/SimulationProvider.ts` fick en tredje
  kanonisk simulering, `"tolerance"`) och Resan/[steg] för alla tre steg
  (03/04/06), via nya fält på `JourneyStepDetail`.
- **`ports/JourneyRepository.ts` utökad:** `JourneyStepDetail` har nu
  `momentKind` ("before"/"running"/"after"), `scoreDelta`,
  `newlyUnlockedParts` och `verdict` utöver `simulation`. Alla kod-
  härledda i `demoJourneyRepository.getStepDetail` (poängdiff mot
  föregående beat, låsta-delar-diff för upplåsning) — inget hårdkodat.
  `adapters/live/JourneyRepository.ts` uppdaterad med trygga
  default-värden (`momentKind: "after"`, resten `null`/`[]`) så
  plattformen fortsätter kompilera; ingen ny livefunktionalitet byggd.
- **`screens/JourneyStep.tsx`** renderar nu momentpillen, en körnings-
  hint (pekar mot Medgrundaren när `momentKind === "running"`),
  poängändring med förklaring, "Nyupplåst"-listan, `VerdictCard` (steg
  06 — den befintliga men tidigare oanvända komponenten) och
  `SimulationCard` (steg 03/04/06).
- **`adapters/demo/PulseProvider.ts`:** fem signaler i stället för fyra
  (tre synliga från start, håller kontraktstestets 3–5-krav i varje
  läge), två låses successivt upp efter `03-marknaden-efter` respektive
  `06-domen-efter` — den sistnämnda bekräftar segmentbytet från Domen med
  en oberoende registersignal. `getTodaysSignal` visar den senast
  upplåsta i stället för en statisk signal.
- **`adapters/demo/MemoryRepository.ts`:** Spåret loggar bara beats med
  `momentKind === "after"` — annars hade varje steg gett tre rader i
  Spåret för samma händelse. Ny `traceSummary`-text per efter-beat
  (kort, retrospektiv) i stället för att återanvända uppgiftens titel.
- **`adapters/demo/OutreachProvider.ts`:** Kunder-tabellens status
  (draft/sent/opened/responded) följer nu beatens `momentKind` och
  `id`-prefix (`stageFor`) i stället för en enda hårdkodad
  `beat.id === "05a-utskicket"`-jämförelse. Svarsvågorna delades upp på
  riktigt: de sex som bekräftar problemet syns från `05a-utskicket-efter`,
  de tre som säger nej till priset syns först från `05b-svaren-efter`
  (tidigare visades alla nio samtidigt så fort steg 05b nåddes).
- **`adapters/demo/cofounderScript.ts`:** en nyckel per moment
  (`-fore`/`-korning`/`-efter`). Steg 01 och 06 fick var sitt
  `ToolRunCard` (profilsammanställning respektive domen) som tidigare
  helt saknades — de var bara chattmeddelanden.
- **`−0`-buggen i Poängrörelse-kortet fixad på riktigt** (Hem och Poäng):
  var ett känt kosmetiskt problem sedan Session 2 (visade "−0" utan text
  efter vid oförändrad poäng), men blev mycket vanligare nu när varje
  steg har två moment (före/körning) utan poängändring. Sektionen göms
  nu helt när `delta === 0`.
- **Onboarding startar alltid om (uppdrag 9.1):** verifierat, inte
  ändrat — `onboardingDone`-flaggan och redirecten från Session 5
  fungerar fortfarande oförändrat med de nya beatsen (`beatIndex 0` är
  bara ett annat, tidigare beat nu).
- **Båda språken:** allt nytt scenarioinnehåll (`sara.ts`,
  `cofounderScript.ts`, pulssignalerna, betalningstoleranssimuleringen)
  och alla nya i18n-nycklar (`journeyPage.momentPill`/`runningHint`/
  `scoreChangeTitle`/`unlockedTitle`/`simulationTitle`,
  `customersPage.simulationTitle`, `common.simulationPopulationLabel`)
  finns typtvingat på sv och en.
- Verifierat: `pnpm typecheck`/`lint`/`test` (227 tester, 192 gröna + 35
  förväntat skippade) och `pnpm build` går alla igenom utan fel eller
  varningar. `pnpm start` + `curl` mot alla `/demo/*`- och publika routes:
  200 överallt (`/demo`/`/app` → 307 som väntat).

### Beslut nästa session behöver känna till

- **Steg 02 och 04 ligger permanent på −2** inom den nuvarande
  fasarkitekturen (se kalibreringsresonemanget ovan) — det går inte att
  stänga gapet helt utan antingen ett tredje `EvidenceItem` för Passform
  (bryter steg 12:s facit) eller att lätta Marknads prelimiär-tak i
  `core/score.ts` (bryter `core/score.test.ts`s beskrivna regler). Låt
  dem vara −2 om inte grundaren uttryckligen vill ändra formlerna.
  `adapters/demo/sara.ts`s header dokumenterar samma resonemang.
  Motsvarande resonemang gäller om Jonas (Persona B, Session 5+) någon
  gång får samma djup — samma fasarkitektur, samma begränsning.
- **`makeStepBeats`-mönstret i `sara.ts`** är tänkt att återanvändas rakt
  av när Jonas fulla resa eller andra scenarier byggs i djup — se
  kommentaren överst i filen och `StepBeatsInput`-typen.
- **`Beat.momentKind` är nu obligatoriskt** på varje beat (inklusive
  steg 07–12, som alla är `"after"`). Ett nytt scenario som inte sätter
  fältet failar typecheck direkt, inte i körning.
- **Ingen webbläsarverifiering** — Claude in Chrome-tillägget var inte
  anslutet i den här sessionen (samma begränsning som Session 3 och 5).
  Verifierat i stället med `typecheck`/`lint`/`test` (inklusive
  komponenttester som faktiskt klickar igenom `DemoBar`s Nästa/Bakåt),
  `pnpm build` och `curl` mot alla routes. **Klicka igenom alla 27 beats
  i `/demo/app` på båda språken i en riktig webbläsare** innan nästa
  session bygger vidare ovanpå det här — särskilt steg 05:s nedgång och
  "Hoppa till steg"-popoverns nya längd (27 rader, fick `max-h-[70vh]
  overflow-y-auto` i `DemoBar.tsx` men är overifierad i en riktig
  webbläsare).
- **`ports/JourneyRepository.ts`s nya fält är demo-bara i praktiken.**
  Liveadaptern returnerar trygga default-värden men bygger ingen egen
  logik för moment/upplåsning/simulering — det är en framtida
  plattformssessions uppgift när Resan-modulen görs klar där, se
  `docs/moduler/resan.md`.

### Kända problem / medvetna begränsningar

- **Steg 07–12 har fortfarande bara ett moment vardera** (oförändrat
  sedan Session 3) — den här sessionens djup gäller uttryckligen bara
  01–06, per uppdraget.
- **"Hoppa till steg"-popoverns 27 rader** är overifierad i en riktig
  webbläsare (se ovan) — fungerar i teorin (Radix Popover + `overflow-y-
  auto`) men inte klickad igenom.
- Inga nya problem i övrigt.

## Session — Två flödesfixar, Saras steg 07–12 i djup (klar, gren `prototyp`)

Uppdrag: (1) profilsamtalet ska gå framåt utan klick, (2) Medgrundaren ska
visa en ren chattyta i stället för hela historiken, (3) Session 4 — Saras
steg 07–12 i samma tre-momentsdjup som 01–06 (uppdrag 9.1), med extra
noggrannhet på steg 07:s prissättningsunderlag och steg 10:s
Lovable-koncept. Två commits: flödesfixarna, sedan djupet i 07–12.

### Klart — flödesfixar
- **`screens/OnboardingProfile.tsx`:** profilsamtalet går nu framåt av sig
  själv. Medgrundarens fråga visas, svaret dyker upp ~900 ms senare, och
  samtalet går vidare till nästa fråga ~1 400 ms efter det — ingen knapp
  att klicka på längre. Implementerat med två `useEffect` som bara sätter
  state inuti `setTimeout`-callbacks (ESLints `react-hooks/set-state-in-
  effect` tillåter inte synkrona `setState`-anrop i en effekts body direkt
  — se kommentarerna i filen). Ett bytt ingång (annat persona-samtal)
  monteras om via `key={entry}` på anropande route
  (`app/demo/start/profil/page.tsx`) i stället för att skärmen nollställer
  sitt eget state — enklare och undviker samma lintregel.
  `screens/OnboardingProfile.test.tsx` omskrivet till `vi.useFakeTimers()`
  och `vi.advanceTimersByTime(...)` i stället för `fireEvent.click`.
- **`screens/Cofounder.tsx` + `app/demo/app/medgrundaren/page.tsx`:**
  Medgrundaren visade tidigare HELA historiken (`saraBeats.slice(0,
  beatIndex + 1)`, alla nådda moments transkript i följd) — en skärm som
  bara växte längre för varje klick i demoraden. Visar nu bara det
  AKTUELLA momentets transkript. Tidigare "-efter"-moments Spår-
  sammanfattningar visas i stället som en kort "Sedan tidigare"-rad
  (`CofounderData.context`, ny i18n-nyckel `cofounderPage.contextTitle`)
  — kort text, inga chattbubblor, ingen scroll. `CofounderData.moments`
  (array) ersatt av `CofounderData.moment` (singular, kan vara `null`).
  Ingen befintlig skärmtest fanns för `Cofounder.tsx` (bara portkontrakt
  och en stubStatus-referens), så inget att uppdatera där.
- **Avsnitt 10 tillämpat på riktigt:** lade till Medgrundarens föreslagna
  exempelrad från uppdraget rakt av ("Du sa i steg 06 att du hellre
  tappar småbyråerna än sänker priset") i `07-affarsfall-korning` —
  Medgrundaren tar nu tillbaka ett tidigare beslut i själva repliken, inte
  bara i en textrad ovanför chatten.

### Klart — Session 4: Saras steg 07–12 i djup
- **`adapters/demo/sara.ts`:** steg 07–12 omskrivna från ett enda
  `momentKind: "after"`-beat vardera till samma `makeStepBeats`-mönster
  som 01–06 (`-fore`/`-korning`/`-efter`, 18 nya beats totalt). Poängen
  ändrades INTE — samma `partsAfter`/`EvidenceItem`-poäng som innan,
  bara ompaketerat. Verifierat med ett tillfälligt testskript (inte
  kvarlämnat, se nedan) att totalsummorna per steg är oförändrade: 60,
  66, 70, 77, 88, 92 — identiska med Session 3:s redan godkända
  kalibrering (±2 mot 9.3:s 60, 66, 69, 78, 88, 91).
- **Fasövergång rättad på riktigt under arbetet:** `makeStepBeats` kräver
  att `phaseBefore`/`phaseAfter` matchar VILKEN fas som faktiskt låser upp
  en dels bevis (`core/score.ts`s `PHASE_UNLOCKED_PARTS`) — en del som är
  upplåst men saknar bevis kastar `calculateScore`s "ingen poäng utan
  källa"-fel. Steg 07 sattes först fel till `phaseBefore: "launch"` (borde
  vara `"tryAfterCalls"` — Produkt/Genomförbarhet låses upp först i
  steg 07:s EGET "-efter") och steg 11 fel till `phaseBefore: "grow"`
  (borde vara `"launch"` — Traktion låses upp först i steg 11:s EGET
  "-efter"). Båda upptäcktes direkt av `pnpm test` mot ett tillfälligt
  kalibreringsskript och rättades. Ett bra exempel på varför `makeStepBeats`
  är värt att återanvända rakt av i stället för att fritt välja
  fas per steg.
- **Steg 07 (Affärsfall och pris) — prissättningsunderlaget gjort
  explicit:** highlights radar nu upp alla fyra underlagen enskilt (1.5:
  vad kunderna tål, vad jämförbara aktörer tar, vad kunderna själva sagt,
  vad som krävs för att gå ihop), med faktiska tal för var och en, i
  stället för en enda sammanfattande mening. Kostnadsgolvets aritmetik
  verifierad: 8 × 1 190 kr = 9 520 kr > 8 500 kr (break-even vid 8 kunder
  stämmer). Steg 07 fick också en egen `simulationKind: "price"` (återanvänder
  steg 06:s prissimulering, 1 000–1 300 kr) — avsnitt 2.2 nämner
  uttryckligen steg 03, 04, 06 OCH 07 som Hiasynth-ytor; bara 03/04/06 hade
  en simulering kopplad innan den här sessionen.
- **Steg 10 (Live) — Lovable-konceptet fördjupat:**
  - `ports/BuildProvider.ts`/`adapters/demo/BuildProvider.ts`:
    `getStatus()` returnerar nu även `creditsUsed` (avsnitt 2.3: "Visa att
    bygget kostar credits") — 40 credits under byggfasen, 62 efter
    publicering, `undefined` innan bygget påbörjats. `screens/Build.tsx`
    visar talet bredvid statuspillret (`buildPage.creditsUsedLabel`, ny
    i18n-nyckel). `types/bygg.ts`s `ByggBrief` rördes INTE (grundarens
    regel om att den filen inte skrivs om) — credits ligger i porten, inte
    i briefen.
  - `cofounderScript.ts` "10-live-korning": `ToolRunCard`s steg utökade
    till att uttryckligen spegla 2.3:s "skelett → komponenter → färdig
    sida" i stället för de tre vagare stegen som fanns innan.
  - `sara.ts` steg 10:s highlights nämner nu uttryckligen "Bygg drivs av
    Lovable · Koncept · partnerskap utforskas" (avsnitt 2.3:s exakta
    märkningstext) och credits-kostnaden.
- **`traceSummaryAfter` tillagt för alla sex stegen** — saknades helt
  innan (Spåret föll tillbaka på en generisk `momentLabel — title`-rad),
  nu en egen kort retrospektiv rad per steg, som för 01–06.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (227 tester, 192
  gröna + 35 förväntat skippade — oförändrat antal, inga nya testfiler
  behövdes) och `pnpm build` går alla igenom utan fel eller varningar.

### Beslut nästa session behöver känna till
- **`makeStepBeats`s `phaseBefore`/`phaseAfter` måste matcha exakt VILKET
  steg som introducerar en dels FÖRSTA bevis**, inte bara vilken fas som
  "känns rätt" för stegets nummer — se resonemanget ovan om steg 07/11.
  Kontrollera alltid mot `core/score.ts`s `PHASE_UNLOCKED_PARTS` innan en
  ny makeStepBeats-instans skrivs, särskilt för Jonas (nästa session).
- **Kalibreringsverifiering:** mönstret med ett tillfälligt
  `scratch.<namn>.test.ts` (vitest, skriver till `/tmp/...` eftersom
  `console.log` inte alltid syns i CI-liknande körning) som körs med
  `pnpm test scratch.<namn>` och sedan tas bort igen — INTE committat —
  är det etablerade sättet att kontrollräkna `calculateScore`-summor
  under utveckling. Använd samma mönster för Jonas.
- **`CofounderData` har ett nytt skal** (`context` + `moment` i stället
  för `moments`) — om Jonas kopplas in i Medgrundaren, bygg vidare på det
  skalet (en `context`-rad per tidigare "-efter"-beat, ett `moment` för
  den aktuella), inte den gamla `moments`-arrayen.

### Kända problem / medvetna begränsningar
- Inga nya. `07-affarsfall-korning`/`10-live-korning`s nya
  `ToolRunCard`-steg är fortfarande bara text, ingen ny animation eller
  komponent.

## Session — Jonas hela resan (klar, gren `prototyp`)

Uppdrag: fixa buggen att ingång B laddade Sara i stället för Jonas, bekräfta
att idégenomlysningen inte hoppas över, och bygg Jonas hela resa (9.4) med
pivoten i steg 06 och de tolv målpoängen. Två commits: motorn
(`adapters/demo/jonas.ts` + `journeyEngine.ts` + wiring), sedan
`docs/status.md`.

### Klart
- **Verifierat, inget kodfel:** `screens/OnboardingEntry.tsx` länkade redan
  korrekt "Jag har redan en idé" till `${basePath}/ide` (idägenomlysningen)
  före `${basePath}/profil` — samma ordning som uppdrag 2.1 beskriver
  (genomlysning → kortare passform-samtal). Ingången hoppade alltså INTE
  över genomlysningen i koden; den verkliga buggen var att `/demo/app`
  ALLTID visade Saras data efter onboardingen, oavsett vald ingång — se
  nedan.
- **Buggen fixad:** `adapters/demo/ProfileRepository.ts`s `getProfile()`
  returnerade alltid `saraProfile`. Läser nu `entry` ur `useDemoStore`
  (samma mönster som övriga demoadaptrar läser `beatIndex`) och
  returnerar `jonasProfile` i ingång B — porten `getProfile()` tar
  medvetet inte emot `entry` som parameter (en inloggad
  plattformsanvändare har bara en profil).
- **`adapters/demo/jonas.ts`, nytt:** Jonas fulla scenario (9.4), byggt i
  BREDD (ett `momentKind: "after"`-beat per kontrollpunkt — INTE samma
  tre-momentsdjup som Saras steg 01–12 fick i tidigare sessioner, en
  medveten avgränsning, se "Återstår" nedan). 13 beats: steg 01 (om dig,
  redan fört i onboardingen), steg 02 (genomlysningen, ersätter
  "Möjligheter"), steg 03–05, steg 06a (pivot — poängen sjunker 41→38 via
  samma motsägelsemekanik som Saras steg 05b), steg 06b ("Efter nya
  samtal", 9.4:s egen kontrollpunkt mellan 06 och 07 — byggd som ett andra
  steg-06-beat, samma mönster som Saras 05a/05b), steg 07–12. Alla tolv
  målpoängen (12, 22, 28, 41, 38, 52, 58, 64, 68, 76, 86, 89) träffas
  EXAKT — verifierat med ett tillfälligt kalibreringsskript (inte
  kvarlämnat, se mönstret i förra sessionens post). Fiktiva konkurrenter
  (BanBokarn, Hallkalendern) och fiktiva kundsiffror (4 betalande hallar,
  7 600 kr MRR) — inga riktiga bokningssystem namngivna.
- **`adapters/demo/sara.ts` utökad, inte omskriven:** `källa`, `pt`,
  `parts`, `partsBoth`, `noSinceLastTime`, `zeroSinceLastTimeBoth`,
  `withMoment`, `makeStepBeats`, `StepBeatsInput` exporterade (var
  privata) så `jonas.ts` kan återanvända dem rakt av i stället för att
  duplicera — precis vad `sara.ts`s egen header-kommentar redan
  rekommenderade. Ny `saraEngine`-export (se nedan). En liten sidoeffekt:
  `noSinceLastTime`s platshållarkälla använde tidigare
  `demoBar.personaLabel` som källnamn — den i18n-nyckeln togs bort (se
  nedan), ersatt med en egen, egennamnsfri bilingual sträng lokalt i filen.
- **`adapters/demo/journeyEngine.ts`, nytt:** ett gemensamt `JourneyEngine`-
  skal (beats, steps, förslagskandidater, alla `get*For*`-funktionerna) och
  `engineFor(entry)` som väljer `saraEngine` (sara.ts) eller `jonasEngine`
  (jonas.ts). Adderat FÖRST som en typ + väljarfunktion, inte en
  ombyggnad av sara.ts:s befintliga exportyta — `saraEngine`/`jonasEngine`
  är bara tunna objekt som pekar på redan existerande funktioner.
- **Sju filer gjorda ingångsmedvetna via `engineFor`/direkt `entry`-läsning:**
  `adapters/demo/demoStore.ts` (`setEntry` nollställer nu `beatIndex` —
  annars hade ett byte mitt i en resa lämnat kvar ett index som betyder
  något helt annat i den andra personans kortare array; `getCurrentBeat`/
  `getCurrentStepNumber` ingångsmedvetna), `adapters/demo/
  JourneyRepository.ts`, `adapters/demo/EvidenceRepository.ts`,
  `adapters/demo/MemoryRepository.ts` (Profilen-fliken OCH Spåret),
  `adapters/demo/ProfileRepository.ts`, `components/spark/DemoBar.tsx`
  (steg/fas-etikett, "Hoppa till steg"-popoverns lista, `atEnd`-gränsen,
  persona-etiketten), `app/demo/app/medgrundaren/page.tsx`.
- **`adapters/demo/jonasCofounderScript.ts`, nytt:** ett meddelande/
  verktygskörning per Jonas-kontrollpunkt (13 nycklar), samma
  `TranscriptItem`-form som `cofounderScript.ts` (typen importerad
  därifrån, inte duplicerad). Medgrundaren-routen väljer skript ur
  `entry`, precis som den redan väljer motor.
- **Persona-etiketten avegennamnad ur i18n:** `demoBar.personaLabel`
  ("Sara Lindqvist · Persona A", hårdkodat namn i en i18n-sträng — ett
  brott mot Session 1:s egen regel, "Egennamn hör hemma i källdata")
  ersatt med `personaALabel`/`personaBLabel` ("Persona A"/"Persona B",
  inga namn) som `DemoBar.tsx` nu komponerar ihop med det verkliga
  profilnamnet ur `sara.ts`/`jonas.ts`. Samma sak för
  `cofounderPage.subtitle`, som hårdkodade "Sara" — generaliserad till att
  inte nämna en persona alls. Båda var redan fel innan den här sessionen
  (skulle ha visat "Sara" även i Jonas läge om entry-bytet fungerat) —
  upptäckt och fixat i samma veva som huvudbuggen.
- **Nytt test, `adapters/demo/entrySwitch.test.ts`:** bevisar att
  `ProfileRepository`, `JourneyRepository` och `EvidenceRepository`
  faktiskt växlar mellan Sara och Jonas när `entry` byts (inte bara att
  Jonas eget scenario internt räknar rätt) — direkt regressionsskydd för
  den bugg sessionen fixade. Kontrollerar bland annat att poängen träffar
  5 → 12 → 38 (pivoten) → 89 i Jonas resa via de riktiga demoadaptrarna,
  inte bara mot `jonas.ts` isolerat.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (232 tester, 197
  gröna + 35 förväntat skippade — fem nya gröna från `entrySwitch.test.ts`)
  och `pnpm build` går alla igenom utan fel. `pnpm start` kolliderade med
  en redan körande `next dev`-process i miljön (utanför den här sessionens
  kontroll) — `curl` mot alla routes (inklusive `/demo/app/resan/6`,
  `/demo/start/ide`) gick i stället mot den körande dev-servern: 200/307
  som väntat, inga serverfel i loggen.

### Beslut nästa session behöver känna till
- **Jonas är byggd i BREDD, inte djup** — ett moment (`"after"`) per
  kontrollpunkt, ingen `-fore`/`-korning`-uppdelning som Saras steg 01–12
  har. En framtida session som vill ge Jonas samma djup kan återanvända
  `makeStepBeats` rakt av (importerad från sara.ts, redan exporterad) —
  se kalibreringsfällan i förra sessionens post om `phaseBefore`/
  `phaseAfter` innan den skriver nya beats.
- **Följande demoadaptrar/sidor är MEDVETET INTE gjorda ingångsmedvetna**
  och visar fortfarande Saras innehåll oavsett `entry` — flaggat, inte en
  bugg som glömdes: `PulseProvider` (Pulsen-sidan och Hem/dagens signal),
  `OutreachProvider`/`RegistryProvider` (Kunder- och Marknad-sidornas
  företagslistor — `saraCompanies`), `BuildProvider` (Bygg-sidans spec är
  Kvittojaktens, inte Beläggningsprognosens), `LegalAdvisor`-demoadaptern
  (Juridik-sidan). En session som vill göra Jonas resa fullständig bör
  börja här, i den ordningen (Pulsen och Kunder syns oftast i en genomgång).
  `SimulationProvider` behöver INGEN ändring — Jonas beats sätter
  medvetet aldrig `simulationKind`, så Marknad/Kunder/Resan visar helt
  enkelt ingen simulering för honom i stället för en påhittad.
- **`JourneyEngine`-mönstret (`adapters/demo/journeyEngine.ts`) är tänkt
  att återanvändas** om en tredje persona någonsin läggs till — lägg bara
  till en `xEngine`-export i den nya scenariofilen och utöka `engineFor`.
- **`saraEngine`/`jonasEngine` är additiva ovanpå sara.ts/jonas.ts:s
  redan existerande fria funktioner** — de fria funktionerna
  (`getScoreSnapshotForBeat` med flera) är fortfarande exporterade och
  används direkt av kod som medvetet ALLTID ska vara Sara-specifik
  (`BuildProvider.ts`, `LegalAdvisor`-demoadaptern, `Marknad`/
  `Kunder`-sidorna via `getCurrentStepNumberFor`). Byt inte de importerna
  till `engineFor` utan att samtidigt göra hela den modulen
  ingångsmedveten (se listan ovan) — annars blandas Saras och Jonas
  `beatIndex`-tolkning på ett sätt som bara råkar fungera för Sara.

### Kända problem / medvetna begränsningar
- **Ingen manuell webbläsarverifiering** av Jonas resa — samma begränsning
  som flera tidigare sessioner (inget webbläsarverktyg anslutet).
  Verifierat i stället med `typecheck`/`lint`/`test` (inklusive det nya
  `entrySwitch.test.ts` som klickar igenom entry-bytet via de riktiga
  adaptrarna, inte bara mot rådata), `pnpm build`, och `curl` mot alla
  routes. Klicka igenom hela Jonas resa i en riktig webbläsare, båda
  språken, särskilt pivoten i steg 06 och "Byt ingång" mitt i en pågående
  Sara-demo, innan nästa session bygger vidare.
- **Jonas steg 01 saknar en egen händelse i /demo/app** — passform-samtalet
  hände redan i onboardingen (`/demo/start/profil`), så beatet är bara en
  bekräftelse av det som redan visats, inte ett nytt klickbart moment.
  Samma mönster som Sara hade före djupsessionen, medvetet kvar för Jonas.
- De sju icke-ingångsmedvetna modulerna listade ovan under "Beslut nästa
  session" — upprepas här för synlighet: en presentatör som visar hela
  Jonas resa bör undvika Pulsen-, Kunder-, Marknad-, Bygg- och
  Juridik-sidorna, eller förklara att de fortfarande speglar Sara.

## Session 6 — Landningssida (klar, gren `prototyp-landning`, mergead in i `prototyp`)

Uppdrag: bygg `/`, `/priser`, `/logga-in` och `/skapa-konto` enligt
`docs/uppdrag.md` avsnitt 5 och 6, i Fonda-stilen, med riktiga produktkort i
sektionerna. Fullständig motivering per sektion i `DESIGN.md` under samma
rubrik — det här är en kort sammanfattning.

### Klart
- **`app/(marketing)/layout.tsx`, ny:** delad ram för `/` och `/priser` —
  `components/spark/PublicHeader.tsx` (ljus, sticky: logga, Priser, Logga in,
  SV/EN, "Starta demo") och `PublicFooter.tsx` (tagline, produkt-/
  kontolänkar, fiktions-/ansvarsnot). `/logga-in`/`/skapa-konto` (P1, redan
  riktiga Supabase-formulär) **återanvända oförändrade** — behöll sin egna
  minimala `AuthLayout`-header i stället för `PublicHeader`, se `DESIGN.md`
  för varför.
- **`app/(marketing)/page.tsx` omskriven helt:** hero ("Din idé. *Spark* gör
  resten.", `NextStepCard` som levande produktkort) plus alla nio sektionerna
  i uppdrag 6 (Problemet, Datalöftet, Resan i rutnät, fyra saker
  Medgrundaren gör, Poängen, Juridisk koll, Minnet som chattutdrag, Koncept
  på väg — Hiasynth/Lovable tydligt märkta, Priser/FAQ/avslutning). Bygger
  uteslutande på befintliga designsystemkomponenter
  (`NextStepCard`/`ToolRunCard`/`ChatMessage`/`PulseCard`/`VerdictCard`/
  `LegalMap`/`SimulationCard`/`DataFact`/`ConceptBadge`) plus en liten ny
  lokal `FeatureCard`-hjälpare (återanvänd fem gånger, motiverar sig själv).
  Inga konkurrenter nämnda vid namn. Nämnda datasiffror (312 byråer,
  4,2 Mkr, 18 %) är uppdragets egna exempeltal ur avsnitt 1.1, med
  Bolagsverket/SCB som källa via `DataFact`/`SourceTag`.
- **`app/(marketing)/priser/page.tsx`, ny:** tre nivåer (Gratis, Grundare
  199 kr/mån, Bygg-credits) under en gemensam "Förslag — inte fastställda
  priser"-etikett, enligt uppdrag 6. Grundare-nivån visuellt högsta
  prioritet ("Mest valt").
- **i18n:** fyra nya toppnycklar i `i18n/dictionary.ts`
  (`publicNav`/`publicFooter`/`landingPage`/`pricingPage`), fullt typade och
  skrivna på båda språken. Egennamn (Bolagsverket m.fl.) förklaras med en
  kort parentes vid första engelska förekomsten i stället för en ny
  tooltip-komponent — se "Kända problem" nedan.
- **Test:** `app/(marketing)/page.test.tsx` — SV-innehåll och EN-innehåll
  (EN verifierad via `localStorage`-satt `spark:locale`, inte en klickad
  `LanguageSwitch`, eftersom headern med växeln ligger i layouten och inte
  testas här), plus `/priser`s tre nivåer.
- **Manuell verifiering i webbläsare** (Playwright, headless Chromium,
  tillfälligt installerat i en scratch-mapp utanför repot — inget
  webbläsarverktyg anslutet i den här sessionen): `/` och `/priser` på båda
  språken, alla nio sektionerna, inga konsolfel. En verklig layoutbugg
  hittades och fixades under det: "Ett steg i taget"-kortet i "Fyra saker
  Medgrundaren gör" var tomt jämfört med sina tre syskon i samma
  grid-rad-par — fixad med en liten poäng-/tidsrad, se `DESIGN.md`.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` och `pnpm build`
  går alla igenom utan fel eller varningar. Branchen `prototyp-landning`
  skapad från `prototyp`, committad, pushad och mergead tillbaka in i
  `prototyp` (ingen PR-genomgång — sessionens instruktion bad uttryckligen
  om en sammanslagen branch, inte en öppen PR).

### Beslut nästa session behöver känna till
- **`/logga-in`/`/skapa-konto` är oförändrade sedan P1** — riktiga
  Supabase-formulär, inte de "fejkade formulär" uppdragstextens
  ursprungliga avsnitt 6 beskrev. `docs/sessioner.md`s egen
  Session 6-anteckning ("återanvänd inloggningen från P1 om den finns")
  väger tyngre här.
- **`FeatureCard`** (lokal i `app/(marketing)/page.tsx`, inte exporterad)
  är en enkel titel+brödtext+children-kortmall, medvetet inte flyttad till
  `components/spark/` — används bara på den här sidan i dag. Flytta den dit
  först om ett tredje ställe faktiskt behöver den.
- **`VerdictCard`s `score={54}`** på landningssidan är avsiktligt samma
  poäng som Saras riktiga steg 06 i demot (kontinuitet), inte en generisk
  platshållarsiffra — ändra den bara om steg 06:s facit någonsin ändras.

### Kända problem / medvetna begränsningar
- **Ingen tooltip-komponent** för att förklara svenska myndighetsnamn på
  engelska (uppdrag 4) — löst med en inline-parentes i stället
  ("Bolagsverket and SCB, Sweden's company registry and statistics
  agency"). En riktig tooltip-primitiv finns inte i designsystemet än.
- **`DataFact`s `SourceTag`-pill kan radbryta** i den smalaste av
  Datalöftet-sektionens tre rutor vid 1440 px bredd — samma komponent och
  mönster som redan används i `screens/Market.tsx` (fast med 4 kolumner
  där, trängre här med 3 kolumner i en halv `max-w-6xl`-bredd). Kosmetiskt,
  ingen bruten layout.
- **Ingen webbläsarverifiering av `/logga-in`/`/skapa-konto`** i den här
  sessionen (de rördes inte, och var redan verifierade i P1).

## Session 7 — Guidad rundtur, demo-manus (klar, gren `prototyp`)

Uppdrag: bygga klart den guidade rundturen (avsnitt 9.2), skriva
`docs/demo-manus.md` i en 5- och en 10-minutersversion, och klicka igenom
båda personorna på båda språken och rätta det som var trasigt. Sessionen
återupptog ett tidigare avbrott (commit `a96fd80`, "Session 7 pågående")
som redan hade skrivit alla 20 stoppens innehåll (`adapters/demo/
tourSteps.ts`) och satt `data-tour-id` på 8 av 15 mål — men ingen
overlay-komponent renderade rundturen än. Två commits: overlayen +
kvarvarande mål, sedan manuset + status.md.

### Klart
- **Verklig bugg fixad innan overlayen ens byggdes:** `demoStore.ts`s
  `toggleTour()` navigerar till stopp 1:s route (`/demo/app`) men satte
  inte `onboardingDone`. `app/demo/app/layout.tsx`s onboarding-koll hade
  därför skickat tillbaka till `/demo/start` direkt så fort någon startade
  rundturen innan de klickat sig igenom onboardingen — samma mönster som
  `DemoBar.tsx`s redan existerande `jumpToStep` löser, nu tillämpat på
  `toggleTour` också.
- **De 7 kvarvarande `data-tour-id`-målen** tillagda: `journey-verdict`/
  `journey-highlights` (`screens/JourneyStep.tsx`), `score-breakdown`/
  `score-suggestions` (`screens/Score.tsx`), `legal-map`
  (`screens/Legal.tsx`), `build-spec` (`screens/Build.tsx`), `pulse-list`
  (`screens/Pulse.tsx`) — alla 15 mål som `tourSteps.ts` refererar finns
  nu i markupen.
- **`components/spark/TourOverlay.tsx`, ny:** hela overlay-lagret.
  Navigerar till stoppets route och hoppar till stoppets `beatId` (sökt
  upp i `saraBeats` — rundturen tvingar alltid entry till "noIdea", se
  `demoStore.ts`s `toggleTour`) i två separata effekter. Spotlighten hittas
  via `document.querySelector('[data-tour-id="…"]')` och mäts om **varje
  animationsframe** medan ett stopp med `target` är aktivt (inte
  engångs-scroll/resize-lyssnare) — självläkande om innehållet under
  hinner flytta sig efter att demodatan laddat klart, utan att behöva
  gissa en fördröjning. Spotlighteffekten är en enda osynlig ruta i målets
  storlek vars 9999px-spridda `box-shadow` fyller resten av skärmen (`0 0
  0 9999px rgba(...)`), inte ett separat dimmat lager ovanpå — se
  kommentaren i filen om varför ett sådant extra lager hade täckt över
  hålet igen (upptäcktes och fixades under bygget, aldrig committat i det
  trasiga skedet). Kort med titel/text (båda språken), "Stopp X av 20",
  Nästa/Hoppa över/Avsluta rundtur, en liten CSS-pilspets mellan kort och
  spotlight, centrerat kort för de tre stoppen utan `target`. Respekterar
  `prefers-reduced-motion` via den redan befintliga
  `design/usePrefersReducedMotion.ts`. Monterad i `app/demo/app/layout.tsx`
  och `app/demo/start/layout.tsx`, bredvid `<DemoBar />` — ingen skärm vet
  att den finns.
- **Verklig layoutbugg hittad med en riktig webbläsare, inte bara
  jsdom:** kortets "ovanför spotlighten"-placering använde
  `translateY(-100%)` från en okänd renderad höjd. För ett mål nära
  toppen av skärmen (kort plats ovanför, mer plats nedanför skulle egentligen
  väljas — men villkoret jämförde bara relativt utrymme ovanför/nedanför,
  inte om utrymmet faktiskt räckte) kunde kortet hamna ovanför `y = 0`,
  helt utanför viewporten och därmed **fysiskt oklickbart** — bekräftat med
  en Playwright-klickgenomgång som fastnade med "element is outside of the
  viewport". Fixat: ett rimligt höjdöverslag (`ESTIMATED_CARD_HEIGHT`,
  220px) och `Math.max`/`Math.min`-clampning i stället för
  `transform: translateY(-100%)` — kortet garanteras nu innanför skärmen i
  båda lägena. Ett bra exempel på varför komponenttester i jsdom (som alla
  gick gröna även med buggen kvar — jsdom mäter aldrig verkliga
  bounding-rects) inte ersätter en riktig browser-klickgenomgång för
  positioneringslogik.
- **`components/spark/TourOverlay.test.tsx`, ny:** rendering av stopp 1
  (centrerat kort), Nästa/Hoppa över, sista stoppets "Avsluta rundtur", och
  att ett `data-tour-id`-mål hittas utan att krascha.
- **`docs/demo-manus.md`, ny:** en 10-minutersversion som går igenom alla
  20 rundturstopp med ett talat stycke per stopp (utöver kortens egna korta
  UI-text), och en kurerad 5-minutersversion (10 av de 20 stoppen). Följer
  rundturens klick rakt av, med en kort not om motsvarande "Hoppa till
  steg"-klick för den som demar utan overlay.
- **Verklig webbläsarverifiering** (Playwright, headless Chromium,
  installerat i en scratch-mapp utanför repot enligt samma mönster som
  Session 6 — inget webbläsarverktyg anslutet i den här sessionen heller):
  `pnpm build` + `pnpm start`, ett skript som klickar igenom **hela
  onboardingen och alla beats för både Sara (ingång A) och Jonas (ingång
  B), på både sv och en** (fyra fulla körningar), plus rundturen från
  stopp 1 till stopp 20 på båda språken — noll `pageerror`/`console.error`
  i samtliga sex körningar. Detta är grundligare än tidigare sessioners
  `curl`-baserade verifiering (som bara ser den statiska skalet före
  klienthydrering) — se "Beslut nästa session" om att återanvända mönstret.
- Verifierat: `pnpm typecheck`/`lint`/`test` (37 filer, 205 gröna + 35
  förväntat skippade — fem nya gröna från `TourOverlay.test.tsx`) och
  `pnpm build` går alla igenom utan fel eller varningar.

### Beslut nästa session behöver känna till
- **Playwright-mönstret i den här sessionen gav en verklig bugg jsdom
  aldrig kunde hittat** (positioneringen ovan). Nästa session som bygger
  UI med egen positionslogik (`getBoundingClientRect`, `position:
  fixed`/`absolute` med beräknade koordinater) bör upprepa mönstret:
  `npm install playwright@1.63.0` i en scratch-mapp utanför repot
  (Chromium låg redan cachad under `~/.cache/ms-playwright`, ingen
  nedladdning behövdes), `pnpm build && pnpm start -p <ledig port>` (kolla
  `ss -ltnp` för porten först — en gammal `next start`-process kan sitta
  kvar och svara med gammalt byggresultat, precis vad som hände en gång
  under den här sessionen), sedan ett Playwright-skript som faktiskt
  klickar och skärmdumpar i stället för att bara läsa DOM:en.
- **`TourOverlay.tsx`s spotlight-mätning kör kontinuerligt via
  `requestAnimationFrame` så länge ett stopp med `target` är aktivt** —
  medvetet, inte en optimering som glömdes bort. Se kommentaren i filen
  innan den byts mot engångs-lyssnare.
- **Rundturens 20 stopp är fortfarande bara skrivna mot Saras scenario**
  (oförändrat sedan det avbrutna skedet) — samma medvetna avgränsning som
  `demoStore.ts`s `toggleTour` redan dokumenterar. Att bygga en egen
  rundtur för Jonas är inte gjort och inte efterfrågat än.
- **`docs/demo-manus.md`s talpunkter är skrivna av den här sessionen**,
  utöver rundturkortens egna korta UI-texter — om `tourSteps.ts`s
  titel/text ändras i en framtida session, uppdatera manuset i samma
  commit så de inte glider isär.

### Kända problem / medvetna begränsningar
- Inga nya. Onboardingen, alla nio undersidorna och rundturen klickades
  igenom på riktigt (se ovan) utan fel för båda personorna på båda
  språken — de tidigare sessionernas upprepade "ingen
  webbläsarverifiering"-anteckning gäller inte längre för just den här
  ytan.
- De sju icke-ingångsmedvetna modulerna (Pulsen, Kunder, Marknad, Bygg,
  Juridik — se "Session — Jonas hela resan" ovan) är oförändrade: Jonas
  klickgenomgång i den här sessionen bekräftar bara att sidorna inte
  kraschar för honom, inte att de visar hans data. Redan känt, inte
  löst här (utanför sessionens uppdrag).

## Session — Fem sidor gjorda ingångsmedvetna: Pulsen, Kunder, Marknad, Bygg, Juridik (klar, gren `prototyp`)

Uppdrag: grundaren bekräftade att Pulsen, Kunder, Marknad, Bygg och Juridik
fortfarande visade Saras data i ingång B (Jonas), flaggat men lämnat utanför
scope i "Session — Jonas hela resan". Uppdraget: hitta orsaken, gör alla fem
ingångsmedvetna, och där Jonas saknar data — hitta inte på något, visa ett
ärligt tomt läge. Rör inte `adapters/live/` eller poängmotorn.

### Orsak
Fem demoadaptrar läste aldrig `entry` ur `useDemoStore` — de returnerade
alltid Saras hårdkodade data (`adapters/demo/PulseProvider.ts`,
`OutreachProvider.ts`, `RegistryProvider.ts`, `BuildProvider.ts`,
`LegalAdvisor.ts`), och två routefiler (`marknad/`, `kunder/page.tsx`)
räknade aktuellt steg via `getCurrentStepNumberFor` importerad direkt från
`sara.ts` i stället för demomotorns entry-medvetna variant. Redan
dokumenterat i "Session — Jonas hela resan" som en medveten avgränsning, inte
en ny bugg.

### Klart
- **Fyra adaptrar** (`OutreachProvider.getCampaign`, `LegalAdvisor.getLegalMap`,
  `BuildProvider.getSpec`/`getStatus`, `PulseProvider.getSignals`) läser nu
  `entry` och returnerar `[]`/`null`/`"not_started"` för Jonas — porttyperna
  tillåter ett tomt svar här, så ändringen ligger helt i adaptern, Sara
  oförändrad.
- **`PulseProvider.getTodaysSignal`** och **`RegistryProvider.getMarketOverview`**
  tillåter INTE ett tomt/null-svar i porten (delas med liveadaptern, som inte
  fick röras) — de anropas i stället aldrig för Jonas: `app/demo/app/page.tsx`
  hoppar över `getTodaysSignal`-anropet och sätter `pulse: null`,
  `marknad/page.tsx` hoppar över hela `Promise.all`-blocket. `AppHomeData.pulse`
  (`screens/AppHome.tsx`) är nu `PulseSignal | null`.
- **Ärligt tomt läge, skilt från "låst":** ny i18n-nyckel
  `homePage.notInThisScenario` ("Det här steget är inte genomfört i det här
  scenariot") — skild från `unlocksAfterStepBefore`, som antyder att
  innehållet kommer senare (fel intryck för Jonas, eftersom det aldrig
  kommer). `screens/Market.tsx`, `Customers.tsx`, `Build.tsx`, `Legal.tsx`
  fick en ny `notInScenario?: boolean`-prop som väljer rätt text i den redan
  befintliga `LockedState`. `pulsePage.emptyState`s text skrevs om (tog bort
  "de dyker upp när resan kommer igång", som bara stämde för Sara).
- **`marknad/page.tsx` och `kunder/page.tsx`** läser nu `entry` och byter
  `getCurrentStepNumberFor` (sara.ts) mot den entry-medvetna
  `getCurrentStepNumber()` (`demoStore.ts`). Båda slutar också anropa
  `demoSimulationProvider` för Jonas — de tre kanoniska simuleringarna
  (`time`/`tolerance`/`price`) är skrivna mot Saras byråer/kvitton
  (`adapters/demo/SimulationProvider.ts`s egen header) och hade annars läckt
  Saras siffror på Jonas sidor även efter huvudfixet.
- **Ingen ny Jonas-data uppfanns.** `adapters/demo/jonas.ts` har löptext om
  marknaden (412 padelhallsbolag m.m.) och juridik (enskild firma, samma
  bolagsform som Sara) men ingen strukturerad `RegistryCompany`/`CampaignRow`/
  `ByggBrief`-data och ingen Kvittojakten-fri juridisk karta — att pressa in
  den löptexten i de formaten hade krävt påhittade fält (t.ex.
  `medianRevenueKsek`, namngivna hallar). Alla fem sidor visar därför ett
  ärligt tomt läge för Jonas, inte påhittat innehåll.
- **Nya tester i `adapters/demo/entrySwitch.test.ts`:** fyra nya `it`-block
  bevisar att `OutreachProvider`/`LegalAdvisor`/`BuildProvider`/`PulseProvider`
  ger Saras data i ingång A och ett tomt svar i ingång B, via de riktiga
  adaptrarna (inte bara mot `jonas.ts` isolerat) — samma mönster som filens
  befintliga tester.
- Verifierat: `pnpm typecheck`/`lint`/`test` (213 tester totalt: 209 gröna +
  35 förväntat skippade, fyra nya gröna) och `pnpm build` går igenom utan
  fel. `pnpm start` + `curl` mot `/`, `/demo`, `/demo/app` och alla fem
  ändrade routes: 200/307 som väntat. Ingen webbläsarverifiering av att
  Jonas faktiskt ser tomma-läge-texten på skärm (inget webbläsarverktyg
  anslutet) — bekräftat i stället via `entrySwitch.test.ts` mot de riktiga
  adaptrarna och `curl` mot den statiska routen.

### Beslut nästa session behöver känna till
- **`homePage.notInThisScenario`** är den nya, generella nyckeln för "den
  här personan har inget byggt innehåll här" — återanvänd den i stället för
  att skriva en ny variant, om fler moduler görs ingångsmedvetna med samma
  mönster.
- **Om Jonas någon gång får riktigt innehåll i dessa fem moduler:** bygg
  strukturerad data i en ny `jonas`-specifik sektion (motsvarande
  `saraCompanies`/Sara-specen) och ta bort `entry === "hasIdea"`-grenarna i
  respektive adapter — rör inte `RegistryProvider.getMarketOverview`s
  Sara-gren, den ska fortsätta gälla oförändrad för ingång A.
- **`RegistryProvider.searchCompanies`** rördes inte — anropas inte av någon
  skärm/route i dag (bara kontraktstestet), så ingen ingångsmedvetenhet
  behövdes där.

### Kända problem / medvetna begränsningar
- Ingen webbläsarverifiering den här sessionen (se ovan).
- De fem modulerna visar nu korrekt ett tomt läge för Jonas, men har
  fortfarande inget riktigt innehåll för honom — om grundaren vill att Jonas
  demo ska kännas lika fullständig som Saras, är nästa steg att skriva den
  strukturerade datan (se "Beslut nästa session" ovan), inte att öppna
  portarnas typer.

## Dataspiken — källa för RegistryProvider (research klar, PR mot `prototyp`, gren `dataspiken`)

Ren research, ingen kod. Resultat i `docs/dataspiken.md`.

### Inga blockerare kvar för Fas 1
1. **Licens för namngivna företag: Verifierat (Erik läste https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html 2026-09-20).** Lagring, visning och vidaredistribution av bolagsdata tillåtet; enskilda firmors personuppgifter (GDPR) får inte profileras/samköras och reklamspärr ska respekteras. Rekommendationen står kvar: namngivna listor bara för aktiebolag utan reklamspärr. Uppdaterad i `docs/dataspiken.md` (status, kort svar, avsnitt 1, 2, 6, 7).
   *Senare (2026-09-23):* nedgraderat till **Sekundärt**. Sidan är en
   informationssida, inte villkorstexten, och ingen ordalydelse citerades.
2. **Mottagarnas kontaktuppgifter (steg 05): beslut.** Hunter.io valdes bort (gratisnivån delar 50 krediter per hela kontot/månad). Egen mejlsökning med Tavily (sök "Kontakta oss"-sidan) + Gemini (extrahera adressen). Grundaren bekräftar/redigerar alltid adressen före utskick. **Beslut för Fas 2 (`OutreachProvider`), byggs inte nu.**

### Klart
- **`docs/dataspiken.md`:** källa, kostnad, villkor och rekommendation per källa, varje uppgift märkt Verifierat / Sekundärt / Osäkert, med de två blockerarna överst.
- **Rekommendation:** bygg `RegistryProvider` på Bolagsverkets och SCB:s "API för värdefulla datamängder" (gratis, inget avtal, öppen licens enligt förordning (EU) 2023/138). Allabolag/UC: inte i MVP, öppet avtalsbeslut. Ratsit: gå inte vidare.
- **Årsredovisningarna** är iXBRL: taggade siffror inuti en dokumentfil per bolag och år, inte en färdig tabell. Bara aktiebolag lämnar in digitalt.
- **`docs/moduler/registret.md`:** rättade "blockeraren är avtal" med hänvisning till dataspiken.

### Var vi står / vad som är kvar innan nästa session
- **Kundanmälan till Bolagsverket är inte skickad än** (Erik 2026-09-19; tidigare stod här felaktigt att den väntade på godkännande).
- **Erik:** kontrollera detaljer (t.ex. källhänvisning) när nycklarna kommer (blockerar inte Fas 1). Licensfrågan är Verifierad 2026-09-20. *Senare (2026-09-23): nedgraderad till Sekundärt, se ovan.*
- **Fas 2:** bygg `OutreachProvider` med Tavily + Gemini för mottagarnas e-post (punkt 2 ovan).
- **Grundaren + partner + vuxen/handledare:** Allabolag/UC är ett öppet avtalsbeslut. Villkoren förbjuder regelbunden, systematisk lagring utan skriftligt medgivande. Ingen kontakt tas och inget formulär skickas innan dess.
- **Först därefter:** en spik med riktiga nycklar (ordning i `dataspiken.md` avsnitt 3), sedan bygg enligt `docs/bygga-en-modul.md`.

### Beslut nästa session behöver känna till
- **Avgjort 2026-09-21: Bolagsverkets API kan inte söka eller lista på SNI-kod.** Swagger-specen (läst av Erik) har bara fyra endpoints (`/isalive`, `POST /organisationer`, `POST /dokumentlista`, `GET /dokument/{dokumentId}`), alla uppslag på känt organisationsnummer. `searchCompanies` måste bygga på SCB (statistikdatabas, nedladdningsbara filer eller företagsregister-API). SCB-spåret är nästa steg.
- **Reklamspärr och enskilda firmor:** SCB-registret innehåller fysiska personer och en reklamspärr-variabel. Förslag: namngivna listor bara för aktiebolag och utan reklamspärrade. Kräver Juridisk koll och en vuxen/handledare.
- **Rättighetshavaren för Allabolag** står som Proff AS i villkoren men UC Affärsinformation AB i integritetspolicyn. Oklart vem som ska ge tillstånd.

### Kända problem / öppna frågor
- **Ratsit** verifierades bara via sökresultat (403 på deras sidor). En söksammanfattning antyder ett API, vilket inte bekräftades.
- SCB:s statistikdatabas (branschaggregat) är inte undersökt. SCB byter från certifikat till API-nycklar i september 2026.

### Uppdatering 2026-09-21 — spik med nycklar (branch `docs/dataspik-bolagsverket`)
- **Verifierat (Erik körde `scratchpad/bv-test.mjs`, gitignorad):** OAuth 2 client credentials fungerar mot `portal.api.bolagsverket.se` med scope `vardefulla-datamangder:read`; uppslag på organisationsnummer (Volvo) ger riktig data. Nycklarna ligger i `.env.local` (`BOLAGSVERKET_CLIENT_ID`/`_SECRET`). Claude Codes miljö når inte portalen, så inget här är egna anrop.
- **Bolagsverkets API saknar sök/listning på SNI: bekräftat, inte längre "sannolikt".** Beskrivet i `docs/dataspiken.md` (avsnittet "Bolagsverkets API — sökning/listning på SNI-kod").
- **Nästa steg: SCB-spåret.** Jämför statistikdatabasen, nedladdningsbara filer och företagsregister-API:et mot kravet lista bolag per SNI och storleksklass (`docs/dataspiken.md` fråga 7).
- **Öppna TODO:s (inte lösta):** svarsformatet för `POST /organisationer` är rekonstruerat ur specen, inte verifierat mot ett riktigt anrop; `/dokumentlista` gav tom lista för Volvo; bas-URL:en är inte inskriven från specen. Se "TODO — öppna punkter" i `docs/dataspiken.md`.
- **Hantering av `scratchpad/`:** `.gitignore` ignorerar nu `/scratchpad/` (mergead in från `scratchpad-gitignore`). Engångsskript med nycklar från `.env.local` committas inte.

## Modul: Registret — liveadapter (påbörjad, grindad, branch `modul/registret`)

Byggd enligt `docs/bygga-en-modul.md`, plan godkänd 2026-09-19 (beslut D1–D7).

**Villkor (blockerande för exponering):** ingen annan än Erik och Theodor får se
eller använda liveregisterdata (ingen demo för lärare, investerare eller andra
UF-företag) förrän `docs/dataspiken.md` §6 fråga 1 är uppgraderad från
Sekundärt till Verifierat. **Uppfyllt 2026-09-20** (Erik läste Bolagsverkets sida; *senare, 2026-09-23: inte uppfyllt, nedgraderat till Sekundärt, villkorstexten är inte läst*); licensgrinden i koden ligger kvar tills Erik öppnar den, och juridisk koll av fråga 4 (aktiebolag/reklamspärr) återstår. Internt utvecklingsarbete och
tester är okej.

### Klart
- **Licensgrind:** `lib/server/registryAccess.ts` — nekat som standard, kräver
  `REGISTRY_LIVE_ENABLED=true` och att `user.id` finns i `REGISTRY_ALLOWED_USER_IDS`.
  Första sats i båda metoderna, före indata och transport. `RegistryLockedError`
  ingår i `isPlaceholderError` (visas som `ComingSoon`) men ärver inte
  `NotImplementedError`. Skyddas av `Licensvakt` i `ports/stubStatus.test.ts`.
- **`adapters/live/RegistryProvider.ts`:** båda metoderna, se
  `docs/moduler/registret.md` ("Hur liveadaptern fungerar i dag"). Bara
  aktiebolag utan reklamspärr med namn, källa = anropsdatum, luckor utelämnas
  eller flaggas via `basis`, extern text rensas och kortas.
- **Port:** valfritt `basis` på `MarketOverview` (D3) och valfri `sniCode` som
  andra parameter på `getMarketOverview` (nytt beslut, se nedan).
- **Transport:** `lib/server/scb.ts` och `bolagsverket.ts` är skelett som kastar
  `RegistryTransportError`. Alla antaganden om svarsform i
  `lib/server/registrySchemas.ts` (`ANTAGANDEN`).
- **Tester:** grind (8), adapter (20), transportskelett (2), kontraktstestet körs
  **grönt mot live** (5 av 5, inte skippat) med mockad transport, `RegistryProvider.live.test.ts`
  (opt-in, `REGISTRY_LIVE_SMOKE`). Registret borttaget ur `STILL_STUBS`.
- `.gitignore`: `.mcp.json` och `supabase/.temp/`. `.env.example`: de två
  grindvariablerna utan värde (Eriks och Theodors user.id ligger bara i `.env.local`).
- Rättat: kundanmälan till Bolagsverket är **inte skickad** (stod felaktigt som skickad).

### Beslut nästa session behöver känna till
- **Grönt betyder inte verifierat mot Bolagsverket/SCB.** Kontraktstestet går mot
  mockad transport i en antagen svarsform. Den riktiga transporten är en andra PR
  efter spiken. Modulstatus är därför "påbörjad", inte "klar".
- **`getMarketOverview` fick valfri `sniCode`** eftersom porten inte hade någon
  branschangivelse. Utan den gäller sammanfattningen hela registret. **Beslutat 2026-09-19 (Erik):** `sniCode`
  förblir en valfri parameter tills vidare. Automatisk koppling till projektets
  bransch tas i en senare session (när `/app/marknad` byggs).
- **Ingen liveyta finns** (`/app/marknad` byggs inte här) och `docs/bygga-en-modul.md`
  §11.2 (`ComingSoon` ska försvinna) är därför medvetet inte tillämpligt.
- **Inget skrivs till Supabase** (`public.companies` har ingen skrivpolicy, en
  service role-nyckel skulle kräva ett eget dokumenterat beslut).
- `REGISTRY_LIVE_ENABLED` är avsiktligt inte satt i `.env.local`; sätt den lokalt
  bara när något faktiskt ska köras mot grinden.

### Kända problem / medvetna begränsningar
- `employees`/`revenueKsek` är icke-nullbara i porten, så bolag med okänt värde
  utelämnas från `searchCompanies`. `regionSharePercent` (Stockholms län) och
  `growthSharePercent` (>10 %) följer i18n-etiketterna men länsnamnet är ett
  ANTAGANDE. Utan `sniCode` ger `getMarketOverview` inga konkurrenter.
- Enskilda firmor/reklamspärr (§6 fråga 4) fortsatt öppet: Juridisk koll + vuxen/handledare.

## Tokenbyte — design-referens/artefakt/TOKENS.md (klar, gren `prototyp`)

Uppdrag (`docs/beslut.md`, näst sist i "Nästa sessioner, i ordning"): byt tokenlagrets värden mot artefakten, utan att röra layout, komponentstruktur eller innehåll. Huvuduppgiften var att söka igenom hela kodbasen efter hårdkodade färger/typsnitt/radier/skuggor som går förbi tokenlagret och routa dem genom det. Full motivering och alla siffror i `DESIGN.md` under samma rubrik — den här posten sammanfattar.

### Klart
- **Färger:** `design/tokens.css`/`design/tokens.ts` ombyggda mot artefaktens ground/hair/ink-3/ink-2/navy/ink/accent, med befintliga namn behållna (`--slate-*`, `--accent-*`, `--paper-50`, `--ink-800/900`) — bara värdena bytta, verifierat mot faktisk användning innan mappningen låstes (`ink-800` = uteslutande mörk ytfyllnad → `navy`; `ink-900` = uteslutande stark text → `ink`). `--score-*`/`--data-simulation`/`--data-customer` lämnade orörda (ingen motsvarighet i referensen). Nya tokens utan tidigare namn: `--ok`/`--warn`/`--bad` och deras `-soft`-varianter, `--sunk`, `--hair-2`, `--scrim` — alla `color-mix(in srgb, …)` rakt av från artefakten.
- **Skuggor:** nytt tokenpar `--shadow-soft`/`--shadow-lift`. Döpt om från artefaktens egna `--shadow`-namn i sista stund — Tailwind v4 har redan en temavariabel `--shadow` som styr `.shadow`-utilityn, och ett eget `:root`-värde med samma namn hade tyst skuggat den (samma krock som `--r-*` redan medvetet undviker för radier). `app/globals.css` routar de enda två `shadow-*`-klasser som faktiskt användes i kodbasen (`shadow-lg`, `shadow-xl`) genom tokens via `@theme inline`, utan att röra någon komponentfil.
- **Hårdkodade värden hittade och rättade:** `components/spark/TourOverlay.tsx` (två `rgba(15, 23, 42, 0.72)`-literaler → `var(--scrim)`), `components/spark/PromptBox.tsx` (en godtycklig Tailwind-shadow-klass med inbränd gammal `slate-800`-hex → `shadow-[var(--shadow-soft)]`). Inga andra hårdkodade färger/radier/skuggor hittades — ingen Tailwind-standardpalett används någonstans i kodbasen. Recharts är inte en dependency och importeras ingenstans (uppdragets punkt 3 om det gäller alltså inte den här kodbasen); `Sparkline.tsx` hämtade redan sina färger från `design/tokens.ts` och ärver de nya värdena automatiskt. "Haisynth" förekommer inte i kodbasen — redan korrekt stavat överallt.
- **Typsnitt:** `--font-sans` (brödtext/rubriker) bytt från Funnel Display till **Castoro** (självhostad `.woff2`, `@fontsource/castoro`, OFL-1.1, samma mönster som tidigare typsnitt — ingen ny npm-dependency). Ny token **`--font-data`** (tabeller/diagramaxlar/nyckeltal) återanvänder de redan självhostade Funnel Display-filerna i stället för att hämta något nytt — löser `docs/beslut.md`s öppna fråga om datatypsnitt pragmatiskt. `.font-numeric`-utilityn pekar nu på `var(--font-data)` i stället för `var(--font-mono)`, samma klassnamn överallt, noll komponentfiler ändrade. `--font-serif-italic` (Instrument Serif Italic) oförändrad. **JetBrains Mono borttagen** (export + wiring i `app/layout.tsx`) eftersom `--font-data` tog över dess enda roll.
- **Radier:** `--r-sm` bytt från ett eget fast värde till `calc(var(--r-md) * .7)`, artefaktens relation. `--r-md` matchade redan artefaktens bas oförändrat. `--r-lg`/`--r-pill` lämnade (ingen motsvarighet).
- **WCAG AA-kontroll** (beräknad, inte ögonmått; paletten inte ändrad för att fixa något): godkänt `ink-3`/`ink-2`/`ink`/`navy`/`accent` i sina vanliga par. **Klarar inte 4.5:1 för normal text** (klarar 3:1): `ok` på `ok-soft` 3,74:1, `warn` på `warn-soft` 3,92:1, `bad` på `bad-soft` 4,34:1 — inga av de tre är kopplade till något UI än, flaggat för framtida bruk.
- Verifierat: `pnpm typecheck`/`lint`/`test` (252 gröna, 31 skippade som väntat) och `pnpm build` gröna. Kontrollerat i kompilerad CSS att `--shadow-soft`/`--shadow-lift` löser ut korrekt, att namnkrocken med Tailwinds `--shadow` inte uppstår, att Castoro bäddas in i byggresultatet, och att inga `fonts.googleapis`/`fonts.gstatic`-anrop finns.

### Beslut nästa session behöver känna till
- **Mappningen färg→namn** (se `DESIGN.md`) är avsiktlig och grundad i faktisk användning (grep före byte), inte en gissning — ändra den inte utan att kontrollera samma sak igen.
- **`--shadow`/`--shadow-lift` heter `--shadow-soft`/`--shadow-lift`**, inte artefaktens exakta `--shadow`-namn — medvetet, för att undvika att skugga Tailwinds egen `--shadow`-temavariabel. Följ samma "kolla mot Tailwinds inbyggda namnrymd innan en ny token döps" -regel som redan gäller för `--r-*`.
- **`--ok`/`--warn`/`--bad` och deras `-soft`-varianter är oanvända i UI:t.** Om Marknaden-sessionen (näst på tur enligt `docs/beslut.md`) vill använda dem för statusindikatorer: `ok`/`warn`/`bad`-text direkt på `-soft`-bakgrunden klarar bara 3:1, inte 4,5:1 — använd stor/fet text, eller lägg texten på `paper`/`ground` i stället och spara `-soft` till fyllningar utan text.
- **`--font-data` är Funnel Display i ny roll**, inte ett nytt typsnitt — om en riktig neutral sans någon gång ska provas separat (utöver Funnel Display), är det en ny hämtning, inte en värdejustering.
- **Castoro har bara vikt 400** (normal + kursiv). Rubriker med `font-bold`/`font-extrabold` renderas nu med webbläsarens syntetiska fetstil. Inte åtgärdat (skulle kräva att röra komponentklasser, utanför uppdraget) — flaggat för en framtida poleringssession om det stör i en riktig genomgång.

### Kända problem / medvetna begränsningar
- **`design/fonts/jetbrains-mono/`-mappen kunde inte tas bort.** Sandboxens auto-läge-klassificerare blockerade både `rm -rf` och `git rm -r` som "Irreversible Local Destruction". Mappen ligger kvar helt oanvänd (ingen kod refererar den längre) — ta bort den manuellt (`git rm -r design/fonts/jetbrains-mono`) när tillfälle ges.
- **Ingen manuell webbläsarverifiering.** Inget webbläsarverktyg var anslutet den här sessionen. Särskilt Castoros syntetiska fetstil på rubriker och den nya paletten i en riktig renderad sida är inte sedda med ögon — bara verifierade via beräknad WCAG-kontrast och kompilerad CSS. Gör en klickgenomgång (båda språken, minst `/`, `/demo/app`, `/designsystem`) i nästa session som har en webbläsare tillgänglig.
- Fokusringar (`focus-visible:outline-accent-300`) är inte kontrollräknade mot 3:1 — samma mönster fanns redan mot den gamla paletten, ingen ny regression, men inte heller undersökt här.

### Återstår (andra sessioner)
- Nästa enligt `docs/beslut.md`: **Marknaden** — sidan Emma kommer att titta på.
- Sidhopslagningen (poängen in i Hem, juridiken som en Medgrundaren-förmåga) är fortfarande uppskjuten, väntar på beslut med Erik efter Emma-mötet — kom ihåg att uppdatera `adapters/demo/tourSteps.ts` samtidigt om/när den görs.
- `design/fonts/jetbrains-mono/` väntar på manuell borttagning (se ovan).

## Marknad-sidan ombyggd för Datalöftet (klar, gren `prototyp`)

Uppdrag (`docs/beslut.md`, sist i "Nästa sessioner, i ordning"): bygg om
Marknad-sidan i demoläget så att den bevisar Datalöftet (uppdrag 1.2) i
praktiken, inte bara beskriver det — den sida Emma (Hiasynths grundare) får
se. Struktur: en KPI-rad, ett "Datalagret"-kort, ett storleksfördelnings-
diagram och ett utskicks-/svarsfrekvenskort. Bara demoläget och demoadaptern
fick röras — inte `ports/`, `adapters/live/` eller `lib/server/`.

### Klart
- **`screens/Market.tsx` omskriven** till fyra sektioner i uppdragets ordning
  (`market-kpi`, `market-datalayers`, `market-distribution`,
  `market-outreach`), plus de två befintliga sektionerna (`market-competitors`,
  `market-simulation`) kvar oförändrade längst ner — inget innehåll togs bort,
  bara omstrukturerat och kompletterat.
- **KPI-raden** återanvänder `KpiTile`/`KpiRow` (byggda i designuppdateringen)
  i stället för den gamla `DataFact`-rutnätet. `KpiTile` fick en ny valfri
  `description`-prop (bakåtkompatibel, används redan av Hem/Poäng utan ändrad
  rendering) för den korta förklarande meningen varje kort kräver.
- **"Baserat på N av M bolag" på riktigt:** `MarketOverview.basis` fanns redan
  som ett valfritt fält i porten (Registret-modulsessionen) men demoadaptern
  satte det aldrig. `adapters/demo/RegistryProvider.ts` sätter nu
  `basis: { medianRevenueCompanies: 194, growthCompanies: 171,
  regionCompanies: 308 }` (av 312 totalt) — mediansiffran, tillväxtandelen och
  regionandelen visar nu alla sitt urval i klartext, aldrig ett tal som
  låtsas gälla hela registret. **Ingen porttyp ändrades** — fältet var redan
  där, bara ifyllt.
- **"Datalagret"-kortet** (nytt): tre rader — Register, Årsredovisning,
  Simulering — var och en med en kort not och en klickbar `SourceTag` (källa +
  hämtdatum). Byggt helt av redan tillgänglig data (`overview.source`,
  `simulation.source`), ingen ny porttyp.
- **Storleksfördelningen** (ny `components/ui/BarChart.tsx`, samma
  "ingen-dependency"-princip som `Sparkline`): bucketar Saras 20 byråer i
  fem SCB-liknande storleksklasser (1–4/5–9/10–19/20–49/50+ anställda) och
  visar **aldrig ett exakt anställningstal** (docs/dataspiken.md: "SCB ger
  klasser, inte siffror") — bara klassnamn och antal bolag per klass.
  SNI-koden läses av det första bolaget i urvalet (`RegistryCompany.sniCode`),
  inte hårdkodad i sidan. Insiktsmeningen ("Vanligast i urvalet: …") räknas
  fram från den faktiska bucketräkningen, inte skriven för hand. Källchip
  och "baserat på 20 av 312 bolag" under diagrammet.
  - **Avvikelse från uppdraget, flaggas:** uppdraget bad om Recharts, men
    "inga nya beroenden" var också ett hårt krav och Recharts är inte
    installerat i den här kodbasen (bekräftat i Tokenbyte-sessionen ovan).
    Byggde i stället en minimal inline-SVG-fri (ren HTML/CSS) stapelgraf,
    samma princip som `Sparkline`. Färgerna kommer uteslutande från tokens
    (`var(--accent-600)`/`var(--slate-100)`). Om Recharts verkligen ska in,
    är det ett eget beroendebeslut för en framtida session, inte något som
    smögs in här.
- **Utskick och svarsfrekvens-kortet** (nytt): läser `OutreachProvider.
  getCampaign` (samma port Kunder-sidan redan använder) och räknar kontaktade
  (alla utom `draft`), svarat och svarsfrekvens. **`CampaignRow` bär ingen
  egen källa** (porten är oförändrad), så en ny demo-bara `outreachSource`
  (`adapters/demo/OutreachProvider.ts`, Källa "Sparks utskick (Gmail)",
  2026-01-19 — samma datum som 05a:s "efter" i `sara.ts`) skickas med via
  skärmens `MarketData`-typ i stället. **Tre ärliga lägen**, inget påhittat:
  ingen kontaktlista byggd än (före steg 04), kontaktlistan klar men inget
  skickat än (alla rader `draft`), och de faktiska siffrorna när utskicket är
  igång. Inga kontaktuppgifter visas (`CampaignRow` har inga — porten gav
  redan inga, oförändrat).
- **`adapters/demo/tourSteps.ts`:** stoppet "dataloftet" (route
  `/demo/app/marknad`) pekade på `target: "market-register"`, som inte längre
  finns — uppdaterat till `"market-kpi"`. De två andra Marknad-stoppen
  (`market-competitors`, `market-simulation`) är oförändrade sektioner, ingen
  uppdatering behövdes där.
- **i18n:** `marketPage` utökad i `dictionary.ts`/`sv.ts`/`en.ts` med
  `dataLayers`, `distribution` (inkl. storleksklassernas etiketter) och
  `outreach`, plus `basedOnLabel`/`ofLabel`/`companiesUnit` för den
  återanvändbara "Baserat på N av M bolag"-meningen. Ingen ny hårdkodad text
  i komponenterna.
- **`screens/Market.test.tsx`** (ny): nio tester — låst läge, Jonas-tomläge,
  urvalstexterna på alla tre KPI:er, Datalagrets tre källor, bucketräkningen
  (bevisar att ett enskilt bolags exakta antal, t.ex. "7 anställda", aldrig
  syns), konkurrenter/simulering oförändrade, och utskickets tre lägen.
- Verifierat: `pnpm typecheck`/`lint`/`test` (261 gröna, 31 skippade som
  väntat — 9 nya tester, alla gröna) och `pnpm build` gröna. `pnpm start` +
  `curl` mot `/demo/app/marknad`: 200.

### Beslut nästa session behöver känna till
- **`overview.basis`-siffrorna (194/171/308 av 312) är påhittade men
  interna konsistenta** — samma mönster som resten av Saras scenario (t.ex.
  registerbilden i `RegistryProvider.ts` sedan tidigare). Justera dem fritt
  om grundaren vill ha andra tal, men håll `medianRevenueCompanies ≤
  growthCompanies` inte nödvändig — de mäter olika saker (tillväxt kräver två
  års iXBRL, se `docs/dataspiken.md` §2).
- **Recharts-avvikelsen ovan** — om grundaren verkligen vill ha Recharts
  specifikt (t.ex. för interaktiva tooltips), är det ett nytt beroendebeslut,
  inte en efterhandsjustering av `BarChart.tsx`.
- **`KpiTile.description`** är nu tillgänglig för alla sidor som använder
  `KpiTile` (Hem, Poäng, Marknad) — återanvänd den i stället för att bygga en
  egen textrad, om fler kort behöver en förklarande mening.
- **`SARA_MARKET_SNI_CODE`** (`adapters/demo/RegistryProvider.ts`) är den
  enda platsen "69.201" definieras för Saras scenario utanför
  `saraCompanies` själva — importera den, skriv inte om strängen.

### Kända problem / medvetna begränsningar
- **Ingen manuell webbläsarverifiering.** Inget webbläsarverktyg var anslutet
  den här sessionen (samma återkommande begränsning som flera tidigare
  sessioner, se t.ex. Tokenbyte ovan) — verifierat med `typecheck`/`lint`/
  `test`/`build` och `curl` (200), samt nio komponenttester som faktiskt
  renderar skärmen med jsdom och läser av texten. Gör en klickgenomgång
  (båda språken) av `/demo/app/marknad` i nästa session som har en
  webbläsare tillgänglig — särskilt stapeldiagrammets layout på mobilbredd.
- **Kunder-sidans tabell visar fortfarande exakta anställningstal**
  (`row.employees`, nu i `screens/Validation.tsx`) — samma dataspik-krav
  ("aldrig exakta tal") gäller där också, men det var utanför den här
  sessionens uppgift (bara Marknad-sidan). Flaggat, inte åtgärdat. Gäller
  fortfarande efter Validering-sammanslagningen nedan.
- Recharts-avvikelsen (se ovan) — dokumenterad, inte en tyst avvikelse.

## Gemensamt skal, innehållsburna rubriker, Validering-sammanslagning (klar, gren `prototyp`)

Fyra uppgifter från grundaren, i ordning (`docs/beslut.md` 2026-09-20):
(1) brödsmula + en poängvisning synlig på alla `/app`-sidor, (2) sidhuvuden
som beskriver innehållet i stället för att upprepa menyvalet, (3) slå ihop
Kunder och valideringsinnehållet ur steg 04–06 till en ny sida, Valideringen,
(4) uppdatera `adapters/demo/tourSteps.ts` så rundturen inte går sönder.
`ports/`, `adapters/live/`, `lib/server/` och poängmotorn (`core/score.ts`)
fick inte röras — Erik arbetar där. Tre commits: uppgift 1, uppgift 2,
uppgift 3+4 tillsammans (grundaren godkände den ordningen).

### Klart — uppgift 1, gemensamt skal
- **`screens/AppShell.tsx`:** ny `scoreSnapshot: ScoreSnapshot | null`-prop
  (ersätter `score: number | null`) och en ny `currentStep?: { number, title,
  total } | null`-prop. Sidhuvudet visar nu en brödsmula ("Marknad · Steg 05
  av 12 · Samtalen" — sidans namn hämtas ur samma `navItems`/`pathname`-
  matchning som redan styr sidomenyns aktiva länk, ingen ny text) och en
  klickbar poängvisning (`ScoreBadge` + nivåns klartextnamn ur `score/levels.ts`
  + en deltachip när `delta !== 0`), länkad till `${navBasePath ?? homeHref}/poang`.
  Poängen räknas fortfarande av `calculateScore` — shellen bara läser
  `ScoreSnapshot`.
- **`app/demo/app/layout.tsx` och `app/(app)/layout.tsx`:** hämtar nu även
  `getSteps(locale)` (redan byggd på båda portarna sedan Session P1/3) och
  hittar steget med `status === "current"` för brödsmulan. Live-vägen
  återanvänder samma `isPlaceholderError`-fångst som poängen redan hade —
  `null` i stället för att krascha om Resan-modulen inte är klar för kontot.

### Klart — uppgift 2, innehållsburna rubriker
- **Redan innehållsburna, orörda:** Hem (`heroHeading` upprepade aldrig
  "Hem") och Resan/[steg] (rubriken är redan stegets eget namn).
- **Medgrundaren:** rubrik = `data.moment.momentLabel` (redan hämtad data).
- **Resan (listan):** rubrik/underrubrik = det aktuella (eller senast klara)
  stegets riktiga `title`/`oneLiner`, ny Eyebrow "Steg NN · Aktuell/Klar".
- **Poäng:** rubrik = poängnivåns klartextnamn (`score.levels[key].name`),
  underrubrik = samma nivås `message` — båda äkta och redan i i18n.
- **Marknad:** rubrik = bransch + storleksspann, t.ex. "Redovisningsbyråer,
  5–20 anställda". Branschordet är nytt men **återanvänt ordagrant** ur
  `sara.ts`s egna steg 02/03-highlights ("redovisningsbyråer, SNI 69.201") —
  ny konstant `SARA_INDUSTRY_LABEL` i `adapters/demo/RegistryProvider.ts`.
  Storleksspannet räknas fram ur `data.companies` (min/max anställda), ingen
  ny data. Ny i18n-nyckel `marketPage.distribution.employeesUnit` ("anställda"),
  samma ord som redan fanns i `sizeBuckets`.
- **Pulsen:** rubrik/underrubrik = den senaste signalens egna `headline`/
  `whyItMatters` ("nyast först", avsnitt 9.5).
- **Minnet:** rubrik = `profile.bio` (Saras/Jonas egen bakgrundstext), Eyebrow
  = namn · roll.
- **Juridik:** rubrik = bolagsformen (`krav[0].gällerFör[0]`), via en ny,
  generisk i18n-nyckel `common.bolagsformLabels` (fyra bolagsformer, ingen
  scenariotext).
- **Bygg:** rubrik = `spec.sammanfattning` (redan visad i body tidigare —
  den gamla dubbleringen togs bort samtidigt).
- Genomgående borttaget: `<Eyebrow>{t.appShell.nav.X}</Eyebrow>` direkt ovanför
  rubriken, på de sidor där den bara upprepade menyvalet (nu dessutom
  redundant med uppgift 1:s brödsmula).

### Klart — uppgift 3, Kunder + Valideringen
- **Ny sida `screens/Validation.tsx`** (`/demo/app/validering`, ersätter
  `screens/Customers.tsx`/`/demo/app/kunder`), i uppdragets ordning:
  1. Fyra nyckeltal (kontaktade + datumintervall, svar, svarsfrekvens,
     öppningsfrekvens som jämförelsetal — se lucka nedan), alla med källa.
  2. "Antagandena som prövades" — tre rader, dom (bekräftat/motsagt),
     motivering och källa.
  3. Svaren från namngivna personer — ett kort per svarande (bolag, län,
     anställda, datum, citat i kursiv, dom, pris testat).
  4. Domen — återanvänd rakt av från `demoJourneyRepository.getStepDetail(6,
     locale).verdict` via den redan byggda `VerdictCard` (samma komponent som
     Resan/6 använder, ingen duplicerad text), plus en konfidensrad räknad ur
     nyckeltalen ("Baserat på 9 av 40 kontaktade (23 % svarsfrekvens)").
  Den fullständiga kontaktlistan (alla 20, status draft/sent/opened/responded)
  är **kvar som en egen sektion** efter svar-korten — inget togs bort ur
  Kunder, bara omstrukturerat och kompletterat.
- **`adapters/demo/OutreachProvider.ts` utökad** (nya exports, porten
  `OutreachProvider` orörd): `getResponseCards(locale)`, `getValidationAssumptions(locale)`,
  `outreachDateRange`, `outreachOpenRate`/`outreachOpenRateSource`. Samma
  mönster som `outreachSource` redan använde — nya fält läggs vid sidan av
  porten, inte i den (`ports/` fick inte röras).
- **`nav.customers` → `nav.validation`** i i18n, `customersPage` →
  `validationPage` (utökad med kpi/antagande/svar-nycklar). `AppShell.tsx`s
  navlista pekar nu på `validering` i stället för `kunder`.
- **7 nya tester** (`screens/Validation.test.tsx`): låst läge, Jonas-tomläge,
  nyckeltal+källa, antaganden med dom/källa, svar-kort med dom/citat/pris,
  att hela kontaktlistan finns kvar, domen+konfidensraden.

### Luckor i demodatan för Valideringen — rapporterade, inte tysta
- **Inga namngivna kontaktpersoner eller roller finns.** Bara bolagsnamn,
  SNI, anställda, omsättning, län och citat finns per svar — ingen
  `namn`/`roll` någonstans i kodbasen för de nio svaren. Svarskorten visar
  därför bolag + län + anställda + datum + citat + dom + pris, **inte**
  namn/roll — hittade inte på några.
- **"Ort" finns inte, bara `county` (län)** — svarskorten visar länet
  (t.ex. "Stockholms län"), inte en påhittad ort/stad.
- **Ingen av de nio svarar med ett fullt "avvisar".** Alla tre som säger nej
  till priset 2 000 kr bekräftar ändå att problemet är verkligt (t.ex.
  "Problemet är verkligt, men 2 000 kr ... är för mycket") — de kategoriseras
  som "delvis", inte "avvisar". Kategorin "avvisar" finns i gränssnittet men
  har inget exempel i det här scenariot.
- **Inget verkligt branschsnitt (jämförelsetal) finns som strukturerad
  data.** "4 % är lågt, normalt ser vi 11 %" finns bara som rundtur-/
  manusprosa (`tourSteps.ts`, `docs/demo-manus.md`), aldrig som en sourcad
  siffra. Det fjärde nyckeltalet är i stället öppningsfrekvensen (38 %,
  samma tal och källa som `sara.ts`s `SinceLastTime.openRate` för steg 05)
  — en riktig, källbelagd jämförelsepunkt, men inte ett branschsnitt.
- **"Antagandena som prövades"-texten** är delvis nyskriven som kort
  rubrikfras (t.ex. "Byråerna betalar 2 000 kr/mån.") för att ge varje
  antagande en rubrik — men varje sifferbärande motivering
  ("7 av 9 bekräftar problemet.", "6 av 9 tycker att 2 000 kr är för dyrt,
  median 900 kr.", "Alla som sa ja har 10 eller fler anställda.") är kopierad
  ordagrant ur `sara.ts`s befintliga `step06NextStep.why`-text, inte nyräknad
  eller nyskriven.

### Klart — uppgift 4, rundturen
`adapters/demo/tourSteps.ts`: `TourRoute`-typen och båda stoppen på
`/demo/app/kunder` bytta till `/demo/app/validering`. **Två stopp
omriktade, inte bara omdirigerade** (target bytt, inte bara route):
- **"spark-skickar-mejlen"** (om att Spark själv skickar utskicket) pekar nu
  på `validation-kpi` i stället för den gamla `customers-table` — mer
  relevant för vad stoppet faktiskt berättar.
- **"svarsdata-forsvarsvall"** (om citerade, namngivna svar) pekar nu på
  `validation-responses` (de nya svar-korten) i stället för tabellen.
- **"domen"-stoppet är oförändrat**, kvar på `/demo/app/resan/6` — den sidan
  visar fortfarande domen oberoende, ingen anledning att flytta det stoppet.
- `docs/demo-manus.md` rad 73: "(Kunder-sidan)" → "(Validering-sidan)".

### Beslut nästa session behöver känna till
- **Sidhopslagningen ovan är EN specifik, av grundaren begärd sammanslagning
  — inte samma sak som den uppskjutna åttasidesplanen i `docs/beslut.md`**
  (poängen in i Hem, juridiken som en Medgrundaren-förmåga). Den planen
  väntar fortfarande på Erik efter Emma-mötet, oförändrad av den här sessionen.
- **`AppShell`s nya `scoreSnapshot`/`currentStep`-props** är tänkta att
  återanvändas rakt av av `/app/poang` och `/app/resan` den dagen de byggs
  färdigt på liveläget — `currentStep` läses redan via `getSteps()`, som
  fungerar på båda lägena.
- **`SARA_INDUSTRY_LABEL`/`marketPage.distribution.employeesUnit`** är de
  enda nya "innehåll"-tillägget uppgift 2 krävde — om Jonas någon gång får
  en egen Marknad-sida, lägg till motsvarande konstant för honom, hitta inte
  på en etikett i farten.
- **`getResponseCards`/`getValidationAssumptions` i `OutreachProvider.ts`
  är avsiktligt INTE en del av `OutreachProvider`-porten** (ports/ fick inte
  röras) — om en liveadapter för Utskick och svar någon gång byggs, avgör då
  om den här formen ska in i porten på riktigt eller förbli demo-bara
  hjälpfunktioner.
- **Response-domen (bekräftar/delvis/avvisar) är en tolkning av citatens
  innehåll**, inte en redan existerande etikett i datan — se
  `PARTIAL_VERDICT_INDICES`-kommentaren i `OutreachProvider.ts` för exakt
  resonemang per index, om domen någonsin ska omprövas.

### Kända problem / medvetna begränsningar
- Ingen manuell webbläsarverifiering (inget webbläsarverktyg anslutet i den
  här sessionen) — verifierat med `typecheck`/`lint`/`test`/`build`, sju nya
  komponenttester, och `pnpm start` + `curl` mot samtliga `/demo/app`-rutter
  inklusive den nya `/validering` (200) och den borttagna `/kunder` (404,
  som väntat). Gör en klickgenomgång (båda språken) i nästa session som har
  en webbläsare tillgänglig — särskilt brödsmulans layout i sidhuvudet vid
  smalare bredder och svar-kortens grid på 1024 px.
- **Kunder-sidans exakta anställningstal-brist** (se ovan, oförändrad sedan
  Marknad-sessionen) gäller nu `screens/Validation.tsx`s tabell.

## Modul: Utskick — mejlsökning och utkast (klar, grindad, branch `modul/utskick`)

Byggd enligt planner-agentens plan, godkänd av grundaren innan kod skrevs.
**Ingen riktig e-post kan skickas** och ingen kan skickas i kommande sessioner
heller utan uttryckligt ja från Theodor och grundaren.

### Klart
- **Ny port `ports/OutreachPrep.ts`** (`suggestEmail`, `draftMessage`), separat från `OutreachProvider` så att den strukturellt saknar `send`. Demoadapter (`.example`-adresser, RFC 2606) och liveadapter (`adapters/live/OutreachPrep.ts`). Ingen route eller skärm använder den, ingenting lagras.
- **Mejlsökning:** ett Tavily-anrop, ett Gemini-anrop. Modellens adress måste stå ordagrant i texten som skickades, ha ren syntax, och **adressens domän måste bära bolagets namn** (`core/emailVerification.ts`, strikt likhet, hårda avslag). Källan injiceras i kod; Gemini-schemat är `.strict()` och saknar käll-/url-fält. Nonce-avgränsade databloc för företagsnamn och sidtext.
- **Utkast:** mallbaserat ur i18n (`outreachDraft`, sv+en), `core/outreachDraft.ts`. Inte modellskrivet.
- **Grind** (`lib/server/outreachAccess.ts`): `OUTREACH_LIVE_ENABLED` exakt `true` **och** användaren i `OUTREACH_ALLOWED_USER_IDS`, första sats i båda metoderna, `OutreachLockedError` (visas som ComingSoon). Throttle 10/timme, 30/dygn per användare (i minnet).
- **Sändspärr:** `liveOutreachProvider.send/getStatuses/getCampaign` kastar `OutreachSendDisabledError` (ärver `NotImplementedError` bara för att bevara kontrakts- och stubtester). **`send()` tar nu `ConfirmedOutreach[]`**, en typ med `unique symbol`-brand som ingen kod kan skapa: ett förslag eller utkast kan inte matas in (kompileringsfel). Ingen konstruktör finns. Ändrad signatur på en befintlig port (`OutreachRecipient` borttagen, ingen anropade `send`).
- **`lib/server/tavily.ts`** är nu en riktig klient: fast URL (ingen SSRF), 10 s timeout, max 5 resultat × 20 000 tecken, resultat med http/`javascript:`/userinfo-URL kastas bort, ingen `cause` i fel. Webbresearch/Pulsen-adaptrarna är fortfarande stubbar.
- **Fyra CI-vakter** (alla verifierade röda vid försvagning): G1 `ports/stubStatus.test.ts` (beteende), G2 `adapters/live/outreachGate.guard.test.ts` (grind först, importkälla, bara godkända Tavily-användare), G3 `lib/server/noMailer.guard.test.ts` + ESLint (inga mejlpaket, alias, sändningsändpunkter), G4 `ports/outreachConfirmation.guard.test.ts` (ingen skapar/casta:r `ConfirmedOutreach`; kör dessutom `tsc` på filen så typskydden prövas i vitest). `test/repoFiles.ts` är gemensam filsökning.
- `.env.example`: `OUTREACH_LIVE_ENABLED`, `OUTREACH_ALLOWED_USER_IDS` (utan värden). ESLint: `no-restricted-imports` mot mejlpaket, sammanslagen med demoguarden (flat config ersätter regler, slår inte ihop dem).
- `core/text.ts`: `cleanText` flyttad hit och delad med Registret (ingen beteendeändring).
- **Granskat:** code-reviewer (0 CRITICAL, 3 HIGH, 6 MEDIUM) och security-reviewer (0 CRITICAL, 3 MEDIUM). Åtgärdat: domänkopplingen (sidans domän räknas inte längre, suffix/delade värdar/fria mejl, strikt namnlikhet), URL-validering, Unicode före adress, etikettsyntax, företagsnamnet i eget databloc, `cause` borttagen, käll-URL i utkast, typvakten (nu `tsc`), vakternas bredd (G2/G3, `sourceFiles`). Kvar och dokumenterat i moduldokumentet: brandet är bara kompileringstid, textbaserade vakter, in-memory-throttle, GDPR art. 14.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

### Beslut nästa session behöver känna till
- **Sändning är en egen uppgift** som inte påbörjas utan uttryckligt ja från Theodor och grundaren. Då: exakt en konstruktör av `ConfirmedOutreach` i `ports/outreachConfirmation.ts`, **och** en körningskontroll i `send` (typen ensam räcker inte, se moduldokumentet). Gmail OAuth och beslutet om `opened` är fortfarande öppna.
- **Ingen liveyta finns.** En framtida skärm/route måste gå via porten och visa `searchedUrl` och `källa.url` så att grundaren ser var adressen kom från innan hen bekräftar.
- **Nya användare av `lib/server/tavily.ts`** (Webbresearch, Pulsen) måste läggas till i G2:s lista, medvetet.
- **`OUTREACH_ALLOWED_USER_IDS`** (Erik och Theodor) sätts bara i `.env.local`.

### Kända problem / medvetna begränsningar
- Adaptern är aldrig körd mot riktiga Tavily/Gemini (bara mockat); opt-in-testet prövar bara Tavily-klienten. Gör en riktig provkörning (utan sändning) innan modulen exponeras.
- Bolag vars domän inte bär namnet avvisas; grundaren söker då manuellt.
- Öppen fråga till Theodor/Juridisk koll: GDPR artikel 14 för mottagarnas personuppgifter och om utkastets `gdprNotice` räcker.
- Detaljer: `docs/moduler/utskick-och-svar.md`, "Kända begränsningar".

## Modul: Domen — grunden (steg 06, branch `modul/domen`)

Byggd enligt planner-agentens plan, godkänd av grundaren innan kod skrevs. Ingen skärm, ingen Gemini, ingen liveindata.

### Klart
- **`docs/moduler/domen.md`** skrivet (det saknades). Beslutsregler, antaganden, säkerhet, status.
- **`core/verdict.ts`**: ren, deterministisk logik. Fyra domar: `run`, `refine`, `pivot`, `insufficient` (egen dom). Trösklar som exporterade konstanter: 5 svar, 70 %, 40 %, 25 % nej till pris, 50 % accepterar pris. Inga texter, ingen poäng (testat). `core/verdictReport.ts` bygger visningsklar rapport ur i18n (`verdict.*`, sv+en); citat ordagranna, rensade med `cleanText`, med källa.
- **Ny port `ports/VerdictProvider.ts`** (`getVerdictInput`, `getVerdictReport`), demoadapter (bygger på `getResponseCards`/`getCampaign`, orörda), liveadapter som är stub (`NotImplementedError`), kontraktstest, rad i `stubStatus.test.ts` och i arkitekturtabellen. `JourneyRepository` orörd.
- **`MemoryRepository.recordTraceEvent`** (ändrad port, eget beslut enligt bygga-en-modul §4): rensar och kortar text, kräver giltig tid, idempotent, användaren ur sessionen, RLS "insert egen". Demo: no-op. `core/verdictTrace.ts` (`recordVerdictTrace`) sparar en pivot i Spåret; inte kopplad till någon skärm.
- **Demodatan rättad till "3 av 9" som avböjer priset** (beslut av grundaren): `getValidationAssumptions`, `sara.ts` steg 06 (sv+en, tre ställen), `cofounderScript.ts` och specraden i `docs/uppdrag.md`.
- Verifierat: `pnpm typecheck`, `lint`, `test`, `build`. `/security-review` körd: inga fynd.

### Beslut nästa session behöver känna till
- **Trösklarna är utgångsvärden**, ska justeras när riktig data finns.
- **Svarstolkningen är öppen**: vem klassificerar svar som bekräftar/delvis/avvisar och pris accepterar/avböjer/tvekar i livedrift hör ihop med OutreachProviders klassificering, som inte är byggd. Demoadaptern tolkar citaten (`DECLINES_PRICE`, `UNDECIDED_PRICE`, `COUNTER_OFFER_KR`).
- **Skärmkoppling är en egen fas**: `screens/Validation.tsx` läser fortfarande skriven prosa från `JourneyRepository`. Kopplingen ska också anropa `recordVerdictTrace`.
- **Liveadaptern** väntar på Utskick (svar) och Registret (anställda). Gemini-sammanfattning är utanför avgränsningen; villkoren står i moduldokumentet.

### Kända problem / medvetna begränsningar
- **Kvar med "6 av 9" (orörda enligt uppdraget):** fixturen i `screens/Validation.test.tsx` och den historiska loggtexten i `docs/status.md` (Valideringssessionen). Rör inte demotexten "7 av 9 bekräftar problemet" (svarskorten visar 9 som bekräftar eller delvis) och "median 900 kr" (ett enda motbud, Domen visar "baserat på 1 svar"): samma sorts inkonsekvens, inte åtgärdad.
- `recordTraceEvent` lämnar `project_id` null (kontonivå) och är inte körd mot en riktig databas (bara fejkad Supabase); lägg gärna till i `rls.live.test.ts`.
- `recordTraceEvent`s idempotens är select-sedan-insert utan unikt index på `trace_events`; två samtidiga omräkningar kan ge dubbletter i Spåret (bara egen data, ingen säkerhetsrisk). Åtgärd om det behövs: unikt index på (user_id, module, occurred_at, description) och `upsert` med `ignoreDuplicates`.

## Sidornas komposition mot artefaktens vyer (klar, gren `prototyp`)

Uppdrag: läs `design-referens/artefakt/app.js`/`app.css`/`index.html` för
STRUKTUR — hur `vyHem`, `vyMedgrundaren`, `vyMarknaden`, `vyValideringen`,
`vyBygget` och `vyProfilen` är komponerade — aldrig för innehåll (artefaktens
Elin/Kvittojakten-scenario är påhittat, inget av det fick in i kodbasen). Till
skillnad från förra sessionens rena `className`-formgivning fick JSX-struktur
och komponentindelning ändras den här gången. Alla tio `/demo/app`-sidor
gjorda (inte bara Hem) — grundaren godkände att fortsätta genom hela listan
efter att Hem var klar. Tio commits, en per sida. Fullständig motivering per
sida i `DESIGN.md` under samma rubrik.

### Klart
- **Hem** ombyggd helt: den gamla femkorts-KPI-raden borttagen (grundarens
  uttryckliga instruktion). Ny tvåkolumns hero — huvudspalt: utökat
  `NextStepCard` (nya valfria props `actionPillLabel`/`remainingParts`) +
  ny `components/spark/JourneyRail.tsx` (kompakt Resan-widget med
  stegprickar, länkar till `/resan/[steg]`). Sidospalt: ny
  `components/spark/ScorePanel.tsx` (total + rörelse + sparkline + alla åtta
  delarna + låsta delar) och "Vad som hänt sedan sist". Botten, full bredd:
  "Höj din poäng" (ny `components/spark/SuggestionList.tsx`, utbruten ur
  `Score.tsx`) och Pulsen — nu 3–5 signaler (`getSignals`) i grid i stället
  för bara dagens signal.
- **Medgrundaren:** samma tvåkolumns "cog"-grid som originalet — chatten i
  huvudspalten, "Sedan tidigare"-kontextlistan i sidospalten (fyller Hjärnans
  platsroll utan att duplicera Minnets data — Hjärnan finns redan på Minnet).
- **Marknad:** ny split — Storleksfördelningen i huvudspalten, "Dina
  utskick" (nu kompakta `dl`-rader i stället för `KpiTile`-kort) och
  "Datalagret" staplade i en sidospalt, som artefaktens `dist`/`[utskick,
  lager]`-uppdelning. KPI-raden, Kundlistan, Konkurrenterna, Simuleringen
  oförändrade.
- **Validering:** låg redan i artefaktens exakta sektionsordning sedan en
  tidigare session — minst omtag. Antagandena och kontaktlistan fick
  `Card`-skal (artefakten wrappar just de två), resten var redan bar
  `Eyebrow` + grid som artefakten.
- **Bygg:** statusraden blev en färgad grindbanner. Ny split: "Omfånget"
  (målgrupp + sidor) i sidospalt, ett webbläsarchrome-styrt "fönster" i
  huvudspalt som visar specen och underlaget. Ingen Lovable-interaktivitet
  tillagd.
- **Minnet:** profilfliken bytte från ett blandat kort till två `Card`-kort
  i grid (Bakgrund, Resurser) — samma "profgrid"-idé, byggt av
  `ProfileSummary`s faktiska sex fält.
- **Resan, Poäng, Pulsen, Juridik** (inget eget artefakt-original): Resan
  fick en "klara/totalt"-not per fasrubrik; Poäng återanvänder nu samma
  `ScorePanel`/`SuggestionList` som Hem i stället för egna uppfinningar;
  Pulsen visar sina signaler som grid i stället för staplad lista; Juridik
  fick en `Eyebrow`-rubrik ovanför kartan.
- **Nytt delat byggblock `components/ui/Card.tsx`:** motsvarar artefaktens
  `card`/`chead`. Regel för när en sektion wrappas: artefakten avgör — en
  sektion artefakten själv bygger med `card()` blir `Card` hos oss, en bar
  `stats`/`.replies`-grid under en rubrik förblir bar `Eyebrow` + grid.
- **`adapters/demo/tourSteps.ts`:** de tre stoppen som pekade på Hems
  borttagna KPI-rad/"Poängrörelse"-kort (`hem-kpi` × 2,
  `hem-score-movement`) omriktade till den nya poängpanelen (`hem-score`).
  Övriga tolv mål verifierade oförändrade (`comm` mellan `tourSteps.ts`s mål
  och samtliga `data-tour-id` i kodbasen — inget saknas).
- Verifierat: `pnpm typecheck`/`lint`/`test` (373 gröna, 36 skippade som
  väntat, genom hela sessionen) och `pnpm build` gröna före varje commit.

### Beslut nästa session behöver känna till
- **`components/ui/Card.tsx` är nu det delade kortskalet** — återanvänd det
  i stället för att skriva `rounded-md border border-slate-200 bg-white p-4
  shadow-lg` för hand, men bara när artefakten själv wrappar motsvarande
  sektion i `card()` (se `DESIGN.md`s regel). En grid av redan
  egna-bordade kort (KpiTile, svarskort, konkurrentkort) ska förbli en bar
  `Eyebrow` + grid, inte dubbelt inkapslad.
- **`components/spark/ScorePanel.tsx` och `SuggestionList.tsx`** används nu
  av både Hem och Poäng — ändra dem på ett ställe, inte per sida.
- **`NextStepCard.remainingParts`** är byggt av `ScoreSnapshot.lockedParts`
  och visar bara "delen är låst, låses upp efter steg N" — det finns ingen
  bespoke kravtext per krav (som artefaktens `UNLOCK.krit`) i vår datamodell.
  Hitta inte på sådan text i en framtida session utan att först fråga
  grundaren om det är värt en ny porttyp.
- **Minnets idé-kedja** ("Härifrån kom idén", artefaktens `vyProfilen`)
  fördes medvetet inte över — sökt igenom hela kodbasen, ingen sådan
  strukturerad data finns. Grundaren godkände avvikelsen under
  förutsättningen att inget befintligt försvinner; eftersom kedjan aldrig
  fanns är villkoret trivialt uppfyllt.
- **Dubbel kantlinje, avsiktlig:** Hems "Höj din poäng"/Pulsen är
  `Card`-wrappade (artefakten wrappar dem) trots att `SuggestionList`/
  `PulseCard` redan har egen kant+skugga — ett litet visuellt dubbelt-kant-
  avdrag, dokumenterat i `DESIGN.md`, inte en bugg att jaga.

### Kända problem / medvetna begränsningar
- **Ingen manuell webbläsarverifiering.** Inget webbläsarverktyg anslutet,
  och ingen cachad Playwright/Chromium-installation tillgänglig den här
  gången (till skillnad från förra sessionen) — att installera ett nytt
  paket hade brutit mot "inga nya beroenden". Verifierat med
  `typecheck`/`lint`/`test`/`build` genom hela sessionen plus `curl` (200)
  mot `/demo/app`. Gör en klickgenomgång (båda språken) i nästa session som
  har ett webbläsarverktyg — särskilt Hems tvåkolumnslayout vid smalare
  bredder och `JourneyRail`s stegprickar.
- `screens/Market.test.tsx` fick ett test justerat (`"4/ 5"` → `"4 / 5"`) för
  den nya `dl`-radens mellanslagsformatering — samma tal, ingen
  beteendeändring.

### Återstår
- Klickgenomgång i en riktig webbläsare (se ovan).
- Sidhopslagningen som väntar på Erik efter Emma-mötet (`docs/beslut.md`,
  oförändrad av den här sessionen — ren layoutsession, ingen sidstruktur
  slogs ihop eller togs bort).

## Hem, fyra kvarstående punkter mot artefakten (klar, gren `prototyp`)

Fyra specifika avvikelser från `design-referens/artefakt/app.js`/`app.css`
som grundaren pekade ut efter förra sessionens omtag: poängvisningen,
poängdelarna, handlingskortet och sidomenyn. `core/score.ts`, `adapters/live/`,
`lib/server/`, `ports/` och demodatan rördes inte. Full motivering i
`DESIGN.md` under samma rubrik.

### Klart
- **Poängvisningen:** ny `components/spark/ScoreRing.tsx` (tunn SVG-ring,
  talet i mitten) ersätter `ScoreBadge` i sidhuvudet
  (`screens/AppShell.tsx`). `ScorePanel.tsx`s topp byggd om från en
  tonfärgad, fylld `ScoreBadge`-pill (det beigea blocket vid låga/mellan-
  poäng) till vanlig text: stort tal (medvetet UTAN `.font-numeric` —
  grundarens skriftliga undantag från "alla siffror är Funnel Display"),
  `/100`, nivånamn, rörelse, tunn skala. **Flaggad lucka:** ingen tak-
  markör på skalan — `PhaseId` (fem värden i `core/score.ts`) går inte att
  entydigt härleda ur `JourneyStepView.journeyPhase` (fyra värden) utan att
  gissa eller röra poängmotorn, så skalan visas utan den.
- **Poängdelarna:** varje rad i `ScorePanel.tsx` är nu namn vänster/poäng
  höger på en rad, en tunn kortare stapel under. `SourceTag` visas bara på
  den utfällda delen (ny lokal `useState`), inte på varje rad.
- **Handlingskortet (`NextStepCard.tsx`):** `why` delas vid meningsgränser
  till pilpunkter (ingen ny text — kontrollerat mot alla `why`-strängar i
  `sara.ts`, inga förkortningar som hade delat fel); en ensam mening visas
  fortfarande som vanlig text, inte en duplicerande ensam punkt. Tre val:
  huvudhandlingen, en ny "Senare" (lokalt UI-state, ingen egen data) och en
  ny "Visa/Dölj underlaget" som fäller ut `doneItems`. Poängen högerställd
  (`+N poäng`). Kravlistan har nu tomma kryssrutor + en äkta räknare
  (`ScoreSnapshot.parts.length` / `+ lockedParts.length`, nya valfria props
  `unlockedPartsCount`/`totalPartsCount`) — ingen bespoke kravtext hittades
  på, samma gräns som noterades i förra sessionens `DESIGN.md`-post. Fyra
  nya i18n-nycklar (`common.laterLabel`/`deferredLabel`/`showEvidenceLabel`/
  `hideEvidenceLabel`, sv+en); allt annat återanvänder befintliga nycklar.
- **Sidomenyn:** nytt `--navy`-alias i `design/tokens.css` (samma ton som
  `slate-800`), `--sidebar-bg: var(--navy)` i stället för den ljusa tonen.
  Kontrast uträknad, inte ögonmått: `slate-200` mot navy 10.67:1,
  `slate-400` 5.92:1, vit på `accent-600` (aktiv länk) 5.27:1 — alla klarar
  WCAG AA. **Inget föll under gränsen.**
- **Manuell webbläsarverifiering genomförd:** `pnpm dev` + en redan cachad
  `npx`-installation av Playwright (från en tidigare session, inget nytt
  projektberoende) — skärmdumpar av `/demo/app` (två beats) och
  `/demo/app/poang`, plus klickade interaktioner (expandera en poängdel,
  "Visa underlaget", "Senare"). Allt renderade och togglade korrekt, inga
  konsolfel. Hittade och städade bort en kvarglömd `next start`-process på
  port 3000 (gav 500:or pga `.next`-mismatch, samma mönster som en
  tidigare sessions `DESIGN.md`-notering) — testade mot `pnpm dev`s egen
  port (3001) i stället.
- Verifierat: `pnpm typecheck`/`lint`/`test` (373 gröna, 36 skippade som
  väntat) och `pnpm build` gröna.

### Beslut nästa session behöver känna till
- **Talets typsnitt i `ScorePanel.tsx`s topp är ett medvetet, skriftligt
  godkänt undantag** från "alla siffror är `.font-numeric`" — rör det inte
  utan att fråga igen.
- **Taköverst-markören på poängskalan saknas** (se "Flaggad lucka" ovan).
  Om den ska in måste antingen `ScoreSnapshot` börja bära den aktuella
  `PhaseId` (ett portkontrakt-beslut, inte en ren formgivningsändring) eller
  `journeyEngine.ts` börja skilja `tryBeforeCalls`/`tryAfterCalls` i det som
  redan exponeras — avgör med grundaren innan poängmotorn eller portarna
  rörs för det.
- **"Senare" i `NextStepCard` är rent kosmetiskt UI-state**, precis som
  artefaktens `S.deferred` — ingen backend, ingen persistens, nollställs vid
  omladdning. Samma avgränsning som demoradens "Byt ingång" hade innan den
  gjordes funktionell (Session 5).

### Kända problem
- Inga nya.

## Formgivningspass mot artefakten, fullständigt (klar, gren `prototyp`)

Uppdrag: artefakten (`design-referens/artefakt/app.js`/`app.css`) är specifikationen överallt där vår kod och den skiljer sig — tidigare sessioners medvetna avsteg ska bort, inte försvaras. Fyra uppgifter: typografin, skalet (sidomeny+sidhuvud), de sex sidor med en artefaktmotsvarighet (Hem, Medgrundaren, Marknad, Validering, Bygg, Minnet), och de fyra utan (Resan, Poäng, Pulsen, Juridik). Full motivering i `DESIGN.md` under samma rubrik — den här posten sammanfattar. Tio commits, `core/score.ts`/`adapters/live/`/`lib/server/`/`ports/`/demodatan orörda.

### Klart
- **Typografin:** `--font-data` (Funnel Display) borttaget helt, inklusive fontfilerna — siffror ärver Castoro precis som artefaktens `.num`/`.mono`. `font-bold`/`font-extrabold` borttaget från alla rubriker (Castoro har bara vikt 400, fetstilen renderades som syntetisk) — hierarkin byggs om med storlek efter artefaktens egen dokumenterade kompensationstabell i `app.css`. **Det tidigare "grundarens uttryckliga undantag"** om `ScorePanel`s poängtal (se föregående sessions post ovan) **är nu löst, inte kringgånget:** `.font-numeric` byter inte längre typsnitt (ingen `--font-data` kvar att peka på), så klassen är tillbaka på poängtalet för konsekvent spårning — ingen konflikt med det gamla beslutet, bara att grunden för det försvann.
- **Skalet:** sidomenyns brand-rad fick ett ikonmärke + undertext (`t.appShell.tagline`), navposterna fick ikoner (ny `components/spark/NavIcon.tsx`) och Hem fick en räknare (upplåsta/totalt delar). Ny sidfot med profilblock (flyttat från sidhuvudet) + en ny `SidebarRestart`-knapp (samma `useDemoStore().reset()` som demoradens "Återställ", en andra ingång). Sidhuvudets brödsmula och stegpill är nu två rader, inte en sammanslagen sträng. Sidomenyn kvar mörk (`--navy`) — grundarens uttryckliga undantag, oförändrat.
- **De sex sidorna:** Hem tappade sin pagehead (artefakten har ingen), `SuggestionList` omskriven till artefaktens `.sugggrid`-kortmönster, och **den dubbla kantlinjen på Hems "Höj din poäng"/Pulsen — grundarens uttryckligen flaggade kända avsteg — är fixad** (delad rutnätslinje i stället för kant+skugga per kort ovanpå `Card`-omslaget, samma mönster spred sig till Marknads Konkurrenter och Valideringens Antaganden som hade samma bugg). Medgrundarens pagehead är statisk igen ("Medgrundaren", inte det aktuella momentets etikett). Marknads Storleksfördelning/Konkurrenter fick sina `Card`-skal. Byggets sidospalt fick sin fasta 300px-bredd + en "steg 08"-not. Minnets pagehead bytte till "Namn, ålder, ort" + bio (artefaktens ordning, samma data).
- **De fyra extra sidorna (Resan/Poäng/Pulsen/Juridik):** redan i gott skick sedan en tidigare session — bara Resans fasgap (24px→18px) och Poängs saknade sorteringsnot behövde rättas. Ärver typografi- och dubbelkantlinje-fixarna automatiskt via delade komponenter.
- Ny i18n: `appShell.tagline`/`restartDemo`, `scorePage.estimatedMinutesUnit`/`suggestionsSortNote`, `buildPage.scopeStepNote`.
- Verifierat vid varje commit: `pnpm typecheck`/`lint`/`test` (373 gröna, 36 skippade) och `pnpm build`. Manuell Playwright-verifiering (cachad installation, inget nytt beroende): alla nio `/demo/app`-sidorna klickade igenom på både sv och en via sidomenyns länkar, skärmdumpar tagna, inga konsolfel.

### Vad som INTE kunde matchas (rapporterat, se `DESIGN.md` för full motivering)
1. Artefaktens "Kundlistan" hör hemma på Marknad — hos oss lever den datan på Validering sedan en tidigare sessions hopslagning (`i18n/dictionary.ts:305`). En sidoombyggnad, inte en sektionsjustering — inte gjord.
2. Validerings navräknare (artefaktens `S.svar`-siffra) byggdes inte — skulle krävt en ny datahämtning i det delade skalet för en decorativ siffra.
3. `VerdictCard` byggdes inte om till artefaktens rikare `.verdict`-kort — delas av tre ställen, en egen större uppgift.
4. Byggets grindrad visar bara byggstatus, inte artefaktens rubrik+beskrivning om huruvida underlaget är låst — den datan finns inte i `BuildData`.
5. Tabelltypografi och mobilanpassning — samma två punkter en tidigare sessions `DESIGN.md`-post redan flaggade, oförändrat.
6. Minnets "Härifrån kom idén"-kedjekort — ingen strukturerad data, samma godkända avgränsning som tidigare.

### Beslut nästa session behöver känna till
- **`ScorePanel`s poängtal bär nu `.font-numeric` igen** — det gamla "rör det inte utan att fråga"-beslutet i föregående sessions post gäller inte längre (grunden för undantaget, ett annat typsnitt bakom klassen, är borta). Inget kvar att fråga om här.
- **`aside` i `AppShell.tsx` är nu `sticky top-0 h-screen`** med `pb-20` när `bottomBar` är satt — ett nytt mönster, inte bara en klassändring. Om en framtida sidfotskomponent läggs till i skalet, kontrollera att den ryms inom den paddningen.
- **`SuggestionList`/`PulseCard`s rutnätslinje-mönster** (`gap-px` + `bg-slate-200`, fyllnadsceller för ofullständiga rader) är nu det etablerade sättet att visa ett kortrutnät inuti en `Card` utan dubbel kantlinje — återanvänd det, uppfinn inte en ny variant.
- **Validering/Marknad-uppdelningen är en känd, olöst motsägelse mot artefakten** (se punkt 1 ovan) — om en framtida session får i uppdrag att åtgärda den, är det en flytt av hela kontaktstatustabellen (med dess tour-steg och tester), inte en enkel sektionsjustering.

### Kända problem
- **`/demo/app/<undersida>` kan redirecta tillbaka till `/demo/start` vid en hård, fräsch sidladdning** (`page.goto` rakt in på en nästlad route), trots att `onboardingDone:true` redan är korrekt persisterat i localStorage — en trolig Zustand-hydreringskapplöpning i `app/demo/app/layout.tsx`s onboarding-redirect-effekt. Reproducerar INTE vid vanlig SPA-navigering (klick på en sidomeny-länk, den här sessionens hela verifieringsmetod) eller vid navigering till `/demo/app` själv. Upptäckt under sessionen, inte skapad av den, inte undersökt vidare — utanför uppdraget (typografi/skal/sidor). Flagga och undersök `app/demo/app/layout.tsx` specifikt om nästa session ser samma sak.

## Poleringssession — visuell disciplin + datakonsekvens (klar, gren `prototyp`)

Två uppgifter från grundaren: (1) gå igenom `/demo/app` mot åtta konkreta regler (färg, accent, rytm, skuggor, siffror, rörelse, källchips, maxbredd), (2) kontrollera att siffror/datum/källor i demodatan hänger ihop. Ingen layout ombyggd, inget innehåll ändrat, `core/score.ts`/`adapters/live/`/`lib/server/`/`ports/` orörda, inga nya beroenden. Full motivering i `DESIGN.md` under samma rubrik — den här posten sammanfattar.

### Klart
- **Färg (a):** genomgången — inget att rätta. Alla poängs-/status-/datatypsfärger var redan kopplade till verklig betydelse, ingen genomgående grön stapel/mätare oavsett värde.
- **Accenten (b):** "Kan ge upp till X poäng"-texten (informativ, inte en handling) neutraliserad från `text-accent-700` till `text-slate-600` i `screens/Journey.tsx` (upprepades tidigare en gång per stegkort, upp till 12x/sida), `screens/JourneyStep.tsx` och `components/spark/JourneyRail.tsx`. `JourneyRail`s "Öppna steg →"-länk och `JourneyStep`s "← Tillbaka"-länk neutraliserade till slate — Hem/Resan-sidorna hade båda flera accent-element samtidigt som en riktig primärknapp. Lämnat oförändrat (med motivering i DESIGN.md): `NextStepCard`s primärknapp, "aktuellt steg"-statusfärgen, flikväljare, chattbubblor, onboardingens symmetriska valkort.
- **Vertikal rytm (c):** en avvikelse — `screens/OnboardingEntry.tsx`s rubrik→ingress var `mt-3` mot alla andra sidors `mt-2`. Rättad.
- **Skuggor (d):** redan rent — bara `shadow-lg`/`shadow-xl`, båda tokeniserade sedan tidigare. Inget att rätta.
- **Siffror (e):** `Validation.tsx`s kontaktlista — `Anställda`/`Omsättning`-kolumnerna högerställda (var vänsterjusterade trots `font-numeric`). SNI-koden (en kod, inte en storlek) lämnad vänsterjusterad.
- **Rörelse (f):** `ScoreBadge`s räkneanimation (Framer Motion) togs bort helt — kunde visa ett annat tal än en samtidigt monterad `ScoreRing` under de ~900 ms den pågick (t.ex. Resan/steg 06). Talet renderas nu direkt. Framer Motion blev därmed oanvänt i hela kodbasen (bekräftat med grep) och togs bort som beroende — sessionens enda beroendeändring, en borttagning, ingen ny.
- **Källchipset (g):** redan enhetligt, `SourceTag` är den enda chip-komponenten.
- **Maxbredd (h):** redan konsekvent (`max-w-[1080px] gap-[18px]` på alla elva `/demo/app`-sidor). `--maxw` gäller bara de artefaktmodellerade appsidorna, inte marknadsförings-/inloggnings-/designsystemsidorna (avsiktlig avgränsning från tidigare sessioner, bekräftad).
- **Datakonsekvens (uppgift 2):** grundarens exempelfel (september-datum mot en januari-källa) existerar inte i koden — alla datum i `sara.ts`/`jonas.ts`/`RegistryProvider.ts`/`OutreachProvider.ts` är redan kronologiskt konsekventa (verifierat fil för fil). Kostnadsgolvets aritmetik och "7 av 9 bekräftar problemet"-påståendet höll vid kontrollräkning.
- **En verklig bugg hittad och fixad, upptäckt via webbläsarverifiering:** `adapters/demo/SimulationProvider.ts`s `kindFor()` valde simulering via en regex mot frågetexten (`/betal|willingness|tolerance/i`) — matchade den svenska toleransfrågan ("...tänkas **betal**a?") men inte den engelska ("...willing to **pay**?"), som tyst föll igenom till tidssimuleringens innehåll. Marknads och Valideringens engelska sida visade därför "HOW MUCH MIGHT FIRMS BE WILLING TO PAY?" följt av "~6.5 hours per employee... chasing receipts" — fel simulering under rätt rubrik, bara på engelska. Fixad genom att slå upp frågan mot `simulationQuestions`s sex kända strängar i stället för fri regex. Ny testfil `adapters/demo/SimulationProvider.test.ts` (5 tester) skyddar mot att det glider isär mellan språken igen.
- Verifierat: `pnpm typecheck`/`lint`/`test` (378 gröna, 36 skippade som väntat) och `pnpm build` gröna. Playwright-klickgenomgång (Hem, Resan, Resan/steg 06+07, Marknad, Poäng, Validering, onboardingens ingångsval) på både sv och en via demoradens "Hoppa till steg" + SPA-nav (samma etablerade metod som undviker den kända fresh-load-hydreringskapplöpningen) — inga konsol-/sidfel. Simuleringsbuggen hittades genom att faktiskt läsa den engelska skärmdumpen.

### Beslut nästa session behöver känna till
- **`ScoreBadge` animerar inte längre.** Om en ny räkneanimation någonsin läggs till (för `ScoreBadge` eller någon annan siffra), måste den garantera att alla samtidigt synliga instanser av samma poäng visar samma tal genom hela animationen — bygg delad state mellan instanserna, chansa inte igen.
- **Framer Motion är borttaget som beroende.** Om en framtida session vill animera något, lägg tillbaka det medvetet (eller använd CSS-transitions/`--motion-*`-tokens, som redan täcker alla kvarvarande rörelser i kodbasen).
- **`SimulationProvider.ts`s `kindFor()`** slår nu upp frågan mot `simulationQuestions`s kända strängar, inte en fri regex — alla anropsställen skickar redan in `simulationQuestions[kind][locale]` rakt av (bekräftat med grep), så ingen anropskod behövde ändras. Lägg aldrig till en fjärde simuleringstyp utan att lägga till dess fråga i `simulationQuestions` också.
- **"Kan ge upp till X poäng" och liknande informativa rader är nu neutrala (slate), inte accent.** Accent är reserverad för en sidas faktiska primära handling och för färgkodade statusar (aktuell/klar/låst) — kontrollera mot det mönstret innan en ny rad färgas blå.

### Kända problem / medvetna begränsningar
- Inga nya. Samma kända, tidigare dokumenterade begränsningar (Jonas byggd i bredd inte djup, fem moduler visar tomt läge för Jonas, fresh-load-hydreringskapplöpningen på nästlade `/demo/app`-routes) är oförändrade — utanför den här sessionens två uppgifter.

## Session — Affärsplanen (klar, gren `prototyp`)

Uppdrag: en ny funktion, Affärsplanen — en plan som sätts samman i kod ur
det grundaren redan bevisat i resan, aldrig genererad, ingen språkmodell
inblandad. Tre delar: specen i `docs/uppdrag.md` (avsnitt 15), en ren
funktion i `core/businessPlan.ts` (samma mönster som `core/score.ts`), och
en ny sida under `/demo/app`. `core/score.ts`, `adapters/live/`,
`lib/server/`, `ports/` och befintlig demodata orörda. Tre commits.

### Klart
- **`docs/uppdrag.md` avsnitt 15:** principen (planen sätts samman, sätts
  aldrig, varje påstående bär `Källa`+datum), tabellen över alla nio
  avsnitt mot sina underliggande portar, och de tre reglerna (luckor
  visas/fylls inte, motsägelser döljs inte, planen visar sin egen
  färdighetsgrad).
- **`core/businessPlan.ts`:** `buildBusinessPlan` — en ren funktion utan
  adapter-, i18n- eller portimport. Tar redan hopsamlade "kontrollpunkter"
  per avsnitt (`BusinessPlanCheck`: `claims` om kontrollpunkten höll, annars
  tom med `requiredStepNumber`) och räknar status (`solid`/`thin`/`missing`)
  och en `maturity.solidShare`. Sorterar alltid till den fasta
  avsnittsordningen (`BUSINESS_PLAN_SECTION_ORDER`), oavsett indataordning.
  Motsägelser (`BusinessPlanContradiction`) och låsta poängdelar
  (`lockedParts`, bara "risks") går rakt igenom oförändrade. Kastar om ett
  avsnitt skickas in utan en enda kontrollpunkt. `core/businessPlan.test.ts`
  har ett test per regel i 15.3, samma stil som `core/score.test.ts`.
- **`adapters/demo/businessPlan.ts`** (ny fil, inte en port): hopsamlingen
  ur de befintliga demoportarna — `JourneyRepository.getStepDetail` (steg
  1, 2, 4, 5, 6, 7, 8, 11, 12), `EvidenceRepository` (`ScoreSnapshot` +
  `getSuggestions`), `RegistryProvider`, `VerdictProvider`,
  `ProjectRepository.getIdeaScreening`, `BuildProvider.getSpec`. Bygger en
  `partSources`-uppslagning (`ScorePartId` → `{source, dataType}`) genom att
  matcha `ScoreSnapshot.parts[].name` (redan lokaliserad etikett) mot
  `t.score.parts` — `ScorePart` bär inget stabilt `partId` (bara `name`),
  så matchningen måste ske i adapterlagret, inte i `core/`.
  **Viktigt fynd under bygget:** `RegistryProvider` och
  `ProjectRepository.getIdeaScreening` är hårdkodade mot en enda persona
  vardera (registret alltid Sara, idégenomlysningen alltid Jonas) **utan**
  egen `entry`-vakt, till skillnad från `OutreachProvider`/`VerdictProvider`/
  `BuildProvider`/`PulseProvider`/`LegalAdvisor` som redan har en. Anropas
  därför bara för rätt persona i `businessPlan.ts` (samma disciplin som
  redan finns överallt annars) — adaptrarna själva rördes inte. Se
  `docs/beslut.md` 2026-09-22 för fullständig motivering.
- **`screens/BusinessPlan.tsx` + `app/demo/app/affarsplan/page.tsx`:** ny
  sida, samma kortskal (`Card`), typografiska skala, källchips (`SourceTag`)
  och maxbredd/gap som resten av `/demo/app`. Färdighetsgraden visas överst
  som en `KpiTile` (`x/9`). Varje avsnitt är ett `Card` med en statuspill
  (håller/tunt underlag/saknas, samma tonfärgsmönster som `Journey.tsx`s
  `journeyStatusToneClasses`), sina påståenden (etikett+tal i `DataFact`-stil
  där ett `value` finns, annars ren text, alltid med `SourceTag`),
  motsägelser i en egen markerad ruta, och luckor som `LockedState` (ärligt
  tomt läge, inte en tom ruta). Låsta poängdelar (bara "risks") listas
  likadant. Sidan hämtar data i en `useEffect` med
  `[locale, beatIndex, entry]` som beroende, samma mönster som
  `app/demo/app/poang/page.tsx`.
- **Ny nav-post** ("Affärsplanen") i `screens/AppShell.tsx`, ny
  `NavIcon`-variant (`businessPlan`). Nya i18n-nycklar
  (`appShell.nav.businessPlan`, `businessPlanPage.*`), sv+en, typtvingat.
  `screens/Market.tsx`s redan existerande `marketPage.companyCountLabel`
  m.fl. återanvänds rakt av för Marknad-avsnittets nyckeltal — inga
  duplicerade i18n-nycklar för samma etiketter.
- **`components/ui/Eyebrow.tsx`:** ny `tone="warning"` (score-orange text)
  för Riskerna-avsnittets motsägelsemarkering. Utan den hade två
  textfärgs-klasser (tone + en påstådd override i `className`) staplats på
  samma element — exakt den CSS-källordningsbugg `DESIGN.md` redan
  dokumenterat en gång (Session 1, `EditorialHeading`). Löst genom att lägga
  till en riktig tone-variant i stället för att stapla klasser.
- **`core/businessPlan.ts`s `BusinessPlanClaim`** fick ett valfritt
  `value`-fält (siffra eller redan formaterad sträng) för siffertunga
  påståenden, i samma "etikett + tal"-stil som `DataFact` — upptäckt som
  nödvändigt medan `adapters/demo/businessPlan.ts` skrevs (registrets
  nyckeltal har ingen egen meningstext att återanvända, bara en i18n-etikett
  + ett tal).
- **Manuell webbläsarverifiering genomförd** (cachad Playwright/Chromium,
  `pnpm build && next start`): båda personas, båda språken, via
  demoradens "Hoppa till steg" (senaste beatet) och sidomenyns SPA-länk —
  samma etablerade metod som undviker den kända fresh-load-
  hydreringskapplöpningen på nästlade `/demo/app`-routes. Inga konsol-
  eller sidfel i någon av de fyra kombinationerna. Skärmdumpar bekräftar
  visuellt: kortskal, chips, statuspiller och `LockedState`-tomma-lägen
  renderar konsekvent med resten av `/demo/app`.
- Verifierat: `pnpm typecheck`/`lint`/`test` (389 gröna, 36 skippade som
  väntat — 11 nya gröna från `core/businessPlan.test.ts`) och `pnpm build`
  gröna. `adapters/demo/tourSteps.ts` opåverkat (ny sida är inte en del av
  `TourRoute`-unionen, ingen tour-uppgift begärdes) — bekräftat via grön
  `TourOverlay.test.tsx` och en oförändrad `pnpm build`.

### Resultat: vilka avsnitt saknade underlag (rapporterat, per uppdrag)
- **Sara (8 av 9 håller):** bara **Beviset** är tunt underlag — domen
  (steg 06) finns och håller, men "antagandena med utfall" saknas eftersom
  hennes ingång (`noIdea`) aldrig gick igenom en idégenomlysning.
- **Jonas (4 håller, 3 tunt, 2 saknas):** **Kunden och problemet** och
  **Konkurrensen** saknas helt — `RegistryProvider`/`OutreachProvider`/
  `VerdictProvider` är Sara-hårdkodade, så ingen kundprofil, inga
  namngivna konkurrenter och inga domsciterade kundsvar finns för honom.
  **Marknaden**, **Erbjudandet och priset** och **Beviset** är tunt
  underlag: Marknaden saknar täckningen (`basis`) eftersom han bara har
  idégenomlysningens tre registerfakta, inte en full `MarketOverview`;
  Erbjudandet saknar valideringen mot steg 05 (ingen `VerdictReport`);
  Beviset saknar en sourced domen-rad (hans steg 6-beats `verdict`-fält
  hittade ingen matchande delkälla vid det slutgiltiga beatet — se "Beslut
  nästa session" nedan). **Affärsidén**, **Genomförandet**, **Ekonomin**
  och **Riskerna** håller — byggda av data han faktiskt har (hans
  idégenomlysning, hans egna 12 stegs highlights och poängbevis).
  Exakt det avsiktliga "full av luckor, inte trasigt"-utfallet uppdraget
  bad om.

### Beslut nästa session behöver känna till
- **`RegistryProvider` och `ProjectRepository.getIdeaScreening` saknar
  fortfarande en egen `entry`-vakt** — `adapters/demo/businessPlan.ts`
  garderar anropen utifrån, men adaptrarna själva är oförändrade. En
  framtida session som bygger vidare på någon av dem bör lägga vakten där
  också, inte bara vid det här anropsstället.
- **Jonas steg 6-beats `verdict`-fält gav ingen sourced rad i Beviset**
  vid hans SISTA beat (kontrollerat manuellt: `steps[6]?.verdict` fanns,
  men källuppslagningen mot `problem`/`willingnessToPay`-delarna gav ingen
  träff vid det läget) — inte felsökt vidare, flaggat i stället som en
  legitim, mekaniskt uppkommen lucka (samma "hitta inte på" -princip som
  resten av funktionen). Om en framtida session vill täta den, börja med
  att logga `partSourcesFrom`s resultat vid Jonas sista beat.
- **`BUSINESS_PLAN_SECTION_ORDER`/`BusinessPlanSectionId`** i
  `core/businessPlan.ts` är den enda källan till avsnittens ordning och
  identiteter — lägg till ett nytt avsnitt där, inte bara i
  `adapters/demo/businessPlan.ts` eller i18n.
- **`Eyebrow`s nya `tone="warning"`** är avsedd att återanvändas för
  framtida motsägelse-/varningsmarkeringar — stapla aldrig en egen
  textfärgsklass ovanpå en annan `tone`, se DESIGN.md om CSS-källordning.

### Kända problem / medvetna begränsningar
- Inga nya utöver den redan flaggade `RegistryProvider`/
  `ProjectRepository`-luckan ovan (som är en förutsättning för resultatet,
  inte en bugg i den här sessionens kod).

## Licensfrågan nedgraderad till Sekundärt (klar, gren `prototyp`)

### Klart
- **`docs/dataspiken.md`:** licensen för namngivna företag (§6 fråga 1,
  "Status inför Fas 1", "Kort svar", avsnitt 1 och 2, källistan) sänkt från
  Verifierat till **Sekundärt**. Underlaget 2026-09-20 var Bolagsverkets
  informationssida om värdefulla datamängder, inte villkorstexten, och
  ingen ordalydelse citerades. EU-förordningens krav (öppen licens) och
  API-sidans "inget avtal, avgiftsfritt" står kvar som Verifierat.
- **`docs/beslut.md`:** beslutet infört under 2026-09-23.

### Återstår
- ~~**Erik:** läs Bolagsverkets faktiska villkor och citera ordalydelsen.~~
  Klart samma dag, se nästa avsnitt.

### Kända problem
- Claude Code kom inte åt `bolagsverket.se`: curl fick timeout på port 443,
  WebFetch misslyckades utan fel, och Chrome-tillägget var inte anslutet.
  Samma domänproblem som i Juridisk koll-sessionen.

### Beslut nästa session behöver känna till
- **Verifierat kräver citerad villkorstext.** En informationssida eller ett
  fungerande API räcker inte för att lyfta licensgrinden.

## Licensfrågan Verifierad med citat (klar, gren `prototyp`)

### Klart
- **`docs/dataspiken.md`:** licensen för namngivna företag är **Verifierat
  2026-09-23**. Erik klistrade in Bolagsverkets sida om värdefulla
  datamängder ordagrant (sidans datum 2025-11-21). Stycket "Användning av
  värdefulla data" är citerat i avsnitt 2: fri användning för kommersiella
  syften och nya tjänster, får modifieras, bearbetas och kombineras, så länge
  personuppgifts- och sekretesslagar följs; källhänvisning "kan" krävas.
- **Rättelse:** de två "undantagen" som dokumentet tillskrev sidan sedan
  2026-09-20 (enskilda firmor får inte profileras/samköras, reklamspärr ska
  respekteras) står inte i texten. De är vår GDPR-tolkning och ligger nu
  under §6 fråga 4. Rekommendationen "bara aktiebolag utan reklamspärr" står
  kvar som egen policy.
- **`docs/moduler/registret.md`:** grindavsnittet säger att licensvillkoret
  är uppfyllt men att grinden i koden är stängd tills Erik öppnar den.
- Två inklistringar före den godkända avvisades: API-sidan (säger bara "inget
  avtal, avgiftsfritt") och en AI-sammanfattning av villkoren (inte
  ordagrann).

### Återstår
- **Erik:** beslut om och när licensgrinden lyfts (koden är oförändrad).
- **§6 fråga 4** (enskilda firmor, reklamspärr, GDPR) med Juridisk koll och
  vuxen/handledare.
- **SCB:s företagsregister-API** har egna villkor som inte täcks.
- Ingen licens namnges i Bolagsverkets text. Hittas en, citera den.

### Beslut nästa session behöver känna till
- **Lagring i Supabase** är en bedömning (följer av fri användning och
  förordningen), inte ordagrant nämnd i Bolagsverkets text.
- **Källa på varje registeruppgift:** Bolagsverket/SCB, eftersom texten
  säger att källhänvisning kan krävas.

## Licensgrinden: öppning avbruten, grinden stängd (klar, gren `prototyp`)

### Klart
- **Öppningen av grinden förkastades innan den committades** (Eriks beslut,
  med `git restore`, ingen reset eller force push). Den hade tagit bort
  allowlisten så att alla inloggade släpptes in när flaggan var på. Koden
  (`lib/server/registryAccess.ts`, testerna, licensvakten i
  `ports/stubStatus.test.ts`, `.env.example`) är oförändrad sedan `8d10919`:
  flagga **och** allowlist krävs.
- **Licensen står kvar som Verifierat** i `docs/dataspiken.md`, med citatet,
  datumet och Eriks namn (`8d10919`).
- **`docs/moduler/registret.md`:** full öppning kräver nu uttryckligen tre
  saker: transporten skriven, SCB:s villkor lästa (efter 30 september 2026)
  och §6 fråga 4 avgjord med handledare.
- **Miljövariabler:** varken `.env.local` eller driftmiljön ändrades.
  `.env.local` har 2 id i `REGISTRY_ALLOWED_USER_IDS` (vems har inte
  kontrollerats, värdena lästes inte) och ingen `REGISTRY_LIVE_ENABLED`.

### Återstår
- De tre kraven för full öppning (se `registret.md`, "Licensgrind").
- **Erik:** bekräfta att de två id:na i `REGISTRY_ALLOWED_USER_IDS` är Erik
  och Theodor, i `.env.local` och i driftmiljön.

### Beslut nästa session behöver känna till
- **Verifierad licens är inte samma sak som öppen grind.** Grinden rörs inte
  förrän alla tre kraven i `registret.md` är uppfyllda.

## Beslut om Supabase-projekten (klar, gren `docs/supabase-projektbeslut`, PR mot `prototyp`)

### Klart
- **`docs/beslut.md` (2026-09-23):** SparkUF2 (Supabase, Frankfurt) är
  utvecklings- och betaprojektet, trots PRODUCTION-märkningen i Supabase.
  Före lanseringen 30 november 2026 skapas ett separat produktionsprojekt med
  samma migreringar (`supabase/migrations/`). Testanvändarna test-a och test-b
  är borttagna 2026-09-23.

### Återstår
- **Före 30 november 2026:** skapa produktionsprojektet, kör migreringarna och
  kontrollera RLS där. Sätt driftmiljöns Supabase-variabler mot det nya
  projektet och flytta inte över testdata.

### Kända problem
- **`adapters/live/rls.live.test.ts` kan inte köras just nu.** Opt-in-testet
  loggar in som två testanvändare (`SUPABASE_TEST_USER_A_*`/`_B_*`), och de är
  borttagna. Skapa två nya testanvändare och uppdatera `.env.local` innan RLS
  prövas mot SparkUF2 eller mot det kommande produktionsprojektet. CI påverkas
  inte, eftersom testet är opt-in.

## SCB-spåret förberett inför nyckeln 30 september (klar, gren `scb/forberedelse`, PR mot `prototyp`)

### Klart
- **`docs/dataspiken.md`, nytt avsnitt "SCB:s företagsregister-API:
  publicerad dokumentation"**, hämtat ordagrant från scb.se 2026-09-23 (HTML
  och PDF, inte sammanfattat), med länkar:
  - SCB:s *värdefulla datamängder* ligger i **Bolagsverkets** API (bara
    uppslag på org.nr). Det sökbara API:t är SCB:s **företagsregister-API**,
    en separat tjänst.
  - Publicerat: REST, JSON/XML, https, certifikat och lösenord efter
    godkända användarvillkor (scbforetag@scb.se), max 2 000 rader per anrop,
    10 anrop per 10 sekunder. Nytt API i september 2026 med API-nyckel och
    paginering; det gamla finns kvar minst sex månader.
  - Levererade fält enligt postbeskrivningen (2025-06-26): SNI
    (`Bransch_1–5`), `Stkl` (anställda), `Juridisk form`, `Reklam`.
    Omsättningsklass, telefon och e-post är tilläggsgrupper.
  - Storleksklasserna är rättade: 0 = uppgift saknas, 1–16.
  - **Inte publicerat:** endpoints, vilka fält som är sökbara, det nya
    API:ts specifikation och användarvillkoren. Inget är gissat.
- **`supabase/migrations/20260923120000_registry_cache.sql`:** skiss av en
  cache för råa registersvar. Varje rad har källa (`source_name`,
  `source_url`), hämtdatum (`fetched_at`) och utgångstid (`expires_at`, högst
  7 dagar). Tabellen ägs per användare med RLS som bara ger åtkomst till
  egna rader (select/insert/update/delete), och raderna tas bort med kontot.
  RLS-täckningsvakten är grön.
- **`lib/server/scb.ts` är inte rörd.**

### Återstår
- **När nyckeln kommer:** fråga SCB om endpoints och sökbara fält i nya
  API:t, maxrader per anrop, om SNI och `Stkl` kan kombineras i en fråga,
  om TG07Oms (omsättningsklass) ingår avgiftsfritt, och be om
  användarvillkoren ordagrant (krav för att öppna licensgrinden).
- Skriv transporten först när det finns riktig dokumentation.

### Kända problem
- **SNI 2025 mot SNI 2007.** SCB:s register följer SNI 2025. Demot och porten
  använder koder som `69.201` (troligen SNI 2007). Översättningen är
  okontrollerad och blockerar `searchCompanies`.
- **Migreringen är inte körd** mot SparkUF2. Den är ofarlig (tom tabell, inget
  skriver), men kör den inte förrän skissen är godkänd. Ingenting får skrivas
  till tabellen förrän §6 fråga 4 är avgjord (licensgrinden, punkt 4).

### Beslut nästa session behöver känna till
- **Cachen ägs per användare, inte delad.** Det följer CLAUDE.md:s RLS-regel
  och kräver ingen service role, men samma fråga från två användare hämtas
  två gånger. En delad cache kräver en servicenyckel och ett eget beslut.

## Registret: två öppna frågor om `registry_cache` (klar, gren `scb/cache-oppna-fragor`, PR mot `scb/forberedelse`)

### Klart
- **`docs/moduler/registret.md`, nytt avsnitt "Öppna frågor (avgörs före
  vecka 2)":**
  1. Användaren skriver i dag själv till `registry_cache` (insert/update för
     `authenticated`) och kan därmed förfalska registerdata i sin egen cache,
     vilket kan påverka Marknad-poängen och affärsplanen. Alternativet är att
     bara servern skriver (servicenyckel isolerad i `lib/server/`, inga
     insert/update-policies för `authenticated`). Erik beslutar innan
     transporten skrivs.
  2. Utgångna rader rensas aldrig. Rensning (vid läsning eller schemalagt
     jobb) ska läggas till så att data inte sparas längre än 7 dagar.

### Återstår
- Eriks beslut om fråga 1, och sedan en ändring av migreringen därefter
  (den är inte körd, så den kan fortfarande skrivas om).
- Rensning av utgångna rader (fråga 2).

### Kända problem
- **Den här PR:en bygger på PR #14** (`scb/forberedelse`), där
  `registry_cache` skapas. Mergea #14 först.
- "Vecka 2" finns inte definierat någonstans i repot. Rubriken följer Eriks
  formulering, men datumet behöver bestämmas.

## Registret: Bolagsverket-transporten, steg A och B (klar, gren `modul/registret-bolagsverket`, PR mot `prototyp`)

### Klart
- **Steg A, svarsformaten är verifierade.** Erik körde det fristående skriptet
  `scratchpad/bv-steg-a.mjs` (gitignorerat, bara Node och miljövariabler) på
  sin egen dator mot Volvo, Ericsson och H&M, plus tre felfall. Formaten står
  i `docs/dataspiken.md` under "Svarsformat, verifierat mot riktiga anrop".
  Den gamla Swagger-skissen var fel på flera punkter och är ersatt.
  Ip-adresser, trace-id och request-id skrevs medvetet inte in.
- **Steg B, `lib/server/bolagsverket.ts`:** `lookupOrganisation` gör
  `/organisationer` och `fetchDocumentList` gör `/dokumentlista`. Token
  hämtas med client credentials och cachas. Vid 401 görs ett nytt försök.
  Anropen har timeout och tempo. Bas-URL:en läses från en miljövariabel med
  host-kontroll (SSRF). Org.nr måste ha giltig kontrollsiffra och får inte
  vara ett personnummer. Grinden anropas först. Scheman:
  `lib/server/bolagsverketSchemas.ts`. Tester: `lib/server/bolagsverket.test.ts`,
  med Ericssons riktiga svar som fixtur.
- **Lint-regel** i `eslint.config.mjs`: bara `adapters/live/RegistryProvider.ts`
  och tester får importera `lib/server/bolagsverket` och `lib/server/scb`.
- **`.env.example`:** `BOLAGSVERKET_CLIENT_ID`, `BOLAGSVERKET_CLIENT_SECRET`,
  `BOLAGSVERKET_API_BASE_URL`, utan värden.

### Återstår
- **Erik:** lägg till `BOLAGSVERKET_API_BASE_URL` i `.env.local` (adressen står
  i dataspiken). Den saknas där i dag. `.env.local` rördes inte.
- **Provkörning av TypeScript-transporten** mot det riktiga API:t. Den går inte
  att köra från Codespacet, och grindkrav 1 i `registret.md` kräver den.
- Koppla `lookupOrganisation` till adaptern. Det väntar på SCB-listan, som
  ger vilka org.nr som ska slås upp.
- `/dokument` och iXBRL (uppskjutet, inga nya beroenden). Först behövs ett
  bolag vars `/dokumentlista` inte är tom.
- De öppna punkterna i dataspiken: hur "finns inte" besvaras, vad
  `reklamsparr: null` betyder, formen på `fel`, SNI-versionen, rate limits
  och `[TEST]`.

### Kända problem
- **Codespacet når inte Bolagsverket.** Både `gw.api`, `portal.api` och
  `bolagsverket.se` ger timeout över IPv4 och IPv6, medan `www.scb.se` svarar.
  Troligen blockeras molnets ip-intervall. Alla riktiga anrop måste göras
  från en annan maskin.
- `post-checkout`/`post-merge`-hookarna klagar på att `git-lfs` saknas.
  Repot spårar inga LFS-filer, så det påverkar inget.

### Beslut nästa session behöver känna till
- **`reklamsparr: null` tolkas som okänt**, inte som "ingen spärr". En
  ifylld spärr i en form vi inte känner igen räknas som spärr.
- **Bolagsverket-schemana är inte `.strict()`**, eftersom svaret har ett
  fyrtiotal fält. Okända fält tas bort av Zod och når aldrig transporten.
- **`registry_cache` rördes inte** (Eriks beslut 2026-09-23, fråga 1 avgörs
  separat).

## Registret: `registry_cache` blir en gemensam servercache (klar, gren `scb/forberedelse`)

### Klart
- **Beslut (Erik 2026-09-23):** cachen är gemensam, och bara servern läser och
  skriver den. Beslutet står i `docs/beslut.md`, och skälen till service role i
  `docs/arkitektur.md` avsnitt 9. Öppen fråga 1 i `registret.md` är struken.
- **Migreringen** `20260923120000_registry_cache.sql` är omskriven:
  - `user_id` och alla policies för `authenticated` är borttagna.
  - Unik nyckel är `(source, request_key)`.
  - RLS är påslaget **utan policies**, och `revoke all … from anon,
    authenticated` är tillagt.
  - Källa, hämtdatum och 7-dagarstaket står kvar.
  - Den är fortfarande inte körd.
- **`lib/server/registryCache.ts`:**
  - Exporterar `registryCache.get/set`, är server-only och använder
    `SUPABASE_SERVICE_ROLE_KEY`.
  - Grinden anropas först.
  - Cachenyckeln måste vara strukturerad (ingen fritext) och käll-URL:en
    https.
  - `fetchedAt` får inte ligga i framtiden (det skulle förlänga lagringen),
    och ttl är högst 7 dagar.
  - Felen bär aldrig Supabase-meddelandet.
  - **`get()` tar bort alla utgångna rader** och returnerar aldrig en utgången.
- **Lint-regel** `registryCachePattern`: bara `adapters/live/RegistryProvider.ts`
  och tester får importera cachen.
- **RLS-vakten** (`supabase/migrations/migrations.test.ts`) har `CLOSED_TABLES`
  med `registry_cache`. En stängd tabell måste ha RLS på, **ingen** policy och
  indragna rättigheter. Vakten bortser nu från SQL-kommentarer.
- **Vakt för nyckeln** (`lib/server/registryCache.test.ts`): bara
  `registryCache.ts` läser `SUPABASE_SERVICE_ROLE_KEY`, och inget
  `NEXT_PUBLIC_…SERVICE` finns.
- **`.env.example`:** `SUPABASE_SERVICE_ROLE_KEY=` utan värde. Den gamla
  kommentaren "service role används INTE" är ersatt.

### Återstår
- **PR #17** (`scb/forberedelse` → `prototyp`) väntar på granskning. PR #14
  från samma gren var redan mergad.
- **`SUPABASE_SERVICE_ROLE_KEY` läggs inte in** i `.env.local` eller
  driftmiljön förrän §6 fråga 4 är avgjord.
- Kör migreringen mot SparkUF2 först när du vill det. Ingenting får skrivas
  till tabellen förrän §6 fråga 4 är avgjord, och `set()` anropas inte av
  någon än.
- Ett schemalagt rensningsjobb, om cachen kan stå oanvänd längre än 7 dagar.

### Kända problem
- **`eslint.config.mjs` kommer att krocka** med PR #16
  (`modul/registret-bolagsverket`), eftersom båda ändrar samma
  `no-restricted-imports`-block. Slå ihop dem till en regel med både
  `registryTransportPattern` och `registryCachePattern`.
- Cachens tester körs mot en egen liten fejk, inte mot riktig PostgREST.
  Semantiken för `lte`/`gt`/`upsert` behöver prövas mot en riktig databas.

### Beslut nästa session behöver känna till
- **Service role används på exakt ett ställe.** En ny användning kräver ett
  nytt beslut i `docs/beslut.md` och en rad i `docs/arkitektur.md` avsnitt 9.
- Beslutet i avsnittet "SCB-spåret förberett" ovan, att cachen ägs per
  användare, gäller inte längre.

## Sammanfattning 2026-09-23 (kvällen) och vad som återstår i morgon

### Dagens session
- **Bolagsverket-transporten (PR #16, `modul/registret-bolagsverket`):**
  svarsformaten är verifierade mot riktiga anrop (steg A), och
  `lib/server/bolagsverket.ts` gör `/organisationer` och `/dokumentlista`
  bakom grinden (steg B). `/dokument` och iXBRL är uppskjutna.
- **Cachebeslutet (PR #17, `scb/forberedelse`):** `registry_cache` är en
  gemensam cache som bara servern läser och skriver, med service role.
  Tabellen är stängd för alla klienter.
- **Städning:** den ospårade filen `main` i repots rot var tom (0 byte,
  skapad 21:35), troligen en felriktad `>main` från ett skalkommando. Den
  är borttagen. Innehållet var tomt, så ingenting gick förlorat.

### I morgon
- **PR #16 och PR #17 väntar på Theos granskning.** Mergea ingen av dem
  innan dess. Räkna med en konflikt i `eslint.config.mjs`: båda ändrar samma
  `no-restricted-imports`-block. Slå ihop `registryTransportPattern` och
  `registryCachePattern` i samma regel.
- **Provkör TypeScript-transporten lokalt** mot Bolagsverket från Eriks dator.
  Codespacet når inte Bolagsverket. Lägg först
  `BOLAGSVERKET_API_BASE_URL` i `.env.local`. Grindkrav 1 i `registret.md`
  kräver provkörningen.
- **`SUPABASE_SERVICE_ROLE_KEY` läggs inte in** förrän dataspiken §6 fråga 4
  är avgjord.
- **Beslut med Theo:**
  - **SNI 2025:** demot och porten använder troligen SNI 2007-koder
    (`69.201`), och SCB följer SNI 2025. Bolagsverkets koder är fem siffror
    utan punkt, och versionen är okänd.
  - **CofounderAgent.**
  - **`getOnboardingScript`.**
- **30 september:** SCB-nyckeln kommer. Läs SCB:s villkor och citera dem
  ordagrant i `docs/dataspiken.md` (grindkrav 2). Ställ frågorna i avsnittet
  "SCB-spåret förberett".

## Merge av `prototyp` in i PR #16 (klar 2026-09-24, gren `modul/registret-bolagsverket`)

### Klart
- **`origin/prototyp` (med PR #17) är mergad in i `modul/registret-bolagsverket`**
  (merge, ingen rebase eller force push). PR #16 har inte längre någon konflikt.
- **Konflikter:**
  - `docs/status.md`: alla avsnitt behölls, i datumordning.
  - `eslint.config.mjs`: `registryTransportPattern` och `registryCachePattern`
    ligger i samma `no-restricted-imports`-regel. De tillåtna importörerna är
    en gemensam `registryImporters`.
- Konflikten i `eslint.config.mjs` som nämns ovan, under "Kända problem" och
  "I morgon", är därmed löst.

### Återstår
- **PR #16 väntar på Theos granskning** (GitHub: `BLOCKED`, mergebar). Mergea den
  inte innan dess.

### Kända problem
- `git fetch origin` uppdaterade en gång inte `origin/prototyp` i Codespacet.
  `git fetch origin prototyp:refs/remotes/origin/prototyp` fungerade.
  Kontrollera med `git ls-remote origin prototyp` före en merge.

## Registret: registreringsdatum i Bolagsverket-transporten (klar 2026-09-24, gren `modul/bv-registreringsdatum`, PR mot `prototyp`)

### Klart
- **`BolagsverketOrganisation.registrationDate`** (`string | null`, YYYY-MM-DD)
  läses från `organisationsdatum.registreringsdatum`
  (`lib/server/bolagsverket.ts`, `lib/server/bolagsverketSchemas.ts`).
- **Validering:** fältet valideras med `z.iso.date()`, som också avvisar
  datum som inte finns, som `2023-02-29`.
- **`null` i stället för att bolaget faller bort:** ett saknat eller ogiltigt
  datum ger `null` (`.catch(null)`), liksom ett ifyllt `fel` i delobjektet
  (via `ok()`). Bolagets övriga uppgifter kommer ändå med.
- **Tester** (`lib/server/bolagsverket.test.ts`): fixtur-testet förväntar
  `"1918-08-19"` för Ericsson. Ett nytt test täcker de fall där datumet ska
  bli `null`: saknat delobjekt, `null`, `2023-02-29`, `1918-8-19` och
  ifyllt `fel`.
- **`docs/dataspiken.md`:** fältet är beskrivet under "Svarsformat, verifierat
  mot riktiga anrop".
- **Gamla grenen `a/bolagsverket-klient`:** fältet `registreringsdatum` var
  det enda den hade som saknades i den nya transporten, och det finns nu med.
  Grenen finns kvar, lokalt och på GitHub.

### Återstår
- **Adaptern:** `registrationDate` når inget gränssnitt än. Adaptern
  (`adapters/live/RegistryProvider.ts`) använder bara `fetchAnnualFigures`,
  inte `lookupOrganisation`, och `RegistryCompany` har inget sådant fält. Det
  avgörs när `lookupOrganisation` kopplas till adaptern.
- **Gamla grenen:** ta bort `a/bolagsverket-klient` när den här PR:en är
  mergad, om du vill.

### Beslut nästa session behöver känna till
- **Ett ogiltigt registreringsdatum blir `null`**, det fäller inte hela bolaget.
  Samma princip som för övriga fält: saknat eller trasigt betyder okänt.

## Registret: Bolagsverket-transporten provkörd (klar 2026-09-24, gren `docs/registret-provkorning`, PR mot `prototyp`)

### Klart
- **Grindkrav 1, Bolagsverket-delen: provkörd.** Erik körde den riktiga
  `lookupOrganisation` och `fetchDocumentList` från sin dator mot Volvo,
  Ericsson och H&M. Alla sex anropen lyckades.
- **Så kördes den:** en fristående bunt (`scratchpad/bv-transport-prov.mjs`,
  gitignorerad, byggd med rolldown som redan fanns i `node_modules`). Grinden
  var den riktiga. Bara `server-only` och inloggningen var utbytta i bunten,
  och inloggningen ersattes av Eriks user.id från en miljövariabel. Id,
  secret och token maskades.
- **Resultat:** varje bolag gav ett svar med alla fält mappade, även
  `registrationDate` (Volvo 1915-05-05, Ericsson 1918-08-19, H&M 1943-08-07).
  `advertisingBlock` var `null` (okänt) för alla tre. Detaljerna står i
  `docs/moduler/registret.md`, "Provkörning 2026-09-24".
- Punkten "Provkörning av TypeScript-transporten" under "Återstår" i avsnittet
  om steg A och B ovan är därmed klar.

### Återstår
- **`/dokumentlista` var tom för alla tre bolagen**, som i steg A. Prova med
  mindre aktiebolag som har lämnat årsredovisningen digitalt, med samma bunt:
  `node bv-transport-prov.mjs <org.nr> ...`. Det behövs innan `/dokument` och
  iXBRL byggs.
- **Grindkrav 1, SCB-delen:** `lib/server/scb.ts` kastar fortfarande.
  Grindkrav 2 och 3 återstår också, så grinden förblir stängd.

### Beslut nästa session behöver känna till
- **Provbunten är gitignorerad** och byggs om med
  `node scratchpad/bv-transport-bygg.mjs` om transporten ändras.

## Buggrapport för demot, september 2026 (klar 2026-09-25, gren `docs/buggar-september`)

- Buggrapporten från genomklickningen av demot finns i `docs/buggar-2026-09.md`.

## Väntelistan på landningssidan (PR #21 från `landning` mot `prototyp`, väntar på granskning)

PR: https://github.com/GreveHertig/SparkUF/pull/21. Granskare: Erik
(`GreveHertig`) och Theo (`magnussontheodor-max`).
Påverkar varken `main` eller produktion förrän PR:en är mergad.

### Klart
- **`supabase/migrations/20260924120000_waitlist.sql`:** tabellen
  `public.waitlist` med bara `id`, `email` och `created_at`. Villkor i
  databasen: högst 254 tecken, bara gemener, ett @ och en punkt i domänen,
  `unique` på `email`. RLS är på.
  - **Besökare har inga rättigheter på tabellen**
    (`revoke all … from anon, authenticated`, ingen grant).
  - **Enda vägen in är funktionen `public.join_waitlist(p_email text)`:**
    `security definer`, `set search_path = ''`, fullständiga namn,
    `lower(trim(p_email))`, `insert … on conflict (email) do nothing`,
    `returns void`. Samma svar för ny och befintlig adress, och inget id,
    ingen tid och inget antal lämnar databasen.
  - **Rättigheter:** `revoke execute … from public`, `grant execute` bara
    till `anon` och `authenticated`.
  - **Stängd tabell:** `waitlist` står i `CLOSED_TABLES` i
    `migrations.test.ts`. RLS på, inga policyer,
    `revoke all on table … from anon, authenticated`. Vakten kontrollerar
    just det. Beslut Erik 2026-09-25, `docs/beslut.md`.
  - **Varför funktion i stället för direkt insert:** med direkt insert via
    Supabases API svarade databasen 201 för en ny adress och 409 för en som
    redan fanns. Vem som helst med den publika anon-nyckeln kunde då pröva
    vilka adresser som står på listan. Hittat av `/security-review`
    innan migreringen kördes.
- **`app/(marketing)/actions.ts`:** Server Action `joinWaitlist`. Trimmar,
  gör om till gemener, validerar med `zod` och anropar
  `supabase.rpc("join_waitlist", …)`, aldrig tabellen direkt. Varje fel ger
  samma allmänna felkod. Returnerar bara koder, aldrig text.
- **`app/(marketing)/WaitlistForm.tsx`:** ett mejlfält (återanvänder
  `TextField`), en knapp och en GDPR-rad om vad adressen används till. En
  komponent som används två gånger i `page.tsx`, i hero och i den
  avslutande sektionen. Beskriven i `DESIGN.md`.
- **i18n:** `landingPage.waitlist` på svenska och engelska.
- **Kontaktadress för borttagning i GDPR-raden** (`privacyNote`, sv och en):
  `spark.ai.uf@gmail.com`, bestämd av Theo. Den som vill bli borttagen från
  listan mejlar dit. Theo eller Erik tar då bort adressen i Supabase. Är inte
  längre ett hinder för merge.
- **Tester:**
  - `actions.test.ts`: giltig adress går via `join_waitlist` och aldrig
    `from()`, ogiltig adress, dubblett ger samma svar, okänt fel, anropet
    kastar.
  - `supabase/migrations/waitlist.test.ts` (ny, statisk som
    `migrations.test.ts`, läser alla migreringar):
    - Ingen migrering ger `anon` eller `authenticated` någon rättighet på
      tabellen, inte heller med namn utan schema, med citattecken eller via
      `on all tables in schema`.
    - **Varje** definition av `join_waitlist`, också en senare `create or
      replace`, har `security definer`, låst `search_path`, `returns void`,
      `lower(trim(...))` och `on conflict do nothing`. Ingen `alter
      function` på den.
    - `execute` bara för `anon` och `authenticated`.
    - Prövat genom att tillfälligt lägga in fem felaktiga rader i
      migreringen: testet föll varje gång.
  - `WaitlistForm.test.tsx` (sv och en) och en rad i `page.test.tsx`.
  - Supabase är mockad. Ingenting är prövat mot en riktig databas.
- `typecheck`, `lint` (0 fel, samma 3 gamla varningar i
  `design-referens/artefakt/app.js`), `test` och `build` är gröna. `build`
  kräver `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
  utan `.env.local` fallerar `/app` vid förrendering (gäller hela appen, inte
  väntelistan). Kört med platshållarvärden. `/security-review` körd två
  gånger, se ovan.

### Återstår
Ordningen (Eriks beslut 2026-09-25): granska, merga, sedan kör Erik
migreringen.
1. **Granskning av PR #21** (Erik och Theo).
2. **Merge mot `prototyp`.**
3. **Migreringen är körd** (rättat 2026-09-26): `20260924120000_waitlist.sql`
   kördes mot SparkUF2 den 26/9 och är verifierad: RLS på, inga policyer,
   anon kan varken göra insert eller select på tabellen, och anon kan köra
   `join_waitlist`. Kör **inte** `supabase db push`: den skulle också köra
   `registry_cache`, som väntar på §6 fråga 4.
4. **Prova skarpt efter migreringen:** skicka formuläret med riktiga
   Supabase-nycklar, pröva att direkt `POST /rest/v1/waitlist` med
   anon-nyckeln ger "permission denied", och att `rpc/join_waitlist` svarar
   likadant två gånger med samma adress.
- **Bekräftelsemejl (dubbel opt-in)** ingår inte och kommer i en egen PR.

### Kända problem
- **Inget spamskydd.** Vem som helst med den publika anon-nyckeln kan anropa
  `join_waitlist` i en loop och fylla listan med skräp, också utan att gå
  via formuläret. Databasen stoppar bara ogiltiga adresser och dubbletter.
  Okej för en väntelista nu. Senare: ett spärrmönster (rate limit per IP i
  Server Action, och att dra in `execute` från `anon` så att bara servern
  anropar funktionen) eller en CAPTCHA.
- **"Invalid Server Actions request" när formuläret skickas via
  Codespaces-adressen (`*.app.github.dev`). Inte löst, och ska inte lösas
  här.** Orsak (återskapad med curl): Next.js jämför `Origin`-headern
  (Codespaces-adressen) med `x-forwarded-host`, som Codespaces sätter till
  `localhost:3000`. De skiljer sig, så Next.js avbryter anropet som skydd mot
  CSRF. Beslut (Oskar): lägg **inte** in `allowedOrigins`. Formuläret testas
  på Vercels förhandsadress för `landning` eller efter att migreringen är
  körd.
  **Ändrat 2026-09-26 (gren `landning-ny-startsida`, Eriks beslut, behöver
  Oskars ok i PR:en):** `next.config.ts` lägger in `allowedOrigins`
  (`localhost:3000`, `localhost:3200`, `*.app.github.dev`) **bara när
  `CODESPACES` är satt**. På Vercel är variabeln inte satt, och där gäller
  Nexts CSRF-skydd oförändrat.

### Beslut nästa session behöver känna till
- **`waitlist` är en stängd tabell i `CLOSED_TABLES`** (Erik 2026-09-25,
  `docs/beslut.md`), samma mönster som `registry_cache`. Den tidigare
  `using (false)`-policyn är borttagen. För att få `CLOSED_TABLES` mergades
  `origin/prototyp` in i `landning`.
- **Supabases Security Advisor kommer att varna för `join_waitlist`**
  ("security definer function executable by anon/authenticated", lints
  0028/0029). Det är avsiktligt: funktionen är den enda vägen in på listan
  och kan bara lägga till en normaliserad adress. Stäng inte av
  `execute` för `anon` och gör inte om den till `security invoker` utan att
  lösa väntelistan på annat sätt, annars slutar formuläret fungera eller
  läckan öppnas igen.
- **Avsteg från RLS-mönstret "egen data":** besökaren är inte inloggad och
  har inget `user_id`. Det ersätts av inga rättigheter på tabellen och en
  `security definer`-funktion som enda väg in. Godkänt av Oskar.
- **Grenen heter `landning`,** inte `prototyp-landning`. Den gamla grenen
  ligger 98 commits efter `prototyp` och är redan inslagen.
- **Produktion deployas från `main`.** Det finns ingen deploykonfiguration i
  repot. Enligt GitHubs deploy-historik bygger Vercel Production från `main`
  och en Preview för varje push till andra grenar, så `landning` får en egen
  förhandsadress.

## Pulsen: dagscachen `pulse_fetches` (klar 2026-09-25, gren `plattform/pulsen-cache`, PR mot `prototyp`)

### Klart
- **Migrering** `supabase/migrations/20260925090000_pulse_fetches.sql`: ny
  tabell `pulse_fetches` med `user_id` (cascade från `auth.users`),
  `fetch_date` (default svensk dag, `(now() at time zone 'Europe/Stockholm')::date`),
  `status` (`pending`/`done`/`empty`/`error`), `claimed_at` och `fetched_at`.
  Primärnyckel `(user_id, fetch_date)`. Ett check-villkor kräver att
  `fetched_at` är `null` exakt när status är `pending`. `pulse_signals` är
  orörd.
- **RLS:** select, insert och update av egna rader. Ingen delete-policy. RLS-vakten
  i `migrations.test.ts` täcker tabellen (RLS på, minst en policy).
- **Provkört i PGlite** (lokal Postgres i minnet, bara i scratchpad, inte
  committat): claim ger en rad första gången och noll andra gången. Insert åt
  en annan användare stoppas av RLS. En annan användare ser och uppdaterar noll
  rader. `done` utan `fetched_at` stoppas av check-villkoret. Takeover tar ett
  `error` en gång, sedan inte igen, och tar aldrig en `empty`-dag.
- **`docs/moduler/webbresearch-och-pulsen.md`:** nytt avsnitt "Dagscachen"
  (claim före Tavily, statusflöde, svensk dag i SQL, takeover efter 5 minuter
  eller vid `error`).
- **`docs/bygga-en-modul.md`:** Pulsens liveadapter byggs på `modul/pulsen`.
- **`docs/beslut.md`:** beslutet om dagscachen, med `claimed_at`.
- **`/security-review`:** inga fynd. Enda anmärkningen: en användare kan
  sätta valfri status eller valfritt `fetch_date` på sina egna rader. Det
  påverkar bara hens egen sökning och är accepterat i beslutet.

### Återstår
- **Adaptern:** `adapters/live/PulseProvider.ts` kastar fortfarande
  `NotImplementedError`. Den byggs på `modul/pulsen` enligt "Dagscachen".
- **Migreringen är körd** (rättat 2026-09-26): `pulse_fetches` kördes mot
  SparkUF2 den 26/9. RLS är på och tabellen har sina 3 policyer.
- **Tak för omförsök av `error`** samma dag bestäms i adaptern (se modul-docen).
- **RLS-testet mot riktig databas** (`adapters/live/rls.live.test.ts`) täcker
  inte `pulse_fetches` än. Lägg till tabellen när migreringen körs.

### Kända problem
- **Inaktuella typer i `.next/dev/types`** efter att `experiment/landning-fonda`
  varit utcheckad gav typecheck-fel om `app/experiment/...`. `rm -rf .next/dev/types`
  löser det. Det är genererade filer, inte kod.

### Beslut nästa session behöver känna till
- **Adaptern räknar aldrig dagen i Node.** Den låter kolumnens default och
  samma SQL-uttryck avgöra svensk dag.
- **`pulse_fetches` är användarägd**, till skillnad från `registry_cache`. En
  förfalskad rad påverkar bara grundarens egen sökning.

## Pulsen: liveadaptern (klar 2026-09-25, gren `modul/pulsen`, PR mot `prototyp`)

Erik har godkänt ändringarna i `ports/` (mockarna i kontraktstestet och stubbraden).
Ingen migrering kördes mot databasen.

### Klart
- **`adapters/live/PulseProvider.ts`** är byggd och ingen stubbe längre.
  Den söker svenska näringslivsnyheter via Tavily med nyckelord ur det
  aktiva projektets `name` och `one_liner`, behåller träffar som nämner ett
  nyckelord (med enkla böjningsändelser) och sparar dem i `pulse_signals`.
  Källa (domän + URL) och hämtdatum (`fetch_date` från databasen) följer med.
  Detaljer i `docs/moduler/webbresearch-och-pulsen.md`, "Hur liveadaptern
  fungerar i dag (Pulsen)".
- **Dagscachen** används enligt modul-docen: claim med
  `upsert(..., { ignoreDuplicates: true }).select()`, villkorat
  övertagande, slut-update med status + `fetched_at` som kräver att claimen
  fortfarande är vår.
- **i18n:** `pulsePage.liveCategory` och `pulsePage.liveWhyItMatters` (sv/en).
- **Tester:** `adapters/live/PulseProvider.test.ts` (dagscachen,
  samtidighet, taket på omförsök, fel, filtrering, källor), kontraktstestet
  kör nu mot liveadaptern (mockar överst, kraven oförändrade), opt-in
  `adapters/live/PulseProvider.live.test.ts`. Ny fejk
  `test/stubs/pulseSupabaseFake.ts` (den delade fejken rördes inte).
- **`ports/stubStatus.test.ts`:** Pulsen-raden och dess import borttagna.
- **`adapters/live/outreachGate.guard.test.ts`:** `PulseProvider.ts` tillagd
  i listan över godkända Tavily-användare (Bruno godkände).
- **Granskning:** code-reviewer godkände (inga kritiska/höga fynd). Tre
  små fynd rättade: dubblettkollen slår bara upp dagens kandidat-URL:er,
  visningsdatumet räknas i svensk tid, felmeddelandet klarar icke-`Error`.
  `/security-review`: inga fynd.
- typecheck, lint (bara 3 gamla varningar i `design-referens/`), test och
  build är gröna.

### Återstår
- **Migreringen `pulse_fetches` är körd** (rättat 2026-09-26): körd mot
  SparkUF2 den 26/9, RLS på, 3 policyer.
- **RLS-testet mot riktig databas** (`adapters/live/rls.live.test.ts`) täcker
  inte `pulse_fetches` än.
- **Kommentaren i `app/(app)/app/page.tsx`** säger fortfarande att Pulsen är
  en stubbe. Route-filer fick inte röras i den här sessionen.
- **`/app/pulsen`** finns inte som live-route än (bara i demot).
- **Webbresearch** är fortfarande en stubbe.

### Kända problem
- **Första sidvisningen av `/app` varje svensk dag väntar på Tavily**
  (upp till 10 s timeout), eftersom `getSignals` körs i samma `Promise.all`
  som resten av Hem. Att strömma Pulsen separat (Suspense) kräver ändringar
  i route-filen, ett eget beslut.
- "Bransch" härleds ur idéns ord, ingen riktig branschkolumn. En vag
  enradsbeskrivning ger få eller irrelevanta träffar.
- En grundare kan skriva en egen `pulse_fetches`-rad med ett framtida
  datum och då blockera sin egen sökning (adaptern läser nyaste raden).
  Påverkar bara hen själv, samma accepterade risk som i dagscachebeslutet.

### Beslut nästa session behöver känna till
- **Omförsök (Bruno 2026-09-25):** ingen räknare. Ett `error` tas över först
  när `fetched_at` är äldre än 6 timmar, vilket ger högst 3 omförsök per
  svensk dag.
- **Efter en claim-krock läses grundarens nyaste rad** i stället för ett
  datum räknat i Node (Supabase-klienten kan inte skicka SQL-uttryck).
- **"Varför det spelar roll"** är en fast i18n-mall, ingen modell.
- **Nätverksfel från Tavily** ger tomläge. Konfigurationsfel (t.ex. saknad
  nyckel) kastas vidare så att de syns.

## Licens (klar 2026-09-25, gren `docs/licens`, PR mot `prototyp`)

### Klart
- `LICENSE` i repots rot: proprietär kod, alla rättigheter förbehållna Spark UF, på engelska och svenska.
- `package.json`: `"license": "UNLICENSED"` tillagd. `"private": true` fanns redan. Inga andra ändringar.
- `README.md`: en rad överst som hänvisar till `LICENSE`.

### Beslut nästa session behöver känna till
- Repot är proprietärt. Nya beroenden och kopierad kod måste ha licenser som tillåter användning i sluten kod.

## Ny startsida och nytt demo (klar 2026-09-26, gren `landning-ny-startsida`, PR mot `prototyp`)
Landningssidan och demot från `experiment/landning-fonda` är de officiella sidorna.

### Klart
- **`/`** (`app/(marketing)/page.tsx`) är den nya startsidan, med egen ram och egna stilar (`design/site.css`, skopat under `.fd`). `(marketing)/layout.tsx` laddar bara stilarna; **`/priser`** har fått egen `layout.tsx` med `PublicHeader`/`PublicFooter` och ser ut som förut. `noindex` från experimentet är borttaget.
- **`/integritet`**: integritetstexten (personuppgiftsansvarig Spark UF, samtycke, lagras inom EU, raderas efter lanseringen eller på begäran).
- **Mejlfältet:** `landingActions.ts` (`joinLandingWaitlist`) framför Oskars `joinWaitlist` (`actions.ts`, orörd): honeypot, spärr per IP, MX-kontroll (`_lib/mxCheck.ts`), och "Menade du …?" i formuläret (`_lib/emailTypos.ts`). Oskars `WaitlistForm.tsx` används inte längre av startsidan men är kvar.
- **`next.config.ts`:** `allowedOrigins` bara när `CODESPACES` är satt (se väntelistans avsnitt ovan, går emot Oskars tidigare beslut).
- **`/demo`**: det gamla demots sidor (`app/demo/**`, 19 sidor och layouter plus `demo-bar.test.tsx` och `locale-switch.test.tsx`) är **borttagna** (finns i git-historiken) och ersatta av demot från experimentet, på `/demo`, `/demo/start/...` och `/demo/<sida>`. `adapters/demo/` är orörd utom `sara.ts` (nedan). `adapters/demo/tourSteps.ts` är orörd: den används av nya demots rundtur, som översätter dess `/demo/app/...`-rutter (`app/demo/_lib/paths.ts`). `screens/*` och `components/spark/DemoBar.tsx`/`TourOverlay.tsx` finns kvar; de två sistnämnda används inte längre av någon sida.
- **Arkitektur:** nya demot har egna sidor och monterar inte `screens/`. Portregeln gäller (bara via portarna, inga liveadaptrar). Beskrivet i `docs/arkitektur.md`.
- **i18n:** namnrymden heter `site` (var `experimentFonda`). Demots sidhuvud säger "Exempel med påhittad data" på varje sida.
- **Datalöftet och buggrapporten (`docs/buggar-2026-09.md`):**
  - Punkt 20: etiketten "Exempel med påhittad data. Företagen finns inte på riktigt." på Valideringens svar och tabell, och på Marknads registersiffror och konkurrenter (`ExampleLabel`).
  - Punkt 13: anställda visas som SCB-storleksklass (`app/demo/_lib/sizeClass.ts`), inte exakt antal.
  - Punkt 11: Pulsen visar inte längre adapterns fasta "3 dagar sedan"; datumet står i källan.
  - Punkt 14: `adapters/demo/sara.ts` säger 5–19 och 10–19 anställda (var 5–20 och 10–20), som rubriken på Marknad och SCB:s klasser. Bara datan, kontraktstesterna gröna.
- **Docs:** `arkitektur.md`, `uppdrag.md` och modulerna pekar på de nya rutterna; `DESIGN.md`, `sessioner.md` och `beslut.md` har en not överst (historiken är inte omskriven); `demo-manus.md` har nya rubriker och adresser, replikerna är inte omskrivna.
- Verifierat: `typecheck`, `lint` (0 fel, 3 gamla varningar i `design-referens/`), `test` (590 gröna), `pnpm build`. I produktionsbygget: `/`, `/priser`, `/integritet`, `/demo`, Validering, Pulsen och rundturens första sju stopp, inga konsolfel.

### Återstår
- Granskning av PR:en (Theo och Oskar), särskilt att gamla demot tas bort och `allowedOrigins` i Codespaces.
- Punkt 14 i övriga adaptrar: `5–20`/`10–20` står kvar i `OutreachProvider.ts`, `SimulationProvider.ts`, `BuildProvider.ts`, `PulseProvider.ts` och `cofounderScript.ts` (inte ändrade, bara `sara.ts` fick röras).
- Punkt 9 (Juridik på svenska i engelska läget): Oskar, vecka 7.
- Frågor till Theo: punkt 15 (Gmail och öppningsspårning, stopp 9), 16 (Hiasynth 312 byråer), 17 (Lovable utan koncept-etikett i rundturskortet, "kvittojakten.lovable.app"), 18 (199 kr, stämmer med startsidan). `demo-manus.md`: replikerna i stopp 9 och 10 krockar med skärmen.
- Kolla manuellt att inget av de påhittade företagsnamnen i demot är ett riktigt bolag.
- Testadresser som läggs på väntelistan vid test ska tas bort i Supabase efteråt.

### Kända problem
- Interna namn säger fortfarande Fonda (`FondaTour`, `FondaDemoBar`, `fondaDemoIsolation`, lagringsnyckeln `spark:fonda-demo-state`). Nyckeln är medvetet kvar så att besökares sparade läge från gamla demot inte läses in.

## Plan: en design för /demo och /app (gren `docs/plan-en-design`, PR mot `prototyp`, bara docs)

### Klart
- `docs/plan-en-design.md`: planen för att flytta demots sidor in i de delade skärmarna i `screens/`, så att `/demo` och `/app` ser likadana ut och bara skiljer sig i data. Skärmarna som påverkas, skillnaderna mot nuvarande `/app`, hur portregeln, Datalöftet och licensgrinden gäller, pågående arbete (Bruno, Oskar), ordningen i 11 PR:er och storleken. Ingen kod ändrad.
- Rättat: migreringen `pulse_fetches` är körd mot SparkUF2 den 26/9 (RLS på, 3 policyer).

### Återstår
- Besluten i planen är förslag. De beslutas med Theo på söndag.
- Fråga Oskar om `landning-bilder` (nya bilder av det nya demot, eller lägg ner grenen).

## PR 1: Grunden för en design (gren `design/pr1-grunden`, PR mot `prototyp`)
Första PR:en i `docs/plan-en-design.md`. Inget ser annorlunda ut.

### Klart
- `design/site.css` laddas även under `app/(app)/layout.tsx`. Skopad under `.fd`/`.fdd`, så `/app` ser likadan ut tills skärmarna använder klasserna. Klassprefixen är oförändrade.
- Vakten `screens/noAdapters.guard.test.ts`: inget under `screens/` får importera, exportera vidare eller ladda något ur `adapters/` (alias eller relativ sökväg, även typer och tester). Två överträdelser lagade: `screens/Validation.tsx` (och dess test) och `screens/Cofounder.tsx`. Typerna `ResponseCard`, `ValidationAssumption` (med verdict-typerna) ligger nu i `ports/OutreachProvider.ts` och `TranscriptItem` i `ports/CofounderAgent.ts`; demoadaptrarna importerar dem därifrån och exporterar dem vidare, så inget annat behövde ändras.
- `ExampleLabel` tar `dataKind: "example" | "live"` (typen `DataKind` i `core/domain.ts`). Demot sätter `"example"` på sina fyra ställen; `"live"` visar ingenting. Test i `app/demo/_components/ExampleLabel.test.tsx`.
- `DESIGN.md` har en ny del överst, "Gällande designsystem", med besluten (demots stil är appens stil, `components/spark` fasas ut, `components/ui` kvar till PR 11, "Kommer snart" för vyer utan liveadapter). Tidigare sessioner ligger oförändrade under "Historik".
- Kontroll: skärmbilder FÖRE och EFTER av `/`, `/demo/start`, `/demo`, `/demo/marknad`, `/demo/validering`, rundturens stopp 6 och `/app` (omdirigeras till inloggningen, inget testkonto) på 1440 och 390 px. 12 av 14 är identiska pixel för pixel; rundturen skiljer sig bara i kortets kantutjämning, lika mycket som mellan två körningar av samma kod. `typecheck`, `lint` (0 fel), `test` (594 gröna), `pnpm build`.

### Återstår
- PR 2 (skalet) enligt planen.
- `/app` efter inloggning är inte fotograferat (inget testkonto). `site.css` är skopad, så det påverkas inte, men det bör kontrolleras med ett riktigt konto.

## Rundturens rutor (klar 2026-09-30, gren `fix/rundtur-rutor`, till `prototyp`)
Grundaren såg att rundturens ruta (spotlighten) inte täckte hela målet på vissa stopp, och efter första rättningen att kortet låg över rutan.

### Klart
- Regeln nu: kortet täcker aldrig rutan, rutan delar aldrig en rad eller ett kort, och målets början syns alltid. Kortet står helst bredvid, under eller över målet inom den säkra ytan; annars får det ligga över sidhuvudet eller demoraden (de är mörklagda under rundan).
- Ett mål som inte ryms bredvid kortet kortas vid en skarv mellan hela delar (`cutBetweenUnits` i `app/demo/_lib/tourGeometry.ts`, delarna mäts av `tourUnits` i `FondaTour.tsx`). Aldrig bara rubriken, och minst halva ytan. Går det inte skärs målet vid kortet med raka hörn, så att det syns att det fortsätter.
- Rättat: skrollen planerades efter förra stoppets korthöjd (fel läge när texten byttes), och en avrundning på 0,4 px kunde fälla placeringen med kortet överst.
- `scrimClipPath` tar radie per kant (raka hörn där målet fortsätter).
- Kontroll: alla 20 stopp i 1920×1080, 1440×900, 1366×768, 1280×720 och 390×844 med Playwright: inget överlapp, början syns på alla. `typecheck`, `lint` (0 fel), `test` (601 gröna).

### Kända problem / beslut
- Mål som är högre än skärmen (svaren på stopp 10, juridiken, poänglistan, pulsen) kan inte visas hela samtidigt som kortet. De kortas till de hela rader som ryms. På 1920×1080 gäller det bara stopp 10. Ska de synas hela måste stoppen peka på mindre delar av sidorna (ett innehållsbeslut, inte gjort).

## Nya priser (klar 2026-09-30, direkt på `prototyp`)
Priserna på sajten och i demot följer nu prisplanen som Kingen (marknad/sälj) tog fram. Allt är fortfarande märkt som förslag.

### Klart
- `/priser`: Gratis blev **Provvecka** (0 kr i 7 dagar, kort krävs, steg 01–04, begränsad Puls). **Grundare** kostar 249 kr/mån (årsvis 2 490 kr) och innehåller hela resan 01–12, även bygget, med 3 miljoner gnistor i månaden. Bygg-credits blev **Gnistpaket**: 2 miljoner gnistor för 99 kr, 5 miljoner för 229 kr.
- Startsidans priskort, pristeasern och FAQ-svaret "Vad kostar det?" säger samma sak. Raden "Steg 10, bygget, ingår inte" är ersatt med provvecka, årspris och gnistpaket.
- Rundturens stopp 19 och `docs/demo-manus.md`: "249 kr i månaden, bygget ingår". `docs/uppdrag.md` avsnittet om `/priser` uppdaterat.
- Bara texter i `i18n/sv.ts` och `i18n/en.ts` (plus `tourCopy.ts`); inga komponenter eller nycklar ändrade.
- Kontroll: `typecheck` (efter `next typegen`), `lint` (0 fel), `test` (601 gröna).

### Beslut
- Gnistor är Sparks krediter: 1 input-token = 1 gnista, 1 output-token = 5 gnistor. Då kostar en gnista lika mycket oavsett användning och påfyllning går aldrig med förlust.
- Ingen permanent gratisnivå. Provveckan har AI-tak 10 kr per konto och 500 kr/mån totalt.
- Marknadsföringsmodulen säljs inte som tillägg för 99 kr (struket).

### Återstår
- Momsen: bekräfta med UF-rådgivaren att Spark varken tar ut eller drar av moms. Kalkylen bygger på det.
- Priset är ännu inte testat mot väntelistan (fyra prisfrågor).
- `pnpm typecheck` kräver att `next typegen` har körts (typen `LayoutProps` i `app/layout.tsx` genereras av Next). Värt att lägga in i skriptet.

## Delningsbild och sidtitel (klar 2026-09-30, gren `fix/delningsbild`, PR mot `prototyp`)
När länken delades (sms, DM, LinkedIn) visades ingen bild och bara titeln "Spark".

### Klart
- `app/opengraph-image.png` och `app/twitter-image.png` (1200×630) med alt-text i `*.alt.txt`. Samma uttryck som startsidans hero: ordmärket, `--paper-50` med blått sken, Castoro och Instrument Serif-kursiv i `--accent-600`, och ett förenklat poängkort. Förenklad med flit så att rubriken går att läsa även i en liten sms-förhandsvisning.
- Titel och beskrivning ligger i i18n (`meta` i `dictionary.ts`, `sv.ts`, `en.ts`); `app/layout.tsx` läser svenskan och sätter `openGraph` och `twitter` (`summary_large_image`).
- Ingen `metadataBase`: Next.js gör bildadressen absolut med Vercels `VERCEL_PROJECT_PRODUCTION_URL`. Bygget varnar lokalt om det, men det är väntat. Sätt `metadataBase` när en egen domän finns.
- Kontroll: taggarna finns på `/`, `/priser`, `/demo`, `/integritet` i produktionsbygget och bilden serveras. `typecheck`, `lint` (0 fel), `test` (601 gröna).

## Modul: Juridisk koll — källorna kontrollerade (klar 2026-09-30, gren `modul/juridisk-koll-kallor`)

**Rekonstruerad vid sammanslagningen till `design/pr2-skalet` 2026-09-30** — det här avsnittet (rubrik + hela innehållet) saknades helt i `origin/prototyp`s version av filen: commit `91be3ef` ("Delningsbild och sidtitel för länkförhandsvisning") skrev över hela sektionen i stället för att lägga till sin egen efter den, en riktig dataförlust på `prototyp` (inte bara en mergekonflikt). Återställt här från `design/pr2-skalet`s egen historik, som hade sektionen intakt. Flaggat i rapporten till grundaren — samma bugg som `.gitattributes`s `merge=union`-rad (se den filen) är till för att förhindra framöver.

### Klart
- **Källorna från Bolagsverket, verksamt.se och Bokföringsnämnden är nu kontrollerade av en människa** (i webbläsaren 2026-09-30). Hela kontrollistan med adresser står som verifieringslogg i `docs/moduler/juridisk-koll.md`. **Ingenting är juristgranskat.**
- `adapters/live/legalSources.ts`:
  - En källa per undersida i stället för startsidor för Bolagsverket, verksamt.se och BFN, `hämtad: "2026-09-30"`. Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen är oförändrade (2026-09-17, startsidor).
  - De två DELVIS-punkterna har nya texter: `aktiekapital` (minst 25 000 kr för privat AB; bankintyg vid betalning med pengar, revisorns yttrande vid apport) och `bolagsavtal` (rekommenderas men inget formellt krav; solidariskt ansvar).
  - `bolagsordning_styrelse` är uppdelat i `bolagsordning`, `styrelse` och `revisor`. `arsredovisning` är uppdelat i `arsredovisning_ab` och `arsredovisning_ek_forening`. Varje ämne har sin egen adress. Katalogen har nu 17 ämnen i stället för 14.
  - Verifieringskommentaren i filhuvudet är omskriven.
- Inga ändringar i `ports/`, `types/`, `LegalAdvisor.ts`, `legalSchema.ts` eller demoadaptern. Källan väljs fortfarande med `KURERADE_KÄLLOR[topic.källId]`, och Geminis enum läser ämnes-id:na dynamiskt.
- `adapters/live/legalSources.test.ts`: fyra nya tester. Varje källa ligger på rätt myndighets domän, de kontrollerade källorna pekar på en undersida, aktiebolag och ekonomisk förening får var sin årsredovisningskälla, och bolagsordning, styrelse och revisor är tre ämnen med var sin adress.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`) och `pnpm test` (605 gröna, 35 skippade) och `pnpm build` (grönt med påhittade platshållarvärden för de två Supabase-variablerna, bara i kommandot, ingen `.env.local` skapad — se Kända problem).

### Återstår
- **Fråga till Erik:** `adapters/live/LegalAdvisor.ts:91` sätter `status: "ej_uppfyllt"` på varje krav. Bolagsavtalet för handelsbolag visas då som ett krav som inte är uppfyllt, fast det bara rekommenderas. Ska `LegalAdvisor.ts` (och kanske `types/legal.ts`) kunna skilja på krav och rekommendationer?
- Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen är inte kontrollerade av en människa och pekar fortfarande på startsidorna.
- Juristgranskning av hela ämneskatalogen: vilka ämnen som gäller per bolagsform, avgifter, deadlines och lagrum.

### Kända problem
- `pnpm build` misslyckas i en Codespace utan `.env.local`: prerenderingen av `/app` kastar "NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY saknas". Felet finns också på en ren `origin/prototyp` och beror inte på den här ändringen. Med påhittade platshållarvärden för de två variablerna går bygget igenom.
- En gammal `.next/`-cache från tidigare `next dev` (med de borttagna `app/demo/app/*`-sidorna) gjorde att `pnpm typecheck` gav fel. Lösningen är att ta bort `.next/`.

### Beslut
- Ämnes-id:na `bolagsordning_styrelse` och `arsredovisning` finns inte längre. Inget i repot använde dem utanför `legalSources.ts`.
- Källnycklarna (`KällId`) är per sida, till exempel `bolagsverket_starta_ab`. Nya ämnen får en egen nyckel när de har en egen undersida.

## PR 2: Skalet (gren `design/pr2-skalet`, PR mot `prototyp`)
Andra PR:en i `docs/plan-en-design.md`. `DemoShell` (`app/demo/_components/DemoShell.tsx`) blir `screens/AppShell.tsx` — nu delad av `/demo` och `/app`. Demoraden och rundturen rörs inte, de stannar i `app/demo/layout.tsx` (var redan syskon till skalet, inte en del av det).

### Klart
- **`screens/AppShell.tsx`** skriven om: sidomenydesignen (mörk, med ikoner, `ScoreRing` i sidhuvudet) ersatt av den flyttade flikradsmarkupen från `DemoShell`. `DemoTopBar` flyttade med (fristående exporterad — demots onboarding, `app/demo/start/layout.tsx`, använder den utan flikrad) och fick en ny valfri `dataKind`-prop (default `"example"`, så onboardingens anropsställe är oförändrat). `AppShell` tar nu `{ homeHref, navBasePath?, dataKind, profile, currentStep?, headerRight?, children }` — flikarna byggs av `navBasePath` + samma tio slugs som gamla sidomenyn redan hade (`t.appShell.nav.*`), utan ikoner. Utan `navBasePath` (fortfarande fallet för `/app`, undersidorna finns inte än) renderas tio inerta `<span>`-flikar i stället för länkar.
- **`scoreSnapshot` borttagen ur skalet helt** — `DemoShellData.score` i gamla `DemoShell.tsx` användes aldrig i dess JSX (redan död kod). `app/(app)/layout.tsx` anropar inte längre `liveEvidenceRepository.getScoreSnapshot` för skalets skull; Hem-sidan hämtar redan sin egen poäng oberoende. `NavIcon`/`ScoreRing` (bara använda av gamla skalet) importeras inte längre av `AppShell`, filerna rörda inte (PR 11 städar).
- **Ny i18n-nyckel `appShell.navMenuLabel`** ("Meny"/"Menu") — flikradens `aria-label` för `dataKind="live"`. `site.demo.navLabel` ("Demomeny") används bara för `dataKind="example"`, så /app:s meny inte kallas "Demomeny" för en inloggad användare.
- **`design/site.css`:** `.fdd`s `padding-bottom: 9rem` (plats åt demoradens `position: fixed`-bar) flyttad till en ny modifierare `.fdd--with-bar`, satt av `app/demo/layout.tsx` (som redan äger demoradens plats) — annars hade `/app` ärvt ett stort tomt utrymme i botten på varje sida utan anledning. Ny `.fdd-tab--disabled` (dämpad färg, ingen hover) för flikar utan sida än.
- **`app/(app)/layout.tsx`:** ny `<div className="fd"><div className="fdd">`-wrapper (behövdes inte förut — gamla sidomenyn var ren Tailwind, inga `fd-`/`fdd-`-klasser). Skickar `dataKind="live"`, ingen `navBasePath` (oförändrat beslut sedan Session 1: inerta flikar tills undersidorna finns).
- **`app/demo/(app)/layout.tsx`** blir en tunn hämtare: hämtar bara profil + steg (inte poäng), anropar `<AppShell navBasePath="/demo" dataKind="example" ...>`. **`app/demo/start/layout.tsx`** importerar `DemoTopBar` från `@/screens/AppShell` istället för den borttagna filen. **`app/demo/_components/DemoShell.tsx` borttagen** (allt flyttat).
- **Tester:** `screens/AppShell.test.tsx` (ny, skärmtest — märket per `dataKind`, elva länkar med `navBasePath`/tio inerta utan, stegpillen, `headerRight`). `app/(app)/layout.test.tsx` (ny — första routetestet för `/app` någonsin: anropar `LiveAppShellLayout` direkt som en async-funktion och renderar resultatet; täcker platshållarprofilen vid stubbade liveadaptrar, en lyckad hämtning, inerta flikar, och att ett riktigt fel fortsätter kastas). `app/demo/demo.test.tsx` (befintlig demotest) oförändrad och grön — samma assertions (fiktionsmärket, flikradens `aria-label`, elva länkar, affärsplan-länken) gäller alltjämt genom `AppShell`.
- **Skärmbilder FÖRE och EFTER** av `/demo` och `/demo/marknad` på 1440 och 390 px (Playwright, headless Chromium): alla fyra par pixel för pixel identiska (`compare -metric AE`, 0 i alla fyra).
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel), `pnpm test` (611 gröna, upp från 601 — tio nya), `pnpm build`. `screens/noAdapters.guard.test.ts` fortsatt grönt.

### Vad som inte gick att flytta rakt av
- **Poängen i sidhuvudet.** Gamla sidomenyn visade poängen (ScoreRing + delta) i headern; `DemoShell` gjorde det redan inte (dess `score`-fält var dödkod). Att "flytta markupen rakt av" innebar alltså att poängen försvinner ur skalet för `/app` också — ingen regression i sig (Hem visar redan sin egen poäng), men en verklig innehållsförändring på `/app`, inte bara en stilförändring.
- **`.fdd`s bottenpadding** var byggd för demoradens `position: fixed`-bar, inte en generell skalegenskap — dolt tills `/app` skulle återanvända samma klass och fått ett stort tomt utrymme i botten på varje sida. Löst med `.fdd--with-bar` (se ovan).
- **`DemoTopBar` har en andra användare** (demots onboarding) utanför den här PR:ns scope — gick inte att bara inline:a i `AppShell`, fick behållas som en egen exporterad byggsten med en bakåtkompatibel default-prop.
- **Ingen "inert flik"-stil fanns** för den nya flikradsdesignen (gamla sidomenyns `<span>`-fallback hade sin egen stil) — en ny, liten CSS-modifierare behövdes.
- **`/app` inte fotograferat** (samma kända begränsning som PR 1 — inget testkonto). Verifierat i stället med det nya routetestet, som renderar skalet direkt utan inloggning.

### Beslut nästa session behöver känna till
- **`AppShell`s props-yta är nu**: `homeHref`, `navBasePath?`, `dataKind`, `profile`, `currentStep?`, `headerRight?`, `children`. `scoreSnapshot`, `headerLeft`, `bottomBar`, `sidebarFooterAction` finns inte längre — lägg inte till dem igen utan en verklig användare.
- **`appShell.profileMenuLabel`/`tagline`/`restartDemo`** är nu oanvända i18n-nycklar (bara gamla sidomenyn använde dem) — lämnade orörda, städas i PR 11 tillsammans med `NavIcon.tsx`/`ScoreRing.tsx`/`components/spark/DemoBar.tsx`/`TourOverlay.tsx`/`SidebarRestart.tsx` (redan sedan tidigare oanvända, se `docs/plan-en-design.md` PR 11).
- **PR 3 (Hem)** är nästa enligt planen — `screens/AppHome.tsx` är oförändrad i den här PR:n, renderas nu bara inuti det nya skalets `<main className="fdd-main">` i stället för den gamla sidomenylayouten. Den kommer se blandad ut (Tailwind-innehåll i en `.fdd-main`-yta) tills PR 3 flyttar dess markup till samma stil — en avsiktlig mellanstation, inte en bugg.

### Sammanslagning med `prototyp`
Gren `design/pr2-skalet` skapades ur `adc4f24`; `prototyp` hann få två egna PR:er ("Nya priser", "Modul: Juridisk koll — källorna kontrollerade") innan den här mergades in (`git merge origin/prototyp`). Konflikt bara i `docs/status.md` (två sessioner hade lagt till varsin sektion längst ner — löst genom att behålla båda, i den ordning de redan låg på `prototyp`, med PR 2-sektionen sist). `i18n/sv.ts` och `i18n/en.ts` merge:ades automatiskt (icke överlappande nycklar). Inget rört i `core/score.ts`, `ports/`, demodatan eller Juridik-modulens adapter. `pnpm typecheck`/`lint`/`test`/`build` gröna efter sammanslagningen; skärmbilder av `/demo` och `/demo/marknad` på 1440/390 px oförändrade (pixel för pixel).

### Andra sammanslagningen med `prototyp` (2026-09-30, PR #31)
`prototyp` hade fått ytterligare två PR:er ("Mobil: ingen sidledsskroll…", "Delningsbild och sidtitel"). Konflikt bara i `docs/status.md`, samma orsak som förra gången — men den här gången avslöjade konflikten en riktig dataförlust: commit `91be3ef` ("Delningsbild och sidtitel") hade av misstag **skrivit över** hela sektionen "Modul: Juridisk koll — källorna kontrollerade" (rubrik och allt) i stället för att lägga till sin egen sektion efter den, redan innan den mergades till `prototyp`. Sektionen fanns intakt i `design/pr2-skalet`s egen historik och är återställd här, med en not om det i sig själv (se ovan). Ingen av parternas text tappades i den här mergen — se `.gitattributes` (ny fil, `docs/status.md merge=union`) för den permanenta fixen som ska förhindra att det händer igen. `design/site.css` och `i18n/{sv,en}.ts` merge:ades automatiskt (icke överlappande rader). `pnpm typecheck`/`lint`/`test`/`build` gröna efter sammanslagningen.

## PR 3: Hem (gren `design/pr3-hem`, ur `design/pr2-skalet`, PR mot `prototyp`)
Tredje PR:en i `docs/plan-en-design.md`. Demots Hem-sida (`app/demo/(app)/page.tsx`) blir `screens/AppHome.tsx` — samma på-plats-utbyte som skalet i PR 2, fast för Hem. Första sidan där `/app` faktiskt syns annorlunda (den fanns redan, bara i den gamla Session 1-designen).

### Klart
- **`screens/AppHome.tsx`** skriven om helt: `Card`/`DataFact`/`LockedState`/`JourneyRail`/`NextStepCard`/`PulseCard`/`ScorePanel`/`SuggestionList` (Tailwind-designen) ersatta av den flyttade `.fdd-*`-markupen från demots Hem-sida. Filerna rörs inte — landningssidan m.fl. använder fortfarande några av dem. `ScoreFigure`/`ScoreDelta`/`JourneyStepper` dupliceras minimalt som icke-exporterade lokala funktioner i stället för att importeras från `app/demo/_components/DemoBlocks.tsx` (den filen används fortfarande av Poäng och Resan, som inte är konverterade än, och screens/ får bara ta emot props/typer från ports/core).
- **`AppHomeData` smalnad av och delvis nullbar**: `scoreHistory`/`suggestions` borttagna (visades aldrig av den här sidan, Poäng-sidan hämtar redan sina egna — samma mönster som PR 2:s borttagna `scoreSnapshot`). `score: ScoreSnapshot | null` och `homeSummary: { nextStep; sinceLastTime } | null` — nya nullbara fält, ett per sak som kan saknas oberoende av de andra.
- **Platshållarfel är nu platsspecifika, inte helsides.** `app/(app)/app/page.tsx` hämtar `score`/`homeSummary` var för sig och fångar var för sig (`isPlaceholderError`); `journeySteps`/`pulseSignals` hämtas ofångade (kastar aldrig platshållarfel, ett äkta fel forsätter kasta). `screens/AppHome.tsx` visar `<ComingSoon />` bara i handlingskortets/poängkortets/"sedan sist"-rutan när respektive fält är `null` — Resan-raden och Pulsen visar riktig data ändå. Tidigare (Session A–P1): ETT stort `Promise.all` + en enda helsides `ComingSoon` om något av sex anrop kastade, även om resten fanns.
- **`todayIso` hämtas inte längre via en adapter för `/app`** — routen sätter det direkt (`new Date().toISOString().slice(0, 10)`, datum-delen bara — `formatDate`, `i18n/format.ts`, lägger själv till `T00:00:00` och kraschar annars på en full tidsstämpel, en verklig bugg hittad och fixad under arbetet).
- **Ny `dataKind`-styrd text:** den skärmläsar-dolda ledtråden till handlingsknappen (`t.site.demo.nextAction`, "Spelar upp nästa moment i demot.") visas bara för `dataKind="example"`. Ny nyckel `homePage.noPulseSignal` ("Ingen signal än." / "No signal yet.") ersätter demots scenario-ramade `t.site.demo.noPulse` för `dataKind="live"`.
- **`app/demo/(app)/page.tsx`** är nu en tunn hämtare (`Promise.all` av fyra demoadaptrar, bygger `AppHomeData`, renderar `<AppHome dataKind="example" onNextStep={next} .../>`) — ingen markup kvar i filen.
- **`app/(app)/app/page.tsx`s inaktuella kommentar rättad** — påstod att Pulsen fortfarande var en stub, den har varit byggd sedan tidigare (`docs/moduler/webbresearch-och-pulsen.md`).
- **Tester:** `screens/AppHome.test.tsx` (nytt skärmtest, 7 tester — `dataKind`-styrd text, `ComingSoon` per lucka, `onNextStep`-anrop, Resan-länkarna). `app/(app)/app/page.test.tsx` (nytt routetest, samma mönster som PR 2:s `app/(app)/layout.test.tsx` — anropar sidans async-funktion direkt, 4 tester: stubbad Resan ger `ComingSoon` bara på två ställen men riktig poäng/Resan-rad, tomt konto ger `ComingSoon` bara i poängrutan, neutral pulstext, äkta fel kastar vidare). `app/demo/demo.test.tsx` (befintlig demotest) grönt helt oförändrat.
- **Skärmbilder FÖRE/EFTER** av `/demo` (Hem) och `/demo/marknad` på 1440/390 px: pixel för pixel identiska (`compare -metric AE`, 0 i alla fyra).
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel), `pnpm test` (626 gröna, upp från 615 — elva nya), `pnpm build`. `screens/noAdapters.guard.test.ts` fortsatt grönt.

### Vad som inte var en ren flytt (innehållsbeslut)
- **Platshållarfel per sektion i stället för helsides** var den enskilt största avvikelsen — en skarpare tolkning av "platshållarfel och låst läge" än den enda tidigare etablerade (helsides `ComingSoon`), eftersom Pulsen och Resans stegrad redan fungerar och inte borde släckas av att Resans `getHomeSummary` är en stub.
- **`scoreHistory`/`suggestions` försvinner ur `AppHomeData`** — samma mönster som PR 2, men ett medvetet beslut, inte en bugg.
- **Två textbeslut** (sr-only-ledtråden gated på `dataKind`, ny `noPulseSignal`-nyckel) — text som skiljer sig i sak mellan demo och app, inte bara flyttad rakt av.
- **`todayIso`s källa byter helt för `/app`** (systemdatum, ingen adapter) — en arkitekturell nödvändighet eftersom Resans `getHomeSummary` (som äger `todayIso` i demot) är en permanent stub.
- **En verklig bugg hittades och fixades under arbetet**, inte i den befintliga koden utan i mitt eget första utkast: `formatDate` kraschade på en full ISO-tidsstämpel (dubbel `T`) — upptäckt av det nya routetestet, inte manuellt.

### Beslut nästa session behöver känna till
- **`AppHome`s props är nu**: `{ data: AppHomeData; dataKind: DataKind; onNextStep?: () => void; journeyStepHref; scoreHref }`. `journeyStepHref`/`scoreHref` är obligatoriska strängar/funktioner — ingen skärm ska anta en specifik bas-väg.
- **`ScoreFigure`/`ScoreDelta`/`JourneyStepper` finns nu på två ställen** (`app/demo/_components/DemoBlocks.tsx` och `screens/AppHome.tsx`, medvetet duplicerade) — när Poäng (PR 4) och Resan (PR 9) konverteras, avgör då om `DemoBlocks.tsx`s versioner kan tas bort helt eller om en gemensam, icke-demo-bunden plats behövs.
- **PR 4 (Poäng)** är nästa enligt planen.

## PR 4: Poäng (2026-09-30, direkt på `design/en-design`, ingen egen PR)
Fjärde steget i `docs/plan-en-design.md`, det första enligt "Arbetsordning" (commits direkt på `design/en-design`). `origin/prototyp` (med Eriks merge av PR 2, #31) togs in först, utan konflikter. Två commits: flytten och dubbletterna (`ce5a58d`), och poängen i sidhuvudet (`9d8fc02`, egen commit så den kan backas separat).

### Klart
- **`screens/Score.tsx`** skriven om: den gamla Tailwind-skärmen (`KpiRow`/`KpiTile`/`ScorePanel`/`SuggestionList`, oanvänd sedan #25) ersatt av markupen från `app/demo/(app)/poang/page.tsx`, flyttad rakt av. `PartsList` och `ScoreHistory` flyttade med in i skärmen (bara Poäng använder dem); `app/demo/_components/ScoreHistory.tsx` borttagen.
- **`ScoreData = { snapshot; suggestions; history }`, alla tre nullbara var för sig** (platshållare per sektion): `null` ger `ComingSoon` bara i det kortet (nedbrytningen, historiken, "Höj din poäng"). En tom lista är ett ärligt tomläge med egen text (`scorePage.noHistory`, `scorePage.noSuggestions`), inte "Kommer snart". Utan poäng blir rubriken sidans namn ("Poäng") i stället för en nivå.
- **Demots poängsida** är en tunn hämtare (tre demoanrop → `<Score data>`), ingen markup kvar.
- **Ny rutt `app/(app)/app/poang/page.tsx`**: `liveEvidenceRepository` (`getScoreSnapshot`, `getSuggestions`, `getScoreHistory`), varje anrop fångat för sig med `isPlaceholderError`; äkta fel kastas vidare. Hems "Se poängen"-länk (`/app/poang`) pekar nu på en sida som finns.
- **Dubbletten från PR 3 borta:** `ScoreFigure`, `ScoreDelta`, `levelTone` och `formatDelta` finns bara i `screens/blocks/ScoreFigure.tsx` (DemoBlocks-versionen). `screens/AppHome.tsx` och `screens/Score.tsx` importerar därifrån; `DemoBlocks.tsx` (`VerdictBlock`) och `resan/[steg]` likaså. `JourneyStepper` är orörd, fortfarande i två exemplar (PR 9).
- **`mentionsConcept` flyttad** från `app/demo/_lib/concepts.ts` till `core/concepts.ts` (ren logik; skärmen behövde den och får inte importera från `app/`). Fyra demosidor pekar om.
- **Poängen i skalets sidhuvud** (egen commit): `AppShell` tar `score?: number | null` och visar "Poäng 24" i toppradens typsnitt och storlek (`.fdd-top__score`), länkad till `…/poang`, på alla bredder. `null`/utelämnad visar "—" med skärmläsartexten "Poängen saknas än", aldrig en nolla. Demots layout hämtar `getScoreSnapshot` (samma snapshot som Hem och Poäng, följer `beatIndex`); `/app`-layouten hämtar den igen och fångar platshållarfel. Nya i18n-nycklar `appShell.headerScoreLabel`/`headerScoreMissing`.
- **Tester:** `screens/Score.test.tsx` (6), `app/(app)/app/poang/page.test.tsx` (4), två nya i `app/demo/demo.test.tsx` (Poäng-sidans delar/låsta/historik, sidhuvudets poäng = motorns), tre nya i `screens/AppShell.test.tsx` och tre nya i `app/(app)/layout.test.tsx` (siffra, lucka, äkta fel).
- **Skärmbilder** (Playwright, 1440 och 390 px, beat 0 och 8, `/demo` och `/demo/poang`): efter del 1–2 alla 16 pixel för pixel identiska med före (AE 0). Efter del 3 skiljer sig bara sidhuvudet (diffen på hela sidan är exakt lika stor som diffen på sidhuvudet): "Poäng 24" bredvid steget på 1440, i andra raden bredvid språkväxeln på 390. Sidhuvudets höjd är oförändrad.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (644 gröna, 35 skippade), `pnpm build` (grönt, bara den kända `metadataBase`-varningen). `screens/noAdapters.guard.test.ts` grön.

### Vad som inte var en ren flytt (innehållsbeslut)
- **Tomlägen på Poäng:** två nya texter ("Ingen poäng sparad än.", "Inga förslag än.") för `/app`. Liveadapterns `getSuggestions` returnerar medvetet `[]` tills förslagstexterna skrivs, så "Höj din poäng" är alltid tom i `/app` just nu. Sorteringsnoten visas bara när det finns förslag.
- **Rubriken utan poäng** blir "Poäng" (ingen kontextrad, ingen ingress), i stället för en nivå.
- **Låst läge:** Poäng har inget låst läge för hela sidan; de låsta delarna ("Låses upp efter steg 05") i nedbrytningen är det låsta läget, samma som i demot.
- **Sidhuvudets poäng har ingen `SourceTag`.** Den är en sammanfattning av delarna och länkar till Poäng, där varje del har sin källa.
- **Flikarna i `/app` är fortfarande inerta** (ingen `navBasePath`), fast `/app/poang` finns. Att tända dem skulle länka till nio sidor som inte finns än. Poängen i sidhuvudet och Hems poängkort länkar dit.

### Beslut nästa session behöver känna till
- **Delade byggstenar mellan skärmar ligger i `screens/blocks/`** (se `DESIGN.md`, "Skärmar och data"). `JourneyStepper` kan flytta dit i PR 9.
- **`AppShell`s props:** `homeHref`, `navBasePath?`, `dataKind`, `profile`, `currentStep?`, `score?`, `headerRight?`, `children`.
- **`/app`-layouten gör nu ett extra `getScoreSnapshot` per sidladdning** (Hem och Poäng hämtar det också). Billigt, men om det blir ett problem kan layouten och sidan dela på ett cachat anrop (`React.cache`).
- Tidigare `app/demo/_lib/concepts.ts` heter nu `core/concepts.ts`.

### Kända problem / docs som inte stämmer
- `docs/uppdrag.md` avsnitt 6, "Appen (`/app/*`)", beskriver fortfarande "mörk sidomeny till vänster" (nu en flikrad), och komponenttabellen säger `ScoreBadge` "kompakt i sidhuvud" (nu en textsiffra). Kravet "sidhuvudet visar poängen alltid" är det som återställts. Det finns inget avsnitt 11.6 i `uppdrag.md`.
- `CLAUDE.md` säger att allt arbete sker på `prototyp`; migrationen sker på `design/en-design` enligt `docs/plan-en-design.md`.
- "Nuläge" i `docs/plan-en-design.md` är en ögonblicksbild från 2026-09-26 (säger att `/app` bara har Hem).
- `/app` efter inloggning är fortfarande inte fotograferat (inget testkonto); täckt av rutttesterna.

## PR 5: Minnet + Juridik (2026-09-30, direkt på `design/en-design`)
Femte steget i `docs/plan-en-design.md`. `origin/prototyp` hade inget nytt att ta in. Tre commits: flytten (`f41bc39`), märkningen av overifierade källor (`56f7d72`, egen commit så att den kan backas separat) och docs.

### Klart
- **`screens/Memory.tsx`** och **`screens/Legal.tsx`** skrivna om: de gamla Tailwind-skärmarna (oanvända sedan #25) ersatta av markupen från `app/demo/(app)/minnet/page.tsx` och `…/juridik/page.tsx`, flyttad rakt av. Demots två sidor är tunna hämtare utan markup.
- **`PageHead`, `Locked` och `Pill`** flyttade från `app/demo/_components/DemoBlocks.tsx` till `screens/blocks/PageBlocks.tsx` (skärmarna får inte importera från `app/`). `DemoBlocks.tsx` exporterar dem vidare, så demots övriga sidor är orörda; de pekas om när de flyttas.
- **`MemoryData = { profile; brainNotes; trace }`**, alla nullbara var för sig (platshållare per sektion). Utan profil blir rubriken "Minnet" och bara Profilen-fliken visar `ComingSoon`. Hjärnan sparas via en prop, `onSaveBrainNotes`; ett misslyckat sparande visar "Anteckningarna kunde inte sparas" (`role="alert"`).
- **`LegalData = { krav }`** (nullbar), **`locked: { unlocksAfterStep } | "notInScenario" | null`** och en valfri **`bolagsformPicker`**. Demots sida räknar ut låsningen som förut (tom karta = låst till steg 04, eller "inte i scenariot" för Jonas). Ansvarsbegränsningen visas alltid när kartan visas.
- **Ny rutt `/app/minnet`:** `liveMemoryRepository`, tre anrop fångade var för sig. Hjärnan sparas med en Server Action (`app/(app)/app/minnet/actions.ts`) som bara tar emot en sträng; användaren tas ur sessionen i adaptern och RLS på `brain_notes` är spärren.
- **Ny rutt `/app/juridik`:** användaren väljer bolagsform (`?bolagsform=…`, fyra länkar i en segmenterad kontroll, bara i `/app`). Värdet vitlistas i rutten; utan giltigt val anropas inte `liveLegalAdvisor` (och inte Gemini). `LegalAdvisorError` kastas vidare som ett äkta fel.
- **Ingen källa visas som verifierad** (egen commit): varje krav visar källa och datum (`SourceTag`) och en streckad märkning "Overifierad"; kartans rubrikrad säger "Ingenting här är granskat av en jurist. Varje källa är overifierad tills den är det." Saknas källnamn eller datum visas "Källa saknas" i stället för en tagg. Gäller både `/demo` och `/app`.
- **`orNull`** delad i `app/(app)/app/_lib/orNull.ts` (Poäng, Minnet, Juridik); Poängs lokala kopia borttagen.
- **Nya i18n-nycklar** (sv/en): `memoryPage.brainHintLive`, `brainSaveFailed`; `legalPage.unverifiedSource`, `notReviewedNote`, `sourceMissing`, `empty`, `bolagsformPickerLabel`, `bolagsformPrompt`.
- **Tester:** `screens/Memory.test.tsx` (6), `screens/Legal.test.tsx` (8), `app/(app)/app/minnet/page.test.tsx` (3 rutt + 3 för Server Action), `app/(app)/app/juridik/page.test.tsx` (5), tre nya/utökade i `app/demo/demo.test.tsx`.
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px, beat 0/8/12 och Jonas, Minnet med alla tre flikar): efter flytten alla 32 pixel för pixel identiska med före (AE 0). Efter märkningen skiljer sig bara Juridik med karta (beat 12, båda bredderna) — märkningen och rubrikradens not; allt annat oförändrat.
- **Docs:** `CLAUDE.md` (undantaget för sidhuvudets poäng med motivering; grenregeln för `design/en-design`), `docs/uppdrag.md` (flikrad och textsiffra i stället för mörk sidomeny och `ScoreBadge` i sidhuvudet), `docs/plan-en-design.md` ("Nuläge" och tabellen efter PR 1–5), `DESIGN.md` (märkningen, valet av bolagsform, `PageBlocks`), `docs/moduler/juridisk-koll.md` (`/app/juridik` finns nu; felet får aldrig visas rakt av).
- **`/security-review`** av PR 5:s ändringar: inga fynd. Kontrollerat: Server Action utan session (adaptern kastar `NotAuthenticatedError` före skrivning), att skriva någon annans Hjärna (`user_id` bara ur sessionen, RLS med `with check`), vitlistningen av `bolagsform`, att källans URL kommer ur `KURERADE_KÄLLOR` och aldrig ur modellen, och att inget renderas som HTML.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (671 gröna, 35 skippade), `pnpm build`.

### Vad som inte var en ren flytt (innehållsbeslut)
- **Märkningen "Overifierad"** ändrar demots Juridik-sida. Ingen adapter skickar verifieringsstatus, så alla källor märks, även Bolagsverket, verksamt.se och BFN som en människa kontrollerat 2026-09-30. Beslut av grundaren: hellre för försiktigt än att något ser verifierat ut.
- **Val av bolagsform i `/app`** är nytt gränssnitt. Ingen port ger användarens bolagsform; att hårdkoda demots `enskild_firma` hade varit en påhittad uppgift. Beslut av grundaren.
- **Hjärnans ledtråd** nämner Sara; `/app` får en egen text ("Dina egna anteckningar…").
- **Tomläge i `/app/juridik`** ("Inga krav hittades för bolagsformen.") — i demot betyder en tom karta låst, i appen inte.
- **Inget låst läge i `/app/juridik`**: det ska komma ur Resans steg, och Resans liveadapter är en stubbe. Inget låsläge hittas på.
- **Spårets datum:** liveadaptern ger hela tidsstämplar; skärmen formaterar datumdelen (`slice(0, 10)`, UTC). `formatDate` hade annars kraschat — samma fel som PR 3 hittade.

### Beslut nästa session behöver känna till
- **`Memory`s props:** `{ data: MemoryData; dataKind; onSaveBrainNotes }`. **`Legal`s props:** `{ data: LegalData; locked: LegalLock; bolagsformPicker? }`.
- Skärmar tar bara serialiserbara props från `/app`-rutterna (eller Server Actions). `Legal` bygger valets länkar själv ur `basePath` i stället för att ta en funktion.
- **När en verifieringsstatus finns i datan** (t.ex. ett fält i `Källa` som Juridik-modulens ägare sätter i `legalSources.ts`) kan märkningen visas bara för de overifierade. Ändringen hör till Juridik-modulen, inte migrationen.
- **När Projekt eller Profil ger bolagsformen** kan `/app/juridik` förvälja den; valet kan stå kvar.

### Kända problem / docs som inte stämmer
- **Troligt fel i `/app` Hem (PR 3, inte rört här):** `app/(app)/app/page.tsx` skickar en funktion (`journeyStepHref`) från en Server Component till klientkomponenten `AppHome`. Next brukar vägra det vid rendering ("Functions cannot be passed directly to Client Components"). Rutttestet anropar sidan direkt och fångar det inte, och `/app` är inte fotograferat (inget testkonto). Bör kontrolleras och rättas i nästa session (t.ex. en `journeyStepBasePath`-sträng, samma mönster som `Legal`).
- **"Tre av åtta källor overifierade"** (status.md, modulsessionen 2026-09-17) är inaktuellt: i dag är tre av åtta myndigheter kontrollerade av en människa och fem bara maskinellt hämtade. Ingenting är juristgranskat.
- **Ett Gemini-anrop per sidladdning av `/app/juridik?bolagsform=…`** — ingen cache. Värt en dagscache som Pulsens om det blir dyrt.
- **Juridik är fortfarande bara på svenska** (`getLegalMap` tar inget `locale`, Oskars ärende).
- `/app/minnet` och `/app/juridik` är inte fotograferade (inget testkonto); täckta av rutttesterna.

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

## PR 8: Marknad (2026-09-30, direkt på `design/en-design`)
Åttonde steget i `docs/plan-en-design.md`. `origin/prototyp` hade inget nytt att ta in. En commit för koden och en för docs.

### Klart
- **`screens/Market.tsx`** är omskriven. Den gamla Tailwind-skärmen (`KpiTile`, `BarChart`, oanvänd sedan #25) är ersatt av markupen från `app/demo/(app)/marknad/page.tsx`, flyttad rakt av. Demots sida är nu en tunn hämtare utan markup.
- **`MarketData`, platshållare per sektion.** `registry` är antingen ett objekt med `overview`, `companies` och `medianRevenueFiscalYears` (var för sig nullbara) eller ett av lägena `"closed"`, `"failed"` och `"notChosen"`, som inte bär någon data alls. En stängd grind kan alltså inte visa en registersiffra, och det gäller redan på typnivå. `outreach` (`{ rows, source }`, gatas tillsammans) och `simulation` kan saknas var för sig.
  - I registerlägena visar nyckeltalen, fördelningen och konkurrenterna samma läge. Utskicket, datalagret och simuleringen visar sina egna lägen.
  - Ett underlag på 0 bolag (`basis`, som porten säger betyder "okänd") visas som luckan, aldrig som 0 %.
- **`MarketLock = { unlocksAfterStep } | "notInScenario" | null`**, samma form som Validering och Juridik. Demot räknar ut låsningen som förut: låst till steg 02, och Jonas får "inte i scenariot".
- **Ren logik till `core/`:** `core/market.ts` (`sizeDistribution`, `dominantBucket`, `employeeSpan`) och `core/fiscalYear.ts` (`fiscalYearSpanOf`, `formatFiscalYearSpan`). Utskickets siffror räknas med `outreachStats` ur `core/validation.ts`, samma som Valideringen.
- **Ny rutt `/app/marknad`.**
  - Låst tills steg 02 är klart (Resans `getSteps`). I låst läge görs inga andra anrop, inte heller till grinden.
  - Rutten frågar licensgrinden (`assertRegistryAccessAllowed`) innan Registret anropas, också innan någon bransch är vald. Stängd grind ger `"closed"`, och då visas ingen branschväljare.
  - Om grinden stängs mellan frågan och anropen (`RegistryLockedError` från adaptern) visas också `"closed"`, även om en del av svaret kom tillbaka.
  - `RegistryTransportError` ger `"failed"`: "Registerdatan kunde inte hämtas just nu." Serverloggen får bara felets namn och meddelande, aldrig `cause`.
  - Ingen cache runt registeranropen.
  - Utskick och simulering är `null` ("Kommer snart"), av samma skäl som i PR 7.
- **Branschen väljs i adressen** (`?sni=69.201`) med ett GET-formulär (`.fdd-sni`, `.fdd-input`). Värdet vitlistas med samma form som adaptern kräver. En ogiltig kod anropar ingenting och ger "Ogiltig SNI-kod" (`role="alert"`).
- **Omsättningen bär sitt räkenskapsår** (del 2):
  - Per bolag visas "4 200 tkr (räkenskapsår 2024)", och för medianen spannet "4,2 Mkr (räkenskapsår 2023–2024)".
  - Saknas året i datan visas luckan i stället för siffran: "—" i nyckeltalet med förklaringen "Räkenskapsåret saknas i underlaget, så siffran visas inte.", och "–" i tabellen med samma text för skärmläsare.
  - Valideringens tabell får en egen radtyp, `ValidationRow = CampaignRow & { revenueFiscalYear }`.
  - Ingen port bär året, så båda rutterna och demot sätter `null`. **Därför visas luckan i dag överallt:** medianen på `/demo/marknad` och `/app/marknad`, och omsättningskolumnen på `/demo/validering` och `/app/validering`.
- **Nya i18n-nycklar** (sv/en): `common.fiscalYearLabel` och `fiscalYearMissing`. I `marketPage`: `companyCountLabelLive`, `companyCountDescriptionLive`, `basisMissing`, `registryClosed`, `registryLoadFailed`, `sniPickerLabel`, `sniPickerSubmit`, `sniPrompt`, `sniInvalid` och `sniChooseFirst`.
- **Tester:**
  - `screens/Market.test.tsx` är omskriven (19 tester). Den täcker låst läge, Jonas, rubriken, urvalet, räkenskapsåren och luckan, underlaget 0, datalagret, klasserna i stället för exakta tal, utskickets tre lägen, `dataKind`, "Kommer snart" per sektion, de tre registerlägena utan registersiffror och branschväljaren.
  - `core/market.test.ts` (3 tester) och `core/fiscalYear.test.ts` (3 tester).
  - `app/(app)/app/marknad/page.test.tsx` (10 tester) täcker låst läge utan anrop, stängd grind, grinden som stängs under anropen, inget val, ogiltig kod, öppen grind, transportfel utan feltext, okända steg, äkta fel och att inga funktioner skickas som props.
  - `app/(app)/app/marknad/licensgrind.test.tsx` (6 tester) använder den riktiga grinden och den riktiga adaptern, se nedan.
  - `screens/Validation.test.tsx` och `app/(app)/app/validering/page.test.tsx` har fått räkenskapsåret.
  - Två nya tester i `app/demo/demo.test.tsx`: Marknads moment och luckorna.
  - I `e2e/app.spec.ts` ligger nu `/app/marknad` och `/app/marknad?sni=69.201` i `PAGES`, plus testet "testkontot ser inga registersiffror".
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px, beat 0, 9, 12, 14, 17 och 37 och Jonas; `/demo`, `/demo/marknad` och `/demo/validering`, 42 par):
  - `/demo` är pixel för pixel identisk i alla 14 lägen.
  - `/demo/marknad` är identisk i låst läge och för Jonas. I de olåsta lägena skiljer sig bara medianrutan: "—" och förklaringen i stället för "4,2 Mkr", "Baserat på 194 av 312 bolag." och källtaggen. På 390 px är rutan 11 px lägre, så resten av sidan flyttar upp. Det är den väntade följden av del 2.
  - `/demo/validering` skiljer sig bara i omsättningskolumnen ("–").
- **Inloggat:** testkontot står på steg 01, så `/app/marknad` visar "Låses upp efter steg 02" (skärmbild och sidans text). `pnpm test:e2e` gav 18 av 18 mot produktionsbygget.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (725 gröna, 35 skippade) och `pnpm build`.

### Licensgrinden: hur den är kontrollerad
1. **Kodläsning.** `assertRegistryAccessAllowed` är första satsen i båda adaptermetoderna, i `registryCache.ts` och i Bolagsverkets transport. Den kräver `REGISTRY_LIVE_ENABLED=true` och att användarens id finns i `REGISTRY_ALLOWED_USER_IDS`, och den nekar som standard. Rutten frågar samma grind en gång till först och cachar inget. Den enda delade cachen (`registry_cache`) ligger bakom grinden.
2. **Test med den riktiga grinden och adaptern** (`licensgrind.test.tsx`). Bara sessionen och transporterna är utbytta, och transporterna svarar med data om de anropas. Fyra fall ger "Registret är inte öppet än" (tre gånger), inga transportanrop och inget bolagsnamn: en användare utanför allowlisten, ingen session, Theo med flaggan av, och Theo med tom allowlist. Theo och Erik på allowlisten når registret.
3. **Mutationstest.** Med grinden tillfälligt gjord verkningslös (`return;` först i `assertRegistryAccessAllowed`) föll alla fyra fall. Grinden återställdes efteråt (`git diff lib/server/` är tom).
4. **Inloggat.** Testkontot står inte på allowlisten, och i den här miljön är `REGISTRY_LIVE_ENABLED` och `REGISTRY_ALLOWED_USER_IDS` inte satta alls (kontrollerat utan att värdena skrevs ut). E2e-testet kräver att sidan saknar `.fdd-figures` och `.fdd-bars` och inte innehåller "Baserat på", "Mkr" eller "Bolag i registret".
   - **Begränsning:** testkontot är låst av Resan (steg 01), så inloggat nås aldrig grindfrågan. Den olåsta vägen är bevisad med testet i punkt 2, inte i webbläsaren. Testkontots steg är inte ändrade.
5. **`/security-review`**: inga fynd. Granskningen kontrollerade:
   - att grinden körs före alla registeranrop och nekar som standard
   - att det inte finns någon cache och att `"closed"` inte bär någon data
   - att `sni` vitlistas innan det används och att den råa strängen aldrig visas tillbaka
   - att inget renderas som HTML
   - att klientskärmen inte importerar `lib/server` eller `adapters/live`
   - att inga nya `NEXT_PUBLIC_`-variabler finns
   - att feltexten aldrig når klienten och att loggen saknar `cause`
   - att demot inte importerar någon liveadapter

### Genomgång av "Kända problem": omsättningen per bolag (PR 7)
PR 7 noterade att omsättningen visades exakt. Den visas fortfarande exakt, men nu bara med sitt räkenskapsår, och utan år visas luckan (se ovan). Raden i PR 7-avsnittet lämnas orörd (`merge=union`); det här är beslutet. Raden "Validerings exakta anställningstal" i "/app verifierat inloggat" är struken, eftersom den ersattes av beslutet i PR 7-avsnittet.

### Vad som inte var en ren flytt (innehållsbeslut)
- **Medianen och tabellens omsättning visas inte i demot.** Grundaren har beslutat att räkenskapsåret gäller även medianen. Demodatan har inga år och fick inte röras, så `/demo/marknad` är inte längre identisk med före (se skärmbilderna).
- **Branschväljaren** är nytt gränssnitt i `/app`, med samma öppna uppgift som bolagsformen: valet finns bara i adressen. De ska lösas tillsammans när en port bär användarens val (`plan-en-design.md`, beslut 5). Beslut av grundaren.
- **Rubriken i `/app`** är "Marknad". Ingen port ger branschens namn, och demots "Redovisningsbyråer" är Saras.
- **Antalet i `/app`** heter "Bolag i registret" med en neutral förklaring. Demots "Byråer" och "SNI 69.201" är Saras.
- **"Registerdatan kunde inte hämtas"** är ett nytt läge. SCB-transporten och årsredovisningarna är inte skrivna (`RegistryTransportError`), så även Theo och Erik ser felrutan i dag. Med PR 7:s mönster (äkta fel kastas vidare) hade sidan kraschat för dem.
- **Utskicket i `/app` anropas inte.** Kortet kräver en källa som ingen port ger, och sändspärren gäller. Validering anropar `getCampaign` och får spärren; här hade anropet inte kunnat ge något.
- **Datalagrets källtaggar** visas bara när datan finns. Texterna står kvar.
- **Registerlägena** visas i varje registersektion (nyckeltal, fördelning, konkurrenter) i stället för en gång, eftersom regeln säger platshållare per sektion.

### Beslut nästa session behöver känna till
- **`Market`s props:** `{ data: MarketData; dataKind; locked: MarketLock; sniPicker? }`. **`Validation`s rader** är `ValidationRow[]`.
- **När porten bär räkenskapsår:** fyll `revenueFiscalYear` per rad och `medianRevenueFiscalYears` (`fiscalYearSpanOf` över urvalets år) i rutterna. Skärmarna behöver inte ändras. Det kräver ändringar i `RegistryCompany`, `CampaignRow` och `MarketOverview`, och i `AnnualFiguresSchema`, som inte heller har något år. Det hör till Registrets ägare.
- **`components/ui/BarChart.tsx`** används inte längre, och `components/spark/KpiTile` bara av `BusinessPlan`. Städas i PR 11.
- **`docs/moduler/registret.md`**: grindens första lager, "ingen `/app/marknad`-route", finns inte längre, enligt planen. Texten är rättad. Registrets ägare bör bekräfta att tre lager räcker.

### Kända problem / docs som inte stämmer
- **Medianomsättning utan år visas fortfarande utanför skärmarna**, i text och data som inte fick röras i den här PR:n:
  - landningssidan (`app/(marketing)/page.tsx`, "4,2 Mkr")
  - affärsplanen (`adapters/demo/businessPlan.ts`)
  - rundturens text (`adapters/demo/tourSteps.ts`, "4,2 Mkr i medianomsättning")
  - Medgrundarens manus (`adapters/demo/cofounderScript.ts`)
  - Saras steg (`adapters/demo/sara.ts`)

  Rundturens stopp på Marknad säger nu "4,2 Mkr" medan sidan visar luckan. Affärsplanen hör till PR 10, landningssidan till `prototyp-landning`.
- **Distributionen i `/app` bygger bara på bolag med omsättning.** `searchCompanies` utelämnar bolag utan årsredovisning. Urvalet anges ("Baserat på N av M bolag"), men det är inte hela branschen.
- **`/app/marknad` med öppen grind är inte fotograferad.** Det finns inget testkonto på allowlisten och transporterna är inte skrivna.

## PR 9: Resan och steget (2026-09-30, direkt på `design/en-design`)
Nionde steget i `docs/plan-en-design.md`. `origin/prototyp` hade inget nytt att ta in (redan sammanslagen). Tre commits: flytten och `JourneyStepper` (`b59aeaf`), medianomsättningen (`49e87f0`, egen commit så att textändringarna kan granskas för sig) och docs.

### Klart
- **`screens/Journey.tsx`** och **`screens/JourneyStep.tsx`** är omskrivna. De gamla Tailwind-skärmarna (oanvända sedan #25) är ersatta av markupen från `app/demo/(app)/resan/page.tsx` och `…/resan/[steg]/page.tsx`, flyttad rakt av. Demots två sidor är tunna hämtare utan markup; `notFound()` för ett ogiltigt steg stannar i demots sida (det är hämtlogik).
- **Props:** `Journey({ data: { steps: JourneyStepView[] | null }, basePath })` och `JourneyStep({ data: JourneyStepDetail | null, stepNumber, journeyHref, verdictMissing? })`. Bara strängar, så att `/app`-rutterna (Server Components) kan skicka dem.
- **Platshållare per sektion:**
  - Resan: `steps: null` ger "Kommer snart" i stegraden och faserna, och rubriken blir "Resan".
  - Steget: `data: null` (platshållarfel) behåller tillbakalänken, visar "Steg 0N" som rubrik och "Kommer snart" i innehållet.
  - Ett olåst steg utan text i `why` visar "Kommer snart" i den rutan (ny gren; demot har alltid text, bevisat av ett test över alla moment för Sara och Jonas på båda språken).
  - `verdictMissing` ger "Kommer snart" i domens ruta. Rutten sätter den bara för steg 06 när steget är olåst och domen saknas (samma som `/app/validering`). Övriga tomma sektioner döljs som i demot.
- **Nya rutter** `/app/resan` och `/app/resan/[steg]` med `liveJourneyRepository` (`getSteps`, `getStepDetail`), fångade med `orNull`; äkta fel kastas vidare. Steget vitlistas (`/^\d{1,2}$/` och `JOURNEY_STEP_META`), allt annat ger 404 utan anrop. Låst läge kommer ur adapterns egen status.
- **`/app` Hem** skickar `journeyBasePath="/app/resan"`: de tolv stegen länkar nu till sidor som finns.
- **`JourneyStepper` finns i ett enda exemplar**, `screens/blocks/JourneyStepper.tsx` (`basePath: string | null`). Kopiorna i `app/demo/_components/DemoBlocks.tsx` och `screens/AppHome.tsx` är borta. **Kontrollerat med grep att inga dubbletter från PR 3 finns kvar:** `JourneyStepper`, `StepContent`, `ScoreFigure`, `ScoreDelta`, `levelTone` och `formatDelta` är definierade en gång var i `screens/`, `app/` (utom demots) och `components/`. Den enda andra `levelTone` ligger i `app/(marketing)/_components/ScoreProof.tsx` och kommer från #25, inte PR 3 (se kända problem).
- **`journeyStatusToneClasses`** flyttad från gamla `screens/Journey.tsx` in i `components/spark/JourneyRail.tsx`, dess enda användare (komponenten själv är oanvänd, PR 11).
- **Medianomsättningen** (egen commit): demodatan bär inget räkenskapsår, så siffran togs bort i stället för att ett år hittades på. Se listan nedan.
- **Tester:** `screens/Journey.test.tsx` (5), `screens/JourneyStep.test.tsx` (9), `screens/blocks/JourneyStepper.test.tsx` (2), `app/(app)/app/resan/page.test.tsx` (4), `app/(app)/app/resan/[steg]/page.test.tsx` (14), tre nya i `app/demo/demo.test.tsx` (Resan, steget, inget olåst steg utan text), `app/(app)/app/page.test.tsx` (Hem länkar till `/app/resan/1`). I `e2e/app.spec.ts`: `/app/resan`, `/app/resan/1` och `/app/resan/12` i `PAGES`, plus "stegen i Hem och Resan länkar till sidor som finns" och "ett ogiltigt steg ger 404".
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px; beat 0, 9, 17, 25, 37 och Jonas; `/demo`, `/demo/resan` och stegen 1, 3, 6, 7 och 12; 84 par plus landningssidan):
  - Efter flytten (del 1–2): alla 84 pixel för pixel identiska med före (AE 0).
  - Efter del 3: `/demo` och `/demo/resan` fortfarande identiska i alla lägen. Skiljer sig gör bara steg 03 (från beat 9: punkten "Medianomsättning 4,2 Mkr." borta), steg 07 (från beat 25: "medianomsättning 4,2 Mkr," borta ur punkt 1) och landningssidan (registerkortet: "—" i stället för "4,2 Mkr", underlagstexten en rad kortare, så sidan är 22 px lägre på 1440).
  - **Rundturens stopp går inte att jämföra pixel för pixel:** två bilder av samma bygge skiljer sig (animerad bakgrund bakom kortet). Texten är jämförd i stället: "312 byråer, 4,2 Mkr i medianomsättning, 18 % tillväxt — …" blev "312 byråer, 18 % tillväxt — …".
- **Inloggat:** testkontot står på steg 01. `/app/resan` visar "Om dig" som aktuellt och resten låst; `/app/resan/1` visar "Kommer snart" i "Vad som återstår" (inget innehåll i `journey_steps`); `/app/resan/12` visar "Låses upp efter steg 11".
- **`/security-review`:** inga fynd. Kontrollerat: rutterna ligger under `requireUser()`, adaptern tar användaren ur sessionen (inget från klienten når frågan), `steg` vitlistas innan adaptern anropas, inga feltexter i props, inga funktioner som props, inget renderas som HTML, demot importerar ingen liveadapter, inga nya `NEXT_PUBLIC_`-variabler.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (762 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (28 av 28 mot produktionsbygget).

### Medianomsättningen: var siffran stod utan år, och vad som gjordes
| Ställe | Före | Efter |
|---|---|---|
| Rundturen, stopp 6 (`adapters/demo/tourSteps.ts`) | "312 byråer, 4,2 Mkr i medianomsättning, 18 % tillväxt — …" | "312 byråer, 18 % tillväxt — …" |
| Medgrundarens manus, steg 03 (`cofounderScript.ts`) | "… anställda. Medianomsättning 4,2 Mkr. 18 % växte …" | "… anställda. 18 % växte …" |
| Saras steg 03 (`sara.ts`, höjdpunkter) | punkten "Medianomsättning 4,2 Mkr." | borttagen |
| Saras steg 07 (`sara.ts`, höjdpunkter) | "1. Vad kunderna tål: medianomsättning 4,2 Mkr, byråer med 10+ …" | "1. Vad kunderna tål: byråer med 10+ …" |
| Affärsplanen (`adapters/demo/businessPlan.ts`) | påståendet "Medianomsättning" med värdet 4200; underlaget "194/171/308" | påståendet borttaget; underlaget "171/308" (tillväxt/region) |
| Landningssidan (`app/(marketing)/page.tsx`) | "Median omsättning 4,2 Mkr"; "Omsättning räknas på 194 och tillväxt på 171 av 312 bolag …" | "—" med `common.fiscalYearMissing` för skärmläsare; "Tillväxten räknas på 171 av 312 bolag …" (sv/en) |

Engelska texterna ändrades likadant. Inget ställe fick ett år, eftersom inget år finns i datan.

### Vad som inte var en ren flytt (innehållsbeslut)
- **"Kommer snart" för ett olåst steg utan text** och **domens ruta i steg 06** i `/app` (se ovan). I demot händer ingetdera.
- **Stegets rubrik utan data** är "Steg 0N", eftersom titeln kommer ur samma anrop.
- **Medianen i affärsplanen** är borttagen som påstående, inte ersatt med en lucka; underlaget anger bara de två siffror som visas.
- **Landningssidans median** visar luckan "—" med förklaringen bara för skärmläsare (samma mönster som Marknads tabell), eftersom kortets tre nyckeltal inte har plats för en synlig förklaring.
- **Lämnat orört, med motivering:** `i18n/sv.ts`/`en.ts` rad 100 ("till exempel 4,2 Mkr eller 312 företag") är ett typsnittsexempel på `/designsystem`, inget påstående om marknaden. "3–15 Mkr i omsättning" i Saras steg 04 är ett urvalskriterium, ingen registersiffra. "Median 900 kr" kommer ur enkätsvaren, inte ur registret.
- **`journeyStepPath`** i `app/demo/_lib/paths.ts` används inte längre. Lämnad (städas i PR 11).

### Beslut nästa session behöver känna till
- **Props:** se "Klart". `AppHome` tar fortfarande `journeyBasePath` och skickar det vidare som `basePath`.
- **När Resans liveadapter ger dom, poängändring och upplåsta delar** visas de utan ändring i skärmen; `verdictMissing` blir då falsk av sig själv.
- **Flikarna i `/app` är fortfarande inerta**: Pulsen, Medgrundaren, Bygg och Affärsplanen saknas.

### Kända problem / docs som inte stämmer
- **"Aktuell · Efter" på ett aktuellt steg i `/app`.** Liveadaptern sätter alltid `momentKind: "after"` (kommentar i `adapters/live/JourneyRepository.ts`), så skärmen visar "Steg 01 · Aktuell · Efter". Det är adapterns värde, inte rört här (någon annans adapter). Resans ägare bör sätta "before" för ett aktuellt steg utan innehåll, eller porten bör tillåta att momentet saknas.
- **Planen sade "liveadaptern stubbe"** för PR 9. `getSteps` och `getStepDetail` är byggda; bara `getHomeSummary` är en stubbe. Rättat i planen.
- **`levelTone` finns två gånger**: `screens/blocks/ScoreFigure.tsx` och `app/(marketing)/_components/ScoreProof.tsx` (landningssidan, #25). Inte en PR 3-dubblett; landningssidan hör till `prototyp-landning`.
- **Landningssidan** hör enligt `CLAUDE.md` till grenen `prototyp-landning`, men medianen ändrades här på uppdrag, i den egna commiten `49e87f0`.

## PR 10: Medgrundaren, Bygg och Affärsplan (2026-09-30, direkt på `design/en-design`)
Tionde steget i `docs/plan-en-design.md`. `origin/prototyp` fanns redan i grenen. Fyra kodcommits och docs: Medgrundaren (`032a12f`), Bygg (`9a5d347`), Affärsplanen (`98eda3d`) och rättningarna av affärsplanens källor (`73287c4`, egen commit så att den kan granskas och backas för sig). Arbetet avbröts en gång av användningsgränsen efter Medgrundaren och återupptogs.

### Klart
- **Medgrundaren:** `screens/Cofounder.tsx` är ersatt av demots markup.
  - `CofounderData = { moment; context }`, nullbara var för sig. En tom `context` döljer spalten, som i demot.
  - `ChatLine`, `ToolRun` och `TimeSkipLine` är flyttade till `screens/blocks/ChatBlocks.tsx`. `DemoBlocks` exporterar dem vidare åt onboardingen (PR 11).
  - Demots manus (`cofounderScript`, `journeyEngine`) stannar i demots sida.
  - `/app/medgrundaren`: `CofounderAgent` har bara `sendMessage` (stubbe), och ingen port ger moment eller kontext. Båda sektionerna visar därför "Kommer snart", och inget anrop görs. Promptfältet är avstängt.
- **Bygg:** `screens/Build.tsx` är ersatt av demots markup.
  - `BuildData = { status; spec }`, där `spec: ByggBrief | "none" | null`. `"none"` betyder att porten svarat att ingen spec finns än och ger tomläget "Ingen spec än." (ny nyckel `buildPage.specEmpty`). `null` betyder platshållarfel och ger "Kommer snart".
  - `BuildLock` har samma form som Validering och Marknad. Demot räknar ut den som förut: ingen spec ger låst till steg 07, och Jonas får "inte i scenariot".
  - `ConceptBadge` visas alltid, också i låst läge.
  - `/app/bygg`: låst tills steg 07 är klart (Resans `getSteps`), och i låst läge görs inga andra anrop. `getStatus` och `getSpec` fångas var för sig med `orNull`, och portens `null` skiljs ut före fångsten. Båda är stubbar, så båda sektionerna visar "Kommer snart" för den som har låst upp.
- **Affärsplanen:** `screens/BusinessPlan.tsx` är ersatt av demots markup. Skärmen visar bara vad `buildBusinessPlan` returnerar, och `core/businessPlan.ts` är orörd.
  - `BusinessPlanData = { plan: BusinessPlan | null }`. `null` ger alla nio avsnitt med rubrik, beskrivning och "Kommer snart", och färdighetsgraden "—", aldrig 0.
  - `/app/affarsplan`: det finns ingen port och ingen live-hopsamling, så sidan visar just det. Demots hopsamling används aldrig.
- **Rättningarna av affärsplanens källor** (`adapters/demo/businessPlan.ts`, beslut av grundaren):
  - **Ett påstående visas bara med sin egen, verkliga källa.** Följande saknar källa i sina portar men lånade tidigare en poängdels eller registrets källa. De tas nu inte med:
    - stegens höjdpunkter, alla steg (poängdelens källa)
    - steg 04:s kundprofil (registrets källa)
    - förslagens förklaringar i Riskerna (poängdelens källa)
    - den skarpare idéns motivering (registrets källa)
    - Jonas antaganden (registrets källa)
    - konkurrenternas beskrivningar ("dyrt och tungt att införa") (registrets källa)
    - domens reservkälla (poängdelen)
  - Kontrollpunkterna står kvar utan påståenden, så avsnittens status sjunker och luckan visas ("Underlag saknas — kommer från steg N"). Ingen källa är påhittad.
  - **Urvalet** skrivs "tillväxt: 171 av 312, region: 308 av 312" (sv) eller "growth: 171 of 312, region: 308 of 312" (en), i stället för "171/308". **Andelarna** bär % ("18 %"). En andel med underlaget 0 (porten: okänt) visas inte. Nya nycklar: `businessPlanPage.percentValueTemplate` och `coverageValueTemplate`.
  - **`CLAUDE.md`:** undantaget från källmärkning gäller nu uträknade sammanfattningar som bara bygger på delar som visas med källa, på samma sida eller en länkad. Det gäller i dag två siffror, sidhuvudets poäng och affärsplanens färdighetsgrad, och aldrig en hämtad siffra.
  - `adapters/demo/businessPlan.test.ts` (5 tester) går igenom alla moment för Sara och Jonas. Mot den gamla hopsamlingen föll alla fem.
- **Tester:**
  - skärmtester: `screens/Cofounder.test.tsx` (6), `screens/Build.test.tsx` (5), `screens/BusinessPlan.test.tsx` (4)
  - ruttester: `/app/medgrundaren` (3), `/app/bygg` (7), `/app/affarsplan` (3)
  - tre nya i `app/demo/demo.test.tsx`
  - alla tre sidorna ligger i `PAGES` i `e2e/app.spec.ts`
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px, Sara vid beat 0, 9, 17, 25, 30 och 37 och Jonas vid 0, 10 och sista, 72 par för `/demo`, `/demo/medgrundaren`, `/demo/bygg` och `/demo/affarsplan`):
  - Efter varje flytt var alla 72 identiska med före (AE 0).
  - Efter rättningarna skiljer sig bara `/demo/affarsplan` (18 av 72). Sara i sista momentet går från 8/9 till 1/9, och Jonas i sista momentet visar 0/9.
- **Inloggat:** testkontot står på steg 01. `/app/medgrundaren` och `/app/affarsplan` visar "Kommer snart" per sektion, och `/app/bygg` visar "Låses upp efter steg 07".
- **`/security-review`:** inga fynd. Kontrollerat:
  - att rutterna ligger under `requireUser()`
  - att ingen rutt läser `params`, `searchParams`, cookies eller formulär
  - att inget renderas som HTML
  - att `orNull` bara fångar platshållarfel
  - att skärmarna inte importerar `adapters/` eller `lib/server` och att demot inte importerar någon liveadapter
  - att det inte finns några nya `NEXT_PUBLIC_`-variabler
  - att inget registeranrop görs
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (798 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (34 av 34 mot produktionsbygget).

### Vad som inte var en ren flytt (innehållsbeslut)
- **Demots affärsplan ändras synligt** av rättningarna (se ovan). Beslut av grundaren: hellre ett tunt avsnitt än ett påstående med lånad källa.
- **Luckans text** "Underlag saknas — kommer från steg 1" visas också när steg 1 är klart. Underlaget finns då, men utan egen källa. Texten är orörd.
- **Medgrundaren utan moment:** kortets rubrik blir sidans namn ("Medgrundaren"), eftersom etiketten kommer ur samma data.
- **Byggets tomläge** "Ingen spec än." är ny text, eftersom portens `null` inte är samma sak som en stubbe eller ett låst läge.
- **Affärsplanen utan plan:** avsnitten visar ingen statuspill, eftersom status inte går att avgöra.

### Påståenden och siffror utan täckning som inte är rättade (rapporteras)
- **Marknad** (`screens/Market.tsx`, demots registeradapter): konkurrenternas beskrivningar visas där med registrets källa. Samma fel som togs bort ur affärsplanen, men det hör till Marknad och Registrets demodata.
- **Bygg:** "Credits använda: 40/62" är ett fast, fiktivt tal i `adapters/demo/BuildProvider.ts` och visas utan källa. Webbläsarraden har reservadressen "lovable.dev/projects/spark" hårdkodad i markupen, flyttad rakt av.
- **Medgrundaren:** manusets siffror (till exempel "312 byråer, 18 %" och priser) visas i chattbubblor utan `SourceTag`. Kontextspalten visar resans sammanfattningar utan källa.
- **Affärsplanen, domen:** domens motivering ("9 av 9 som svarade …") visas med citatens källa (utskicket). Det är utskickets svar som ligger bakom domen, så det bedöms som en verklig källa. Det ska granskas om domen får en egen källa i `VerdictReport`.
- **Affärsplanen, Jonas:** idégenomlysningens registerfakta visas både i Affärsidén och i Marknaden (fanns före PR 10).

### Beslut nästa session behöver känna till
- **Props:**
  - `Cofounder({ data: { moment; context } })`
  - `Build({ data: { status; spec }, locked })`
  - `BusinessPlan({ data: { plan } })`
- **När någon bygger en live-hopsamling för affärsplanen:** följ källregeln i `adapters/demo/businessPlan.ts`. Ett påstående utan egen källa tas inte med. Skärmen behöver inte ändras.
- **När stegens höjdpunkter får en egen källa i `JourneyStepDetail`** kan de komma tillbaka i planen, men bara med den källan.
- **Flikarna i `/app`** är fortfarande inerta. Bara Pulsen saknas.

### Kända problem / docs som inte stämmer
- **Skärmbildsfällan, två gånger till:** en `next start` som lever kvar gav alla 72 som falska skillnader. Kontrollera att porten är fri (`ps`) före `pnpm start`. `pkill -f "next …"` i samma skalkommando dödar skalet självt (exit 144).
- **Demots läge** ligger i `localStorage` under `spark:fonda-demo-state` (`app/demo/_lib/fondaDemoIsolation.ts`), inte `spark:demo-state` som `demoStore.ts` visar.
- **`i18n/dictionary.ts`** hänvisar till `screens/Cofounder.tsx` för "Sedan tidigare" och stämmer fortfarande.
## Spik: SCB:s företagsregister-API, AFR (klar 2026-09-30, gren `docs/scb-afr-spik`, PR mot `prototyp`, bara docs)

### Klart
- **Provkörning mot `apiafr.scb.se`** från Claude Codes miljö, med Eriks personliga nyckel (`SCB_AFR_API_KEY` i `.env.local`, lästes med `node --env-file` och skrevs aldrig ut).
  - Tio anrop, alla 200, i två skript i `scratchpad/` (gitignorerad): `scb-afr-test.mjs` och `scb-afr-uppfoljning.mjs`.
  - Bara struktur, antal och kodtabeller skrevs ut. Inga enskilda firmor, inget `/full`.
- **`docs/dataspiken.md`:**
  - Nytt avsnitt "SCB AFR, provkörning 2026-09-30" (Verifierat/Sekundärt, filtermodell, fält, kodtabeller, kostnad, luckor, öppen fråga om `/full`).
  - §6 fråga 2 och 8 besvarade.
  - De gamla uppgifterna (certifikat, 2 000 rader, 10 anrop/10 s) rättade.
- **`docs/moduler/registret.md`:** nytt avsnitt "SCB AFR":
  - gränser, nattfönster, sidstorlek och filtermodellen;
  - förslaget för `searchCompanies` och `getMarketOverview`;
  - cache och SNI 2025;
  - skillnader mot `registrySchemas.ts` och porten;
  - vad som ska göras när transporten skrivs.
- **`docs/beslut.md`:** SNI 2025 rakt av (Erik, 2026-09-30).
- **`.env.example`:** `SCB_AFR_API_KEY` och `SCB_AFR_API_BASE_URL` utan värden, server-only, med kommentar.
- **`lib/server/scb.ts`:** bara kommentaren uppdaterad, ingen kodändring. Funktionen kastar fortfarande.

### Beslut
- **SNI 2025 rakt av**, fem siffror utan punkt, ingen omkodning. Porten och demodatan är inte ändrade än, se `docs/moduler/registret.md`, "SNI 2025".
- **Vilka bolag vi behåller:**
  - `jurform` 41, 42, 43, 49 (alla aktiebolag);
  - `ftgStat` 1 (verksam);
  - `reklamSparrTyp` 1 (tar emot reklam). Allt annat räknas som spärr.
- **`/full` och omsättningsklass används inte** (innehåller `tel` och `epost`). Det kräver ett eget beslut om personuppgifter.

### Återstår
- **SCB:s användarvillkor** citerade ordagrant i `docs/dataspiken.md`. Erik klistrar in dem. Det är grindkrav 2 i "Licensgrind".
- **Inget cachas** förrän villkoren är citerade och Erik har kört `registry_cache`-migreringen.
- **Skriv `lib/server/scb.ts`** och skriv om `lib/server/registrySchemas.ts` mot det verkliga svaret, enligt `docs/moduler/registret.md`, "SCB AFR". Byt också felmeddelandet i `fetchCompanies`.
- **Byt SNI-formen** i porten, liveadaptern, demodatan och testerna (listan står i `registret.md`).

### Kända problem
- `swagger.json` saknar `servers`. Bas-URL:en är härledd och bekräftad med anrop, inte angiven i kontraktet.
- Gränsen 5 anrop/s är Sekundärt: den står i SCB:s dokumentation enligt Erik, inte i swagger.json, och inga rate limit-headers syntes.

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

## PR 6: Pulsen (2026-10-01, direkt på `design/en-design`)
Steg 6 i `docs/plan-en-design.md`, det sista. Två kodcommits och docs: den rena flytten (`853323a`) och exempelkällorna (`5b2e7f2`, egen commit så att den kan granskas och backas för sig, som PR 11 del 4). Ersätter #35, som byggde samma rutt mot `prototyp` med det gamla skalet. Av #35 behölls ruttestet. Liveadaptern och Tavily fanns redan här sedan #23.

### Klart
- **`screens/Pulse.tsx`:** demots markup rakt av, ersätter den gamla oanvända skärmen (Tailwind och `PulseCard`). Props: `Pulse({ data: { signals, sourceDataType? } })`.
  - Platshållare per sektion: `signals: null` (platshållarfel) ger "Kommer snart" i listan. Sidhuvudet står kvar med sidans namn.
  - En tom lista är ett ärligt tomläge ("Ingen signal än"), inte en lucka. Det är vad liveadaptern ger utan aktivt projekt och demot ger för Jonas.
- **Demots sida** (`app/demo/(app)/pulsen/page.tsx`) är en tunn hämtare utan markup.
- **`/app/pulsen`:** `livePulseProvider.getSignals("sv")` via `orNull`, som de andra rutterna. Ingen exempelkälla, ingen `sourceDataType`: källan är artikelns domän och hämtdatum.
- **Fliken tänd:** `UNAVAILABLE_TABS` i `app/(app)/layout.tsx` är tom. PR 11:s flikrad och `unavailableTabs` i `AppShell` är orörda.
- **`app/demo/_components/DemoBlocks.tsx` borttagen** (grep: inget importerade den). Kommentarerna i `PageBlocks.tsx` och `DataBlocks.tsx` som hänvisade till den är rättade.
- **Exempelkällorna (andra commiten):** demots fem signaler är påhittade men bar myndighetsnamn som källa (Bolagsverket, Skatteverket, "Fiktiv branschtidning"). Nu visas varje signal på demots Pulsen-sida med `exampleSource` för steget där den dyker upp och `sourceDataType: "example"`: "EXEMPEL · Påhittad data, steg 01" (de tre från start), "…, steg 03" och "…, steg 06" (de två som låses upp). Stegen kommer ur nya `getSignalSteps()` i `adapters/demo/PulseProvider.ts`. `getSignals` är oförändrad.
- **Tester:**
  - `screens/Pulse.test.tsx` (5): rubrik och källor, inga relativa tider, exempeletiketten bara med `sourceDataType`, tomläge, Kommer snart vid `null`
  - `app/(app)/app/pulsen/page.test.tsx` (5): signaler utan fiktionsmärke och exempeltagg, tomläge, Kommer snart för stubbe och tomt konto, äkta fel kastas
  - `adapters/demo/PulseProvider.test.ts` (2): stegen följer signalerna i varje moment, tomt för Jonas
  - `app/demo/demo.test.tsx` (3 nya): signalerna följer momentet, exempelkälla på varje signal och inget myndighetsnamn, Jonas tomläge
  - `app/(app)/layout.test.tsx`: 11 länkar, Pulsen länkar till `/app/pulsen`
  - e2e: `/app/pulsen` i `PAGES`, flik-testet ändrat till "… Pulsen också" (11 länkar)
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px). `/demo` och `/demo/pulsen` för Sara vid beat 0, 9, 17, 25 och 37 och Jonas vid 0 och 12, 28 bilder:
  - efter den rena flytten: alla 28 identiska med före (AE 0)
  - efter exempelkällorna: `/demo` (14) och Jonas Pulsen (4) fortfarande identiska. Skiljer sig gör bara Saras `/demo/pulsen` (10), där källtaggarna bytts.
- **Säkerhet** (manuellt, `/security-review` fanns inte i miljön): `/app/pulsen` ligger under `(app)`-layoutens `requireUser()`; inga nycklar eller `NEXT_PUBLIC_`-variabler i diffen; `screens/` och demot importerar inga liveadaptrar; ingen rå HTML; Registret används inte (licensgrinden berörs inte). Vakttesterna `noExampleSources` och `noAdapters` gröna.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (843 gröna, 35 skippade) och `pnpm build`.

### Inte verifierat
- **`pnpm test:e2e` kördes inte.** Testkontot (`APP_TEST_USER_*` i `.env.local`) fanns inte i miljön, så testerna hoppas över. Kör e2e lokalt innan PR:en mot `prototyp`.
- **`/app/pulsen` inloggat mot riktig Supabase och Tavily** är inte klickad.

### Innehållsbeslut (inte ren flytt)
- **Exempelkällorna:** myndighetsnamnen byttes mot exempelkällor (se ovan). Steg 01 för de tre signalerna från start är ett val: de hör inte till något steg, de är "dagens puls" från första momentet. Datumet är scenariots datum för steget, som i PR 11.
- **Inget låst läge i `/app/pulsen`:** demots Pulsen har ingen stegspärr att flytta. `/priser` lovar "begränsad Puls" i provveckan, men ingen sådan begränsning finns i kod.

### Kända problem
- **Hem visar fortfarande dagens signal med "Bolagsverket"** (`screens/AppHome.tsx`, demots Hem). Det är samma påhittade signal. Rättas med samma mönster: en exempelkälla och `dataType` för Hems signal. Rördes inte här, eftersom Hem inte hör till steg 6 och `/demo` skulle sluta vara identisk.
- **Rubrikerna i demots signaler** påstår fortfarande saker om verkliga aktörer ("Skatteverket skärper kraven …", "Registret bekräftar precis det segment …"). Taggen säger nu att det är påhittat, men texten är oförändrad. Ett eget innehållsbeslut.
- **Liveadapterns källtagg** visas med datatypen `register` (grå registertagg) fast källan är en nyhetssajt. Samma som på Hem. Ingen datatyp för nyheter finns.

### Docs mot kod
- **Portregeln** i planen säger att `screens/` bara får ta emot props och typer från `ports/` och `core/`. Koden importerar också `design/tokens` (`DataType`), `i18n` och `components/ui` (t.ex. `Market.tsx`). Vakttestet förbjuder bara `adapters/`. `Pulse.tsx` följer Marknads mönster.
- **PR 11:s "Vad som står kvar"** säger att `PulseCard` används av `screens/Pulse.tsx`. Nu används den bara av `/designsystem`, så den står kvar av samma skäl som de andra komponenterna där.
- **`adapters/demo/PulseProvider.ts`** säger "alla med källa" om signalerna, men källorna var myndighetsnamn på påhittad data. Kommentaren om Jonas pekar på `app/demo/app/page.tsx`, som inte finns längre.

### Beslut nästa session behöver känna till
- **#35 kan stängas** nu när steg 6 ligger på `design/en-design`.
- **Migrationen är helt klar.** Inga skärmar i `screens/` är oanvända och inga demosidor har kvar egen markup.
