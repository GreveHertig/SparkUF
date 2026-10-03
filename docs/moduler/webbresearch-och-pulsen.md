# Modul: Webbresearch och Pulsen

Ett dokument för två portar (uppdrag 14.3 listar dem tillsammans; båda
liveadaptrarna pekar redan hit) — de delar samma datakälla (Tavily) och
samma regel: **varje resultat måste bära en källa och en hämtningstid**,
annars får det inte visas.

## Syfte

- **Webbresearch (`ResearchProvider`):** generell webbsökning åt Medgrundaren
  och andra moduler som behöver hämta aktuell information (branschnyheter,
  bekräfta ett påstående, m.m.) — en underliggande förmåga, ingen egen sida.
- **Pulsen (`PulseProvider`):** kärnfunktion 1.4 punkt 5 — en daglig svensk
  marknadssignal kopplad till idén och kundsegmentet (nyregistreringar,
  kapitalrundor, nedläggningar, branschnyheter), var och en med en mening om
  varför den spelar roll för just den här grundaren. Visas på Hem
  ("Vad som hänt sedan sist") och `/app/pulsen` (3–5 signaler, avsnitt 9.5).

## Porten

`ports/ResearchProvider.ts`:

```ts
search(query: string): Promise<ResearchResult[]>
```

`ResearchResult`: `{ title, url, snippet, fetchedAtIso }`.

`ports/PulseProvider.ts`:

```ts
getTodaysSignal(locale: Locale): Promise<PulseSignal>
getSignals(locale: Locale): Promise<PulseSignal[]>
```

`PulseSignal` (`core/domain.ts`): `{ category, headline, whyItMatters,
timestamp, source: Källa }`.

## Datakällor och vad som krävs

- **Tavily search API**, `TAVILY_API_KEY` — server-only, via den nya
  `lib/server/tavily.ts` (klienten är byggd sedan mejlsökningen i steg 05; Pulsens liveadapter använder den, Webbresearch är fortfarande en stubbe).
  Samma mönster som `lib/server/gemini.ts`: tunn klient, ingen domänlogik.
- **Kostnad per sökning.** Pulsen är tänkt att köras dagligen per grundare
  (avsnitt 1.4). Pulsen har en dagscache, `pulse_fetches`, som ger högst en
  sökning per grundare och svensk dag (se "Dagscachen" nedan). Webbresearch
  har ingen cache än. Bestäm den innan den adaptern byggs.
- **Varje signal/resultat måste bära källa + tidpunkt** — ett Tavily-svar
  utan en användbar `url`/publiceringsdatum får inte bli en `PulseSignal`
  eller ett `ResearchResult` utan att först kompletteras eller kasseras.
- Hämtat webbinnehåll (sökresultatens text) är **data, aldrig instruktion**
  — om det någonsin skickas vidare till Gemini (t.ex. för att formulera
  `whyItMatters`) gäller samma princip som i Juridisk koll: modellen får
  formulera text, den får aldrig hitta på en egen källa.

## Dagscachen (`pulse_fetches`)

Migrering: `supabase/migrations/20260925090000_pulse_fetches.sql`. En rad
per grundare och svensk kalenderdag, nyckel `(user_id, fetch_date)`.
Signalerna själva sparas i `pulse_signals`. Den här tabellen säger bara om
dagens sökning redan är gjord, pågår eller misslyckades.

**Svensk dag.** `fetch_date` räknas i databasen, som
`(now() at time zone 'Europe/Stockholm')::date`, och är kolumnens default.
Adaptern skickar alltså inget datum själv och räknar aldrig dagen i Node,
eftersom serverns tidszon är UTC. Mellan 00:00 och 02:00 svensk tid skulle
Node annars ge gårdagens datum. Använd samma uttryck när dagens rad läses.

**Status.**

| status | betyder | `fetched_at` |
|---|---|---|
| `pending` | någon har tagit raden och söker nu | `null` |
| `done` | sökningen gav signaler, de ligger i `pulse_signals` | satt |
| `empty` | sökningen gav inga användbara signaler | satt |
| `error` | Tavily eller valideringen föll | satt |

Ett check-villkor kräver att `fetched_at` är `null` exakt när status är
`pending`.

**Flödet i adaptern** (`getTodaysSignal`/`getSignals`):

1. **Claim före Tavily.**
   `insert into pulse_fetches (user_id) values (auth.uid()) on conflict do nothing returning *`.
   Fick anropet en rad tillbaka äger det dagens sökning. Samtidiga
   förfrågningar krockar på primärnyckeln, och bara en av dem får raden,
   så det blir ett enda Tavily-anrop.
