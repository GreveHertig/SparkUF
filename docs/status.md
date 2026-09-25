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
- Tre av åtta kuraterade källor (Bolagsverket, verksamt.se, BFN) kunde inte bekräftas med en live hämtning i den här sessionen (WebFetch-anrop misslyckades utan svar för just de tre domänerna, oklart varför — troligen blockering, inte trasiga adresser). Adresserna är väletablerade, mångåriga svenska myndighetsadresser, men bör dubbelkollas manuellt innan lansering.
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

## Designexperiment — /experiment/fonda (gren `experiment/landning-fonda`, lokal, mergas aldrig)
- Grenad från `origin/prototyp` @ 48b04dc. **Pushas inte** förrän grundaren säger till, och mergas aldrig. Grenen har ingen upstream.
- `/experiment/landning` och `/experiment/fri` finns inte på den här grenen (de ligger på `experiment/landning-erik` resp. `experiment/landning-fri`), så de påverkas inte.

### Klart
- **Landningssida `/experiment/fonda`**: sektionsrytm och berättande i steg med fonda.co som inspiration (bara struktur, inga texter, bilder eller varumärke därifrån, och Fonda nämns inte på sidan). Bara projektets tokens och typsnitt, `design/tokens.css` orörd. Sektioner: hero med ett interaktivt poängexempel (sex kundsvar, tre slår om till "säger emot" och `calculateScore` räknar om, 51 → 40, nivån byter), Resan (tolv steg i fyra faser ur `journeySteps`), Registret (demots marknadsbild och kundlista, märkt fiktiv), Poängen (de åtta vikterna ur `SCORE_PART_WEIGHTS` och tre regler), Medgrundaren (demots riktiga nästa steg efter Domen), Pris (Grundare 199 kr/mån, märkt som förslag, steg 10 ingår inte), mejlfält (inte kopplat, säger att inget sparas) och sidfot. "Se demot" är alltid märkt "Demo med fiktiv data" och går till kopian.
- **Demokopia `/experiment/fonda/demo`, första omgången:** Hem och Poäng i samma stil, plus en egen demorad (bakåt, nästa, börja om, ← →). Datan kommer ur de oförändrade demoadaptrarna. Kopian byter demo-lagrets lagringsnyckel till `spark:fonda-demo-state` medan man är i den (samma mönster som `/experiment/fri`, `_lib/fondaDemoIsolation.ts`), så det riktiga demots läge läses och skrivs aldrig.
- **Skillnader mot originalet (medvetna):** knappen i "Nästa steg" på Hem spelar upp nästa moment (i originalet gör den ingenting); förslag som nämner Lovable eller Hiasynth får `ConceptBadge` (originalets Poäng-sida saknar den).
- i18n: nytt namnutrymme `experimentFonda` i `dictionary.ts`/`sv.ts`/`en.ts`, bara tillagda rader. Inga nya beroenden.
- Tester: `page.test.tsx` (sv/en, demolänkens märkning och mål, formulärets tillstånd, att poängen sjunker, att texterna inte nämner Fonda, "den enda"/"only" eller tankstreck), `_lib/proofEvidence.test.ts`, `demo/_lib/fondaDemoIsolation.test.ts`, `demo/demo.test.tsx`.
- Verifierat: `typecheck`, `lint` (0 fel, 3 gamla varningar i `design-referens/`) och `test` (450 gröna). Playwright på 1440 och 390 px, sv och en, ingen horisontell överrullning. Skärmdumpar av `/demo/start`, `/demo/app` och `/demo/app/poang` (steg 6, Domen, Efter) är byte-identiska före och efter.

