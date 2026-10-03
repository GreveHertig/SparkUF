## PR 9: Resan och steget (2026-09-30, direkt på `design/en-design`)
Nionde steget i `docs/plan-en-design.md`. `origin/prototyp` hade inget nytt att ta in (redan sammanslagen). Tre commits: flytten och `JourneyStepper` (`b59aeaf`), medianomsättningen (`49e87f0`, egen commit så att textändringarna kan granskas för sig) och docs.

### Klart
- **`screens/Journey.tsx`** och **`screens/JourneyStep.tsx`** är omskrivna. De gamla Tailwind-skärmarna (oanvända sedan #25) är ersatta av markupen från `app/demo/(app)/resan/page.tsx` och `…/resan/[steg]/page.tsx`, flyttad rakt av. Demots två sidor är tunna hämtare utan markup; `notFound()` för ett ogiltigt steg stannar i demots sida (det är hämtlogik).
- **Props:** `Journey({ data: { steps: JourneyStepView[] | null }, basePath })` och `JourneyStep({ data: JourneyStepDetail | null, stepNumber, journeyHref, verdictMissing? })`. Bara strängar, så att `/app`-rutterna (Server Components) kan skicka dem.
- **Platshållare per sektion:**
  - Resan: `steps: null` ger "Kommer snart" i stegraden och faserna, och rubriken blir "Resan".
  - Steget: `data: null` (platshållarfel) behåller tillbakalänken, visar "Steg 0N" som rubrik och "Kommer snart" i innehållet.
  - Ett olåst steg utan text i `why` visar "Kommer snart" i den rutan (ny gren; demot har alltid text, bevisat av ett test över alla moment för Sara och Jonas på båda språken).
  - `verdictMissing` ger "Kommer snart" i domens ruta. Rutten sätter den bara för steg 06 när steget är olåst och domen saknas (samma som `/app/validering`). Övriga tomma sektioner döljs som i demot.
- **Nya rutter** `/app/resan` och `/app/resan/[steg]` med `liveJourneyRepository` (`getSteps`, `getStepDetail`), fångade med `orNull`; äkta fel kastas vidare. Steget vitlistas (`/^\d{1,2}$/` och `JOURNEY_STEP_META`), allt annat ger 404 utan anrop. Låst läge kommer ur adapterns egen status.
- **`/app` Hem** skickar `journeyBasePath="/app/resan"`: de tolv stegen länkar nu till sidor som finns.
- **`JourneyStepper` finns i ett enda exemplar**, `screens/blocks/JourneyStepper.tsx` (`basePath: string | null`). Kopiorna i `app/demo/_components/DemoBlocks.tsx` och `screens/AppHome.tsx` är borta. **Kontrollerat med grep att inga dubbletter från PR 3 finns kvar:** `JourneyStepper`, `StepContent`, `ScoreFigure`, `ScoreDelta`, `levelTone` och `formatDelta` är definierade en gång var i `screens/`, `app/` (utom demots) och `components/`. Den enda andra `levelTone` ligger i `app/(marketing)/_components/ScoreProof.tsx` och kommer från #25, inte PR 3 (se kända problem).
- **`journeyStatusToneClasses`** flyttad från gamla `screens/Journey.tsx` in i `components/spark/JourneyRail.tsx`, dess enda användare (komponenten själv är oanvänd, PR 11).
- **Medianomsättningen** (egen commit): demodatan bär inget räkenskapsår, så siffran togs bort i stället för att ett år hittades på. Se listan nedan.
- **Tester:** `screens/Journey.test.tsx` (5), `screens/JourneyStep.test.tsx` (9), `screens/blocks/JourneyStepper.test.tsx` (2), `app/(app)/app/resan/page.test.tsx` (4), `app/(app)/app/resan/[steg]/page.test.tsx` (14), tre nya i `app/demo/demo.test.tsx` (Resan, steget, inget olåst steg utan text), `app/(app)/app/page.test.tsx` (Hem länkar till `/app/resan/1`). I `e2e/app.spec.ts`: `/app/resan`, `/app/resan/1` och `/app/resan/12` i `PAGES`, plus "stegen i Hem och Resan länkar till sidor som finns" och "ett ogiltigt steg ger 404".
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px; beat 0, 9, 17, 25, 37 och Jonas; `/demo`, `/demo/resan` och stegen 1, 3, 6, 7 och 12; 84 par plus landningssidan):
  - Efter flytten (del 1–2): alla 84 pixel för pixel identiska med före (AE 0).
  - Efter del 3: `/demo` och `/demo/resan` fortfarande identiska i alla lägen. Skiljer sig gör bara steg 03 (från beat 9: punkten "Medianomsättning 4,2 Mkr." borta), steg 07 (från beat 25: "medianomsättning 4,2 Mkr," borta ur punkt 1) och landningssidan (registerkortet: "—" i stället för "4,2 Mkr", underlagstexten en rad kortare, så sidan är 22 px lägre på 1440).
  - **Rundturens stopp går inte att jämföra pixel för pixel:** två bilder av samma bygge skiljer sig (animerad bakgrund bakom kortet). Texten är jämförd i stället: "312 byråer, 4,2 Mkr i medianomsättning, 18 % tillväxt — …" blev "312 byråer, 18 % tillväxt — …".
