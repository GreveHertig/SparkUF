## PR 6: Pulsen — källtyperna (2026-10-01, direkt på `design/en-design`)
Theodors granskning av PR 6: varje källa ska bära sin egen typ, och en signal får inte påstå saker om verkliga aktörer. Bygger på källtyperna från `aeb7a47` (docs/beslut.md, 2026-10-01).

### Klart
- **`/app/pulsen`** skickar `sourceDataType: "media"`. Artiklarna visas med "Media" i blått, aldrig med registrets grå tagg. Samma som Hem.
- **Demoadaptern bär inga myndighetsnamn längre** (`adapters/demo/PulseProvider.ts`). `source` är borttagen ur signaltexterna. Adaptern sätter exempelkällan själv (`withSource`, steget ur `getSignalSteps()`), i både `getSignals` och `getTodaysSignal`. Demots Pulsen-sida skriver därför inte längre över källan, den sätter bara `sourceDataType: "example"`. Demots Hem (Theodors) skriver fortfarande över med samma värden, vilket ger samma resultat.
- **Två texter skrivna om**, på svenska och engelska:
  - "Skatteverket skärper kraven på digital arkivering av underlag" blev "Fler byråer efterfrågar digital arkivering av kvitton och underlag" (kategorin "Reglering" blev "Bransch")
  - "Registret bekräftar precis det segment Domen pekade ut …" blev "Fler tecken pekar på samma segment som Domen …"
- **Portregeln** i `docs/plan-en-design.md` säger nu som koden gör: skärmar importerar aldrig `adapters/`, datans typer kommer från `ports/` och `core/`, och presentationen (`design/`, `i18n/`, `components/ui/`) får importeras.
- **`docs/beslut.md`:** varför de tre startsignalerna räknas till steg 01, och att signalerna inte påstår något om verkliga aktörer.
- **Tester:** ruttestet kontrollerar "Media". Adaptertestet kontrollerar att varje signal bär exempelkällan för sitt steg och att inga myndighetsnamn finns (sv, en, `getTodaysSignal`).
- **Skärmbilder** mot `064ec3f` (28 bilder, samma lägen som förut): skillnad bara där texten ändrats. Det gäller Saras `/demo/pulsen` (10) och Hem vid beat 25 och 37 (4), där segmentsignalen är dagens signal. På Hem ändras bara meningen, och Theodors exempeltagg är identisk. Jonas och övriga Hem-lägen är identiska.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`), `pnpm test` (852 gröna, 35 skippade) och `pnpm build`. e2e och inloggat: Theodor kör dem.

### Kvar
- **Rubrikerna innehåller fortfarande påhittade siffror** ("14 nya redovisningsbyråer …", "22 % fler …", "10–20 anställda växer snabbare …"). De påstår inte att en myndighet sagt dem och bär exempeltagg, men de är uppfunna statistikpåståenden. Om de ska bort är ett eget innehållsbeslut.
- **`timestamp`-fälten** i demoadaptern ("3 dagar sedan" m.fl.) visas inte längre någonstans men finns kvar i datan.