### Demokopian, andra omgången (samma gren, lokal commit)
- **Alla sidor finns nu i kopian:** onboardingen (`start`, `start/profil`, `start/ide`), Hem, Medgrundaren, Resan med stegsidor, Poäng, Marknad, Validering, Pulsen, Minnet, Juridik, Bygg och Affärsplanen. Samma data och samma urval per steg och persona som det riktiga demots rutter, i landningssidans stil.
- **Struktur:** `demo/layout.tsx` sköter bara lagringsisoleringen, demoraden och rundturen. `demo/(app)/` har skalet med en flikrad för alla sidor. `demo/start/` är onboardingen utan skal, som i originalet. Rutterna är oförändrade (`/experiment/fonda/demo/...`).
- **Onboarding-spärr som i originalet:** app-sidorna skickar en ny besökare till `start`. Spärren läser lagrets faktiska värde efter inläsning, så en återvändande besökare skickas inte tillbaka (originalets hydreringsbugg finns inte här).
- **Demoraden** har originalets alla funktioner: bakåt, nästa, hoppa till steg (Radix Popover), rundtur (låst för Jonas), byt ingång, börja om, fäll ihop, och tangenterna ← → T R.
- **Rundturen** (`_components/FondaTour.tsx`): samma 20 stopp ur `adapters/demo/tourSteps.ts` (orörd). Rutterna översätts med `toFondaPath`, och kopians sidor bär samma `data-tour-id` som originalets skärmar. `paths.test.ts` kontrollerar att varje stopp och varje menyrutt har en sida.
- **Koncept-etiketten** sätts i kopian på allt som nämner Lovable eller Hiasynth: chattrader, verktygskörningar, "Sedan tidigare", stegens höjdpunkter, datalagret på Marknad, förslagen på Poäng och påståendena i Affärsplanen (`_lib/concepts.ts`). Originalets skärmar saknar den på flera av dessa ställen.
- **Juridik** visar ansvarsbegränsningen. Hjärnan i Minnet sparar via demoadapterns `setBrainNotes`, som inte gör något, så inget kan skrivas till det riktiga demots data.
- Inga nya i18n-rader i den här omgången: kopian återanvänder de befintliga nycklarna (`onboarding`, `journeyPage`, `marketPage`, `validationPage`, `demoBar`, `tour` m.fl.).
- Tester: `demo/demo.test.tsx` (spärren, ingången sparas bara i kopians läge, Hem, menyn, Poäng mot motorn och koncept-etiketten, Marknad låst för Jonas, Juridikens ansvarsbegränsning) och `demo/_lib/paths.test.ts`.
- Verifierat: `typecheck`, `lint` (0 fel) och `test` (457 gröna). Playwright på 1440 och 390 px: onboardingen hela vägen till Hem, alla sidor, rundturen med spotlight, engelska. Inga filer utanför `app/experiment/fonda` ändrade i den här omgången, och det riktiga demots lagringsnyckel var orörd under hela genomgången.

### Rundturen, mjukare rörelse (2026-09-25)
Grundaren tyckte att rundturen hackade. Orsaker: en rAF-loop satte spotlightens `top/left/width/height` via React-state varje bildruta medan en CSS-transition på samma egenskaper körde (spotlighten släpade efter och gungade under skrollen), mörkläggningen var en `box-shadow` på 9999 px som målades om hela tiden, och vid sidbyte försvann spotlighten och helskärmsmörkläggningen blinkade fram.
- **Mörkläggning och ring ritas med `clip-path: path(evenodd, …)`** på helskärmslager (`demo/_lib/tourGeometry.ts`). Hålet har samma path-kommandon i alla lägen, så webbläsaren tweenar det mellan stoppen. Kortet flyttas med `transform`. Inget width/height/top/left animeras, och positionerna skrivs direkt i DOM:en, inte via React-state.
- **Förflyttning:** spotlighten glider direkt till målets slutläge samtidigt som sidan skrollar, rättar sig en gång om sidan flyttat sig och följer sedan målet direkt vid skroll och med glid när innehållet flyttar sig (ResizeObserver).
- **Sidbyte:** hålet krymper där det står, kortet tonar ut, och när målet finns på nya sidan och sidan stått still i ca 100 ms växer hålet ut ur målets mitt.
- **Kortet:** riktig höjd i stället för en uppskattning, tonar in med skala 0,96 → 1, raderna tonar upp i tur och ordning (40 ms), en tunn förloppslinje för stoppet, och "Hoppa över"/"Avsluta" tonar ut rundturen (180 ms) i stället för att den försvinner.
- **Ankomst:** ringen pulsar en gång utåt (WAAPI, 700 ms).
- **Kurvor:** easeInOutCubic (`cubic-bezier(0.65, 0, 0.35, 1)`) för förflyttning, `--fd-ease` för in/ut. Med `prefers-reduced-motion` finns inga glid, ingen skalning och ingen puls, bara toningar.
- **Andra varvet, samma dag** (grundaren: "lite hårda transitions och de hamnar på lite konstiga ställen"):
  - *Placering* (`layoutStop`/`frameStop`): allt räknas inom den säkra ytan mellan det klistrade sidhuvudet och demoraden, och hålet beskärs dit. Kortet läggs bredvid målet om det ryms (höger först), annars under eller över. Ett mål som fyller mer än två tredjedelar av ytan får kortet dockat i nedre högra hörnet, andra mål får kortet nära (det läge under/över som täcker minst). På smal skärm är kortet ett ark längst ner och hålet slutar ovanför det. Sidan skrollas så att mål och kort står mitt i ytan tillsammans, eller målets början under sidhuvudet om det är för högt, och skrollar inte alls om allt redan syns.
  - *Rörelse:* sidan skrollas av rundturen själv med samma kurva (easeInOutCubic) och samma längd som hålet glider, 420-680 ms efter sträckan, så att de rör sig som en kamera. Kortet glider inte längre tvärs över skärmen: det tonar ut (160 ms), flyttas osynligt och tonar in (280 ms) när hålet är drygt halvvägs framme. Pulsen är dämpad (0,55 → 0, 900 ms).
  - Mätt i Playwright på 1440 px: kortet täcker inte målet på något stopp utom de fyra där målet fyller skärmen (dockat i hörnet), aldrig över demoraden. På 390 px täcker kortet inte målet på något stopp. Längsta glapp mellan bildrutor under ett glid: 22 ms.
