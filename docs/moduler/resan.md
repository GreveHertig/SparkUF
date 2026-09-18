# Modul: Resan

## Syfte

Kärnfunktionen "Nästa steg" (uppdrag avsnitt 1.4, punkt 3) och de 12 stegen i
4 faser (avsnitt 1.5). Visar var grundaren är, vad som hänt sedan sist och
ett enda handlingssteg — och håller resten av resan låst tills det steget är
klart, så att grundaren inte kan hoppa till bygget innan valideringen är
gjord. Används av Hem (`getHomeSummary`), `/app/resan` (`getSteps`) och
`/app/resan/[steg]` (`getStepDetail`).

## Porten

`ports/JourneyRepository.ts`:

```ts
getHomeSummary(locale: Locale): Promise<JourneySummary>
getSteps(locale: Locale): Promise<JourneyStepView[]>
getStepDetail(stepNumber: number, locale: Locale): Promise<JourneyStepDetail | null>
```

- `JourneySummary`: `{ todayIso, nextStep: NextStep, sinceLastTime:
  SinceLastTime }`.
- `JourneyStepView`: `{ stepNumber, journeyPhase, title, oneLiner,
  maxPoints, status: "done" | "current" | "locked" }`.
- `JourneyStepDetail`: `JourneyStepView & { why, doneItems, highlights,
  actionLabel }` — tomma strängar/listor för ett steg som ännu inte har
  någon data (se `status`).

`NextStep`/`SinceLastTime` (`core/domain.ts`) är delade typer — samma form
oavsett om Hem hämtar dem via `JourneyRepository` eller (indirekt) via
Evidens och poäng.

## Datakällor och vad som krävs

- **Supabase**, tabell `journey_steps` (uppdrag 14.4) — grundarens framsteg
  per steg (klar/aktuell/låst, tidsstämplar). De 12 stegens metadata
  (titel, fas, `maxPoints`) är produktkonstanter, inte databasrader — de kan
  ligga som kod (jfr `adapters/demo/sara.ts`s `SARA_STEPS`) snarare än en
  tabell, ett beslut liveadaptersessionen tar.
- **Upplåsningslogiken hör hemma i `core/`, inte i adaptern** (uppdrag
  14.2: "core/ … resans upplåsning … delas av båda lägena"). Adaptern
  hämtar rådata (vilket steg är senast avklarat) och en delad funktion i
  `core/` räknar ut `done`/`current`/`locked` — duplicera inte den logiken
  i både demo- och liveadaptern. I dag ligger motsvarande `statusFor`-logik
  lokalt i `adapters/demo/JourneyRepository.ts`; flytta den till `core/`
  samtidigt som liveadaptern byggs, så båda delar samma regel.
- Ingen extern tjänst.

## Hur demoadaptern fungerar i dag

`adapters/demo/JourneyRepository.ts` läser `beatIndex` ur `useDemoStore`
(Zustand, utanför React) och härleder allt ur `adapters/demo/sara.ts`:

- `getCurrentStepNumberFor(beatIndex)` ger aktuellt stegnummer; en lokal
  `statusFor` jämför varje steg i `SARA_STEPS` (den kanoniska 12-stegslistan)
  mot det för att sätta `done`/`current`/`locked`.
- `getStepDetail` slår upp senaste `beat` för steget
  (`findLatestBeatForStep`) och fyller `why`/`doneItems`/`highlights`/
  `actionLabel` ur beatens `nextStep`/`highlights`; ett okänt stegnummer ger
  `null`, ett steg utan beat än ger tomma strängar/listor (status `locked`
  eller `current` utan innehåll).
- `getHomeSummary` delegerar till `getJourneySummaryForBeat` i `sara.ts`.

## Acceptanskriterier

- `getSteps` returnerar exakt de 12 stegen i uppdrag 1.5, i ordning
  (stegnummer 1–12).
- Högst ett steg har status `current` åt gången; inget steg efter ett
  `locked` steg är `done`.
- `getStepDetail` på ett okänt stegnummer ger `null`, aldrig ett kastat fel.
- `getHomeSummary` har alltid ett `nextStep` med ifylld titel och
  `maxPoints > 0`.
- Klarar kontraktstestet i `ports/JourneyRepository.contract.test.ts`.

## Säkerhet

RLS på `journey_steps`, policy begränsad till ägarens `user_id`/`project_id`.
Ingen extern nyckel. Fritext i `why`/`highlights` som eventuellt genereras av
Medgrundaren är då text som redan validerats av den modulen (`docs/moduler/medgrundaren.md`)
— den här porten lagrar/serverar den, genererar den inte.

## Status

stub — `adapters/live/JourneyRepository.ts` kastar `NotImplementedError` för
alla tre metoderna. Demoadaptern är klar och används av alla `/demo/app`-sidor
som visar resan. Bygg efter Evidens och poäng (`docs/moduler/evidens-och-poang.md`)
eftersom upplåsningen i praktiken beror på poängen — avgör ordningen med
grundaren om de två byggs i samma session eller separat.
