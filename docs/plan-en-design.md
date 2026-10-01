# Plan: en design för /demo och /app

Målet: den riktiga appen (`/app`) ska se ut exakt som demot (`/demo`). Den
enda skillnaden ska vara datan: appen visar riktig data via
`adapters/live`, demot exempeldata via `adapters/demo`. Båda ska använda
samma skärmar i `screens/`.

Skriven 2026-09-26 efter PR #25 (ny startsida och nytt demo). PR 1–3 är
gjorda (egna grenar och PR:er mot `prototyp`); PR 4–11 är gjorda på
`design/en-design` enligt avsnittet "Arbetsordning" nedan. Läget per PR står
i `docs/status.md`.

**Migrationen är klar (2026-09-30, PR 11; Pulsen 2026-10-01, PR 6).** Alla
skärmar delas av `/demo` och `/app`, och demots sidor är tunna hämtare.
Pulsen (steg 6) flyttades sist: `screens/Pulse.tsx`, demots sida och
`/app/pulsen`, och `"pulsen"` är borttagen ur `UNAVAILABLE_TABS`. Vad som
återstår utanför själva migrationen står under "PR 11" och "PR 6: Pulsen" i
`docs/status.md`.

## Nuläge

Uppdaterat 2026-09-30, efter PR 11. Ögonblicksbilden från 2026-09-26 (före
PR 1) finns i historiken för den här filen.

- **Delat av `/demo` och `/app`:** skalet (`AppShell`, PR 2, med poängen i
  sidhuvudet från PR 4), Hem (`AppHome`, PR 3), Poäng (`Score`, PR 4),
  Minnet (`Memory`, PR 5), Juridik (`Legal`, PR 5), Validering
  (`Validation`, PR 7), Marknad (`Market`, PR 8), Resan och steget
  (`Journey`, `JourneyStep`, PR 9), Medgrundaren (`Cofounder`), Bygg
  (`Build`) och Affärsplanen (`BusinessPlan`, alla tre PR 10) och
  onboardingen (`OnboardingEntry`, `OnboardingIdea`, `OnboardingProfile`,
  PR 11). Demots sidor för dem är tunna hämtare utan markup.
- **`/app`-rutter:** `/app` (Hem), `/app/poang`, `/app/minnet`,
  `/app/juridik`, `/app/validering`, `/app/marknad`, `/app/resan`,
  `/app/resan/[steg]`, `/app/medgrundaren`, `/app/bygg` och `/app/affarsplan`, plus onboardingen på `/start` (`OnboardingEntry`,
  `OnboardingIdea`, `OnboardingProfile`, samma skärmar som `/demo/start`
  sedan PR 11), och `/app/pulsen` (PR 6). Alla flikar i `/app` länkar till
  sina sidor (PR 11, Pulsen PR 6).
- **Oanvända skärmar i `screens/`:** inga. Oanvända komponenter togs bort i
  PR 11.
- **Delade byggstenar** ligger i `screens/blocks/`: `ScoreFigure.tsx` (PR 4),
  `PageBlocks.tsx` (`PageHead`, `Locked`, `Pill`, PR 5) och
  `DataBlocks.tsx` (`ExampleLabel`, `Figures`, `SimulationBlock`,
  `VerdictBlock`, PR 7), `JourneyStepper.tsx` (PR 9, delad av Hem och
  Resan) och `ChatBlocks.tsx` (`ChatLine`, `ToolRun`, `TimeSkipLine`, PR 10).
  `app/demo/_components/DemoBlocks.tsx` togs bort i PR 6.
- **Demots egna sidor kvar att flytta:** inga.
- **Liveadaptrarna:** byggda är Evidens, Juridik, Minnet, OutreachPrep,
  Utskick, Pulsen och Registret (bakom licensgrinden). Helt eller delvis
  stubbar (`NotImplementedError`) är Build, Medgrundaren, Resan
  (`getSteps` och `getStepDetail` byggda, `getHomeSummary` stubbe; ingen
  dom, poängändring eller upplåsta delar än), Profil, Projekt, Domen,
  Research och Simulering.

