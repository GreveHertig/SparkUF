# Beslutslogg

> **Not (2026-09-26):** det gamla demot under `/demo/app/...` är borttaget
> och ersatt av demot på `/demo` (sidorna ligger på `/demo/<sida>`, t.ex.
> `/demo/marknad`). Rutterna nedan beskriver hur det var när texten skrevs.
> Det gamla demot finns kvar i git-historiken.

## 2026-09-19

**Design från artefakten överförs — endast utseendet.**
Tokens finns i design-referens/artefakt/TOKENS.md.
Inget innehåll, ingen layout och ingen komponentstruktur ändras.

**Sidhopslagning: uppskjuten, inte avfärdad.**
Artefakten har sex sidor, prototypen har omkring tio. Övervägt
förslag om åtta sidor: poängen flyttas till Hem och får ingen egen
flik, juridiken blir en förmåga hos Medgrundaren enligt uppdrag.md
i stället för en egen sida. Resan, Pulsen och onboardingen behålls
som egna. Beslut tas tillsammans med Erik efter Emma-mötet.
Varje sidhopslagning måste uppdatera adapters/demo/tourSteps.ts,
annars slutar den guidade rundturen fungera.

**Stavning: Hiasynth.** Artefakten stavar fel (Haisynth). Rättas.

**Öppet — typsnitt för data.** Castoro används även för siffror.
Neutral sans för tabeller, diagramaxlar och nyckeltal ska provas
via --font-data innan det låses.

**Öppet — poängen.** Frågan om poängen ska spegla faktiskt
resultat i stället för bevisgrad är inte avgjord. Går emot
uppdrag.md 11.1 och 11.7.

**Arbetssätt.** Kör aldrig git-kommandon medan en Claude
Code-session arbetar. Det svepte med halvfärdiga filer i kväll.

**Nästa sessioner, i ordning.**
1. Tokenbyte enligt TOKENS.md. — klart, se docs/status.md.
2. Marknaden — den sidan Emma kommer att titta på. — klart, se docs/status.md.

## 2026-09-20

**Gemensamt skal + innehållsburna rubriker, genomfört.**
Brödsmula och en klickbar poängvisning (poäng, nivå, rörelse) på alla
`/app`-sidor i både demo- och liveläget, och sidhuvuden som beskriver
innehållet i stället för menyvalet. Se docs/status.md för detaljer och
vilka fält som är genuint hämtade ur aktivt case.

**Sidhopslagning: Kunder + Valideringen, genomfört — separat från den
uppskjutna åttasidesplanen ovan.** Grundaren bad specifikt om att slå
ihop Kunder med valideringsinnehållet ur steg 04–06 till en sida,
"Valideringen" (route `/demo/app/validering`). Det är INTE samma sak
som den uppskjutna planen ovan (poängen in i Hem, juridiken som en
Medgrundaren-förmåga) — den planen väntar fortfarande på Erik efter
Emma-mötet, oförändrad. `adapters/demo/tourSteps.ts` uppdaterat i
samma commit, enligt regeln ovan.

**Luckor i demodatan, rapporterade (inte tysta avvikelser).** Inga
namngivna kontaktpersoner eller roller finns för de nio kundsvaren
(bara bolagsnamn och citat) — svarskorten saknar därför namn/roll.
Ingen av de nio svarar med ett fullt "avvisar" (alla bekräftar
problemet, tre är bara oense om priset) — kategorin har inget exempel
i det här scenariot. Inget verkligt branschsnitt ("jämförelsetal")
finns som strukturerad data — öppningsfrekvensen (38 %, redan
källbelagd) används i stället. Se docs/status.md för fullständig lucklista.

## 2026-09-22

**Affärsplanen, byggd — se docs/status.md för fullständig detalj.**
Ny funktion enligt grundarens uppdrag: en plan som sätts samman i kod
(`core/businessPlan.ts`, samma "ren funktion"-mönster som `core/score.ts`)
ur redan befintliga portsnapshots — ingen ny port, ingen ny datakälla,
ingen språkmodell inblandad. Specen ligger i `docs/uppdrag.md` avsnitt 15.

**Bekräftat under bygget: två demoadaptrar är hårdkodade mot en enda
persona vardera, utan egen entry-vakt.** `RegistryProvider` (registret,
alltid Saras 312-byrå-data) och `ProjectRepository.getIdeaScreening`
(alltid Jonas idégenomlysning) hade ingen `entry === "hasIdea"`-koll,
till skillnad från övriga demoadaptrar (OutreachProvider, VerdictProvider,
BuildProvider, PulseProvider, LegalAdvisor har alla redan en). Åtgärdat
genom att gardera anropen i den NYA hopsamlingskoden
(`adapters/demo/businessPlan.ts`), inte genom att ändra de befintliga
adaptrarna — de rördes inte, i linje med "rör inte befintlig demodata".
Flaggat här eftersom det är samma klass av fel som redan bitit en gång
(`SimulationProvider.ts`s regex-bugg, poleringssessionen ovan): en
adapter som ser persona-medveten ut men inte är det, tyst visar fel
persons siffror. En framtida session kan överväga att lägga samma vakt
direkt i `RegistryProvider`/`ProjectRepository` själva — inte gjort här,
eftersom uppdraget uttryckligen bad om att inte röra befintlig demodata.

**Resultatet är avsiktligt asymmetriskt, som uppdraget bad om.** Sara:
8 av 9 avsnitt håller (bara Beviset tunt — hon gjorde aldrig en
idégenomlysning, så "antagandena med utfall" saknas för henne). Jonas:
4 håller, 3 tunt, 2 saknas (Kunden och problemet, Konkurrensen) — en
direkt konsekvens av att hans resa är byggd i bredd och att Registret/
Utskicket/Domen aldrig byggdes ut för hans persona.

