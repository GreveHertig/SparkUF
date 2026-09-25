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

## Acceptanskriterier

- `search(query)` returnerar en lista där varje resultat har `title`, `url`
  och `fetchedAtIso` ifyllda; tomt resultat ger `[]`, aldrig ett kastat fel.
- `getTodaysSignal`/`getSignals` har alltid `source.namn` och
  `source.hämtad` ifyllda — inget påstående utan källa.
- `getSignals` returnerar 3–5 signaler (avsnitt 9.5), nyast först.
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
  fungerar i dag (Pulsen)" ovan. Används av `/app` (Hem).
- **Webbresearch: stub.** `adapters/live/ResearchProvider.ts` kastar
  `NotImplementedError`, med hänvisning hit. Den behöver en
  cachningsstrategi innan den anropar Tavily på riktigt.

Demoadaptrarna är klara. Pulsen används av `/demo/app` och
`/demo/app/pulsen`, Webbresearch av ingen skärm än.

Kända begränsningar (Pulsen):
- "Bransch" härleds ur idéns ord. Det finns ingen riktig branschkolumn, så
  en kort eller vag enradsbeskrivning ger få eller irrelevanta träffar.
- Nyckelordsfiltret är enkelt (delsträng plus böjningsändelser), ingen
  semantisk bedömning.
- "Varför det spelar roll" är samma mall för alla signaler, inte
  skräddarsydd per nyhet.
- Tidsgränserna räknas från serverns klocka mot databasens tidsstämplar.
