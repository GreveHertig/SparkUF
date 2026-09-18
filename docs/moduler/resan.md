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
  14.2: "core/ … resans upplåsning … delas av båda lägena"). `core/journey.ts`
  (Session P1) äger nu `deriveStepStatus`/`deriveCurrentStepNumber` för
  liveadaptern. **Avsteg, medvetet:** `adapters/demo/JourneyRepository.ts`s
  egen lokala `statusFor` rördes INTE i P1 (uttrycklig instruktion från
  grundaren: rör inte demot den sessionen) — reglerna är alltså i dag
  DUPLICERADE mellan `core/journey.ts` och demoadaptern, inte delade. En
  framtida session kan slå ihop dem genom att låta demoadaptern importera
  `core/journey.ts` i stället — inte gjort här.
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

påbörjad (Session P1, branch `plattform-p1-adaptrar`, byggd efter Evidens
och poäng i samma session) — `getSteps`/`getStepDetail` är klara och
testade mot Supabase. `getHomeSummary` är MEDVETET kvar som
`NotImplementedError`: `JourneySummary.sinceLastTime` är obligatorisk och
kräver riktiga utskicksdata (Utskick och svar, inte byggd i P1), och
"opened" som mätvärde är redan flaggat som en olöst GDPR-fråga i
`docs/moduler/utskick-och-svar.md` — den här sessionen gissar inte en
tolkning (`ports/stubStatus.test.ts`s `PARTIELLA_STUBBAR`).

### Hur liveadaptern fungerar i dag

`adapters/live/JourneyRepository.ts` flyttade upplåsningslogiken till
`core/journey.ts` (`deriveStepStatus`/`deriveCurrentStepNumber`/
`JOURNEY_STEP_META`) precis som den här filen alltid bett om — **med ett
uttryckligt undantag**: `adapters/demo/JourneyRepository.ts`s lokala
`statusFor` rördes INTE (grundaren bad uttryckligen att demot inte skulle
röras i P1), så reglerna är i dag medvetet duplicerade mellan `core/journey.ts`
och demoadaptern i stället för delade. De 12 stegens titel/ingress ligger i
en ny i18n-nyckel (`journeySteps`), inte hårdkodade i adaptern. `getSteps`
och `getStepDetail` fungerar för ett konto helt utan projekt (steg 1
"current", resten låsta) — inget `EmptyStateError` behövs för dem.