## Skärmar som påverkas

| Vy | Demots sida i dag | Skärm i dag | `/app`-rutt i dag | Liveadapter |
|---|---|---|---|---|
| Skal (sidhuvud, meny, poäng) | `_components/DemoShell` | `AppShell` | ja | Profil och Resan är stubbar |
| Hem | `(app)/page.tsx` | `AppHome` | ja | Resan stubbe, Evidens och Pulsen byggda |
| Resan och steget | `resan`, `resan/[steg]` | `Journey`, `JourneyStep` | ja, PR 9 (steget vitlistat 1–12, låst ur stegets status) | `getSteps`/`getStepDetail` byggda, `getHomeSummary` stubbe |
| Poäng | `poang` | `Score` | ja, PR 4 | byggd |
| Marknad | `marknad` | `Market` | ja, PR 8 (branschen väljs i adressen, låst till steg 02) | Registret, bakom licensgrinden; transporterna är inte skrivna, så även Theo och Erik får felrutan |
| Validering | `validering` | `Validation` | ja, PR 7 (låst till steg 03 ur Resans steg) | Utskick: sändspärren ger "Kommer snart"; läser inte Registret |
| Pulsen | `pulsen` | `Pulse` | ja, PR 6 (inget låst läge: demot har ingen stegspärr) | byggd |
| Medgrundaren | `medgrundaren` | `Cofounder` | ja, PR 10 (ingen port för samtalet: Kommer snart i båda sektionerna) | stubbe (`sendMessage`) |
| Minnet | `minnet` | `Memory` | ja, PR 5 | byggd |
| Juridik | `juridik` | `Legal` | ja, PR 5 (bolagsformen väljs av användaren) | byggd, inget juristgranskat |
| Bygg | `bygg` | `Build` | ja, PR 10 (låst till steg 07 ur Resans steg; tomläge när porten saknar spec) | stubbe |
| Affärsplan | `affarsplan` | `BusinessPlan` | ja, PR 10 (ingen hopsamling i `/app`: Kommer snart i varje avsnitt) | ingen port, sammansätts i `core/businessPlan`; hopsamlingen finns bara i demot |
| Onboarding (tre vyer) | `start/*` | `Onboarding*` | ja, `/start`, PR 11 (Kommer snart per sektion) | Profil och Projekt stubbar |

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
5. **Logik i sidorna.** Marknads storleksfördelning och rubrik (PR 8:
   `core/market.ts`) och
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
- **Licensgrinden.** I appen använder Marknad det riktiga Registret.
  (Validering var tänkt att göra det, men sidan har inga registersiffror:
  kontaktlistan kommer ur Utskick. `/app/validering` anropar inte
  Registret, och ett test bevisar det. Se PR 7 i `docs/status.md`.) Stängd grind kastar `RegistryLockedError`, som redan räknas
  som platshållarfel (`isPlaceholderError`). Skärmarna får ett eget låst
  läge ("Registret är inte öppet än") i stället för bara `ComingSoon`.
  Inga registersiffror visas för den som inte står på allowlisten. Ett
  test per rutt bevisar att stängd grind aldrig visar data. PR 8:
  `/app/marknad` frågar grinden (`assertRegistryAccessAllowed`) innan den
  anropar Registret och visar då låsläget i varje registersektion. Det
  bevisas av `app/(app)/app/marknad/licensgrind.test.tsx` med den riktiga
  grinden och den riktiga adaptern.
- **Omsättning bär sitt räkenskapsår** (PR 8). Per bolag visas året,
  och för en median spannet av år den bygger på ("4,2 Mkr (räkenskapsår
  2023–2024)"). Saknas året i datan visas luckan, aldrig siffran. I dag
  bär ingen port året (`CampaignRow`, `RegistryCompany`, `MarketOverview`),
  så luckan syns både i `/demo` och `/app` tills Registrets ägare lägger
  till det.
