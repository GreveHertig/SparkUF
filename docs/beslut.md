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
| 01 Om dig | Svar på alla fyra passformsfrågor (`profileFitAnswer` med `fit:skills`, `fit:network`, `fit:time`, `fit:money`) |
| 02 Möjligheter | Ett aktivt projekt |
| 03 Marknaden | `registerMarketCount` (systembevis ur registret) |
| 04 Kunden | `registerCompetitorSet` (systembevis ur registret) |
| 05 Samtalen | Minst ett problembevis (bekräftar eller avvisar) **och** minst ett prisbevis (godtar eller avböjer). Självrapporterat räcker (B6). |
| 06, 07, 12 | Inget beslutat krav. Kan inte markeras klara. Se de öppna punkterna nedan. |
| 08 Omfånget | `productScopeFromEvidence` |
| 09 Det formella | `formalRegistrationDone` |
| 10 Live | `productPublished` |
| 11 Första kunderna | `payingCustomer` |

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

### Öppna punkter till Theodor: krav för steg 06, 07 och 12

De tre stegen har inget mätbart krav. Utan beslut går de aldrig att markera
som klara. Steg 06 och 07 stoppar då hela resan efter steg 05: fasen kommer
aldrig till Lansera och taket stannar på 66. Inget av förslagen är byggt.

**Steg 06 Domen.** Förslag: minst **fem** kundbevis som räknas i Problem och
Betalningsvilja tillsammans, från minst **tre** olika bolag (`subject_ref`).
- Motiv: uppdrag 1.5 säger att domen fattas "baserat på faktiska svar med
  citat och siffror". Det mätbara i det är antalet svar och att de inte alla
  kommer från en kund.
- Det går att bygga med dagens tabeller, utan ny sort.
- Fem svar och tre bolag är startvärden att diskutera. Trappan för avtagande
  värde ger fullt värde åt de tio första.
- Motsägande svar räknas med. Domen kan lika gärna bli "pivotera".
- Självrapporterade svar räknas (B6), men taket på halva delen gäller ändå för
  poängen.
- Själva valet (kör, förfina eller pivotera) kräver en egen lagring. Domen är
  en stubbe och ska inte vara ett villkor än.

**Steg 07 Affärsfall och pris.** Förslag: minst ett kundbevis som räknas och
**godtar ett pris** (`customerPriceAccepted`), plus ett **beslutat pris** som
en ny sort `priceDecided` (grundaren som källa, `subject_ref` = `price`,
pris och spann i `quote`).
- Motiv: 1.5 kräver att priset motiveras av fyra saker, och "vad kunderna
  själva sagt" är den enda som går att mäta i dag.
- Ett beslutat pris är stegets faktiska resultat.
- Kräver en ny sort och därmed en migrering. `base_points > 0` i
  `evidence_kinds` betyder att sorten måste ge poäng. Antingen ändras villkoret
  till `>= 0`, eller så ger sorten en liten poäng i Betalningsvilja.
- Alternativ utan ny sort: bara kravet om ett godtaget pris. Det är enklare men
  svagare, eftersom steget då kan bli klart utan att grundaren satt något pris.

**Steg 12 Kapital.** Förslag: en ny sort `fundingApplied`: en inskickad
ansökan eller ett beslut från en finansiär.
- `enteredBy: either`, `subject_ref` = finansiären och diarie- eller
  ärendenumret, och källan är programmets URL.
- Motiv: 1.5 nämner Almi, Vinnova, Tillväxtverket, regionala medel och
  banklån. En inskickad ansökan är det minsta mätbara utfallet, och det går
  att kontrollera.
- Steg 12 påverkar varken fasen eller taket, som redan är Växa och 100 efter
  steg 11. Kravet styr alltså bara om resan kan avslutas, inte poängen.
- Alternativ: låt steg 12 vara klart när steg 11 är klart och ett
  bootstrapping-beslut är angivet. Det är svagare, och 1.5 nämner
  bootstrapping som ett av alternativen.

