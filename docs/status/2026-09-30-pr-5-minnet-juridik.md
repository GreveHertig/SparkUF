## PR 5: Minnet + Juridik (2026-09-30, direkt på `design/en-design`)
Femte steget i `docs/plan-en-design.md`. `origin/prototyp` hade inget nytt att ta in. Tre commits: flytten (`f41bc39`), märkningen av overifierade källor (`56f7d72`, egen commit så att den kan backas separat) och docs.

### Klart
- **`screens/Memory.tsx`** och **`screens/Legal.tsx`** skrivna om: de gamla Tailwind-skärmarna (oanvända sedan #25) ersatta av markupen från `app/demo/(app)/minnet/page.tsx` och `…/juridik/page.tsx`, flyttad rakt av. Demots två sidor är tunna hämtare utan markup.
- **`PageHead`, `Locked` och `Pill`** flyttade från `app/demo/_components/DemoBlocks.tsx` till `screens/blocks/PageBlocks.tsx` (skärmarna får inte importera från `app/`). `DemoBlocks.tsx` exporterar dem vidare, så demots övriga sidor är orörda; de pekas om när de flyttas.
- **`MemoryData = { profile; brainNotes; trace }`**, alla nullbara var för sig (platshållare per sektion). Utan profil blir rubriken "Minnet" och bara Profilen-fliken visar `ComingSoon`. Hjärnan sparas via en prop, `onSaveBrainNotes`; ett misslyckat sparande visar "Anteckningarna kunde inte sparas" (`role="alert"`).
- **`LegalData = { krav }`** (nullbar), **`locked: { unlocksAfterStep } | "notInScenario" | null`** och en valfri **`bolagsformPicker`**. Demots sida räknar ut låsningen som förut (tom karta = låst till steg 04, eller "inte i scenariot" för Jonas). Ansvarsbegränsningen visas alltid när kartan visas.
- **Ny rutt `/app/minnet`:** `liveMemoryRepository`, tre anrop fångade var för sig. Hjärnan sparas med en Server Action (`app/(app)/app/minnet/actions.ts`) som bara tar emot en sträng; användaren tas ur sessionen i adaptern och RLS på `brain_notes` är spärren.
- **Ny rutt `/app/juridik`:** användaren väljer bolagsform (`?bolagsform=…`, fyra länkar i en segmenterad kontroll, bara i `/app`). Värdet vitlistas i rutten; utan giltigt val anropas inte `liveLegalAdvisor` (och inte Gemini). `LegalAdvisorError` kastas vidare som ett äkta fel.
- **Ingen källa visas som verifierad** (egen commit): varje krav visar källa och datum (`SourceTag`) och en streckad märkning "Overifierad"; kartans rubrikrad säger "Ingenting här är granskat av en jurist. Varje källa är overifierad tills den är det." Saknas källnamn eller datum visas "Källa saknas" i stället för en tagg. Gäller både `/demo` och `/app`.
- **`orNull`** delad i `app/(app)/app/_lib/orNull.ts` (Poäng, Minnet, Juridik); Poängs lokala kopia borttagen.
- **Nya i18n-nycklar** (sv/en): `memoryPage.brainHintLive`, `brainSaveFailed`; `legalPage.unverifiedSource`, `notReviewedNote`, `sourceMissing`, `empty`, `bolagsformPickerLabel`, `bolagsformPrompt`.
- **Tester:** `screens/Memory.test.tsx` (6), `screens/Legal.test.tsx` (8), `app/(app)/app/minnet/page.test.tsx` (3 rutt + 3 för Server Action), `app/(app)/app/juridik/page.test.tsx` (5), tre nya/utökade i `app/demo/demo.test.tsx`.
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px, beat 0/8/12 och Jonas, Minnet med alla tre flikar): efter flytten alla 32 pixel för pixel identiska med före (AE 0). Efter märkningen skiljer sig bara Juridik med karta (beat 12, båda bredderna) — märkningen och rubrikradens not; allt annat oförändrat.
- **Docs:** `CLAUDE.md` (undantaget för sidhuvudets poäng med motivering; grenregeln för `design/en-design`), `docs/uppdrag.md` (flikrad och textsiffra i stället för mörk sidomeny och `ScoreBadge` i sidhuvudet), `docs/plan-en-design.md` ("Nuläge" och tabellen efter PR 1–5), `DESIGN.md` (märkningen, valet av bolagsform, `PageBlocks`), `docs/moduler/juridisk-koll.md` (`/app/juridik` finns nu; felet får aldrig visas rakt av).
- **`/security-review`** av PR 5:s ändringar: inga fynd. Kontrollerat: Server Action utan session (adaptern kastar `NotAuthenticatedError` före skrivning), att skriva någon annans Hjärna (`user_id` bara ur sessionen, RLS med `with check`), vitlistningen av `bolagsform`, att källans URL kommer ur `KURERADE_KÄLLOR` och aldrig ur modellen, och att inget renderas som HTML.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (671 gröna, 35 skippade), `pnpm build`.