- **Platshållare per sektion** (infört av PR 3). Ett kort/en sektion visar
  `ComingSoon` bara när just DEN datan saknas — inte hela sidan bara för att
  ett enda anrop misslyckas. Är två fält beroende av samma anrop (t.ex. ett
  `nextStep`+`sinceLastTime`-par ur samma `getHomeSummary`), gate:a dem
  tillsammans som ett nullbart objekt, inte var för sig. Gäller alla
  återstående PR:er (4–11). Motivering: datalöftet — luckan ska synas, men
  fungerande data ska aldrig gömmas bakom en annan moduls stubbe.

## Arbetsordning

PR 4–11 pushas direkt till grenen `design/en-design` — ingen egen PR per
skärm. En PR öppnas från `design/en-design` mot `prototyp` ungefär en gång
i veckan (eller när en naturlig grupp skärmar är klar), inte per skärm.
`design/en-design` är skapad ur `design/pr3-hem` och har redan PR 2 och
PR 3 i sig; den tar löpande in `prototyp` när nytt landar där (samma
`.gitattributes`-fix för `docs/status.md` gäller — se filen).

Under migrationen (PR 4–11) rör bara EN person `screens/` och
`design/site.css` åt gången, för att undvika samtidiga ändringar i samma
delade filer. Alla andra fortsätter jobba i sina egna moduler
(`adapters/live/*`, `ports/*`, liveadaptrar) som vanligt, oberoende av
migrationen — de rör varken `screens/` eller `design/site.css`.

## Pågående arbete, så att vi inte krockar