## 2026-09-23

**Licensen för namngivna företag nedgraderad från Verifierat till Sekundärt.**
Erik 2026-09-20 hade läst Bolagsverkets informationssida om värdefulla
datamängder, inte villkorstexten, och ingen ordalydelse citerades. Ett
fungerande API eller en informationssida är inte lästa villkor. Licensgrinden
(`docs/moduler/registret.md`) lyfts först när en människa läst villkoren och
citerat dem i `docs/dataspiken.md`.

**Licensen för namngivna företag Verifierad, samma dag.** Erik klistrade in
Bolagsverkets sida om värdefulla datamängder ordagrant. Stycket "Användning
av värdefulla data" tillåter fri kommersiell användning, modifiering och
bearbetning inom personuppgifts- och sekretesslag, och är citerat i
`docs/dataspiken.md`. Licensvillkoret för grinden är därmed uppfyllt. Grinden
i koden lyfts separat, av Erik. De tidigare påstådda "undantagen" om enskilda
firmor och reklamspärr fanns inte i texten; de hör till GDPR-frågan (§6
fråga 4).

**Licensgrinden förblir stängd för alla utom Erik och Theodor.** En påbörjad
öppning (allowlisten borttagen) förkastades innan den committades. Full
öppning kräver alla tre: transporten skriven, SCB:s villkor lästa (efter 30
september 2026) och dataspiken §6 fråga 4 avgjord med handledare. Se
`docs/moduler/registret.md`, "Licensgrind".

**Supabase-projekten: SparkUF2 är utveckling och beta.**
SparkUF2 (Supabase, Frankfurt) är utvecklings- och betaprojektet trots
PRODUCTION-märkningen i Supabase. Före lanseringen 30 november skapas
ett separat produktionsprojekt med samma migreringar. Testanvändarna
test-a och test-b är borttagna 2026-09-23.

**`registry_cache` blir en gemensam cache som bara servern läser och skriver
(Erik).** Tidigare skiss: cachen ägdes per användare och användaren skrev
själv, vilket lät en användare förfalska registerdata som påverkar
Marknad-poängen och affärsplanen. Nu: ingen `user_id`, unik nyckel
`(source, request_key)`, RLS på utan policies och rättigheterna indragna från
`anon`/`authenticated`, så att ingen klient kommer åt tabellen. Servern läser
och skriver via `lib/server/registryCache.ts` med `SUPABASE_SERVICE_ROLE_KEY`,
som är server-only och aldrig har `NEXT_PUBLIC_`-prefix. Det är projektets enda
användning av service role, se `docs/arkitektur.md` avsnitt 9. Källa,
hämtdatum och 7-dagarstaket står kvar, och `get()` tar bort utgångna rader.
Ingenting skrivs till tabellen förrän dataspiken §6 fråga 4 är avgjord.

## 2026-09-25

**`waitlist` blir en stängd tabell i `CLOSED_TABLES` (Erik).** Allt ska gå
genom `join_waitlist`. Policyn `using (false)` tas bort, `waitlist` läggs till
i `CLOSED_TABLES` i `supabase/migrations/migrations.test.ts`, och `anon` och
`authenticated` har inga rättigheter på tabellen (`revoke all`). Skäl: en
`using (false)`-policy är vilseledande, eftersom den ser ut som en policy men
inte gör något, och inkonsekvent, eftersom det då finns två olika sätt att
markera en stängd tabell i kodbasen.

**Pulsens dagscache: `pulse_fetches`, per grundare och svensk dag (Erik).**
En rad per `(user_id, fetch_date)`, där `fetch_date` räknas i
Europe/Stockholm i databasen. Adaptern tar raden med `insert … on conflict do
nothing` innan Tavily anropas, så samtidiga förfrågningar ger ett enda anrop.
En tom dag sparas som `empty` och söks inte om samma dag. `claimed_at` lades
till utöver den ursprungliga specen, så att en rad som fastnat på `pending`
(äldre än 5 minuter) eller står på `error` kan tas över med en villkorad
update. Användarägd med RLS (läsa, skapa, uppdatera egen), till skillnad från
`registry_cache`: raden styr bara grundarens egen sökning, så en förfalskad rad
skadar ingen annan. Flödet står i `docs/moduler/webbresearch-och-pulsen.md`,
"Dagscachen".

## 2026-09-30

**Juridikens källor: verifieringsstatus, och varför gränssnittet visar alla
som overifierade.** Statusen har hittills bara funnits i en kodkommentar i
`adapters/live/legalSources.ts`. Den hör hemma här och i datan.
- **Kontrollerade av en människa, i webbläsaren 2026-09-30:** alla källor
  från Bolagsverket, verksamt.se och Bokföringsnämnden (BFN). Kontrollen är
  inlagd av Oskar (`Jaeger154`) i commit `262dc95`. Verifieringsloggen i
  `docs/moduler/juridisk-koll.md` återger resultatet ordagrant men namnger
  inte vem som gjorde kontrollen.
- **Enbart maskinellt hämtade,** av Claude Code 2026-09-17, fortfarande
  startsidor: Skatteverket, IMY, EUR-Lex (GDPR), Konsumentverket och
  Riksdagen.
- **Ingenting är granskat av jurist:** varken källorna, vilka ämnen som
  gäller per bolagsform, avgifter, deadlines eller lagrum.
- **Därför märker gränssnittet alla åtta som overifierade** ("Overifierad"
  bredvid varje källa på Juridik, i både `/demo` och `/app`, PR 5). Det står
  kvar tills en port bär verifieringsstatusen som data. En status som bara
  finns i en kommentar får inte styra vad användaren ser.

