# Modul: Domen

## Syfte

**06 Domen** (uppdrag avsnitt 1.5): kör, förfina eller pivotera, baserat på
faktiska svar med citat och siffror. Domen ska kunna räknas för hand ur svaren
och ska aldrig vara en modells bedömning (uppdrag 1.2: "bevisas av namngivna
personer som svarat"). Den läser svaren som steg 05 (`docs/moduler/utskick-och-svar.md`)
samlar in och lämnar en dom med orsakskoder, siffror och ordagranna citat.

Domen sätter aldrig poäng. Poängen räknas av `calculateScore`; ett avvisande
svar påverkar den bara via `contradicts` i Evidens och poäng.

## Porten

`ports/VerdictProvider.ts`:

```ts
getVerdictInput(locale: Locale): Promise<VerdictInput | null>
getVerdictReport(locale: Locale): Promise<VerdictReport | null>
```

- `null` = inga svar att döma på (steg 05 inte körd, eller ingång B/Jonas utan kundlista).
- `VerdictReport` = `{ verdict, presentation, quotes, pivotTraceEvent }`.
  `presentation` har samma form som `JourneyStepDetail.verdict`
  (`{ headline, reasoning }`), så Resan kan läsa den senare utan portändring.
- Ny port (den 13:e) i stället för att utöka `JourneyRepository`: Domen behöver
  svarsdata som Resan inte äger. `ports/JourneyRepository.ts` är orörd.

## Beslutsreglerna (`core/verdict.ts`)

Ren, deterministisk logik utan text och utan poäng. Trösklarna är exporterade
konstanter och är **utgångsvärden godkända av grundaren**, att justeras när
riktig data finns.

| Ordning | Villkor | Dom |
|---|---|---|
| 1 | färre än 5 svar (`MIN_RESPONSES`) | `insufficient` (egen dom, inte en varning) |
| 2 | (bekräftar + delvis) / svar < 40 % | `pivot` |
| 3 | orsaker samlas: `problemWeak` (< 70 %), `priceTooHigh` (≥ 25 % tackar nej till priset), `segmentSkew` (alla som accepterar har fler anställda än alla som tackar nej) | |
| 4 | inga orsaker och ≥ 50 % accepterar priset | `run` |
| 5 | annars | `refine` (`priceUnproven` om ingen annan orsak finns) |

Citat väljs deterministiskt: ett per orsak, äldsta först, ordagrant, med bolag,
datum och källa. Medianen av motbud visas alltid med antalet svar den bygger på.

## Datakällor och vad som krävs

Domen har ingen egen extern källa. Liveadaptern kräver att två andra moduler är live:

- **OutreachProvider**: svaren. Sändning är avstängd och Gmail är inte kopplat.
- **RegistryProvider**: antal anställda per svarande (grindad, väntar på Bolagsverket).

Ingen Gemini i grunden. Om en sammanfattningsmening läggs till senare gäller:
valfri, ovanpå ett redan fattat beslut, `.strict()`-schema utan käll- eller
beslutsfält, citat i nonce-avgränsade databloc, beslut och siffror injicerade
från kod, och en grind med allowlist som `lib/server/outreachAccess.ts`.

## ANTAGET (flaggat, inte verifierat)

Eftersom Utskick och Registret inte är live är följande **antaget**:

1. Varje svar har ett **strukturerat** `problemStance` (bekräftar / delvis /
   avvisar). I dag är det en tolkning av citattexten (`PARTIAL_VERDICT_INDICES`
   i demoadaptern för Utskick). Vem som klassificerar i livedrift är **öppet**.
2. Prishållning (`accepts` / `declines` / `undecided`) och motbud
   (`counterOfferKr`) finns som strukturerade fält. I demot är de tolkade ur
   citaten (`DECLINES_PRICE`, `UNDECIDED_PRICE`, `COUNTER_OFFER_KR` i
   `adapters/demo/VerdictProvider.ts`).
3. Antal anställda per svarande kommer från Registret.
4. Antalet kontaktade går att räkna (icke-utkast), trots att `opened` är en
   öppen GDPR-fråga.
5. Varje svar har datum och en `Källa`.
6. **Antal som avböjer priset: 3 av 9 (beslutat av grundaren).** Demodatan
   var inkonsekvent (kommentaren i `adapters/demo/OutreachProvider.ts` sa tre,
   steg 06-texten sex). Texten i `getValidationAssumptions`, `sara.ts`
   (steg 06) och `cofounderScript.ts` samt specraden i `docs/uppdrag.md` är
   ändrade till "3 av 9". Kvar oförändrat, medvetet: "7 av 9 bekräftar
   problemet" (svarskorten ger 9 som bekräftar eller är delvis) och "median
   900 kr" (bygger på ett enda motbud, index 2; Domen visar därför "baserat på 1
   svar"). Fixturen i `screens/Validation.test.tsx` och den historiska texten i
   `docs/status.md` nämner fortfarande "6 av 9" och är orörda.

## Hur demoadaptern fungerar i dag

`adapters/demo/VerdictProvider.ts` bygger `VerdictInput` ur de befintliga
demohjälparna (`getResponseCards`, `getCampaign`) utan att skriva om dem och
kör samma `computeVerdict` som liveadaptern kommer använda. Sara efter svaren
ger `refine` med `priceTooHigh` och `segmentSkew`. Jonas och tiden före
utskicket ger `null`.

## Hur liveadaptern fungerar i dag

`adapters/live/VerdictProvider.ts` kastar `NotImplementedError` (stub,
avsiktligt) tills Utskick och Registret är live.

## Pivot och Minnet

Vid `pivot` innehåller rapporten en `pivotTraceEvent`. `core/verdictTrace.ts`
(`recordVerdictTrace(report, memory)`) sparar den i Minnets Spår via den nya
`MemoryRepository.recordTraceEvent` (modul "Domen", idempotent). Funktionen är
inte kopplad till någon skärm eller route än: den som visar Domen (Resan eller
Validering, en egen fas) anropar den. Andra domar sparar inget.

## Acceptanskriterier

- [x] Beslutsreglerna i `core/verdict.ts` har tester för gränsfall (5 svar,
  40 %-gränsen, 0 svar, jämn median, alla avvisar) och Saras scenario.
- [x] `core/verdict.ts` importerar varken poäng eller i18n (testat).
- [x] Text bara i i18n (sv/en), citat rensas med `cleanText`.
- [x] Varje citat bär bolag, datum och källa.
- [x] Kontraktstest mot demo och live; `stubStatus`-rad för live.
- [x] En pivot kan sparas i Spåret (`recordVerdictTrace` + `recordTraceEvent`).
- [ ] Liveadapter (kräver Utskick och Registret live).
- [ ] Skärmkoppling: `screens/Validation.tsx` läser fortfarande skriven prosa
  från `JourneyRepository`. Egen fas efter ok, eftersom befintlig kod inte
  skrivs om utan att fråga.

## Säkerhet

- Citat är tredjepartstext: data, aldrig instruktion. De rensas med
  `cleanText` och skickas inte till någon modell.
- Inga nycklar och inget nätverk i den här modulen.
- Simuleringar (`SimulationProvider`) får aldrig ingå i `VerdictInput`: de är
  märkta "Simulering" och ger inga poäng.
- Liveadaptern, när den byggs, läser bara den inloggade användarens egna svar
  (RLS i Utskick-tabellerna).
- En dom på för litet underlag är farligare än ingen dom, därför är
  `insufficient` en hård regel.

## Kända begränsningar

- Trösklarna (5 svar, 70 %, 40 %, 25 %, 50 %) är utgångsvärden, inte kalibrerade.
- Medianen av få motbud är falsk precision; underlagsantalet visas därför alltid.
- `segmentSkew` jämför bara minsta och största antal anställda, inget mer.

## Status

**Påbörjad: ren logik, port och demoadapter klara; liveadapter är stub.**