- **Inloggat:** testkontot står på steg 01. `/app/resan` visar "Om dig" som aktuellt och resten låst; `/app/resan/1` visar "Kommer snart" i "Vad som återstår" (inget innehåll i `journey_steps`); `/app/resan/12` visar "Låses upp efter steg 11".
- **`/security-review`:** inga fynd. Kontrollerat: rutterna ligger under `requireUser()`, adaptern tar användaren ur sessionen (inget från klienten når frågan), `steg` vitlistas innan adaptern anropas, inga feltexter i props, inga funktioner som props, inget renderas som HTML, demot importerar ingen liveadapter, inga nya `NEXT_PUBLIC_`-variabler.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (762 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (28 av 28 mot produktionsbygget).

### Medianomsättningen: var siffran stod utan år, och vad som gjordes
| Ställe | Före | Efter |
|---|---|---|
| Rundturen, stopp 6 (`adapters/demo/tourSteps.ts`) | "312 byråer, 4,2 Mkr i medianomsättning, 18 % tillväxt — …" | "312 byråer, 18 % tillväxt — …" |
| Medgrundarens manus, steg 03 (`cofounderScript.ts`) | "… anställda. Medianomsättning 4,2 Mkr. 18 % växte …" | "… anställda. 18 % växte …" |
| Saras steg 03 (`sara.ts`, höjdpunkter) | punkten "Medianomsättning 4,2 Mkr." | borttagen |
| Saras steg 07 (`sara.ts`, höjdpunkter) | "1. Vad kunderna tål: medianomsättning 4,2 Mkr, byråer med 10+ …" | "1. Vad kunderna tål: byråer med 10+ …" |
| Affärsplanen (`adapters/demo/businessPlan.ts`) | påståendet "Medianomsättning" med värdet 4200; underlaget "194/171/308" | påståendet borttaget; underlaget "171/308" (tillväxt/region) |
| Landningssidan (`app/(marketing)/page.tsx`) | "Median omsättning 4,2 Mkr"; "Omsättning räknas på 194 och tillväxt på 171 av 312 bolag …" | "—" med `common.fiscalYearMissing` för skärmläsare; "Tillväxten räknas på 171 av 312 bolag …" (sv/en) |

Engelska texterna ändrades likadant. Inget ställe fick ett år, eftersom inget år finns i datan.

### Vad som inte var en ren flytt (innehållsbeslut)
- **"Kommer snart" för ett olåst steg utan text** och **domens ruta i steg 06** i `/app` (se ovan). I demot händer ingetdera.
- **Stegets rubrik utan data** är "Steg 0N", eftersom titeln kommer ur samma anrop.
- **Medianen i affärsplanen** är borttagen som påstående, inte ersatt med en lucka; underlaget anger bara de två siffror som visas.
- **Landningssidans median** visar luckan "—" med förklaringen bara för skärmläsare (samma mönster som Marknads tabell), eftersom kortets tre nyckeltal inte har plats för en synlig förklaring.
- **Lämnat orört, med motivering:** `i18n/sv.ts`/`en.ts` rad 100 ("till exempel 4,2 Mkr eller 312 företag") är ett typsnittsexempel på `/designsystem`, inget påstående om marknaden. "3–15 Mkr i omsättning" i Saras steg 04 är ett urvalskriterium, ingen registersiffra. "Median 900 kr" kommer ur enkätsvaren, inte ur registret.
- **`journeyStepPath`** i `app/demo/_lib/paths.ts` används inte längre. Lämnad (städas i PR 11).

### Beslut nästa session behöver känna till
- **Props:** se "Klart". `AppHome` tar fortfarande `journeyBasePath` och skickar det vidare som `basePath`.
- **När Resans liveadapter ger dom, poängändring och upplåsta delar** visas de utan ändring i skärmen; `verdictMissing` blir då falsk av sig själv.
- **Flikarna i `/app` är fortfarande inerta**: Pulsen, Medgrundaren, Bygg och Affärsplanen saknas.

### Kända problem / docs som inte stämmer
- **"Aktuell · Efter" på ett aktuellt steg i `/app`.** Liveadaptern sätter alltid `momentKind: "after"` (kommentar i `adapters/live/JourneyRepository.ts`), så skärmen visar "Steg 01 · Aktuell · Efter". Det är adapterns värde, inte rört här (någon annans adapter). Resans ägare bör sätta "before" för ett aktuellt steg utan innehåll, eller porten bör tillåta att momentet saknas.
- **Planen sade "liveadaptern stubbe"** för PR 9. `getSteps` och `getStepDetail` är byggda; bara `getHomeSummary` är en stubbe. Rättat i planen.
- **`levelTone` finns två gånger**: `screens/blocks/ScoreFigure.tsx` och `app/(marketing)/_components/ScoreProof.tsx` (landningssidan, #25). Inte en PR 3-dubblett; landningssidan hör till `prototyp-landning`.
- **Landningssidan** hör enligt `CLAUDE.md` till grenen `prototyp-landning`, men medianen ändrades här på uppdrag, i den egna commiten `49e87f0`.
