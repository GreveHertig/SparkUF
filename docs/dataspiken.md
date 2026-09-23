# Dataspiken — vilken källa bygger vi RegistryProvider på?

Research, ingen kod. Underlag för `docs/moduler/registret.md` (porten
`ports/RegistryProvider.ts`) och Datalöftet i `docs/uppdrag.md` 1.2.
Skriven 2026-09-18 på branchen `dataspiken`.

## Status inför Fas 1 — inga blockerare kvar

De två punkter som tidigare stod som olösta är avgjorda nog för att gå
vidare med `RegistryProvider` (Fas 1):

1. **Licens för namngivna företag: Verifierat 2026-09-23.** Erik har läst
   Bolagsverkets sida om värdefulla datamängder och klistrat in den
   ordagrant (https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html,
   sidans datum 2025-11-21). Stycket "Användning av värdefulla data" är
   citerat i avsnitt 2: fri användning för kommersiella syften och nya
   tjänster, modifiering och bearbetning, så länge personuppgifts- och
   sekretesslagar följs. Källhänvisning "kan" krävas, så vi anger alltid
   Bolagsverket/SCB som källa. Det som *inte* står i texten: någon namngiven
   licens, och några särskilda regler om enskilda firmor eller reklamspärr
   (de kommer från GDPR, fråga 4). Rekommendationen står kvar som vår egen
   policy: visa bara namngivna listor för **aktiebolag utan reklamspärr**.
   (Historik: märkt Verifierat 2026-09-20 utan citat, nedgraderat till
   Sekundärt 2026-09-23, verifierat med citat samma dag.)
2. **Mottagarnas kontaktuppgifter (steg 05): beslut taget.** Hunter.io
   övervägdes och valdes bort: gratisnivån delar 50 krediter per **hela
   kontot** och månad, inte per person, vilket inte räcker för utskick i
   omgångar. Vi bygger en egen mejlsökning med **Tavily** (websökning efter
   företagets "Kontakta oss"-sida) och **Gemini** (extraherar
   mejladressen ur sidans text). Grundaren bekräftar eller redigerar alltid
   adressen före utskick, aldrig automatiskt. Det här är ett beslut för
   **Fas 2 (`OutreachProvider`)** och byggs inte nu. Registret ger fortfarande
   inga kontaktuppgifter, så Fas 1 påverkas inte.

## Kort svar

- **MVP bygger vi på Bolagsverkets och SCB:s "API för värdefulla datamängder".**
  Gratis, inget avtal, öppen licens enligt EU-lag. Åtkomst väntar på
  en kundanmälan (**inte skickad än**, bekräftat av Erik 2026-09-19; tidigare version av det här dokumentet sa felaktigt "skickad").
- **Allabolag/UC går vi inte vidare med nu.** Villkoren förbjuder
  uttryckligen systematisk lagring, det är sannolikt en betald B2B-tjänst
  och det kräver ett avtal. Det är ett **öppet beslut för grundaren**, se
  avsnitt 4.