2. **Ingen rad tillbaka:** läs dagens rad.
   - `done`: läs `pulse_signals` och sök inte.
   - `empty`: sök inte igen samma dag. Visa tomläget.
   - `pending` med `claimed_at` yngre än 5 minuter: en annan förfrågan
     söker. Visa det som redan finns i `pulse_signals`. Sök inte.
   - `error`, eller `pending` med `claimed_at` äldre än 5 minuter (servern
     dog mitt i): ta över raden med en villkorad update, som också är
     atomär:
     `update pulse_fetches set status = 'pending', claimed_at = now(), fetched_at = null where user_id = auth.uid() and fetch_date = <svensk dag> and (status = 'error' or (status = 'pending' and claimed_at < now() - interval '5 minutes')) returning *`.
     Bara den som får en rad tillbaka söker.
3. **Efter sökningen:** spara signalerna i `pulse_signals` och sätt sedan
   `status = 'done'` (eller `'empty'`, eller `'error'`) och
   `fetched_at = now()` i samma update.

Ett `error` kan alltså försökas igen samma dag, men bara av en förfrågan åt
gången. **Taket (beslut Bruno 2026-09-25):** ett `error` tas bara över när
dess `fetched_at` är äldre än **6 timmar**. Det ger högst 3 omförsök per
svensk dag (efter 6, 12 och 18 timmar) utan en räknarkolumn, och
väntetiden ligger i databasen, så den gäller över alla serverinstanser.

**RLS.** Användaren läser, skapar och uppdaterar bara sina egna rader
(`(select auth.uid()) = user_id`). Ingen delete-policy. Raderna försvinner
med kontot. En grundare kan bara påverka sin egen sökning: sätter hen sin
egen rad till `done` får hen själv ingen signal den dagen, inget mer.

## Hur demoadaptern fungerar i dag

- `adapters/demo/ResearchProvider.ts`: `search()` returnerar alltid `[]` —
  ingen skärm använder porten i demot.
- `adapters/demo/PulseProvider.ts`: `getTodaysSignal(locale)` returnerar
  Saras signal för dagen (`saraPulseSignal[locale]`, `adapters/demo/sara.ts`).
  `getSignals(locale)` returnerar fyra fabricerade signaler till (kategori,
  rubrik, varför den spelar roll för Sara, relativ tidsangivelse som
  "3 dagar sedan", `Källa` — bland annat en fiktiv branschtidning samt
  Skatteverket och Bolagsverket namngivna enligt uppdrag 2.5 "myndigheter …
  får nämnas vid namn"), nyast först — totalt 4 signaler (Saras dagens
  signal + 3 till), inom 9.5:s krav på 3–5.

## Hur liveadaptern fungerar i dag (Pulsen)

`adapters/live/PulseProvider.ts`:

- **Bransch = idén.** Det finns ingen branschkolumn. Adaptern läser det
  aktiva projektets `name` och `one_liner` och tar ut högst 6 nyckelord
  (minst 4 tecken, utan stoppord). Bara nyckelorden skickas till Tavily,
  efter den fasta frasen "svenska näringslivsnyheter". Utan aktivt projekt
  eller utan nyckelord blir det ingen sökning och en tom lista.
- **Filtrering.** En träff behålls bara om den har rubrik, en https-URL
  (validerad i `lib/server/tavily.ts`) och om rubrik eller text nämner
  något nyckelord. Enkla svenska böjningsändelser tas bort först, så
  "redovisningsbyråer" hittar "redovisningsbyrå". En URL som redan finns i
  `pulse_signals` för projektet sparas inte igen. Rubriken rensas från
  styrtecken och kapas till 200 tecken. Webbtext är data, aldrig
  instruktion. Ingen modell är inblandad.
- **Källa.** `source.namn` = sajtens domän (utan `www.`), `source.url` =
  artikelns URL, `source.hämtad` = dagens `fetch_date` från databasen.
  `signal_at` = publiceringsdatumet om det är giltigt och inte i
  framtiden, annars nu.
- **Text.** Kategorin ("Branschnyhet") och "varför det spelar roll" är
  fasta i18n-texter (`pulsePage.liveCategory`, `pulsePage.liveWhyItMatters`)
  med projektets namn infogat. De sparas på svenska (kolumnerna är NOT
  NULL) men byggs om per språk vid läsning.