- **Tredje varvet, samma dag** (grundaren: "fortfarande hoppigt och skarpt"). Inspelning bildruta för bildruta (CDP screencast) visade orsakerna: 130-260 ms frysning direkt efter varje klick (React renderar om sidan och byter moment medan rörelsen skulle börja), den nya sidan syntes genom hålet medan det krympte vid sidbyte, och clip-path-animationer och den egna skrollen körs på huvudtråden och stod still under frysningarna. Ombyggt:
  - *Ordning:* Nästa spelar först ut-rörelsen (kortet tonar ut, hålet tonar igen om sidan byts) och byter stopp och moment i samma omgång först när den är klar. Det tunga arbetet sker medan inget rör sig.
  - *Compositorn:* spotlighten är ett element i sidans koordinater med en `box-shadow` på 200vmax som mörklägger. Glid mellan mål är FLIP (`transform`, WAAPI), öppna och stänga är ett lock som tonar (`opacity`). Inget clip-path längre.
  - *Skroll:* korta skrollar glider hålet i skärmens koordinater medan sidan skrollar med samma kurva och längd (förankras i sidan igen efteråt). Långa skrollar (mer än 35 % av skärmen) tonar hålet igen, skrollar under mörkläggningen och tonar upp på målet, så att innehållet inte strömmar förbi genom hålet.
  - *Mjukare toningar:* stora ytor tonar med ease-in-out (`cubic-bezier(0.45, 0, 0.55, 1)`, 300 ms) i stället för stark ease-out, som gjorde nästan hela tonen på några bildrutor. Mörkläggningen inom rundturen är 64 % i stället för `--scrim`s 72 %. Kortet behåller texten medan det tonar ut.
  - Mätt i produktionsbygget (`pnpm build && pnpm start`) genom alla 20 stopp: längsta glapp under någon rörelse 44-66 ms (inspelningens egen takt i miljön). De enda längre glappen (190-230 ms) kommer medan skärmen står still. Placeringen oförändrad, alla kort inom skärmen på 1440 och 390 px.
  - **Visa rundturen från ett produktionsbygge.** `next dev` renderar mycket långsammare, särskilt på 2 kärnor.
- Tester: `demo/_lib/tourGeometry.test.ts` (FLIP-transformen, koordinatbytet, hålet stannar i den säkra ytan, alla placeringar, skrollen för breda, höga och mobila mål, glidlängd).
- Verifierat: `typecheck`, `lint` (0 fel), `test`. Playwright på 1440 och 390 px genom alla 20 stopp.

