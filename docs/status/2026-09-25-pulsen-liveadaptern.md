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