- **Ratsit: vi går inte vidare.** Se avsnitt 5.
- **Två saker är inte lösta av den här spiken och kan ändra planen:**
  1. ~~Bolagsverkets användarvillkor är inte lästa av en människa.~~
     **Avgjort 2026-09-23:** Erik har läst och ordagrant citerat
     Bolagsverkets text om användning av värdefulla datamängder. Licensen
     för namngivna företag är **Verifierat** (fri kommersiell användning,
     inom personuppgifts- och sekretesslag). Se
     avsnitt 2. Kvarstår som två olösta frågor:
  1. ~~Det är oklart om Bolagsverkets API går att söka på SNI-kod.~~
     **Avgjort 2026-09-21:** det går inte. API:et har bara fyra endpoints
     och stöder bara uppslag på känt organisationsnummer. `searchCompanies`
     måste bygga på SCB. Se avsnitt 2 ("Bolagsverkets API — sökning/listning
     på SNI-kod") och fråga 2 i avsnitt 6.
  2. Registerdatan ger **inga kontaktuppgifter** (ingen e-post eller
     telefon). Mottagarnas e-post hämtas i Fas 2 via egen sökning
     (Tavily + Gemini), se överst och avsnitt 6.

## Så läser du märkningarna

| Märkning | Betyder |
|---|---|
| **Verifierat** | Läst på källans egen sida eller i EU-förordningens text den här sessionen. |
| **Sekundärt** | Kommer från en söksammanfattning av källans sida, eller från Erik. Inte läst i original. |
| **Osäkert** | Vi vet inte. Måste kontrolleras innan vi bygger på det. |

Obs: sidorna hämtades med ett verktyg som sammanfattar innehållet, inte
med ordagranna kopior. Även "Verifierat" är alltså ett utdrag. Kontrollera
citaten i avsnitt 4 mot originalet innan de används i något beslut.

## 1. Översikt

| | Bolagsverket + SCB (värdefulla datamängder) | Allabolag / UC | Ratsit |
|---|---|---|---|
| **Kostnad** | Gratis, inget avtal (Verifierat: Bolagsverkets API-sida, läst av Erik 2026-09-19, sidans datum 2026-06-30, och EU-förordningen) | Ingen publik prissättning (Verifierat). Troligen betald (Osäkert) | Styckpris per dokument, t.ex. registreringsbevis ca 119 kr inkl. moms (Sekundärt, ur sökresultat) |
| **Åtkomst** | Kundanmälan, nycklar via e-post/SMS (Sekundärt) | Kontaktformulär, developerportal (Verifierat) | Oklart. Ingen publik utvecklaråtkomst hittad |
| **Licens/villkor** | Öppen licens, CC BY 4.0 eller mindre restriktiv (Verifierat i förordningen). Fri användning för kommersiella och icke-kommersiella syften, får modifieras, bearbetas och kombineras, inom personuppgifts- och sekretesslag; källhänvisning kan krävas (Verifierat: Bolagsverkets sida, ordagrant citerad av Erik 2026-09-23, se 2) | Systematisk lagring förbjuden utan skriftligt medgivande (Verifierat, se 4) | Automatiserad hämtning verkar förbjuden (Sekundärt) |
| **Lämpar sig för MVP** | Ja | Nej, inte utan avtal | Nej |

## 2. Bolagsverket + SCB — värdefulla datamängder

### Vad det är
Ett gemensamt REST-API (JSON, OAuth 2) för de företagsdata som EU
klassar som "värdefulla datamängder" (genomförandeförordning (EU)
2023/138). SCB:s uppgifter finns i samma API som Bolagsverkets, plus
filnedladdning (Sekundärt: Bolagsverkets sidor, SCB:s sida).

### Vilka uppgifter (Verifierat, SCB:s lista över 15 variabler)
Organisationsnamn, organisationsform, **reklamspärr**, avregistrerad
organisation, avregistreringsorsak, pågående avveckling/omstrukturering,
verksam organisation (F-skatt, momsreg, arbetsgivarreg), alla
organisationsnamn, juridisk form, postadress, registreringsdatum,
**SNI-koder**, verksamhetsbeskrivning, identitetsbeteckning (org.nr) och
**digitalt inlämnade årsredovisningar**.

Det som **inte** finns i listan: omsättning och antal anställda som
fristående fält, län, styrelse eller firmatecknare, telefon, e-post.

### Årsredovisningarna: strukturerad data eller dokument?
**Svar: båda, men strukturen ligger inuti dokumentet.**
- Årsredovisningarna levereras i **iXBRL** (Sekundärt: Bolagsverkets
  sidor). iXBRL är en HTML-fil med maskinläsbara taggar för varje siffra,
  byggd på K2/K3-taxonomin (Sekundärt: Wolters Kluwer, Bolagsverkets
  tekniska dokumentation). Nedladdning sker som zip-filer som packas upp
  till iXBRL (Sekundärt).
- Det är alltså **ingen färdig tabell**. Vi måste hämta en fil per bolag
  och år och läsa ut taggarna (t.ex. nettoomsättning) själva.
- **Bara aktiebolag lämnar in digitalt** (K2/K3). Enskilda firmor,
  handelsbolag och ekonomiska föreningar saknar då siffror i det här
  materialet (Sekundärt).
- **Osäkert:** vilka taggar som faktiskt finns för små bolag
  (nettoomsättning, medelantal anställda), och hur många bolag som har
  ett digitalt inlämnat år. Kontrolleras mot riktiga filer när nycklarna
  finns.

### Kostnad
Gratis och inget avtal krävs. **Verifierat** på Bolagsverkets egen sida
(API för värdefulla datamängder, https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder/apiforvardefulladatamangder.5513.html,
sidans datum 2026-06-30, läst av Erik 2026-09-19): "Det krävs inget avtal
för att du ska få använda vårt API för värdefulla datamängder." och
"Värdefulla datamängder är avgiftsfritt. Enligt EU-kommissionens direktiv
ska det vara kostnadsfritt för alla att använda." Även EU:s förordning
kräver avgiftsfri tillgång (Verifierat). Sidan tar inte upp visning eller
lagring av namngivna företag, se nedan.

### Får vi visa och lagra namngivna företag? (frågan från Erik)
**Svar: ja för företag. Verifierat** (Bolagsverkets sida, ordagrant citerad av Erik 2026-09-23, se nedan). Personuppgifter i enskilda firmor är en separat GDPR-fråga (fråga 4).

Det som är verifierat:
- Förordning (EU) 2023/138 artikel 4 kräver att datamängderna är
  tillgängliga "under Creative Commons BY 4.0 eller en likvärdig eller
  mindre restriktiv öppen licens", med **obegränsad återanvändning** och
  avgiftsfritt (Verifierat via EUR-Lex). Datamängden "Företag och
  företagsägande" nämner uttryckligen företagsnamn, status,
  registreringsdatum/-nummer, adress, juridisk form, aktivitetskod och
  finansiella rapporter.
- Förordningen tillåter "kompletterande villkor för återanvändning av
  personuppgifter där det är tillämpligt" (Verifierat).

**Verifierat, Bolagsverkets egen text** (https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html,
sidans datum "Uppdaterad: 2025-11-21", läst och ordagrant inklistrad av
Erik 2026-09-23), stycket "Användning av värdefulla data":

> När det gäller värdefulla datamängder är de öppna för vidareutnyttjande
> enligt vissa regler. Du får använda dessa data fritt för kommersiella och
> icke-kommersiella syften, exempelvis för att skapa nya tjänster eller
> produkter, så länge användningen inte bryter mot lagar om skydd av
> personuppgifter eller sekretess. Data kan modifieras, bearbetas och
> kombineras med andra källor, vilket gör det möjligt att utveckla
> innovativa applikationer eller utföra djupgående analyser.
>
> Det är dock viktigt att se till att data hanteras enligt de villkor och
> licenser som gäller, vilket ibland kan inkludera krav på att ange källan
> och säkerställa att informationen är korrekt återgiven. Digg, som
> ansvarar för vägledning kring öppna data, rekommenderar att information
> om licenser och säkerhet granskas noggrant för varje datamängd.

Samma sida: "Detta gör det möjligt för dig att bygga nya digitala tjänster
[…] värdefulla datamängder är avgiftsfritt och kräver inget avtal!"
Reklamspärr (SCB) finns i listan "Datamängder som ingår".

Vad det betyder för oss:
- **Visa namngivna företag i en kommersiell tjänst:** tillåtet
  ("fritt för kommersiella … syften", "skapa nya tjänster eller produkter").
- **Bearbeta och kombinera** (t.ex. med SCB och egna analyser): tillåtet,
  uttryckligen.
- **Lagring och cachning** (t.ex. i Supabase): nämns inte ordagrant, men
  följer av fri användning för nya tjänster och av förordningens krav på
  obegränsad återanvändning (ovan). Bedömning, inte citat.
- **Källhänvisning:** texten säger att den "ibland kan" krävas. Vi anger
  alltid Bolagsverket/SCB som källa (Datalöftet kräver det ändå) och
  återger datan korrekt.
- **Villkoret:** lagar om personuppgifter och sekretess. Texten har inga
  egna regler om enskilda firmor, profilering, samkörning eller
  reklamspärr. Tidigare versioner av det här dokumentet påstod att sidan
  sa det; det gör den inte. De frågorna hör till GDPR, se fråga 4.

Det som **inte** är löst:
- **Ingen licens namnges.** Texten hänvisar till "de villkor och licenser
  som gäller" utan att säga vilka. Hittas en uttrycklig licens (t.ex. i
  kundanmälan eller utvecklarportalen), citera den här. Blockerar inte.