**Öppen uppgift till Juridik-modulens ägare (inte genomförd):** lägg till
ett valfritt fält `kontrollerad?: string` (ISO-datum) i `Källa`
(`types/evidence.ts`) och sätt det i `KURERADE_KÄLLOR`
(`adapters/live/legalSources.ts`) för de källor som är kontrollerade. Först
då kan `screens/Legal.tsx` visa märkningen bara för de källor som saknar
fältet. Juristgranskning är en egen status och ska inte läggas i samma fält.

**Spark använder SNI 2025 rakt av (Erik).** SNI-koder skrivs som fem siffror
utan punkt, till exempel `69201`. Ingen omkodning från SNI 2007. Skäl: SCB:s
företagsregister-API (AFR) och dess kodtabell är SNI 2025 (Verifierat
2026-09-30: 62010 finns inte, 62100 = Dataprogrammering), och en omkodning
mellan versionerna är inte en-till-en. Porten (`RegistryQuery.sniCode`),
liveadapterns validering och demodatan (`69.201`) ändras inte nu. Vad som
ska ändras står i `docs/moduler/registret.md`, "SNI 2025".

**Källverifiering juridik.** Oskar Jaeger läste själv myndighetssidorna i
webbläsaren 2026-09-30: Bolagsverket (registrering, aktiekapital,
bolagsordning, styrelse, revisor, årsredovisning, stadgar), verksamt.se
(vilka som driver sidan, handelsbolag) och BFN (webbplatsen,
bokföringsskyldighet). Adresserna finns i verifieringsloggen i
`docs/moduler/juridisk-koll.md`. Två texter rättades (aktiekapital och
bolagsavtal). Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen är
inte kontrollerade av en människa. Ingenting är juristgranskat.

## 2026-10-01

**Fasen räknas ur högsta avklarade steg, inte ur steget som pågår.**
"Låses upp efter steg 05" betyder efter att steg 05 är klart. Förut räknade
liveadaptern fasen ur aktuellt steg (`scorePhaseForStep(deriveCurrentStepNumber(...))`),
vilket låste upp varje del ett steg för tidigt och sade emot texten.
Upplåsningstexten gäller, och fasen är rättad (`scorePhaseForCompletedSteps`
i `core/journey.ts`). Skäl: det stämmer med texten, med demots kalibrerade
moment (fasen byts i "efter"-momentet för steg 03, 05, 07 och 11) och med
fasnamnet "tryAfterCalls", efter samtalen i steg 05. `UNLOCK_STEP` i
`core/score.ts` är rättat, se beslutet om Produkt och Genomförbarhet nedan.
Se `docs/bevislagring.md` 11.6.

**Bevislagringen: `evidence`, `score_snapshots` och `evidence_kinds` är
stängda för skrivning från klienter** (`WRITE_CLOSED_TABLES` i
`supabase/migrations/migrations.test.ts`). Klienten läser sina egna rader
men skriver aldrig direkt. Bevis skrivs via `public.record_evidence`
(security definer), och poängen sätts av databasen ur sorten. Skäl: förut
kunde vem som helst höja sin egen poäng med ett direkt anrop mot Supabase.
Se `docs/bevislagring.md` 11.

**Poänghistoriken skrivs av servern med service role**
(`lib/server/scoreSnapshots.ts`). Det är den andra användningen av
`SUPABASE_SERVICE_ROLE_KEY`, efter registercachen. Skäl: totalen räknas av
`calculateScore` i kod och aldrig i SQL, så den kan inte sättas av en
databasfunktion som användaren själv anropar. Om klienten fick skriva kunde
historiken och den visade förändringen förfalskas.
- Nyckeln används bara för insert i `score_snapshots`.
- Användare och projekt kommer ur sessionen.
- Den sammansatta främmande nyckeln mot `projects` gör det omöjligt att
  skriva på någon annans projekt.
- Lint tillåter bara `adapters/live/EvidenceRecorder.ts` att importera filen.

**Besluten B1–B10 i bevislagringen** står med motiv i
`docs/bevislagring.md` avsnitt 11. B4, B6 och B9 tog Theodor:
- B4: en upplåst del utan bevis ger 0 och visas som en lucka.
- B6: självrapporterade bevis ger halva poängen, med tak på halva delens vikt.
- B9: gamla bevis utesluts, med livslängd per sort.

**Ett steg i resan markeras klart bara när dess krav är uppfyllda, och
villkoret sitter i databasen.** Theodor valde strikta krav, där steg utan
mätbart krav är låsta. Förut kunde en inloggad användare skriva `completed_at`
i `journey_steps` direkt mot Supabase. Fasen räknas ur högsta avklarade steg,
så den som markerade steg 11 kunde låsa upp alla delar och höja taket till 100.
Nu är `journey_steps` stängd för skrivning (`WRITE_CLOSED_TABLES`) och steg
markeras bara via `public.complete_journey_step` (security definer,
`supabase/migrations/20261001150000_journey_step_completion.sql`). Funktionen
kräver att föregående steg är klart och att kraven i
`journey_step_requirements` är uppfyllda av bevis som räknas (inte
återkallade, inte äldre än sortens livslängd). Kraven finns också i
`core/journeyRequirements.ts`, så att UI:t kan visa vad som saknas. Ett test
mot Postgres håller de två i synk och kör samma fall mot båda.

