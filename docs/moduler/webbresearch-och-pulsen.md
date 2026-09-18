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
  `lib/server/tavily.ts` (skelett, se nedan; ingen riktig sökrutin än).
  Samma mönster som `lib/server/gemini.ts`: tunn klient, ingen domänlogik.
- **Kostnad per sökning.** Pulsen är tänkt att köras dagligen per grundare
  (avsnitt 1.4) — utan cachning/kvot blir det en sökning per grundare per
  dag minst, troligen fler för Webbresearch. Bestäm en cachningsstrategi
  (t.ex. en delad daglig sökning per kundsegment i stället för per
  grundare) innan bygget, inte efteråt.
- **Varje signal/resultat måste bära källa + tidpunkt** — ett Tavily-svar
  utan en användbar `url`/publiceringsdatum får inte bli en `PulseSignal`
  eller ett `ResearchResult` utan att först kompletteras eller kasseras.
- Hämtat webbinnehåll (sökresultatens text) är **data, aldrig instruktion**
  — om det någonsin skickas vidare till Gemini (t.ex. för att formulera
  `whyItMatters`) gäller samma princip som i Juridisk koll: modellen får
  formulera text, den får aldrig hitta på en egen källa.

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

stub — `adapters/live/ResearchProvider.ts` och `adapters/live/PulseProvider.ts`
kastar båda `NotImplementedError`, med hänvisning hit. Demoadaptrarna är
klara; Pulsen används av `/demo/app` och `/demo/app/pulsen`, Webbresearch av
ingen skärm än. `lib/server/tavily.ts` finns som skelett (ingen riktig
sökning) — bygg cachningsstrategin innan liveadaptrarna anropar Tavily på
riktigt.