### Rundturen och layouten, fjärde varvet (2026-09-25)
Uppdraget: jämna 60 fps, en ruta som alltid täcker rätt element, proffsig layout och sakliga rubriker. Allt mätt i produktionsbygget (`pnpm build && pnpm start -p 3200`).
- **Mätning** (skript i sessionens scratchpad, inte i repot): per övergång rAF-tider, `document.getAnimations()` per bildruta (bara glapp medan något rör sig räknas som synliga) och Long Animation Frames med skriptorsak. Baslinje i miljön: tom sida och en transform-animation går i rena 60 fps.
- **Orsak till tappade bildrutor:** hålets `box-shadow` på 200vmax. När elementet flyttades eller skalades rastrerades ett jättelager om, 2-5 tappade bildrutor per glid. Isolerat: utan skuggan 60 fps, locket, kortet och den egna skrollen kostade inget.
- **Mörkläggningen är nu fyra enfärgade paneler runt hålet**, fyra hörnbitar (radiell gradient, 16 px) och ett lock som fyller hålet när det är stängt, alla i sidans nollpunkt och placerade med `transform` (`shadeTransforms` i `demo/_lib/tourGeometry.ts`). Ringen glider aldrig (ingen förvrängning): den placeras när hålet landat och tonar in.
- **Resultat:** 1440 px: 18 av 19 övergångar utan tappad bildruta under rörelse, en med en enda (33 ms). 390 px: 19 av 19. Inga långa skript under rörelse. Reducerad rörelse: bara toningar, inga glid.
- **Rutan följer elementet:** räknas om vid skroll (beskärs mot sidhuvudet, demoraden och kortet), vid ändrad fönsterstorlek och när innehållet ändrar storlek (ResizeObserver), och placeras först när elementet syns (storlek, `checkVisibility`, typsnitt och bilder laddade) och stått still. Ett kort som hör till målet följer med sidan men lämnar aldrig den säkra ytan, och placeringen väljs om när skrollen stannat (160 ms).
- **Kontroll:** 17 stopp med mål × landat/skrollat ned 250 px/skrollat upp × 1440 och 390 px. Förra versionen (`bea7402`): rutan fel med 27-412 px efter skroll på de flesta stopp, kortet utanför skärmen, och på 5 stopp täckte kortet 66 % av målet. Nu: rätt på alla 102, kortet täcker aldrig hålet och hamnar aldrig utanför.
- **Kortets placering:** bredvid (höger först), under, över, bredvid med smalare kort (300-380 px), och annars staplat: hålet visar målets början och kortet står under det (på mobil ett ark längst ner). Det dockade läget som täckte stora mål finns inte längre. Test som provar 36 kombinationer av målstorlek och läge på dator och mobil.
- **Layout:** all spacing i demots regler och de delade komponenter demot använder följer nu `--space-*` i `design/tokens.css` (228 värden, t.ex. 0.35rem → 4 px, 0.6rem → 8 px, 0.85rem → 12 px, 1.25rem → 24 px). Typografin har färre nivåer (korttitlar 1.25rem, listrubriker 1.125rem, större titlar 1.5rem, nyckeltal lika på Hem och Marknad). Hem: korten i första raden lika höga med knapparna i linje (`.fdd-hero--even`, bara där innehållet är jämförbart). Källpillerna linjerar i nyckeltalsrader och signalkort. Resan/steg: höjdpunkterna har egen rubrik (`experimentFonda.demo.stepHighlightsTitle`, "Resultat"/"Results") i stället för en andra "Vad som gjorts", och en rubricerad del i en kolumn får sektionsluft. Simuleringen på Marknad är fullbredd. Långa sidrubriker (över 40 tecken) krymps. Flikraden på mobil tonar ut i kanten så att det syns att den skrollar.
- Landningssidans egna sektionsavstånd är orörda. Delade `.fd-*`-komponenter (knapp, piller, panel) som demot använder följer nu skalan även på landningssidan.
- Tester: `demo/_lib/tourGeometry.test.ts` (panelerna kant i kant med hålet, hörnbitarna, alla placeringar, skroll, att kortet aldrig täcker hålet).
- Rubrikerna i rundturen (punkt 4) är inte bytta: förslaget väntar på grundarens ok. Siffror i de nya rubrikerna ska räknas fram ur motorn (`calculateScore` via demoadaptrarna, `PHASE_TOTAL_CAP`), inte skrivas in.

### Återstår
- Inget i kopian.

### Kända problem
- `next dev` var mycket långsam under arbetet (20-80 s för första kompileringen av en rutt). Rundturens navigering väntar då på servern. Inget fel i koden, men värt att veta vid en visning i dev-läge. 2026-09-25: en uppsvälld `.next`-cache (1,8 GB) var en stor del av det. Efter `rm -rf .next` kompilerades `/` på 3 s i stället för 3 min.
- Rundturen: ett mål som är högre än den säkra ytan visas bara till den del som får plats (hålet beskärs). På stopp 8 på mobil ligger målet sist på sidan, så bara en remsa syns ovanför arket.
- `start/profil` på mobil har ett litet layoutskifte (CLS 0,024, gränsen för "bra" är 0,1): profilpanelen under samtalet flyttas ner när nästa fråga visas efter en timer. Avsiktligt innehåll som växer, inte rättat.
- Impeccable-skillens verktyg (`scripts/impeccable`) finns inte i miljön, så dess automatiska granskning och DESIGN.md-dokumentation kördes inte. Designbesluten står här i stället; `DESIGN.md` är orörd.
- Sidan är bara ljus, eftersom tokens saknar mörkt läge.
