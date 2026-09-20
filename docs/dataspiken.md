# Dataspiken — vilken källa bygger vi RegistryProvider på?

Research, ingen kod. Underlag för `docs/moduler/registret.md` (porten
`ports/RegistryProvider.ts`) och Datalöftet i `docs/uppdrag.md` 1.2.
Skriven 2026-09-18 på branchen `dataspiken`.

## Status inför Fas 1 — inga blockerare kvar

De två punkter som tidigare stod som olösta är avgjorda nog för att gå
vidare med `RegistryProvider` (Fas 1):

1. **Licens för namngivna företag: Verifierat.** Erik har själv läst
   Bolagsverkets sida om värdefulla datamängder (https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html,
   läst av Erik 2026-09-20). Lagring, visning och vidaredistribution av
   bolagsdata är tillåtet. Undantag: enskilda firmors personuppgifter
   (GDPR) får inte profileras eller samköras, och reklamspärr ska
   respekteras. Rekommendationen står kvar: visa bara namngivna listor för
   **aktiebolag utan reklamspärr**, eftersom det är precis vad undantagen
   pekar mot. Kvar är att kontrollera detaljer när kundanmälan godkänns
   (t.ex. krav på källhänvisning), se avsnitt 6.
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
     **Avgjort 2026-09-20:** Erik har läst Bolagsverkets sida om värdefulla
     datamängder. Licensen för namngivna företag är **Verifierat**, med
     undantag för enskilda firmors personuppgifter och reklamspärr. Se
     avsnitt 2. Kvarstår som två olösta frågor:
  1. Det är **oklart om Bolagsverkets API går att söka på SNI-kod**.
     `searchCompanies` bygger på det. Se avsnitt 3.
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
| **Licens/villkor** | Öppen licens, CC BY 4.0 eller mindre restriktiv (Verifierat i förordningen). Lagring, visning och vidaredistribution tillåtet; enskilda firmors personuppgifter får inte profileras/samköras och reklamspärr ska respekteras (Verifierat: Bolagsverkets sida, läst av Erik 2026-09-20) | Systematisk lagring förbjuden utan skriftligt medgivande (Verifierat, se 4) | Automatiserad hämtning verkar förbjuden (Sekundärt) |
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
**Svar: ja för företag, med två undantag. Verifierat** (Bolagsverkets sida, läst av Erik 2026-09-20).

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

Verifierat av Erik på Bolagsverkets egen sida
(https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html,
läst 2026-09-20): lagring, visning och vidaredistribution av bolagsdata är
tillåtet, med två undantag:
- **Enskilda firmors personuppgifter (GDPR)** får inte profileras eller
  samköras.
- **Reklamspärr ska respekteras.**

Det som tidigare bara var sekundärt (söksammanfattning och två oberoende
AI-sökningar) och som stämmer med ovan:
- Datan får användas "fritt" för kommersiella och icke-kommersiella
  ändamål, t.ex. nya tjänster och produkter, och får ändras, bearbetas
  och kombineras med andra källor.
- Inget avtal och ingen avgift krävs.
- Förbehåll: användningen måste följa gällande lag, inklusive GDPR (lagar
  om skydd av personuppgifter och sekretess), och det kan finnas krav på
  källhänvisning.

Det som **inte** är löst:
- Sidans exakta ordalydelse är inte kopierad hit. Kontrollera detaljer som
  källhänvisning när kundanmälan godkänns. Blockerar inte bygget.
- **Lagring och cachning** (t.ex. i Supabase) omfattas av den verifierade
  tillåtelsen ovan.
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
| `RegistryQuery.sniCode` | SCB SNI-koder | Verifierat att fältet finns. **Osäkert** om Bolagsverkets API kan söka på det (se nedan) |
| `RegistryCompany.name`, `sniCode` | Register | Verifierat |
| `RegistryCompany.employees` | SCB storleksklass (inte exakt tal), eller medelantal anställda ur iXBRL | Osäkert. Portens `min/maxEmployees` kräver ett tal, klasserna ger intervall |
| `RegistryCompany.revenueKsek` | iXBRL, nettoomsättning | Osäkert. Bara aktiebolag, kräver en fil per bolag |
| `RegistryCompany.county` | Härledd ur postadress | Osäkert. Län är inget eget fält, behöver postnummer-till-län-mappning |
| `MarketOverview.companyCount` | Räkna bolag per SNI | Rimligt, om vi kan lista på SNI |
| `MarketOverview.medianRevenueKsek` | Median över iXBRL-urval | Osäkert. Ett urval, inte hela marknaden |
| `MarketOverview.growthSharePercent` | Kräver minst två års iXBRL per bolag | Osäkert, tungt |
| `MarketOverview.regionSharePercent` | Fördelning över län | Rimligt om län går att härleda |
| `MarketOverview.competitors` | Bolag per SNI + verksamhetsbeskrivning | Rimligt |

**Största tekniska osäkerheten:** Bolagsverkets API beskrivs som en
uppslagstjänst per organisation och dokument (Sekundärt, Context7). Att
**lista alla bolag på en SNI-kod** görs sannolikt via SCB:s API eller via
de nedladdningsbara filerna, inte via Bolagsverkets uppslag. Det avgör hur
adaptern byggs. Kontrolleras i API-specifikationen (Swagger) när nycklarna
kommer.

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
| 1 | ~~Bolagsverkets faktiska användarvillkor (lagring, vidareutnyttjande)~~ **Avgjort, Verifierat 2026-09-20** (Erik läste Bolagsverkets sida om värdefulla datamängder): lagring, visning och vidaredistribution tillåtet; enskilda firmors personuppgifter får inte profileras/samköras; reklamspärr ska respekteras. Kvar: detaljer som källhänvisning | Erik vid godkänd kundanmälan | **Inte längre ett hinder för exponering på licensgrunden.** Licensgrinden (`docs/moduler/registret.md`) ligger kvar tills Erik själv öppnar den. Fråga 4 nedan gäller fortfarande |
| 2 | Kan Bolagsverkets API söka på SNI, eller krävs SCB/filer? | Spik med nycklar | `searchCompanies` |
| 3 | Vilka iXBRL-taggar finns för små bolag, och täckning | Spik med nycklar | `revenueKsek`, `growthSharePercent`, median |
| 4 | Får namngivna aktiebolag lagras/visas, och hur hanteras enskilda firmor och reklamspärr? | Juridisk koll + vuxen/handledare | Steg 04–05 i live |
| 5 | ~~Var får Utskick och svar mottagarnas e-post från?~~ **Avgjort:** egen mejlsökning med Tavily + Gemini, grundaren bekräftar alltid adressen. Hunter.io valdes bort (50 krediter per konto/månad) | Beslutat | Fas 2 (`OutreachProvider`), byggs inte nu |
| 6 | Allabolag/UC: kontakt, villkor, pris, vem som är rättighetshavare (UC eller Proff AS) | Grundaren + partner + vuxen/handledare | Inget i MVP |
| 7 | SCB:s statistikdatabas som källa till branschaggregat | Undersök vid spiken | `medianRevenueKsek` utan iXBRL-urval |
| 8 | SCB:s byte från certifikat till API-nycklar (september 2026) | Kolla vid åtkomst | Autentiseringens utformning |

## 7. Källor

Verifierat (läst den här sessionen, som sammanfattat utdrag):
- Bolagsverket, värdefulla datamängder, licens och användning (läst av Erik 2026-09-20): https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html
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
