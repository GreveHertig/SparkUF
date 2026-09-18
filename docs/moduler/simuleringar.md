# Modul: Simuleringar

## Syfte

Hiasynths simuleringslager (uppdrag avsnitt 1.3, 2.2) — syntetiska
populationer ur europeisk data, ovanpå Registret, för avancerade
simuleringar av efterfrågan, priskänslighet och beteende. Används i steg
**03, 04, 06 och 07**. **Alltid koncept** — inget avtal finns, se de hårda
reglerna i uppdrag 2.2 nedan. Skiljer sig från alla andra moduler på ett
sätt som styr hela designen: **en simulering ger aldrig poäng** (avsnitt
7.4) och måste alltid visas märkt "Simulering" (`ConceptBadge`,
CLAUDE.md).

## Porten

`ports/SimulationProvider.ts`:

```ts
simulate(question: string, locale: Locale): Promise<Simulation>
```

`Simulation`: `{ question, populationSize, source: Källa, result,
uncertaintyRangeLabel }`.

## Datakällor och vad som krävs

- **Hiasynth — koncept, alltid stub.** Inget partnerskap finns (uppdrag
  2.2: "Inget avtal finns … Ingen text i prototypen får påstå att
  samarbetet finns"). Det här är den enda modulen där "liveadapter" aldrig
  betyder en riktig extern integration förrän ett faktiskt partnerskap
  ingås — till dess ska liveadaptern fortsätta kasta `NotImplementedError`
  även efter att alla andra moduler är klara.
- **Hårda regler (uppdrag 2.2), gäller båda adaptrarna:**
  - Alltid märkt och åtskild — egen visuell stil, etiketten "Simulering",
    blandas aldrig ihop med registerfakta.
  - Underlaget syns — populationsstorlek, källor, osäkerhetsintervall
    (`populationSize`, `source`, `uncertaintyRangeLabel` är alla
    obligatoriska i typen av just det skälet, inte valfria).
  - Ger aldrig poäng — `EvidenceRepository`/`calculateScore` får aldrig ta
    emot en `Simulation` som underlag för en `EvidenceItem`.
  - Märkt som koncept — "Koncept · partnerskap utforskas" på varje yta,
    aldrig ett påstående om att samarbetet finns.
- Inget API-nyckelbehov i dag eftersom ingen riktig integration är
  planerad förrän ett avtal finns.

## Hur demoadaptern fungerar i dag

`adapters/demo/SimulationProvider.ts`: två kanoniska svar
(`time`/`price`), valda på frågans innehåll med en enkel regex
(`/pris|price/i`). `time`: populationsstorlek 312, "~6,5 timmar per
anställd och månad går åt till att jaga kvitton …", intervall 4–9 timmar.
`price`: populationsstorlek 96, "1 000–1 300 kr/mån stöds av
priskänsligheten …", intervall 1 000–1 300 kr. Båda med `Källa` "Hiasynth
(koncept)"/"Hiasynth (concept)". Inte en riktig modell — bara två färdiga
svar ur Saras scenario (9.3 steg 03 och 06).

## Acceptanskriterier

- `simulate` returnerar alltid ett resultat med ifylld `source`,
  `populationSize > 0` och en icke-tom `uncertaintyRangeLabel` — aldrig ett
  påstående utan synligt underlag.
- `source.namn` innehåller alltid "koncept"/"concept" eller motsvarande
  markering — aldrig ett namn som antyder ett verkligt, ingått partnerskap.
- Resultatet av `simulate` når **aldrig** `EvidenceRepository` eller
  `calculateScore` som poänggivande underlag — det är ett UI/dataflödeskrav
  utöver själva porten, verifiera det där `Simulation` konsumeras, inte
  bara i adaptern.
- Klarar kontraktstestet i `ports/SimulationProvider.contract.test.ts`.

## Säkerhet

`question` är grundarens fria text — om liveadaptern någon gång skickar
den vidare till en modell (Hiasynth eller ett mellanled) är den data,
aldrig instruktion (avsnitt 14.6). Ingen Supabase-koppling krävs
nödvändigtvis (simuleringar kan vara stateless per fråga) — om resultat
cachas per projekt gäller RLS som för alla andra tabeller.

## Status

stub, **avsiktligt permanent tills ett Hiasynth-partnerskap ingås** —
skiljer sig från övriga stubbar i listan genom att den inte är blockerad
på kod eller ett vanligt dataavtal, utan på en affärsrelation som inte
finns. `adapters/live/SimulationProvider.ts` kastar `NotImplementedError`.
Demoadaptern är klar och används där Saras scenario visar en simulering
(steg 03, 06).