| Steg | Krav |
|---|---|
| 01 Om dig | Klar onboarding (`profiles.onboarding_completed_at`). Ändrat 2026-10-02 (`20261002150000_steg1_onboarding.sql`), förut fyra `profileFitAnswer`-bevis. Onboardingen skapar inga sådana bevis (Datalöftet). |
| 02 Möjligheter | Ett aktivt projekt |
| 03 Marknaden | `registerMarketCount` (systembevis ur registret) |
| 04 Kunden | `registerCompetitorSet` (systembevis ur registret) |
| 05 Samtalen | Minst ett problembevis (bekräftar eller avvisar) **och** minst ett prisbevis (godtar eller avböjer). Självrapporterat räcker (B6). |
| 06 Domen | Minst fem kundsvar (problem eller pris, bekräftar eller avvisar) från minst tre bolag. Se beslutet om steg 06, 07 och 12 nedan. |
| 07 Affärsfall och pris | Ett beslutat pris (`priceDecided`). Se nedan. |
| 08 Omfånget | `productScopeFromEvidence` |
| 09 Det formella | `formalRegistrationDone` |
| 10 Live | `productPublished` |
| 11 Första kunderna | `payingCustomer` |
| 12 Kapital | En inskickad ansökan till en finansiär (`fundingApplied`). Se nedan. |

Följd: i live kan bara steg 01 och 02 bli klara i dag. Steg 03 kräver
registerdata, och Registret är licensgrindat. Se `docs/status.md`, kända
problem.

**Produkt och Genomförbarhet låses upp efter steg 07, inte efter 08
respektive 09.** `UNLOCK_STEP` i `core/score.ts` är rättat. Skäl: uppdrag 7.3
låser upp båda tillsammans i fasen Lansera. Demots kalibrerade moment byter
fas efter steg 07, och live räknar fasen på samma sätt
(`scorePhaseForCompletedSteps`). Det var alltså texten "Låses upp efter steg
08/09" som var fel, inte fasen. Att ändra fasen i stället hade krävt en sjätte
fas med eget tak, och den finns inte i uppdraget. Ett test
(`core/journeyRequirements.test.ts`) kräver nu att varje del är upplåst exakt
när dess steg är klart.

**Passformssvar från profilen räknas fullt och märks "Ditt eget svar".** De
är inte självrapporterade i B6:s mening, eftersom grundaren själv är källan
(`docs/bevislagring.md` 11.1). Svaret sparas i `quote`, källan är
`spark:profile` ("Profilsamtalet") och datumet är dagens. Formuläret ligger
under Profilen i `/app/minnet`. Profilsamtalet i onboardingen är fortfarande
en stubbe.

**Krav för steg 06, 07 och 12 (Theodor).** Förut hade de tre stegen inget
mätbart krav och kunde aldrig markeras klara, så resan stannade efter steg 05
och taket på 66. Byggt på grenen `plattform/stegkrav`, se
`docs/bevislagring.md` 11.8.
- **Steg 06 Domen: godkänt som föreslaget.** Minst fem kundsvar som räknas i
  Problem och Betalningsvilja tillsammans, från minst tre olika bolag
  (`subject_ref`).
  - Motiv: uppdrag 1.5 säger att domen fattas "baserat på faktiska svar med
    citat och siffror". Det mätbara är antalet svar och att de inte alla
    kommer från en kund.
  - Motsägande svar räknas med, eftersom domen lika gärna kan bli
    "pivotera". Självrapporterade svar räknas också, men taket på halva delen
    (B6) gäller ändå för poängen.
  - Själva valet (kör, förfina eller pivotera) är inte ett villkor. Domen är
    en stubbe.
  - Kravet behövde en tröskel per grupp, i den nya tabellen
    `journey_step_group_thresholds`.
- **Steg 07 Affärsfall och pris: ändrat.** Kravet är ett **beslutat pris**, inte
  ett godtaget. Det är självrapporterbart och märks som självrapporterat (ny
  sort `priceDecided`, `subject_ref` = `price`, pris och spann i `quote`).
  - Skäl: ett godtaget pris kräver svar utifrån. Det dubblerar steg 05 och 06
    och blockeras av att utskicken är avstängda.
  - Att en kund godtar priset är ett eget bevis (`customerPriceAccepted`) som
    höjer Betalningsvilja, inte ett krav för att steget ska vara klart.
- **Steg 12 Kapital: godkänt som föreslaget.** En ny sort `fundingApplied`
  för en inskickad ansökan till en finansiär. `subject_ref` är finansiären och
  diarie- eller ärendenumret, och källan är programmets URL. Steg 12 påverkar
  varken fasen eller taket.
- **`priceDecided` och `fundingApplied` ger ingen poäng (Theodor).**
  - Villkoret på `evidence_kinds.base_points` är ändrat från `> 0` till `>= 0`.
  - Skäl: ett pris grundaren själv satt bevisar inte att någon betalar det, och
    en ansökan är inte beviljade pengar.
  - Sorter utan poäng skickas inte till `calculateScore`, så de fyller aldrig
    en tom del och döljer luckan (B4).
  - Livslängd: ett beslutat pris räknas i 365 dagar, en ansökan föråldras aldrig.

**Källtyperna: sex datatyper för källtaggen, och bara registret är grått.**
Beslut av grundaren. Varje källtagg (`components/ui/SourceTag.tsx`) har en
datatyp (`DataType` i `design/tokens.ts`). Datatypen säger vilket slags källa
det är, och utseendet ska avslöja det på avstånd. Tidigare fanns tre typer
plus exempel. Pulsens nyhetsartiklar visades därför med registrets grå tagg,
fast de inte kommer från något register (Hem och Pulsen i `/app`). Nu finns
hela uppsättningen, så att ingen modul behöver uppfinna en egen:

