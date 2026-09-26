# Plan: en design för /demo och /app

Målet: den riktiga appen (`/app`) ska se ut exakt som demot (`/demo`). Den
enda skillnaden ska vara datan: appen visar riktig data via
`adapters/live`, demot exempeldata via `adapters/demo`. Båda ska använda
samma skärmar i `screens/`.

Skriven 2026-09-26 efter PR #25 (ny startsida och nytt demo). Ingen kod är
ändrad än. Besluten längst ner är **förslag, beslutas med Theo på söndag**.

## Nuläge

- **`/app` har bara Hem**: `app/(app)/app/page.tsx` (skärmen `AppHome`),
  skalet `AppShell` och onboardingen på `/start` (`OnboardingEntry`,
  `OnboardingIdea`, `OnboardingProfile`).
- **Tio skärmar i `screens/` används inte av någon sida** sedan det gamla
  demot togs bort i #25: `Build`, `BusinessPlan`, `Cofounder`,
  `JourneyStep`, `Legal`, `Market`, `Memory`, `Pulse`, `Score` och
  `Validation`. `Journey` används bara via `components/spark/JourneyRail`
  i `AppHome`.
- **Demot delar ingenting med `screens/`.** Sidorna i `app/demo/**` hämtar
  data själva (`useEffect`) från demoadaptrarna och har egen markup: cirka
  1 800 rader sidor, 1 000 rader komponenter och `design/site.css`
  (3 600 rader).
- **Liveadaptrarna:** byggda är Evidens, Juridik, Minnet, OutreachPrep,
  Utskick, Pulsen och Registret (bakom licensgrinden). Stubbar
  (`NotImplementedError`) är Build, Medgrundaren, Resan, Profil, Projekt,
  Domen, Research och Simulering.

## Skärmar som påverkas

| Vy | Demots sida i dag | Skärm i dag | `/app`-rutt i dag | Liveadapter |
|---|---|---|---|---|
| Skal (sidhuvud, meny, poäng) | `_components/DemoShell` | `AppShell` | ja | Profil och Resan är stubbar |
| Hem | `(app)/page.tsx` | `AppHome` | ja | Resan stubbe, Evidens och Pulsen byggda |
| Resan och steget | `resan`, `resan/[steg]` | `Journey`, `JourneyStep` | nej | stubbe |
| Poäng | `poang` | `Score` | nej | byggd |
| Marknad | `marknad` | `Market` | nej | Registret, bakom licensgrinden |
| Validering | `validering` | `Validation` | nej | Utskick byggt |
| Pulsen | `pulsen` | `Pulse` | nej | byggd |
| Medgrundaren | `medgrundaren` | `Cofounder` | nej | stubbe |
| Minnet | `minnet` | `Memory` | nej | byggd |
| Juridik | `juridik` | `Legal` | nej | byggd |
| Bygg | `bygg` | `Build` | nej | stubbe |
| Affärsplan | `affarsplan` | `BusinessPlan` | nej | ingen port, sammansätts i `core/businessPlan` |
| Onboarding (tre vyer) | `start/*` | `Onboarding*` | ja, `/start` | Profil och Projekt stubbar |

## Vad som skiljer demot från nuvarande /app (gäller alla skärmar)

1. **Stilsystem.** `screens/` bygger på Tailwind och `components/spark`
   och `components/ui` (designsystemet i `DESIGN.md`). Demot bygger på
   klasser i `design/site.css`, skopade under `.fd` och `.fdd`. "Se ut
   exakt som demot" betyder att skärmarna byter till demots stil och att
   det mesta av `components/spark` slutar användas.
2. **Datahämtning.** Demot hämtar i webbläsaren (`useEffect`). `/app`
   hämtar på servern (async Server Components) och visar `ComingSoon` när
   en liveadapter inte är klar. Skärmarna blir rena props-komponenter;
   hämtningen stannar i respektive rutt-fil.
3. **Demoläge i sidorna.** Demots sidor läser `useDemoStore` (moment,
   ingång, Jonas-scenariot) och visar låsta lägen utifrån demots moment. I
   appen ska låst och olåst komma från Resans steg. Skärmarna tar emot det
   som props, till exempel `locked: { unlocksAfterStep } | null`.
4. **Demospecifika moduler utanför portarna.** Några av demots sidor
   importerar `cofounderScript`, `journeyEngine`, `businessPlan` och
   `demoStore` direkt ur `adapters/demo`. De får bara användas i demots
   rutt-filer, aldrig i skärmarna.
5. **Logik i sidorna.** Marknads storleksfördelning och rubrik och
   Valideringens nyckeltal räknas i sidan. De flyttas till `core/` så att
   demot och appen räknar likadant.
6. **Rundturen.** `data-tour-id` kan stå kvar i skärmarna (ofarligt i
   appen). Demoraden och rundturen stannar i demots layout.

## Regler som ska gälla

- **Portregeln.** Skärmarna får bara ta emot props och typer från
  `ports/` och `core/`. En befintlig överträdelse ska bort:
  `screens/Validation.tsx` importerar en typ från
  `adapters/demo/OutreachProvider`. Ett test som förbjuder `screens/**` att
  importera från `adapters/**` läggs till i PR 1.
