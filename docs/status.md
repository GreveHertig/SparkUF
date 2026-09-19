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
