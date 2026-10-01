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
