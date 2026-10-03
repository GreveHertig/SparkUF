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