- **SCB:s företagsregister-API** (SCB-spåret, alternativ A) är en separat
  tjänst med egna användarvillkor. Den här texten täcker inte dem.
- **Personuppgifter är den verkliga risken, inte licensen.** Enskilda
  firmor är fysiska personer, och SCB:s register innehåller uttryckligen
  "fysiska personer som har ett inregistrerat företagsnamn och/eller är
  registrerade för moms och/eller F-skatt" (Verifierat, SCB). Därtill
  finns variabeln **reklamspärr** (Verifierat). En namngiven kundlista som
  vi lagrar och kontaktar (steg 04–05) måste respektera den och GDPR.
  **Förslag:** i MVP visar och lagrar vi namngivna bolag bara för
  **juridiska personer (aktiebolag)** och filtrerar bort reklamspärrade.
  Enskilda firmor räknas bara i aggregat. Det här är ett förslag, inte
  juridisk rådgivning. Ta det med Juridisk koll och en vuxen/handledare.

### SCB:s del
- SCB:s **avgiftsfria** företagsregister-API ger bl.a. SNI-koder,
  arbetsställeadresser och **antal anställda i storleksklasser**
  (Sekundärt). Kräver att man godkänner API:ets användarvillkor och får
  certifikat via scbforetag@scb.se.
- Begränsningar: max 2 000 rader per anrop och 10 anrop per 10 sekunder
  och användare. Bara aktuell data, ingen historik (Sekundärt, SCB).
- **Autentiseringen byter från certifikat till API-nycklar i september
  2026**, samt paginering läggs till (Sekundärt, SCB). Kolla vad som gäller
  när vi får åtkomst.
- **Osäkert:** SCB:s statistikdatabas (branschstatistik som skulle kunna
  ge `medianRevenueKsek` direkt) har vi **inte** undersökt.

### Vad det betyder för porten (`ports/RegistryProvider.ts`)

| Portfält | Möjlig källa | Status |
|---|---|---|
| `RegistryQuery.sniCode` | SCB SNI-koder | Verifierat att fältet finns. Bolagsverkets API kan **inte** söka på det (avgjort 2026-09-21), listning måste komma från SCB |
| `RegistryCompany.name`, `sniCode` | Register | Verifierat |
| `RegistryCompany.employees` | SCB storleksklass (inte exakt tal), eller medelantal anställda ur iXBRL | Osäkert. Portens `min/maxEmployees` kräver ett tal, klasserna ger intervall |
| `RegistryCompany.revenueKsek` | iXBRL, nettoomsättning | Osäkert. Bara aktiebolag, kräver en fil per bolag |
| `RegistryCompany.county` | Härledd ur postadress | Osäkert. Län är inget eget fält, behöver postnummer-till-län-mappning |
| `MarketOverview.companyCount` | Räkna bolag per SNI | Rimligt, om vi kan lista på SNI |
| `MarketOverview.medianRevenueKsek` | Median över iXBRL-urval | Osäkert. Ett urval, inte hela marknaden |
| `MarketOverview.growthSharePercent` | Kräver minst två års iXBRL per bolag | Osäkert, tungt |
| `MarketOverview.regionSharePercent` | Fördelning över län | Rimligt om län går att härleda |
| `MarketOverview.competitors` | Bolag per SNI + verksamhetsbeskrivning | Rimligt |