### Vad som inte var en ren flytt (innehållsbeslut)
- **Märkningen "Overifierad"** ändrar demots Juridik-sida. Ingen adapter skickar verifieringsstatus, så alla källor märks, även Bolagsverket, verksamt.se och BFN som en människa kontrollerat 2026-09-30. Beslut av grundaren: hellre för försiktigt än att något ser verifierat ut.
- **Val av bolagsform i `/app`** är nytt gränssnitt. Ingen port ger användarens bolagsform; att hårdkoda demots `enskild_firma` hade varit en påhittad uppgift. Beslut av grundaren.
- **Hjärnans ledtråd** nämner Sara; `/app` får en egen text ("Dina egna anteckningar…").
- **Tomläge i `/app/juridik`** ("Inga krav hittades för bolagsformen.") — i demot betyder en tom karta låst, i appen inte.
- **Inget låst läge i `/app/juridik`**: det ska komma ur Resans steg, och Resans liveadapter är en stubbe. Inget låsläge hittas på.
- **Spårets datum:** liveadaptern ger hela tidsstämplar; skärmen formaterar datumdelen (`slice(0, 10)`, UTC). `formatDate` hade annars kraschat — samma fel som PR 3 hittade.

### Beslut nästa session behöver känna till
- **`Memory`s props:** `{ data: MemoryData; dataKind; onSaveBrainNotes }`. **`Legal`s props:** `{ data: LegalData; locked: LegalLock; bolagsformPicker? }`.
- Skärmar tar bara serialiserbara props från `/app`-rutterna (eller Server Actions). `Legal` bygger valets länkar själv ur `basePath` i stället för att ta en funktion.
- **När en verifieringsstatus finns i datan** (t.ex. ett fält i `Källa` som Juridik-modulens ägare sätter i `legalSources.ts`) kan märkningen visas bara för de overifierade. Ändringen hör till Juridik-modulen, inte migrationen.
- **När Projekt eller Profil ger bolagsformen** kan `/app/juridik` förvälja den; valet kan stå kvar.

### Kända problem / docs som inte stämmer
- **Troligt fel i `/app` Hem (PR 3, inte rört här):** `app/(app)/app/page.tsx` skickar en funktion (`journeyStepHref`) från en Server Component till klientkomponenten `AppHome`. Next brukar vägra det vid rendering ("Functions cannot be passed directly to Client Components"). Rutttestet anropar sidan direkt och fångar det inte, och `/app` är inte fotograferat (inget testkonto). Bör kontrolleras och rättas i nästa session (t.ex. en `journeyStepBasePath`-sträng, samma mönster som `Legal`).
- **"Tre av åtta källor overifierade"** (status.md, modulsessionen 2026-09-17) är inaktuellt: i dag är tre av åtta myndigheter kontrollerade av en människa och fem bara maskinellt hämtade. Ingenting är juristgranskat.
- **Ett Gemini-anrop per sidladdning av `/app/juridik?bolagsform=…`** — ingen cache. Värt en dagscache som Pulsens om det blir dyrt.
- **Juridik är fortfarande bara på svenska** (`getLegalMap` tar inget `locale`, Oskars ärende).
- `/app/minnet` och `/app/juridik` är inte fotograferade (inget testkonto); täckta av rutttesterna.
