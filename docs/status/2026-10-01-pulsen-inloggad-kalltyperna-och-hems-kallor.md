## Pulsen inloggad, källtyperna och Hems källor (2026-10-01, direkt på `design/en-design`)
`origin/prototyp` fanns redan i grenen. Tre commits: källtyperna, Hems källor (egen commit, så att den kan granskas och backas för sig) och docs.

### Del 1: `/app/pulsen` verifierad inloggad (ingen kodändring)
- **`pnpm test:e2e`:** 44 av 44 gröna mot produktionsbygget, både före och efter ändringarna. PR 6:s "e2e kördes inte" är därmed gjort.
- **`/app/pulsen` inloggad** (1440 och 390 px): rubriken "Pulsen", underrubriken och tomläget "Inga signaler för det här scenariot." Inga signaler och inga källor, eftersom testkontot saknar aktivt projekt. Status 200, inga konsolfel. Hem i `/app` visar "Ingen signal än."
- **Registertaggen, exakt var den sitter fel:** `screens/Pulse.tsx:60`, `<SourceTag source={signal.source} dataType={data.sourceDataType} />`. `/app/pulsen` (`app/(app)/app/pulsen/page.tsx`) skickar ingen `sourceDataType`, så `SourceTag` faller tillbaka på sin standard `"register"` (`components/ui/SourceTag.tsx`). En artikel från till exempel `breakit.se` får då klassen `bg-data-register-bg`, alltså registrets grå tagg. Det syns inte med testkontot, men bekräftades genom att rendera skärmen med en signal i liveadapterns form. **Rättningen för Bruno:** skicka `sourceDataType: "media"` från `/app/pulsen`-rutten (se `docs/beslut.md`, 2026-10-01). Skärmen behöver ingen ändring.
- **Tomtexten i `/app/pulsen`** säger "scenariot", som är demots ord (`pulsePage.emptyState`). Hem använder `homePage.noPulseSignal` ("Ingen signal än."). Inte rättat, eftersom det ligger i `Pulse.tsx` (Brunos).

### Klart
- **Källtyperna** (beslut av grundaren, `docs/beslut.md` 2026-10-01): `register`, `media` (ny, blå, etiketten "Media"), `customer`, `user` (ny, bär, etiketten "Din uppgift" / "Your input"), `simulation` och `example`. Bara registret är grått. Tonerna ligger i `design/tokens.css`, `app/globals.css` och `design/tokens.ts`, med uträknad kontrast 6,0:1 och 5,3:1. Etiketterna ligger i `common.mediaSourceLabel` och `userSourceLabel`, och `SourceTag` samlar alla etiketter på ett ställe. `/designsystem` visar de nya tonerna av sig själv.
- **Hem i demot:**
  - **Dagens signal** bar "Bolagsverket" och en påhittad relativ tid ("4 dagar sedan"). Nu bär den en exempelkälla för steget där signalen dyker upp (`getSignalSteps()`), och tiden visas inte (bugg 11, som Pulsen).
  - **"Sedan sist":** "40 mottagare" bar källan "Inget utskick ännu" i registergrått, öppningsgraden "Utskicket, steg 05" i registergrått och svaren "Kundsamtal, steg 05" som kunddata. Nu bär alla tre en exempelkälla för steget där siffran kommer ifrån, som läses ur scenariots källnamn. Mottagarna följer utskicket. Utan steg, före utskicket, gäller det aktuella steget.
  - **Handlingskortet** får en exempelkälla när rubriken, förklaringen eller "Redan klart" innehåller en siffra som inte är ett stegnummer. Det är PR 11:s regel, nu i `app/demo/_lib/figures.ts` och delad med Medgrundaren. Exempel: "7 av 9 bekräftar problemet …" och "5 betalande byråer".
  - Allt sker i demots rutt (`app/demo/(app)/page.tsx`), med samma mönster som Pulsen. `AppHome` fick två valfria fält: `sourceDataTypes` och `nextStepSource`.
- **Hem i `/app`:** Pulsens artikel visas som `"media"` (`sourceDataTypes: { pulse: "media" }`), aldrig som register eller exempel. Utan signal ser sidan ut som förut.
- **CLAUDE.md:** poängkortet på Hem står nu i listan över uträknade sammanfattningar (beslut av grundaren).
- **Tester:**
  - `screens/AppHome.test.tsx` (3 nya): standardtaggarna utan fälten, media och exempel
  - `app/(app)/app/page.test.tsx` (1 ny): media, inget exempel
  - `app/demo/demo.test.tsx` (5 nya): Hems taggar är exempel i tre moment, utan myndighetsnamn och påhittad tid; "Sedan sist" pekar på steg 05; handlingskortet med och utan siffra; siffra bara i "Redan klart"
  - De tre första demotesterna föll mot den gamla rutten.
- **Skärmbilder** (Playwright mot `pnpm build && pnpm start`, 1440 och 390 px). Sara vid beat 0, 9, 17, 25 och 37 och Jonas vid 0 och 12, 18 demosidor, totalt 252 bilder. Två FÖRE-omgångar var identiska (AE 0):
  - efter ändringarna är 238 identiska med före
  - skiljer sig gör bara `/demo` (Hem) i alla 14 lägen, som avsett
  - Medgrundaren, där bara sifferregelns import flyttade, är identisk
  - `/app` och `/app/pulsen` inloggat är identiska (AE 0)
- **`/security-review`:** inga fynd. Kontrollerat: ingen rå HTML, inga nycklar eller `NEXT_PUBLIC_`, demot importerar inga liveadaptrar, `requireUser()` är orört, inga funktioner skickas från servern.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (851 gröna, 35 skippade), `pnpm build` och `pnpm test:e2e` (44 av 44).

### Kända problem
- **Rubrikerna i demots signaler** påstår fortfarande saker om verkliga aktörer, till exempel "Registret bekräftar precis det segment …" och "Skatteverket skärper …". Taggen säger att det är påhittat. Ett eget innehållsbeslut (kvar sedan PR 6).
- **Handlingskortets texter i demot** säger "Riktiga siffror ur registret". Taggen säger nu "Exempel", men texten lovar fortfarande riktiga siffror. Ett innehållsbeslut.
- **"Sedan sist" i `/app`** har fortfarande registrets tagg för utskicket och öppningsgraden som standard. Det syns inte, eftersom `getHomeSummary` är en stubbe. När Resan byggs ska rutten sätta rätt datatyp: utskicket är användarens egen data, inte ett register.
- **Källans steg i "Sedan sist"** läses ur scenariots källnamn ("steg 05"). Om demots källnamn byter form faller det tillbaka på det aktuella steget. Ett test täcker steg 05.

### Beslut nästa session behöver känna till
- **Källtyperna i `docs/beslut.md` gäller alla moduler.** `SourceTag` har `register` som standard, så sätt alltid datatypen för en källa som inte är ett register.
- **Bruno:** `/app/pulsen` behöver bara `sourceDataType: "media"` i rutten. Tomtexten i `Pulse.tsx` (se ovan) är hans att avgöra.