- **Bruno** (`Litfot`): `modul/pulsen` är mergad (#23). `/app/pulsen` är
  byggd i PR 6 på `design/en-design`. Kvar för Pulsen: RLS-testet för
  `pulse_fetches`. #35 (samma rutt mot `prototyp`, gammalt skal) stängs.
- **Oskar** (`Jaeger154`):
  - `landning-bilder` (2 commits före `prototyp`, bara `DESIGN.md` och
    `status.md` än) planerar skärmbilder av det gamla demot i en sektion
    på den gamla startsidan. Båda försvann i #25, se beslut 4.
  - Juridiken på engelska ("vecka 7", buggpunkt 9) rör
    `ports/LegalAdvisor.ts` (`getLegalMap` med locale) och båda
    adaptrarna. Juridik-PR:en nedan väntar på den eller görs i samråd.
- `modul/marknadsforing` finns men har inga egna commits. Fråga i teamet
  vems den är.

## Ordning, i små steg

"PR 4", "PR 5" osv. är namn på stegen, inte egna pull requests: från PR 4
är varje steg en eller flera commits direkt på `design/en-design` (se
"Arbetsordning"). PR 1–3 var egna PR:er.

Varje steg: flytta markupen från demots sida till skärmen i `screens/`
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
   **Tar samtidigt bort dubbletten:** `ScoreFigure`/`ScoreDelta` finns just
   nu i två exemplar (`app/demo/_components/DemoBlocks.tsx` och den lokala
   kopian i `screens/AppHome.tsx`, PR 3). Poäng-sidan ska flytta in
   DemoBlocks-versionen (eller en gemensam, icke-demo-bunden variant) och
   ta bort den andra kopian — dubbletten får inte överleva PR 4.
5. **Minnet** och **Juridik** (byggda). Juridik i samråd med Oskar.
6. **Pulsen**: Bruno, på den nya skärmen (beslut 3). Gjort 2026-10-01.
7. **Validering** (Utskick byggt, låst läge för Registret).
8. **Marknad** (Registret bakom licensgrinden, tester för stängd grind).
9. **Resan och steget** (gjort; `getSteps` och `getStepDetail` är byggda,
   det som saknas i datan visar "Kommer snart" per sektion). **Tar samtidigt bort dubbletten:** samma sak för
   `JourneyStepper` (`app/demo/_components/DemoBlocks.tsx` vs.
   `screens/AppHome.tsx`s lokala kopia, PR 3). Gjort: den enda versionen
   ligger i `screens/blocks/JourneyStepper.tsx`, delad av Hem och Resan.
10. **Medgrundaren**, **Bygg** och **Affärsplan** (gjort; stubbar i appen,
    Medgrundarens manus stannar i demots sida). Affärsplanens demo visar nu
    bara påståenden med egen källa (se PR 10 i `docs/status.md`).
11. **Onboarding** (`/start` och `/demo/start`) och städning: ta bort
    oanvända `components/spark` och `components/ui`, `DemoBar` och
    `TourOverlay`, och Fonda-namnen i koden. Gjort, tillsammans med flikarna
    i `/app` och demots exempelkällor (se PR 11 i `docs/status.md`).

PR 1–3 i ordning. PR 4–10 är i stort sett oberoende och kan delas upp.

## Ungefär hur stort

- Cirka 2 800 rader av demots sidor och komponenter flyttas in och
  ersätter cirka 2 000 rader skärmar och 13 skärmtester.
- Nytt: 11 `/app`-rutter med platshållarfel, låsta lägen och tester.
- Grovt: 11–12 steg på 300–900 ändrade rader, runt 6 000–8 000 rader
  totalt inklusive tester. Med en session per steg ungefär 2–3 veckor för
  en person, kortare om PR 4–10 delas upp.
- Störst risk: stilbytet i PR 1–2 (rör allt `/app` visar), Marknad
  (licensgrinden) och Medgrundaren (manuset ligger i sidan).

## Beslut

1. **Demots stil ersätter `components/spark`.** Gällande; `DESIGN.md`
   skrevs om i PR 1. Komponenter i `components/ui` som fortfarande används
   får vara kvar till PR 11.
2. **Vyer utan liveadapter visar `ComingSoon`, märkt "Kommer snart", och
   syns i menyn**, så att appen och demot ser likadana ut. Skärpt av PR 3:
   `ComingSoon` visas per sektion, inte för hela sidan (se "Platshållare
   per sektion").
3. **Bruno bygger `/app/pulsen` på den nya skärmen (steg 6)**, men enligt
   "Arbetsordning": på `design/en-design`, och bara när ingen annan rör
   `screens/` och `design/site.css`. Fram till dess jobbar han i sin modul
   (`adapters/live/PulseProvider`, `pulse_fetches`).
4. **Öppen fråga — Oskars `landning-bilder`:** fråga Oskar om han vill ta
   nya bilder av det nya demot eller lägga ner grenen.
5. **Bolagsformen i `/app/juridik` (PR 5).** Ingen port ger användarens
   bolagsform, så användaren väljer den med fyra länkar på sidan.
   - **Var valet sparas i dag:** bara i adressen (`?bolagsform=aktiebolag`).
     Det sparas inte i databasen, i en cookie eller i webbläsaren. Valet
     överlever en omladdning av samma adress. Det försvinner däremot när
     användaren kommer till `/app/juridik` på annat sätt, till exempel via
     en flik eller en länk utan parametern. Då visas uppmaningen att välja
     igen.
   - **Krav:** valet måste överleva en sidladdning, också när sidan öppnas
     utan parametern. Det är inte uppfyllt än. Valet ska sparas
     serverside per användare och inte bara i webbläsaren, eftersom `/app`
     hämtar på servern.
   - **När en port för bolagsform tillkommer** (troligen Projekt eller
     Profil) ska väljaren läsa från den och skriva till den i stället.
     Valet får inte finnas på två ställen, i adressen och i porten, som
     kan säga olika saker. Adressparametern tas då bort eller blir bara ett
     sätt att byta värdet i porten.
   - **Samma öppna uppgift som branschen i `/app/marknad` (PR 8).** Ingen
     port ger användarens bransch, så användaren skriver en SNI-kod
     (`?sni=69.201`, vitlistad med samma form som Registret kräver). Valet
     har exakt samma brist: det finns bara i adressen och försvinner när
     sidan öppnas utan parametern. Bolagsformen och branschen ska lösas
     tillsammans, med samma lagring, när en port bär användarens val. Inte
     löst i PR 8.