| Datatyp | När | Utseende | Etikett före källan |
|---|---|---|---|
| `register` | Myndighet eller officiellt register: Bolagsverket, SCB, Skatteverket och de kuraterade juridiska källorna | grå (`slate-700` på `slate-100`) | ingen |
| `media` | Nyhets- eller mediekälla, artiklar och webbsidor: Pulsens signaler (Tavily), webbresearch | blå (`#2b5a8a` på `#e3ecf6`, 6,0:1) | "Media" |
| `customer` | Riktiga kunders svar: utskick, samtal, enkäter | petrol (`#38717f` på `#dfeef2`) | ingen (tonen skiljer den från registret) |
| `user` | Användarens egen uppgift: något grundaren själv har skrivit in eller påstått, till exempel i profilen | bär (`#8a4a6b` på `#f5e6ee`, 5,3:1) | "Din uppgift" / "Your input" |
| `simulation` | Simulering (uppdrag 2.2), ger aldrig poäng | lila | "Simulering" |
| `example` | Påhittad exempeldata, **bara i demot** | vit med streckad kant | "Exempel" |

Regler:
- **Ingen tagg får se ut som registrets om den inte är ett register.** Därför
  är `register` den enda grå typen, och den enda förutom `customer` utan
  etikett.
- **Etiketten gör att typen inte hänger på färgen ensam.** Det är samma princip
  som "Simulering" (uppdrag 2.2). `customer` har ingen etikett i dag, eftersom
  en etikett skulle ändra demots sidor. Lägg till den om petrol och grått
  visar sig svåra att skilja åt.
- **`SourceTag` har fortfarande `register` som standard.** Den som visar en
  källa som inte är ett register måste därför sätta datatypen. Pulsens
  liveadapter ger artiklar: rutten sätter `"media"`.
- **`example` används aldrig i `/app` eller `/start`** (vakttestet
  `noExampleSources`). Saknas verkligt underlag visas luckan.
- Kontrasten är uträknad mot taggens egen botten (WCAG AA, minst 4,5:1).

**Så används det i Pulsen (för Bruno):** `/app/pulsen` skickar
`sourceDataType: "media"` till `Pulse` (`app/(app)/app/pulsen/page.tsx`),
samma som Hem gör sedan i dag (`sourceDataTypes: { pulse: "media" }` i
`app/(app)/app/page.tsx`). Skärmen behöver ingen ändring.

**Pulsens exempelkällor: de tre startsignalerna räknas till steg 01.**
Beslut av Bruno i PR 6, godkänt av Theodor. Demots Pulsen-signaler är
påhittade, så varje signal bär en exempelkälla för steget där den dyker upp
i scenariot ("Påhittad data, steg NN", PR 11). Två signaler låses upp av ett
steg och får det stegets nummer: marknadssignalen efter steg 03 och
segmentsignalen efter steg 06. De tre andra är synliga från första momentet
och hör inte till något steg; de är "dagens puls" när resan börjar. De får
steg 01, det första steget, i stället för att uppfinna ett eget ursprung (en
ny `ExampleOrigin` som "Pulsen" hade krävt ändringar i
`adapters/demo/exampleSource.ts` och i18n). Datumet är scenariots datum för
steg 01, som för alla exempelkällor. Stegen kommer ur `getSignalSteps()` i
`adapters/demo/PulseProvider.ts`, som både adaptern och demots Hem använder.
Får en ny startsignal ett eget steg ska den listan ändras, inte sidorna.

**Pulsens signaler påstår inget om verkliga aktörer.** Beslut av Theodor
(2026-10-01). En påhittad signal får inte säga vad en myndighet eller ett
register har gjort eller visat, även med exempeltagg: "Skatteverket skärper
kraven …" blev "Fler byråer efterfrågar digital arkivering …" (kategorin
"Reglering" blev "Bransch"), och "Registret bekräftar …" blev "Fler tecken
pekar på samma segment …". Demoadaptern bär inga myndighetsnamn längre, inte
ens i `source`: källan sätts av adaptern som exempelkälla.

**Källverifiering juridik, del 2.** Oskar Jaeger läste själv
myndighetssidorna i webbläsaren 2026-10-01: Skatteverket (F-skatt, moms,
arbetsgivare), IMY (rättslig grund, register över behandling), EUR-Lex
(GDPR-förordningen) och Konsumentverket (marknadsföringslagen, ångerrätt).
Adresserna finns i verifieringsloggen i `docs/moduler/juridisk-koll.md`.
Fyra texter rättades (F-skatt, moms, GDPR-registret och ångerrätt).
`gdpr_personuppgifter` delas i `gdpr_rattslig_grund` och `gdpr_register`
med var sin IMY-sida. Moms delas inte: sidan som används säger både
huvudregeln och undantaget. Gränsen 120 000 kr för moms står i texten
till Gemini, eftersom den har källa och datum, på samma sätt som 25 000 kr
för aktiekapital. EUR-Lex pekar på den svenska versionen. Riksdagen är inte
kontrollerad och inget ämne använder den. Om den ska finnas kvar väntar på
Theos beslut. Ingenting är juristgranskat.

## 2026-10-02

**Pulsens risksignaler: två Tavily-anrop per grundare och dag, klassning utan modell, ingen migration.**
Beslut av Bruno, efter Hampus Hedelius tips om yttre omständigheter
(Rotary-pitchen 2026-10-02). Detaljer i `docs/moduler/webbresearch-och-pulsen.md`, "Risksignaler".
- **Kostnad:** varje hämtning gör en nyhetssökning och en risksökning. Taket
  går från ett till två anrop per grundare och dag. Ett tema per dag i tur
  och ordning, i stället för sex sökningar per dag, håller kostnaden fast.
  Att dela sökningar per bransch skulle sänka den ytterligare men kräver en
  ny tabell. Det tas när Erik godkänt en migration.