**Avgjort 2026-09-21:** Bolagsverkets API är en ren uppslagstjänst per
organisationsnummer och dokument. Det kan **inte** lista bolag på SNI-kod
(bekräftat mot Swagger-specen, se "Bolagsverkets API — sökning/listning på
SNI-kod" ovan). Listning per SNI och storleksklass måste därför komma från
SCB (statistikdatabas, nedladdningsbara filer eller företagsregister-API).
Vilket av dem som håller är nästa spik, se fråga 7 i avsnitt 6.

### Spik med nycklar (2026-09-21)

Kört av Erik lokalt med `scratchpad/bv-test.mjs` (gitignorad). Claude Codes
miljö når inte `portal.api.bolagsverket.se` (timeout), så resultaten nedan
är Eriks rapport, inte egna anrop.

**Verifierat (Erik körde det):**
- OAuth 2 client credentials fungerar mot
  `https://portal.api.bolagsverket.se/oauth2/token` med `client_id`,
  `client_secret` och `scope=vardefulla-datamangder:read`. Uppgifterna
  ligger i `.env.local` som `BOLAGSVERKET_CLIENT_ID` och
  `BOLAGSVERKET_CLIENT_SECRET`. Det gäller alltså inte en enskild API-nyckel
  i en header.
- **Uppslag på organisationsnummer fungerar och ger riktig data**
  (Volvo, 5560125790).
- `dokumentlista` för samma organisationsnummer kom **tom**. Orsak okänd:
  kan vara fel anrop, ingen digital årsredovisning för just det bolaget,
  eller att `[TEST]`-åtkomsten inte omfattar dokument. Ej utrett.

**Skarp data, trots `[TEST]` i bekräftelsemailet (Erik, från Volvo-svaret):**
det verkar vara skarp, inte syntetisk, data. Vad `[TEST]` betyder är
**inte klarlagt**: om det finns en separat produktionsmiljö med annan
bas-URL eller andra gränser vet vi inte. Fråga Bolagsverket eller läs
Developer Portal innan vi bygger på antagandet.

### Bolagsverkets API — sökning/listning på SNI-kod: definitivt inte möjligt

**Status: bekräftat** (Erik läste Swagger-specen i Developer Portal,
portal.api.bolagsverket.se, API:et "VärdefullaDatamängder"; Claude Code når
inte portalen och har inte läst specen själv). Specen visar samtliga
endpoints, och det finns bara fyra:

| Metod | Endpoint | Syfte |
|---|---|---|
| GET | `/isalive` | Hälsokontroll. Kräver scope `vardefulla-datamangder:ping`, ett annat än `:read`, vilket förklarar 403 vid tidigare test |
| POST | `/organisationer` | Slå upp ett bolag via `identitetsbeteckning` (känt organisationsnummer). Inget SNI-filter, inget sökfält |
| POST | `/dokumentlista` | Lista årsredovisningar för ett känt organisationsnummer |
| GET | `/dokument/{dokumentId}` | Hämta en specifik årsredovisning (zip) |

Det finns ingen sök- eller listningsendpoint. API:et stöder bara uppslag på
ett organisationsnummer man redan känner till.

**Konsekvens för `searchCompanies`:** kan inte byggas på Bolagsverkets API
ensamt. Måste luta sig mot SCB:s statistikdatabas eller nedladdningsbara
filer, enligt reservplanen redan skisserad nedan.

**Övrigt specen bekräftar:**
- Ingen omsättning eller antal anställda i grunddatan från
  `/organisationer`. Det måste hämtas ur iXBRL-dokumenten via
  `/dokumentlista` + `/dokument/{dokumentId}`.
- Inget eget länsfält, bara postnummer i adressen. Län måste härledas ur
  postnumret.

**Kvar att utreda:** `/dokumentlista` gav tom lista för Volvo
(5560125790). Kan bero på fel anrop, på att bolaget saknar digital
årsredovisning i materialet, eller på `[TEST]`-åtkomsten. Bas-URL:en
`https://gw.api.bolagsverket.se/vardefulla-datamangder/v1` användes i
skriptet från minnet, och Erik har sedan fått uppslaget att fungera, men
den är ännu inte skriven in här från specen.

### Svarsformat, POST /organisationer

Struktur enligt Swagger-specen, **inte verifierad mot ett faktiskt
testanrop.** Verifiera fälten mot ett riktigt svar innan strukturen låses i
adaptern.

```json
{
  "organisationer": [
    {
      "identitetsbeteckning": "5560000000",
      "organisationsnamn": {
        "organisationsnamnLista": [
          { "namn": "Exempel AB", "typ": "REGISTRERAT_NAMN" }
        ]
      },
      "naringsgrenOrganisation": {
        "sni": [
          { "kod": "62010", "beskrivning": "Dataprogrammering" }
        ]
      },
      "postadressOrganisation": {
        "postadress": {
          "coAdress": null,
          "utdelningsadress": "Exempelgatan 1",
          "postnummer": "11122",
          "postort": "Stockholm",
          "land": "SE"
        }
      },
      "reklamsparr": false
    }
  ]
}
```

### TODO — öppna punkter från Bolagsverket-spiken

Noterade 2026-09-21, medvetet inte lösta än:

- [ ] **Svarsformatet för `POST /organisationer` är rekonstruerat från
  Swagger-specen, inte verifierat mot ett riktigt testanrop.** Kör ett
  anrop och jämför fält för fält innan strukturen låses i adaptern.
- [ ] **`/dokumentlista` gav tom lista för Volvo (5560125790).** Orsak
  okänd (fel anrop, ingen digital årsredovisning i materialet, eller
  `[TEST]`-åtkomst). Prova fler organisationsnummer och kontrollera
  anropets utformning mot specen.
- [ ] **Bas-URL:en är inte inskriven från specen.** Skriptet använde
  `https://gw.api.bolagsverket.se/vardefulla-datamangder/v1` från minnet.
  Läs den ur Swagger-specen och skriv in den här.
- [ ] Vad `[TEST]` i bekräftelsemailet betyder (separat produktionsmiljö
  eller ej), se "Spik med nycklar".

## 3. Rekommenderad arkitektur för MVP

En liveadapter (`adapters/live/RegistryProvider.ts`) med **två interna
serverklienter**, samma mönster som `lib/server/gemini.ts` och
`lib/server/tavily.ts`:

- `lib/server/scb.ts` — lista bolag per SNI, storleksklass, avregistrerade,
  reklamspärr.
- `lib/server/bolagsverket.ts` — hämta årsredovisningar (iXBRL) per
  organisationsnummer.

Principer:
- **Nycklar bara i serverkod**, aldrig `NEXT_PUBLIC_` (CLAUDE.md).
  Lägg variabelnamnen i `.env.example` först när vi vet vad portalen
  faktiskt ger.
- **Källa och hämtningsdatum är det faktiska anropsdatumet**
  (`Källa.hämtad`), aldrig hårdkodat. Källnamnet kan förbli "Bolagsverket
  och SCB". CC BY-kravet på källhänvisning uppfylls då av det vi ändå
  visar (Datalöftet).
- **Datalöftet vid luckor:** om medianomsättningen bara kan räknas på de
  bolag som har digital årsredovisning ska gränssnittet säga det ("baserat
  på N bolag"), aldrig visa ett tal som ser ut att gälla hela marknaden.
  Saknas siffran visar vi att vi inte vet.
- **Cachning i Supabase** är möjlig för att spara anrop och klara SCB:s
  gräns på 10 anrop per 10 sekunder. Registerdatan är offentlig men
  RLS-reglerna i CLAUDE.md gäller ändå. Förutsätter att villkoren tillåter
  lagring (se ovan).
- **Bygg enligt `docs/bygga-en-modul.md`.** Kontraktstestet
  `ports/RegistryProvider.contract.test.ts` börjar då pröva liveadaptern
  automatiskt.

### Föreslagen ordning när nycklarna kommer
1. **Spik (1–2 timmar):** kontrollera detaljer i Bolagsverkets villkor (t.ex. källhänvisning). Kör några
   riktiga anrop. Svara på: kan man söka på SNI? Vilka taggar finns i
   iXBRL för 5 små aktiebolag? Går län att härleda? Vad säger villkoren om
   lagring?
2. Justera det här dokumentet med det som visade sig.
3. Bygg `searchCompanies` (lista + org.nr) först.
4. Bygg `getMarketOverview`. Börja med `companyCount` och konkurrenter,
   ta omsättningsmedian sist.

### Om detaljvillkoren mot förmodan visar sig förbjuda lagring av namngivna bolag
Reservplan, i den här ordningen:
1. Hämta live vid varje sökning och lagra ingenting. Sämre prestanda men
   samma produkt.
2. Lagra bara aggregat (antal, median) och inga namn.
3. Först därefter: en betald källa, vilket är beslutet i avsnitt 4.

## 4. Allabolag / UC — ÖPPET BESLUT

> **Det här är ett beslut för grundaren.** Prata med din partner och
> sannolikt en vuxen eller handledare **innan** någon kontakt tas, något
> formulär skickas in eller något avtal ingås. Det är troligen en betald
> B2B-tjänst, och ett avtal binder UF-företaget.

### Vem som står bakom (Verifierat)
Allabolag.se drivs av **UC Affärsinformation AB**, en del av **Enento
Group** (Allabolags integritetspolicy). UC:s developerportal
(`developerportal.uc.se`) listas som Enentos.

**Diskrepans att reda ut:** rättighetsklausulen i villkoren nämner
**Proff AS** som den som ger medgivande, inte UC. Det kan vara kvarlevd
text efter ett ägarbyte, eller en annan juridisk person. Vi vet inte. Det
avgör vem man ska fråga om tillstånd.

### Vad villkoren säger (Verifierat, "Villkor för Onlineköp" på allabolag.se)
- 5.1: "Kunden får endast använda Tjänsten och Informationen för eget
  bruk."
- Kunden får inte "sälja, vidareupplåta, tillgängliggöra, överföra, hyra
  ut, distribuera, eller på annat sätt kommersiellt exploatera" tjänsten
  eller informationen.
- Upphovsrättsnotisen: "All form av regelbunden, systematisk eller
  kontinuerlig insamling, lagring, indexering, distribution eller annan
  sammanställning av data är inte tillåten utan uttryckligt skriftligt
  medgivande från Proff AS."

Eriks bild stämmer alltså i sak. **Begränsning:** det här är villkoren för
webbköp. Ett API-avtal har egna villkor som vi inte sett. De kan tillåta
mer, men det kan vi bara få veta genom att fråga.

### Vad UC erbjuder (Verifierat: `uc.se/berika-ditt-crm`, `developerportal.uc.se`)
- JSON/REST-API för CRM-berikning. Organisationsnummer, **styrelse och
  firmatecknare**, koncernstruktur, ekonomi (tio års historik),
  registreringsdatum, arbetsställen.
- Developerportalen listar tre produkter: Beneficial Owner Service,
  **Business Insight** (adresser, registreringsdatum, arbetsställen,
  styrelse/firmatecknare, finansiell info) och Asiakastieto-integrationer.
- **Ingen prissättning och inga användarvillkor visas.** Vägen in är ett
  kontaktformulär. Vi har bara läst sidorna, inget formulär är ifyllt eller
  inskickat.
- **Telefonnummer:** Erik nämner kontaktuppgifter (telefon). Det såg vi
  **inte** bekräftat på de sidor vi läste. Osäkert.

### Varför det är känsligt
- **Namngivna personer.** Styrelse och firmatecknare är personuppgifter.
  GDPR och tjänstens egna villkor gäller. Det är en annan risk än
  bolagsdata.
- **Lagringsförbudet** krockar direkt med hur vi tänkt använda registret
  (bygga och spara kundlistor).
- **Kostnad okänd.**

### Rekommendation
Inte i MVP. Behovet Allabolag skulle fylla (styrelse, telefon, bokslut)
behövs inte för att bygga steg 03–04. Ta upp med UC först när MVP visar
att vi faktiskt saknar just de uppgifterna. Då som ett avtalsbeslut med
partner och handledare, inte som en utvecklaråtgärd.

## 5. Ratsit — rekommendation: gå inte vidare

**Status: svag verifiering.** Ratsits egna sidor (`/anvandarvillkor`,
`/faq`) svarade 403. Allt nedan är sekundärt, ur sökresultat.

- Sekundärt: användarvillkoren förbjuder kommersiella syften som försäljning,
  undersökningar och reklam. Användarkonton får inte användas för
  dator-till-dator-anslutning eller automatiserad behandling.
- Sekundärt: tjänsterna säljs styckvis (kreditupplysning, årsredovisning,
  registreringsbevis). Exempelpriser: registreringsbevis ca 119 kr inkl.
  moms, bolagsordning ca 79 kr.
- **Motsägelse mot Eriks bild:** en söksammanfattning säger att Ratsit
  också säljer "API". Vi hittade ingen sida som visar det. Osäkert.
- Ratsit är i grunden ett personregister (kreditupplysning på
  privatpersoner) och passar dåligt för en kundlista över många bolag.

**Rekommendation:** gå inte vidare. Programmatisk hämtning av hundratals
bolag är inte det tjänsten säljs för, villkoren verkar förbjuda det, och
Bolagsverket och SCB ger samma bolagsdata gratis. Vill vi ändå vara säkra
kan vi läsa villkoren i webbläsaren (en minut), men det ändrar
sannolikt inget.

## 6. Luckor och öppna frågor

| # | Fråga | Vem/hur | Blockerar |
|---|---|---|---|
| 1 | ~~Bolagsverkets faktiska användarvillkor (lagring, vidareutnyttjande)~~ **Avgjort, Verifierat 2026-09-23** (Erik läste och citerade ordagrant stycket "Användning av värdefulla data", sidans datum 2025-11-21, se avsnitt 2): fri kommersiell användning, får modifieras, bearbetas och kombineras, inom personuppgifts- och sekretesslag; källhänvisning kan krävas. Ingen namngiven licens. (Märkt Verifierat 2026-09-20 utan citat, nedgraderat och åter verifierat 2026-09-23.) | Klart. Om en uttrycklig licens hittas: citera den | **Inte längre ett hinder på licensgrunden.** Licensgrinden (`docs/moduler/registret.md`) ligger kvar i koden tills Erik själv öppnar den. Fråga 4 nedan gäller fortfarande |
| 2 | ~~Kan Bolagsverkets API söka på SNI, eller krävs SCB/filer?~~ **Avgjort, bekräftat 2026-09-21:** nej. Bara fyra endpoints, ingen sökning eller listning. `searchCompanies` måste bygga på SCB:s statistikdatabas eller nedladdningsbara filer. Nästa steg: undersök SCB-spåret (fråga 7) | Undersök SCB:s databas och filer | `searchCompanies` |
| 3 | Vilka iXBRL-taggar finns för små bolag, och täckning | Spik med nycklar | `revenueKsek`, `growthSharePercent`, median |
| 4 | Får namngivna aktiebolag lagras/visas, och hur hanteras enskilda firmor och reklamspärr? | Juridisk koll + vuxen/handledare | Steg 04–05 i live |
| 5 | ~~Var får Utskick och svar mottagarnas e-post från?~~ **Avgjort:** egen mejlsökning med Tavily + Gemini, grundaren bekräftar alltid adressen. Hunter.io valdes bort (50 krediter per konto/månad) | Beslutat | Fas 2 (`OutreachProvider`), byggs inte nu |
| 6 | Allabolag/UC: kontakt, villkor, pris, vem som är rättighetshavare (UC eller Proff AS) | Grundaren + partner + vuxen/handledare | Inget i MVP |
| 7 | SCB:s statistikdatabas som källa till branschaggregat | Undersök vid spiken | `medianRevenueKsek` utan iXBRL-urval |
| 8 | ~~SCB:s byte från certifikat till API-nycklar~~ Gemensamma API:et använder OAuth 2 client credentials (**Verifierat** 2026-09-21). Oklart om SCB:s separata företagsregister-API gör det | Kolla vid behov | Autentiseringens utformning |

## Förslag: SCB-spåret (UTKAST, väntar på godkännande)

> **Status:** förslag skrivet 2026-09-21, godkänt av Erik samma dag. Underlag: SCB:s egna sidor och söksammanfattningar. Inget
> anrop mot SCB är gjort, och Claude Codes miljö har inte nycklar.
> Märkningarna följer avsnittet "Så läser du märkningarna".

### Frågan

Kan vi **lista bolag per SNI-kod och storleksklass** (antal anställda,
omsättning)? Det är vad `searchCompanies` behöver, eftersom Bolagsverkets
API inte kan det (se avsnitt 2). Tre kandidater hos SCB och Bolagsverket:

### Jämförelse

| | A. SCB Företagsregister-API (avgiftsfritt) | B. SCB Statistikdatabas (PxWeb) | C. Nedladdningsbara filer (värdefulla datamängder) |
|---|---|---|---|
| **Vad du får** | Enskilda företag och arbetsställen | Aggregat (antal, nyckeltal), **inga bolagsnamn** | Bolagsdata i filer, per bolag |
| **Lista per SNI** | **Ja** (Sekundärt: SCB:s sida säger att man kan söka på fasta koder som SNI) | Nej, bara antal per SNI | Ja, filtrera lokalt. SNI finns i de 15 variablerna (Verifierat, se avsnitt 2) |
| **Storleksklass anställda** | **Ja**, som klass, inte exakt tal (Sekundärt) | Ja, som filter/dimension: nio klasser, 0 till 500+ anställda (Sekundärt, tabell FDBR07N) | **Nej**, finns inte bland de 15 variablerna (Verifierat, avsnitt 2) |
| **Storleksklass omsättning** | **Osäkert.** Variabeln finns i registrets variabelbeskrivning (Sekundärt), men sidan om de avgiftsfria uppgifterna nämner den inte | Delvis: "Företagens ekonomi" (nettoomsättning per SNI och storleksklass, 2022–2024) och branschnyckeltal med kvartiler (Sekundärt, tabellnamn ur sökresultat, innehåll ej granskat) | Nej, bara iXBRL per bolag, en fil per bolag och år |
| **Kontaktuppgifter** | Troligen inte i den avgiftsfria delen (Sekundärt). Registret har telefon/e-post/reklam som variabler, men det gäller inte nödvändigtvis det gratis utsnittet | Nej | Nej |
| **Kostnad** | Avgiftsfritt sedan 2025-06-26 (Sekundärt) | Avgiftsfritt (Osäkert, inte kontrollerat mot sidan) | Avgiftsfritt |
| **Åtkomst** | Godkänna villkor och få certifikat via scbforetag@scb.se. Byter till API-nycklar i september 2026 (Sekundärt: alltså nu, kolla vad som gäller) | Öppet API, ingen inloggning (Osäkert, inte prövat) | Ingen inloggning känd, se Bolagsverkets sida om nedladdningsbara filer (Sekundärt) |
| **Gränser** | Max 2 000 rader per anrop, 10 anrop per 10 sekunder och användare, bara aktuell data, ingen historik (Sekundärt) | Inte kontrollerade | Stora filer, tung bearbetning |
| **Format** | REST, JSON eller XML (Sekundärt) | JSON via PxWeb (Sekundärt) | Filer (Osäkert vilket format) |

**Storleksklasserna (Sekundärt, registrets variabelbeskrivning):**
1 = 0 anställda, 2 = 1–4, 3 = 5–9, 4 = 10–19, 5 = 20–49, 6 = 50–99,
7 = 100–199, 8 = 200–499, och därefter större. Klasserna 2–6 stämmer med
de fem klasser demot redan visar (1–4, 5–9, 10–19, 20–49, 50+). Portens
`minEmployees`/`maxEmployees` måste alltså översättas till klasser och
`RegistryCompany.employees` visas som intervall, aldrig som exakt tal.

### Rekommendation

**Bygg listningen på A och aggregaten på B, och berika med Bolagsverket.**

1. **`searchCompanies` (lista + org.nr) via A.** Det är den enda
   kandidaten som listar enskilda bolag på SNI *och* storleksklass i ett
   anrop. Filen (C) klarar SNI men saknar storleksklass, och B har inga
   namn.
2. **Berika med Bolagsverkets `/organisationer`** för de träffar vi visar:
   juridisk form, reklamspärr och verksamhetsbeskrivning. Det ger också
   filtret "bara aktiebolag utan reklamspärr" (avsnitt 2) även om A inte
   har juridisk form i det gratis utsnittet.
3. **`getMarketOverview` via B** för `companyCount` per SNI och
   storleksklass, och (om tabellerna visar sig innehålla det) omsättning
   per storleksklass. Det är billigare och ärligare än en median över ett
   iXBRL-urval, och rätt sätt att uppfylla Datalöftet: ett tal med källa
   för hela marknaden i stället för "baserat på N bolag".
4. **Omsättning per bolag** kommer bara via iXBRL för aktiebolag, som
   tidigare. Om A har omsättningsklass räcker det för filtrering, och då
   behövs iXBRL bara för de bolag vi visar upp.
5. **C (filer) som reserv**, inte första val: om A:s access dröjer eller
   villkoren blockerar. Då listar vi på SNI ur filen och tappar
   storleksfiltret.

### Spik, i ordning

1. **B först (inget att vänta på).** Slå upp `FDBR07N` och tabellerna för
   Företagens ekonomi och branschnyckeltal i PxWeb. Kontrollera: SNI-djup
   (2–5 siffror), storleksklasser, senaste år, om nettoomsättning finns,
   om API:et är öppet. Testa med en verklig SNI-kod från demot.
2. **A: begär åtkomst hos SCB** (mejl till scbforetag@scb.se) och ställ
   frågorna nedan. **Det är ett utåtriktat steg och görs av Erik, inte av
   Claude.** Kolla först om nya API-nycklar redan ersatt certifikaten.
3. Kör riktiga anrop och **uppdatera det här dokumentet** med det som
   visade sig, precis som Bolagsverket-spiken.

**Frågor till SCB / att kontrollera i A:**
- Går det att filtrera på SNI **och** storleksklass anställda i samma anrop?
- Finns storleksklass omsättning i det avgiftsfria utsnittet?
- Finns juridisk form och län/kommun som sökfilter? (Behövs för "bara
  aktiebolag" och `county`.)
- Finns reklamspärr (variabeln "Reklam") med, och kan vi filtrera bort
  spärrade?
- Hur fungerar pagineringen nu när 2 000 rader/anrop är taket, och gäller
  gränsen 10 anrop/10 s även med API-nyckel?
- Får vi lagra svaren (Supabase-cache), och vilken källhänvisning krävs?
- Får enskilda firmor listas, eller bara aggregeras? (Samma GDPR-fråga som
  i avsnitt 2.)

### TODO / nästa steg

- [ ] **Erik mejlar scbforetag@scb.se** för åtkomst till API:et (A) och
  ställer frågorna ovan. Inget mejl är skickat. Claude skickar inget.
- [ ] **Läs variabelbeskrivnings-PDF:en för API:et**
  (`variabelbeskrivning-api-sni-2025.pdf`, länk under Källor). Den kunde
  inte läsas i den här sessionen (saknat PDF-verktyg), så uppgifterna om
  vilka variabler det gratis utsnittet har och vilka som går att filtrera
  på är oläst i original. Kontrollera särskilt omsättningsklass,
  juridisk form, län/kommun, reklam.
- [ ] Spik B (statistikdatabasen), se "Spik, i ordning".

### Risker och luckor

- **Allt om A är Sekundärt** tills Erik eller någon med åtkomst kört ett
  anrop. Särskilt omsättningsklass och juridisk form är osäkra i det
  gratis utsnittet.
- **Enskilda firmor** ingår i SCB:s register. Samma förslag som i avsnitt
  2: namngivna listor bara för aktiebolag utan reklamspärr.
- **Datafärskhet:** A uppdateras nattligen, de flesta variabler veckovis
  (Sekundärt). B har årsdata med eftersläpning. Visa alltid
  `Källa.hämtad` och statistikår.
- **Två register kan säga olika saker** (SCB:s och Bolagsverkets SNI-kod
  kan skilja). Visa källan per uppgift, blanda inte tyst.

Källor (Sekundärt, hämtade 2026-09-21 som sammanfattat utdrag):
- SCB, avgiftsfria uppgifter i företagsregistret: https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/avgiftsfria-uppgifter-i-foretagsregistret/
- SCB, variabelbeskrivning för företagsregistret: https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/variabelbeskrivning/
- SCB, variabelbeskrivning API (PDF, kunde inte läsas i den här sessionen): https://www.scb.se/contentassets/8a8eb5c3d45f461ea93482f8e8d4de4f/variabelbeskrivning-api-sni-2025.pdf
- SCB, värdefulla datamängder: https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/vardefulla-datamangder--grundlaggande-foretagsinformation/ (hänvisar vidare till Bolagsverket för API och filer, ger inga detaljer om filter)
- SCB Statistikdatabasen, Företag (FDB) efter SNI 2007 och storleksklass 2008–2025: https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__NV__NV0101/FDBR07N/
- SCB Statistikdatabasen, Företagens ekonomi, basfakta efter SNI och storleksklass: https://www.statistikdatabasen.scb.se/pxweb/sv/ssd/START__NV__NV0109__NV0109P/NSEBasStklFEngs07/
- SCB Statistikdatabasen, branschnyckeltal: https://www.statistikdatabasen.scb.se/pxweb/en/ssd/START__NV__NV0109__NV0109O/BNTT01/
- CRMdata, om det avgiftsfria API:et (tredjepart): https://www.crmdata.se/scbs-avgiftsfria-api-for-foretagsregistret-nar-racker-det/

## 7. Källor

Verifierat (läst den här sessionen, som sammanfattat utdrag):
- Bolagsverket, värdefulla datamängder, stycket "Användning av värdefulla data" (sidans datum 2025-11-21, läst och ordagrant citerad av Erik 2026-09-23; ett tidigare besök 2026-09-20 saknade citat): https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html
- Bolagsverket, API för värdefulla datamängder (läst av Erik 2026-09-19, sidans datum 2026-06-30): https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder/apiforvardefulladatamangder.5513.html
- Förordning (EU) 2023/138: https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX:32023R0138
- SCB, värdefulla datamängder, grundläggande företagsinformation: https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/vardefulla-datamangder--grundlaggande-foretagsinformation/
- SCB, avgiftsfria uppgifter i företagsregistret: https://www.scb.se/vara-tjanster/bestall-data-och-statistik/foretagsregistret/avgiftsfria-uppgifter-i-foretagsregistret/
- Allabolag, villkor för onlineköp: https://www.allabolag.se/info/villkor-for-onlinekop/
- Allabolag, integritetspolicy: https://allabolag.se/om/integritetspolicy
- UC, berika ditt CRM: https://www.uc.se/berika-ditt-crm
- Enento/UC developerportal: https://developerportal.uc.se

Sekundärt (söksammanfattning, sidan gick inte att läsa direkt):
- Bolagsverket, kundanmälan: https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder/kundanmalantillapiforvardefulladatamangder.5528.html
- Bolagsverket, frågor och svar om API:erna: https://bolagsverket.se/apierochoppnadata/driftochsupport/fragorochsvaromapierna.4611.html
- Bolagsverket, nedladdningsbara filer: https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/nedladdningsbarafiler.2517.html
- Bolagsverket, teknisk dokumentation för digital inlämning: https://bolagsverket.se/apierochoppnadata/lamnaforetagsinformation/apifordigitalinlamningavarsredovisningochrevisionsberattelse/tekniskdokumentationfordigitalinlamningavarsredovisning.5937.html
- Bolagsverkets API-portal: https://portal.api.bolagsverket.se (403 vid hämtning)
- Ratsit, användarvillkor och tjänster: https://www.ratsit.se/anvandarvillkor, https://www.ratsit.se/tjanster (403 vid hämtning)