- **Dagscachen** följer flödet ovan, med två tekniska detaljer:
  - Claimen är `upsert({ user_id }, { onConflict: "user_id,fetch_date", ignoreDuplicates: true }).select()`,
    alltså `insert … on conflict do nothing returning`.
  - Supabase-klienten kan inte skicka databasens datumuttryck som filter.
    Efter en krock läser adaptern därför grundarens **nyaste** rad. Krocken
    visar att dagens rad finns, så den nyaste raden är dagens. Datumet
    räknas aldrig i Node. Övertagandet filtrerar på radens eget
    `fetch_date`. Tidsgränserna (5 min, 6 h) räknas från serverns klocka
    och jämförs med databasens tidsstämplar, så en liten klockskillnad
    förskjuter dem med samma marginal.
  - Slut-updaten kräver att raden fortfarande är vår (`status = 'pending'`
    och samma `claimed_at`), så en förfrågan som tagits över skriver aldrig
    över den nya ägarens resultat.
- **Fel.** Nätverks-/HTTP-fel från Tavily (`OutreachTransportError`) ger
  `error` och det som redan finns (ofta en tom lista). Andra fel (t.ex.
  saknad `TAVILY_API_KEY`) och fel när signalerna sparas ger också `error`
  men kastas vidare, så att de syns.
- **Retur.** `getSignals` ger de 5 nyaste signalerna för projektet, nyast
  först. Det kan vara 0–5 i verkligheten. Skärmarna visar tomläget vid `[]`.
  `getTodaysSignal` ger den nyaste signalen eller kastar `EmptyStateError`.
- **Tester.** `adapters/live/PulseProvider.test.ts` (Tavily och Supabase
  mockade med `test/stubs/pulseSupabaseFake.ts`), kontraktstestet med
  samma fejk, och opt-in `adapters/live/PulseProvider.live.test.ts` mot
  riktiga Tavily.

## Risksignaler (Pulsen, 2026-10-02)

Hampus Hedelius tips efter Rotary-pitchen: grundaren ska få veta om yttre
omständigheter som kan påverka företaget. Pulsen visar därför **risker att
bevaka** bredvid vanliga branschnyheter.

- **Två sökningar per hämtning.** Dagscachen är oförändrad (en hämtning per
  grundare och svensk dag). Varje hämtning gör nu nyhetssökningen som förut
  och en **risksökning**: dagens tema plus projektets nyckelord. Taket är
  alltså två Tavily-anrop per grundare och dag.
- **Sex teman i tur och ordning** (`riskThemeFor`, räknat ur dagscachens
  datum): kostnader och råvaror, räntor och finansiering, regler och krav,
  konkurrens, efterfrågan och konjunktur, leveranser. Alla sex täcks på sex
  dagar utan fler anrop per dag.
- **Klassning utan modell** (`classifyRisk`): ord i rubrik och text jämförs
  med ordbörjan per område (`RISK_TERMS`). Rubriken väger tre gånger mer än
  brödtexten. Listorna är medvetet snäva. En vanlig nyhet som själv handlar
  om en risk (t.ex. "Räntan höjs …") blir en risk. En träff från
  risksökningen som inte själv nämner ett riskord sparas inte.
- **Lagring utan migration.** Riskområdet sparas i `pulse_signals.category`
  som `risk:<område>`. Äldre rader ("Branschnyhet") och okända värden läses
  som vanliga nyheter (vitlista i `riskAreaOf`).
- **Visning.** `getSignals` ger högst 3 risker och fyller på med nyheter
  till högst 5 (porten säger 3–5), nyast först. Risker trängs alltså inte
  undan av en dag med många nyheter. Varje risk har `risk: { area, actions }`
  (`core/domain.ts`). Kategori, "varför" och förslag byggs från i18n
  (`pulsePage.riskAreas`) per språk.