- **Ingen modell, ingen allvarlighetsgrad.** Riskområdet läses ur ord i
  artikeln. En gradering ("hög risk") skulle vara en gissning utan källa, och
  datalöftet gäller. Förslagen är allmänna i18n-texter per område, inga
  påståenden om den enskilda nyheten.
- **Ingen migration.** Riskområdet sparas i den befintliga kolumnen
  `pulse_signals.category` som `risk:<område>`.

**Pulsens möjligheter och spelböcker.** Beslut av Bruno (2026-10-02), efter
teamets önskan att Pulsen ska visa hur en risk påverkar företaget och hur
man löser den.
- **Möjligheter** (stöd och bidrag, offentlig upphandling) delar motor och
  rotation med riskerna. Två Tavily-anrop per grundare och dag som förut.
- **Spelböckerna är förskrivna i18n-texter, inte genererade.** Allmänna råd
  per område, utan siffror och utan påståenden om den enskilda nyheten. De
  märks "ännu inte granskad av en rådgivare" tills en kunnig person (förslag:
  Hampus Hedelius) har läst dem. Att räkna påverkan med grundarens egna
  siffror väntar på att Resan sparar kalkylen; en AI-bedömning per nyhet är
  ett eget teambeslut.

**Pulsens omdöme och bevakningar (gren `modul/pulsen-bevakningar`, väntar på Eriks godkännande).**
Förslag av Bruno (2026-10-02). Två nya tabeller, `pulse_feedback` och
`pulse_watches`, med RLS prövad i PGlite. Porten får fyra valfria metoder,
så att demoadaptern (demot är fryst) inte behöver ändras. Adaptern tål att
tabellerna saknas, så koden kan mergas före migreringen. "Relevant" sparas
men används inte än; den är underlag för en senare rangordning.

## 2026-10-03

**Medgrundaren, version 1 (gren `modul/medgrundaren`, väntar på granskning).**
Uppdrag från Bruno (2026-10-03). Se `docs/moduler/medgrundaren.md`.
- **Bara text, inga verktygsanrop.** Kontraktet för `sendMessage` ändras inte.
  Function calling mot de andra portarna tas i en senare session.
- **Steg 01 och 02.** Prompten får stegets mål ur Resan och det som redan är
  känt ur Profilen och Minnet (och den aktiva idén ur Projekt och idé), via
  deras portar. Steg 01 och 02 har egen styrning i prompten.
- **Steg 03 och senare: Medgrundaren svarar ändå** (Brunos val). Prompten får
  då bara stegets titel och ingress ur Resan, ingen särskild styrning.
- **Modell:** Gemini via `lib/server/gemini.ts`, den nya funktionen
  `generateText`. Samma modell som Juridisk koll.
- **Samtalet sparas i `public.cofounder_messages`** (migrering
  `20261003120000_cofounder_messages.sql`), med RLS och utan service role.
  Bara select- och insert-policy för egna rader. **Ingen update- eller
  delete-policy, med flit:** taket räknas ur raderna, och gick de att ta bort
  kunde en grundare nollställa sitt eget tak. Raderna försvinner när kontot tas
  bort (`on delete cascade`). Att låta grundaren rensa sitt samtal kräver ett
  nytt beslut (till exempel en security definer-funktion som behåller räkningen).
- **Kostnadstak:** högst 20 tidigare meddelanden per anrop, högst 40 meddelanden
  från grundaren per kalenderdag (Stockholm). Över taket visas en text ur i18n.
  Gränserna ligger i `core/cofounder.ts`.
- **Taket hålls av databasen** (efter säkerhets- och kodgranskningen
  2026-10-03). Funktionen `public.reserve_cofounder_message` räknar dagens
  meddelanden och sparar grundarens nya meddelande i ett steg, under ett lås
  per användare. Den är `security invoker`, så RLS gäller som vanligt, och
  ingen service role används. Meddelandet sparas innan Gemini anropas, så att
  samtidiga anrop inte båda passerar taket och ett misslyckat anrop också
  räknas. Ordningen i samtalet kommer ur kolumnen `seq` (identity), inte ur en
  tid som klienten kan sätta.
- **Siffror i modellens svar** (Brunos val): systemprompten förbjuder egna
  siffror och statistik. Bara siffror som grundaren själv angett får upprepas.
  Det finns ingen kodspärr, så en siffra kan slinka igenom. Det är dokumenterat
  som känd begränsning.
- **Ändrad port, Minnet:** `MemoryRepository` får den valfria metoden
  `getKnownProfile()` (Brunos val). Den ger de profilfält som är ifyllda, även
  för ingång B som bara svarar på tre frågor. Demoadaptern ändras inte.
- **Ny port:** `CofounderConversationRepository` (`ports/CofounderConversation.ts`)
  med demo- och liveadapter.
- **"Sedan tidigare" på /app:** grundarens egna uppgifter. En rad med en siffra
  får källan "Din uppgift" (profilsamtalet, Hjärnan eller Spåret) med dagens
  datum, eller postens datum för Spåret.

**Personlig spelbok, Medgrundaren från Pulsen och Min plan (gren `modul/pulsen-spelbok`, väntar på granskning).**
Uppdrag från Bruno (2026-10-03). Se `docs/moduler/webbresearch-och-pulsen.md`
("Personlig spelbok") och `docs/moduler/min-plan.md`.
- **Personlig spelbok utan modell.** Överst i spelboken visas det grundaren
  redan har berättat: idén ur projektet, tid, pengar och vad hen kan riskera
  ur Profilen, och för möjligheter om steget "Det formella" är klart. Bara
  grundarens egen text och läget i Resan. Beslutet att spelböckerna är
  förskrivna i18n-texter (2026-10-02) står kvar: frågorna och stegen ändras
  inte, grundaren jämför själv. En rad med en siffra får källan "Din uppgift".