- **Datalöftet.** "Exempel med påhittad data" (`ExampleLabel`) blir en
  prop, `dataKind: "example" | "live"`, som bara demot sätter. Appen faller
  aldrig tillbaka på demodata. Saknad data ger tomläge eller `ComingSoon`.
  Varje siffra har källa, som i demot i dag.
- **Licensgrinden.** I appen använder Marknad och Validering det riktiga
  Registret. Stängd grind kastar `RegistryLockedError`, som redan räknas
  som platshållarfel (`isPlaceholderError`). Skärmarna får ett eget låst
  läge ("Registret är inte öppet än") i stället för bara `ComingSoon`.
  Inga registersiffror visas för den som inte står på allowlisten. Ett
  test per rutt bevisar att stängd grind aldrig visar data.

## Pågående arbete, så att vi inte krockar

- **Bruno** (`Litfot`): `modul/pulsen` är mergad (#23), ingen öppen gren.
  Kvar för Pulsen enligt `status.md`: live-rutten `/app/pulsen`,
  kommentaren i `app/(app)/app/page.tsx` och RLS-testet för
  `pulse_fetches`. `/app/pulsen` krockar med den här planen, se beslut 3.
- **Oskar** (`Jaeger154`):
  - `landning-bilder` (2 commits före `prototyp`, bara `DESIGN.md` och
    `status.md` än) planerar skärmbilder av det gamla demot i en sektion
    på den gamla startsidan. Båda försvann i #25, se beslut 4.
  - Juridiken på engelska ("vecka 7", buggpunkt 9) rör
    `ports/LegalAdvisor.ts` (`getLegalMap` med locale) och båda
    adaptrarna. Juridik-PR:en nedan väntar på den eller görs i samråd.
- `modul/marknadsforing` finns men har inga egna commits. Fråga i teamet
  vems den är.

## Ordning, i små PR:er

Varje PR: flytta markupen från demots sida till skärmen i `screens/`
(ersätter den gamla), gör demots sida till en tunn hämtare av demodata,
lägg till `/app`-rutten med liveadaptern, platshållarfel och låst läge,
och tester (skärmtest, demotest, ruttest för `/app`). Demot ska se
likadant ut före och efter, kontrollerat med skärmbilder.

1. **Grunden** (inget synligt ändras): demots stil blir appens stil
   (`design/site.css` laddas även under `(app)`), testet som förbjuder
   `screens/` att importera `adapters/`, prop-mönstret för
   `ExampleLabel`, och `DESIGN.md` skrivs om (beslut 1).
2. **Skalet:** `DemoShell` blir `AppShell`, som används av både `/demo`
   och `/app`. Demoraden och rundturen stannar i demots layout.
3. **Hem** (`AppHome`). `/app` finns redan, så här syns skillnaden först.
4. **Poäng** (Evidens är byggd): en enkel första vy med riktig data.
5. **Minnet** och **Juridik** (byggda). Juridik i samråd med Oskar.
6. **Pulsen**: Bruno, på den nya skärmen (beslut 3).
7. **Validering** (Utskick byggt, låst läge för Registret).
8. **Marknad** (Registret bakom licensgrinden, tester för stängd grind).
9. **Resan och steget** (liveadaptern stubbe: "Kommer snart" tills den
   är klar).
10. **Medgrundaren**, **Bygg** och **Affärsplan** (stubbar i appen;
    Medgrundaren kräver att demots manus flyttas ut ur sidan).
11. **Onboarding** (`/start` och `/demo/start`) och städning: ta bort
    oanvända `components/spark` och `components/ui`, `DemoBar` och
    `TourOverlay`, och Fonda-namnen i koden.

PR 1–3 i ordning. PR 4–10 är i stort sett oberoende och kan delas upp.

## Ungefär hur stort

- Cirka 2 800 rader av demots sidor och komponenter flyttas in och
  ersätter cirka 2 000 rader skärmar och 13 skärmtester.
- Nytt: 11 `/app`-rutter med platshållarfel, låsta lägen och tester.
- Grovt: 11–12 PR:er på 300–900 ändrade rader, runt 6 000–8 000 rader
  totalt inklusive tester. Med en session per PR ungefär 2–3 veckor för
  en person, kortare om PR 4–10 delas upp.
- Störst risk: stilbytet i PR 1–2 (rör allt `/app` visar), Marknad
  (licensgrinden) och Medgrundaren (manuset ligger i sidan).

## Beslut (förslag, beslutas med Theo på söndag)

1. **Demots stil ersätter `components/spark`.** `DESIGN.md` skrivs om i
   PR 1. Komponenter i `components/ui` som fortfarande används får vara
   kvar till PR 11.
2. **Vyer utan liveadapter visar `ComingSoon`, märkt "Kommer snart", och
   syns i menyn**, så att appen och demot ser likadana ut.
3. **Bruno bygger `/app/pulsen` på den nya skärmen efter PR 1–2.** Innan
   dess gör han RLS-testet och cachen för `pulse_fetches`.
4. **Oskars `landning-bilder`:** fråga Oskar om han vill ta nya bilder av
   det nya demot eller lägga ner grenen.
