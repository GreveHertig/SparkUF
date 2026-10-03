## PR 1: Grunden för en design (gren `design/pr1-grunden`, PR mot `prototyp`)
Första PR:en i `docs/plan-en-design.md`. Inget ser annorlunda ut.

### Klart
- `design/site.css` laddas även under `app/(app)/layout.tsx`. Skopad under `.fd`/`.fdd`, så `/app` ser likadan ut tills skärmarna använder klasserna. Klassprefixen är oförändrade.
- Vakten `screens/noAdapters.guard.test.ts`: inget under `screens/` får importera, exportera vidare eller ladda något ur `adapters/` (alias eller relativ sökväg, även typer och tester). Två överträdelser lagade: `screens/Validation.tsx` (och dess test) och `screens/Cofounder.tsx`. Typerna `ResponseCard`, `ValidationAssumption` (med verdict-typerna) ligger nu i `ports/OutreachProvider.ts` och `TranscriptItem` i `ports/CofounderAgent.ts`; demoadaptrarna importerar dem därifrån och exporterar dem vidare, så inget annat behövde ändras.
- `ExampleLabel` tar `dataKind: "example" | "live"` (typen `DataKind` i `core/domain.ts`). Demot sätter `"example"` på sina fyra ställen; `"live"` visar ingenting. Test i `app/demo/_components/ExampleLabel.test.tsx`.
- `DESIGN.md` har en ny del överst, "Gällande designsystem", med besluten (demots stil är appens stil, `components/spark` fasas ut, `components/ui` kvar till PR 11, "Kommer snart" för vyer utan liveadapter). Tidigare sessioner ligger oförändrade under "Historik".
- Kontroll: skärmbilder FÖRE och EFTER av `/`, `/demo/start`, `/demo`, `/demo/marknad`, `/demo/validering`, rundturens stopp 6 och `/app` (omdirigeras till inloggningen, inget testkonto) på 1440 och 390 px. 12 av 14 är identiska pixel för pixel; rundturen skiljer sig bara i kortets kantutjämning, lika mycket som mellan två körningar av samma kod. `typecheck`, `lint` (0 fel), `test` (594 gröna), `pnpm build`.

### Återstår
- PR 2 (skalet) enligt planen.
- `/app` efter inloggning är inte fotograferat (inget testkonto). `site.css` är skopad, så det påverkas inte, men det bör kontrolleras med ett riktigt konto.
