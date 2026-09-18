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

## Dataspiken — källa för RegistryProvider (research klar, PR mot `prototyp`, gren `dataspiken`)

Ren research, ingen kod. Resultat i `docs/dataspiken.md`.

### ⚠ Blockerar bygget av RegistryProvider — Erik och Theodor måste avgöra
**Bygg inte `adapters/live/RegistryProvider.ts` förrän båda är avgjorda.**
1. **Bolagsverkets licensvillkor för namngivna företag är inte verifierade.** CAPTCHA blockerade både researchen och chatten, API-portalen gav 403. "Sannolikt ja" bygger på förordning (EU) 2023/138 och sammanfattningar. **Erik läser villkoren i sin egen webbläsare.**
2. **Ingen källa ger e-postadress till en mottagare.** Bolagsverket/SCB ger inga kontaktuppgifter. Allabolag ger möjligen telefon, men det är overifierat att skarpa API-anrop returnerar det. Öppet problem för **hela steg 05**. **Erik tar det med Theodor.**

### Klart
- **`docs/dataspiken.md`:** källa, kostnad, villkor och rekommendation per källa, varje uppgift märkt Verifierat / Sekundärt / Osäkert, med de två blockerarna överst.
- **Rekommendation:** bygg `RegistryProvider` på Bolagsverkets och SCB:s "API för värdefulla datamängder" (gratis, inget avtal, öppen licens enligt förordning (EU) 2023/138). Allabolag/UC: inte i MVP, öppet avtalsbeslut. Ratsit: gå inte vidare.
- **Årsredovisningarna** är iXBRL: taggade siffror inuti en dokumentfil per bolag och år, inte en färdig tabell. Bara aktiebolag lämnar in digitalt.
- **`docs/moduler/registret.md`:** rättade "blockeraren är avtal" med hänvisning till dataspiken.

### Var vi står / vad som är kvar innan nästa session
- **Väntar på Bolagsverkets godkännande** av Eriks kundanmälan (nycklar).
- **Erik:** läs Bolagsverkets användarvillkor (punkt 1 ovan).
- **Erik + Theodor:** lös mottagarnas kontaktuppgifter för steg 05 (punkt 2 ovan).
- **Grundaren + partner + vuxen/handledare:** Allabolag/UC är ett öppet avtalsbeslut. Villkoren förbjuder regelbunden, systematisk lagring utan skriftligt medgivande. Ingen kontakt tas och inget formulär skickas innan dess.
- **Först därefter:** en spik med riktiga nycklar (ordning i `dataspiken.md` avsnitt 3), sedan bygg enligt `docs/bygga-en-modul.md`.

### Beslut nästa session behöver känna till
- **Oklart om Bolagsverkets API kan söka på SNI-kod.** `searchCompanies` kan behöva SCB:s API eller filnedladdning. Avgörs i spiken.
- **Reklamspärr och enskilda firmor:** SCB-registret innehåller fysiska personer och en reklamspärr-variabel. Förslag: namngivna listor bara för aktiebolag och utan reklamspärrade. Kräver Juridisk koll och en vuxen/handledare.
- **Rättighetshavaren för Allabolag** står som Proff AS i villkoren men UC Affärsinformation AB i integritetspolicyn. Oklart vem som ska ge tillstånd.

### Kända problem / öppna frågor
- **Ratsit** verifierades bara via sökresultat (403 på deras sidor). En söksammanfattning antyder ett API, vilket inte bekräftades.
- SCB:s statistikdatabas (branschaggregat) är inte undersökt. SCB byter från certifikat till API-nycklar i september 2026.