- **"Gå igenom det här med Medgrundaren".** Länken bär bara signalens id
  (`/app/medgrundaren?signal=<uuid>`). Sidan letar upp signalen bland
  grundarens egna signaler på servern och förifyller en fråga ur i18n med
  rubrik, källa och datum. Inget skickas och inget räknas mot Medgrundarens
  tak förrän grundaren trycker Skicka. Ingen ny modellkostnad.
- **Min plan: ny port och ny tabell.** `PlanRepository` (`ports/PlanRepository.ts`)
  med demo- och liveadapter, tabellen `public.plan_items` (migrering
  `20261003180000_plan_items.sql`) med RLS för select, insert, update och
  delete på egna rader. Raderna försvinner när kontot tas bort. Stegen hämtas
  ur spelbokens i18n på servern, aldrig från klienten. Samma steg från samma
  signal sparas en gång (unikt index). Högst 50 öppna uppgifter
  (`core/plan.ts`). Planen visas och bockas av i Resan.
- **`screens/` är ändrad** (`Pulse.tsx`, `Journey.tsx`, `Cofounder.tsx`,
  `blocks/CofounderChat.tsx`) och `design/site.css` har nya klasser
  (`fdd-playbook__personal`, `fdd-playbook__actions`, `fdd-plan`). Stäm av
  med den som har `screens/` innan merge.

**Onboarding v4 (gren `plattform/onboarding-v4`, PR 1 av 2).** Erik
2026-10-03, enligt systemspecifikationen v4 §4 och §3.2. Plan och status:
`docs/status/2026-10-03-onboarding-v4.md`.
- **Nya frågor, val i stället för fritext.** Sju frågor per ingång, sex val
  med stabila id:n och en fritext (`frustration` i A, `customer` i B). Ingen
  självskattning: `bio` och `risk` ställs inte längre. Frågorna och valen står
  i `core/onboarding.ts` och speglas av `public.onboarding_v4_questions()`,
  vaktat av `onboardingWrite.pg.test.ts`. Ett id byts aldrig, eftersom det
  står i databasen.
- **Steg 1 är klart efter startkortet.** De fyra första frågorna är
  kärnfrågor. När de är besvarade visas startkortet, och "Till appen" anropar
  `complete_onboarding`, som kräver kärnfrågorna. Spärren mot /app öppnas då.
- **Resten är återstående frågor.** De härleds (ingångens frågor minus de
  besvarade) och lagras inte som en egen lista. De visas under Återstår i
  Minnet, där grundaren kan svara. Medgrundaren ställer dem i PR 2.
- **Varje svar sparas för sig** (`public.save_onboarding_answer`), så att
  samtalet kan avbrytas. Före klar onboarding får ett svar ändras. Efteråt tas
  bara obesvarade frågor emot (55000 annars).
- **Startkortet bygger bara på svaren** (`core/startFrame.ts`): tid på tre
  månader, pengar, en regelbaserad bedömning märkt som Medgrundarens och en
  första uppgift i verkligheten. Ingen modell, inget register, inga bevis,
  ingen poäng. Siffrorna bär källan "Din uppgift".
- **Gamla fritextsvar räknas inte om.** Konton som redan var klara får
  `onboarding_version = 1`, och svaren står kvar i sina kolumner och visas i
  Minnet som förut. Alla v4-frågor för ingången räknas som återstående för
  dem. Att gissa ett val ur en fritext vore att hitta på data.
- **Ändrade portar** (alla valfria, så att demoadaptrarna inte ändras):
  - `OnboardingQuestion.kind?` och `OnboardingQuestion.choices?`
    (`ports/ProfileRepository.ts`).
  - `ProfileRepository.saveOnboardingAnswer?(answer)` och
    `ProfileRepository.getOnboardingAnswers?()`.
  - `SavedOnboardingAnswer` (`{ answer, answeredOn }`): det
    `saveOnboardingAnswer` och `getOnboardingAnswers` ger.
  - `ProfileSummary.answers?` (`ports/MemoryRepository.ts`): v4-svaren med
    frågan och valets etikett.
  - `MemoryRepository.getPendingOnboardingQuestions?(locale)`.
- **Två nya kolumner i `profiles`**, stängda för klienten:
  `onboarding_answers` och `onboarding_version`. Inga nya RLS-policyer.