- **Förslagen är allmänna** ("Se vilka kostnader i din kalkyl som
  påverkas"), inga påståenden om nyheten och inga siffror. Sidan säger det
  i ingressen. Ingen allvarlighetsgrad sätts: den skulle vara gissad.
- **Fel.** Ett nätverksfel i risksökningen stoppar inte dagens nyheter (status
  `done`/`empty` efter nyheterna). Ett konfigurationsfel syns och ger
  `error`, som i nyhetssökningen.
- **Skärmen** (`screens/Pulse.tsx`): utan risker ser sidan ut som förut (en
  lista, demot oförändrat). Med risker visas "Risker att bevaka" först, med
  område, förklaring, "Vad du kan göra" och källan som `media`, sedan
  "Nyheter i din bransch".

## Möjligheter och spelböcker (Pulsen, 2026-10-02)

- **Möjligheter** är en tredje sort bredvid nyheter och risker: **stöd och
  bidrag** (`funding`) och **offentlig upphandling** (`procurement`). Samma
  motor: ordbörjan per område (`OPPORTUNITY_TERMS`), samma vikt på rubriken,
  sparas som `opportunity:<område>` i `category`. `classify` väljer risk,
  möjlighet eller ingenting; vid lika poäng vinner risken.
- **Rotationen** har nu åtta teman (sex risker, två möjligheter, `themeFor`).
  Fortfarande två Tavily-anrop per grundare och dag.
- **Urvalet:** högst 3 risker, högst 2 möjligheter, resten nyheter, högst 5
  totalt. `PulseSignal.opportunity` (valfri) bär område och förslag.
- **Spelböcker** (`pulsePage.riskAreas.<område>.playbook` och
  `opportunityAreas.<område>.playbook`, sv och en): under varje risk "Så
  påverkar det dig" (frågor att pröva mot det egna företaget) och "Så löser
  du det" (numrerade steg); under varje möjlighet "Passar det dig?" och "Så
  tar du vara på det". Utfällbara, stängda från början. Märkta "Allmän
  vägledning, ännu inte granskad av en rådgivare". Innehållet är allmänna
  råd utan siffror och utan påståenden om den enskilda nyheten. **Ska
  granskas** (förslag: Hampus Hedelius) innan märkningen tas bort.
- **Skärmen:** "Risker att bevaka", "Möjligheter", "Nyheter i din bransch".
  Utan risker och möjligheter ser sidan ut som förut.

Nästa steg (inte byggt): dela sökningar mellan grundare i samma bransch
(kräver en tabell, alltså en migration som Erik godkänner), och koppla en
risk till grundarens egna antaganden i kalkylen (kräver data från Resan).

## Omdöme och bevakningar (Pulsen, 2026-10-02, gren `modul/pulsen-bevakningar`)

Gör Pulsen bättre för varje grundare över tid: grundaren säger vad som
träffar, och lägger till det Pulsen ska leta efter.

- **Migrering** `supabase/migrations/20261002120000_pulse_feedback_watches.sql`
  (**kräver Eriks godkännande och körning**):
  - `pulse_feedback` (user_id, signal_id, verdict `relevant`/`not_relevant`).
    RLS: bara egna rader, och insert/update bara för en signal som är
    grundarens egen (`exists` mot `pulse_signals`). Försvinner med signalen.
  - `pulse_watches` (id, user_id, project_id, kind `competitor`/`keyword`,
    term 2–60 tecken utan styrtecken). Unik per projekt oavsett stora och små
    bokstäver. RLS: select, insert och delete på egna rader, ingen update.
  - Prövad i en riktig Postgres: `supabase/migrations/pulseFeedbackWatches.pg.test.ts` (13 fall).
- **Porten:** fyra **valfria** metoder (`setFeedback`, `getWatches`,
  `addWatch`, `removeWatch`). Bara liveadaptern har dem; demot visar
  varken knappar eller bevakningar.
- **Liveadaptern:**
  - "Inte relevant" döljer signalen vid läsning. "Relevant" används för
    inlärning, se "Inlärning ur Relevant" nedan.
  - Bevakningarna läggs till sökorden i båda sökningarna och i
    relevansfiltret. En träff som nämner en bevakad konkurrent och inget
    annat riskord blir en konkurrensrisk. Med bevakningar söker Pulsen även
    när projektets egna ord inte räcker.
  - Högst 10 bevakningar per projekt (`MAX_WATCHES`). Ordet rensas
    (`cleanWatchTerm`). Samma ord två gånger ignoreras.
  - **Tål att tabellerna saknas** (PostgREST `PGRST205`, Postgres `42P01`):
    signalerna visas som vanligt, inget döljs, och `getWatches`/`addWatch`/
    `setFeedback` ger `NotImplementedError`. Grenen kan alltså mergas före
    migreringen utan att något går sönder.
- **`/app/pulsen`:** Server Actions i `app/(app)/app/pulsen/actions.ts`
  (indata kontrolleras där och i adaptern, användaren tas ur sessionen).
  Routen visar knappar och bevakningar bara när `getWatches` svarar.
- **Skärmen:** "Är det här relevant för dig?" med två knappar under varje
  signal ("Inte relevant" döljer kortet direkt), och "Dina bevakningar" med
  lista, borttagning och ett formulär. Ändringar gäller från nästa hämtning.

## Inlärning ur Relevant (Pulsen, 2026-10-02, gren `modul/pulsen-relevant`)

"Relevant" gör att Pulsen visar och letar efter mer av samma sort. Ingen
migrering och ingen modell: allt räknas i liveadaptern ur `pulse_feedback`
och de gillade signalernas kategori och rubrik.

- **Läsningen:** omdömena läses en gång per sidvisning (`readFeedback`),
  högst de 500 nyaste (`MAX_FEEDBACK_ROWS`, tabellen saknar `project_id`),
  och de senaste 20 gillade signalerna i projektet hämtas.
- **Ordningen:** varje signal får poäng (`preferenceScore`): antalet
  gillade av samma sort (`risk:<område>`, `opportunity:<område>` eller
  vanlig nyhet), plus ett om rubriken nämner ett inlärt ord. Högst poäng
  först, sedan nyast. Utan omdömen är alla poäng noll och ordningen exakt
  som förut. Takten (3 risker, 2 möjligheter, 5 totalt) gäller som förut.
- **Sökningen:** ord som står i minst två gillade rubriker läggs till
  sökorden och relevansfiltret, högst tre (`learnPreferences`). Siffror,
  vanliga nyhetsord ("miljoner", "satsar") och ord som redan söks räknas
  inte. Ett enda gillande ändrar alltså ordningen men inte sökningen.
- **Temat:** har grundaren gillat en risk eller möjlighet blir varannan
  dag det mest gillade området dagens tema (`favoriteInsight`). De andra
  dagarna roterar temat fortfarande genom alla åtta, så inget område tystnar.
  Taket på två Tavily-anrop per dag är oförändrat.
- **Säkerhet:** rubrikerna är text från okända webbplatser. Bara bokstäver
  och siffror tas ut (`extractKeywords`), och orden blir sökord till Tavily,
  aldrig instruktion. Bara grundarens egna omdömen och signaler i det
  aktiva projektet läses (filter i frågan, RLS som bindande spärr).
- **Tål att tabellen saknas:** utan `pulse_feedback` lärs ingenting och
  sidan fungerar som förut.

## Kunden i sökningen (Pulsen, 2026-10-02, gren `modul/pulsen-kund`)

Profilsamtalets "Vem tror du skulle köpa? En gissning räcker." (ingång B,
`profiles.customer_guess`, migreringen `20261002190000`) blir sökord. Då
kommer nyheter om dem som ska köpa, inte bara om produkten.

- **Orden:** högst tre ur gissningen (`customerTerms`), efter projektets egna
  ord. Bara bokstäver och siffror, inga vanliga nyhetsord, inga siffror och
  inga ord som redan söks. Grundarens text är data, aldrig instruktion.
- **Var:** båda sökningarna (nyheter och dagens tema) och relevansfiltret.
  En nyhet som bara nämner kunden släpps alltså igenom.
- **Räcker ensam:** gissningen gör att Pulsen söker även när projektets
  namn och ingress saknar användbara ord.
- **Tål att kolumnen saknas** (`42703`/`PGRST204`, migreringen inte körd):
  Pulsen söker som förut. Andra fel när profilen läses syns.
- **Ingen migrering.** Läses ur `profiles`, som grundaren redan får läsa
  (RLS: select egen).

## Bättre signaler för alla idéer (Pulsen, 2026-10-03, gren `modul/pulsen-kund`)

Efter den första riktiga genomklickningen (Laddkollen, 2026-10-03) kom
konkurrenters produktsidor, en engelsk rubrik, sajtnamn i rubrikerna och två
risker om samma sak. Rättat generellt, för alla idéer:

- **Bara nyheter:** båda sökningarna ber Tavily om `topic: "news"` från de
  senaste 30 dagarna (`NEWS_DAYS`). `lib/server/tavily.ts` fick två
  valfria fält, `topic` och `days`. Utan dem skickas exakt samma anrop som
  förut, så Utskick (`OutreachPrep`) påverkas inte.
- **Reserv:** ger nyhetssökningen noll träffar (smal bransch) blir dagens
  andra anrop en vanlig sökning på samma ord i stället för temat. Taket på
  två anrop per dag håller.
- **Rena rubriker:** sajtnamnet i slutet ("| Sveriges Riksbank", "- SBAB")
  tas bort när det matchar källans domän (`stripSiteSuffix`). Ett led som
  inte är källan står kvar.
- **Bara svenska:** en rubrik utan å, ä och ö med minst två engelska småord,
  och fler engelska än svenska, sparas inte och visas inte
  (`isSwedishHeadline`).
- **Samma nyhet en gång:** rubriker där minst 75 % av den kortares ord finns
  i den andra visas en gång (`isNearDuplicate`, böjningar och
  sammansättningar räknas).
- **En per område:** högst en risk per riskområde och en möjlighet per sort.
- **Äldre rader** rensas på samma sätt vid läsning, så inget behöver
  migreras.
- **Inte gjort:** en artikel utan publiceringsdatum får fortfarande
  hämtdagen som datum. Att skilja dem åt kräver en kolumn (migrering).
  Nyhetsläget ger datum på nästan alla träffar.

## Personlig spelbok (Pulsen, 2026-10-03, gren `modul/pulsen-spelbok`)

Efter Brunos genomklickning: spelboken var samma lista för alla. Tre tillägg,
beslut i `docs/beslut.md` (2026-10-03):

- **Det du har berättat** (`app/(app)/app/pulsen/personal.ts`): överst i
  spelboken. Risker får idé, tid, pengar och vad grundaren kan riskera.
  Möjligheter får idé, om steget "Det formella" är klart, tid och pengar.
  Ingen modell, bara grundarens egen text ur projektet och Profilen och läget
  i Resan. En rad med en siffra får källan "Din uppgift". Saknas allt ser
  spelboken ut som förut.
- **Gå igenom det här med Medgrundaren**: länk till
  `/app/medgrundaren?signal=<id>`. Frågan byggs på servern
  (`app/(app)/app/medgrundaren/signalDraft.ts`) och förifylls i fältet.
- **Lägg till stegen i min plan**: spelbokens steg blir uppgifter i Resan,
  se `docs/moduler/min-plan.md`. Knappen visas bara när `plan_items` finns.

## Acceptanskriterier

- `search(query)` returnerar en lista där varje resultat har `title`, `url`
  och `fetchedAtIso` ifyllda; tomt resultat ger `[]`, aldrig ett kastat fel.
- `getTodaysSignal`/`getSignals` har alltid `source.namn` och
  `source.hämtad` ifyllda — inget påstående utan källa.
- `getSignals` returnerar 3–5 signaler (avsnitt 9.5), nyast först, utom när
  grundaren har gillat signaler: då det som liknar dem först ("Inlärning ur Relevant").
- Klarar kontraktstesterna i `ports/ResearchProvider.contract.test.ts` och
  `ports/PulseProvider.contract.test.ts`.

## Säkerhet

`TAVILY_API_KEY` bara i serverkod (`lib/server/tavily.ts`, `import
"server-only"`), aldrig `NEXT_PUBLIC_`-prefix. Sökfrågor kan innehålla
grundarens egna ord (t.ex. idébeskrivningen) — det är fortfarande data till
Tavily, inte en instruktion, men undvik att skicka mer av grundarens
råtext än nödvändigt i en extern sökfråga. Hämtat webbinnehåll valideras
(minst: giltig URL, rimlig längd) innan det sparas som en `Källa` eller
visas för användaren.

## Status

- **Pulsen: live** (2026-09-25, gren `modul/pulsen`). Se "Hur liveadaptern
  fungerar i dag (Pulsen)" ovan. Används av `/app` (Hem) och `/app/pulsen`.
  Risksignaler sedan 2026-10-02, se "Risksignaler".
- **Webbresearch: stub.** `adapters/live/ResearchProvider.ts` kastar
  `NotImplementedError`, med hänvisning hit. Den behöver en
  cachningsstrategi innan den anropar Tavily på riktigt.

Demoadaptrarna är klara. Pulsen används av `/demo` och
`/demo/pulsen`, Webbresearch av ingen skärm än.

Kända begränsningar (Pulsen):
- "Bransch" härleds ur idéns ord. Det finns ingen riktig branschkolumn, så
  en kort eller vag enradsbeskrivning ger få eller irrelevanta träffar.
- Nyckelordsfiltret är enkelt (delsträng plus böjningsändelser), ingen
  semantisk bedömning.
- "Varför det spelar roll" är samma mall för alla signaler, inte
  skräddarsydd per nyhet.
- Tidsgränserna räknas från serverns klocka mot databasens tidsstämplar.