- **Källans datum är dagen svaret gavs, aldrig dagens** (Erik, efter
  granskningen av #70). Varje svar sparas som `{answer, answered_at}`, där
  `answered_at` sätts av databasen. Ett svar utan tid visar källan "Din
  uppgift" utan datum (`SourceTag` med tomt `hämtad`), aldrig ett påhittat.

**Min plan, version 2 (gren `modul/min-plan-v2`, väntar på granskning).**
Uppdrag från Bruno (2026-10-03). Se `docs/moduler/min-plan.md`.
- **Grupper per nyhet.** Rubriken visas en gång och stegen under. Egna
  uppgifter och uppgifter utan sammanhang får egna grupper. Helt avbockade
  grupper hamnar sist och är ihopfällda. Inga räknare ("2 av 4"), så att
  ingen ny siffra behöver källa.
- **"Hjälp mig med det här"** på varje öppen uppgift, och på Hem: länk till
  `/app/medgrundaren?task=<uuid>`. Uppgiften letas upp i grundarens egen plan
  på servern och blir en förifylld fråga. Inget skickas förrän grundaren
  trycker Skicka.
- **Ändra och egna uppgifter.** Porten `PlanRepository` får `updateText`, och
  `PlanItem` får `origin`. Nytt ursprung `own` (migrering
  `20261003210000_plan_items_egna.sql`, vidgar bara check-villkoret, RLS och
  policyerna är oförändrade). Samma text två gånger från samma ursprung nekas.
- **"Nästa i din plan" på Hem:** första öppna uppgiften, med länk till
  Medgrundaren och till planen i Resan. Inget kort utan öppna uppgifter.
- **Rättat från förra versionen:** Min plans CSS använde klassen `.fdd-plan`,
  som Affärsplanen redan använder, och skrev över dess rutnät. Min plan heter
  nu `.fdd-myplan`.
- **Ingen poäng för avbockade uppgifter.** Poängen kommer bara från bevis med
  källa; en ikryssad ruta är inget bevis.

## 2026-10-04

**Pulsen v3 (gren `modul/pulsen-v3`, väntar på granskning).**
Uppdrag från Bruno (2026-10-04). Se `docs/moduler/webbresearch-och-pulsen.md`
("Pulsen v3") och `docs/moduler/min-plan.md`.
- **Bevakningar ger inte längre fel träffar.** Ett bevakningsord räcker när
  det står i rubriken, eller när projektet saknar nyckelord; nämns det bara i
  förbigående i texten krävs ett av projektets ord. Språkfiltret läser även
  artikelns text när rubriken saknar svenska tecken och småord, och känner
  igen vanliga engelska rubrikord ("Gallery", "Photos").
- **"Varför det spelar roll" av Gemini: byggd men AVSTÄNGD.** Beslutet
  2026-10-02 (klassning utan modell) står kvar tills Erik och Theodor säger
  annat. Med `PULSE_AI_WHY=true` skrivs en mening per ny nyhet, ett anrop per
  hämtning, aldrig vid läsning. Meningen får inte innehålla siffror, länkar
  eller kod; annars används den förskrivna texten. Den märks på skärmen
  ("Skrivet av AI … Kontrollera i källan") och visas bara på svenska.
- **Omdömet märks.** "Pulsen lär sig av dig" visar sorterna och orden som
  väger tyngre, och en signal som liknar det grundaren gillat märks. Inga
  antal, så ingen ny siffra behöver källa.
- **Sista ansökningsdag** ur artikelns text (`core/deadline.ts`, bara efter
  tydliga fraser, aldrig en gissning), bara för möjligheter. Visas med
  artikeln som källa, följer med till Min plan och till kortet på Hem. Inget
  "om 5 dagar": bara datumet, så att siffran har sin källa.
- **"Veckans puls"** på Hem i stället för "Dagens signal" (bara /app): högst
  två signaler från den senaste veckan, risker och möjligheter först. Demot
  är oförändrat.
- **Layout:** ett ensamt signalkort tar hela bredden, två delar på den.
- **Migrering** `20261004090000_pulsen_v3.sql`: nya valfria kolumner
  (`pulse_signals.deadline`, `pulse_signals.why_ai`, `plan_items.due_*`).
  Utan den fungerar allt som förut.
- Porten `PulseProvider` fick den valfria `getLearning`, `PulseSignal` fick
  `boosted`, `whyByAi` och `deadline`, och `PlanRepository` fick `due`.

> Förslag från sessionen "Marknad låser upp steg 03" (gren `modul/marknad-steg3`).
> Godkänns eller nekas i PR:en.

**Systembevis skrivs av servern med service role (`lib/server/systemEvidence.ts`).**
`public.record_evidence` vägrar medvetet registersorterna, så att en grundare
aldrig kan skriva in egna registersiffror. Det betyder att ingen väg fanns för
systemets egna bevis, och att steg 03 och 04 inte gick att klara. Servern
skriver dem nu med `SUPABASE_SERVICE_ROLE_KEY`, samma mönster som
`lib/server/scoreSnapshots.ts`. Skydden: bara sorter som är `system` i
`core/evidenceKinds.ts`, användare och projekt ur sessionen, https-länk till
källan (bevislagring 7.3c), triggern sätter del, datatyp och poäng, och
lint-regeln tillåter bara `adapters/live/EvidenceRecorder.ts` att importera
filen. Marknadsbilden hämtas på nytt på servern med licensgrinden innan något
sparas, aldrig mottagen från webbläsaren. Vakten i `lib/server/registryCache.test.ts`
har fått filen som tredje tillåtna läsare. Ingen ny migrering.

**SCB:s bolagslista per bransch är ett platshållarfel tills den byggs.**
Före 2026-10-04 kastade `fetchCompanies` ett riktigt `RegistryTransportError`
eftersom ingenting i SCB-transporten fanns. Nu finns antalet per bransch
(`fetchCompanyCount`, `/count`, ett anrop, inga namn) och branschsökningen ur
kodtabellen. Hela listan kräver 26–32 sidor i tur och ordning och därmed cache,
som väntar på SCB:s villkor. Den kastar därför `ScbListingUnavailableError`
(ärver `NotImplementedError`): sektionerna som behöver listan visar "Kommer
snart", och marknadsbilden visar antalet med resten som luckor.

**Grundarens bransch är den som det senaste giltiga registerbeviset gäller.**
Ingen ny kolumn på `projects`: `subject_ref` på `registerMarketCount`
("sni:69.201") är redan branschen. Byter grundaren bransch återkallas de gamla
registerbevisen, så att två branscher aldrig ger dubbelt underlag till samma del.

**"Det här är min bransch" klarar steg 03 (och 04) direkt** när det är det
aktuella steget och kraven håller, i samma server action. Databasen prövar
kraven igen i `public.complete_journey_step`.
