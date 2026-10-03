## Pitchsäkring av demot (2026-10-01, direkt på `design/en-design`)
`origin/prototyp` fanns redan i grenen. Två commits: texterna (egen commit) och docs.

### Klart
- **Texter som lovade en verklig källa under exempeldata är omskrivna** (sv och en). De beskriver nu vad kortet gör utan att namnge en myndighet. Ingen ny källa är uppfunnen.
  - `adapters/demo/sara.ts`: steg 01–04 på Hem och Resan ("… innan den kan visa några siffror ur registret", "Riktiga siffror ur registret …", "Se de första siffrorna ur registret", "Kundprofil ur registret …"), steg 02:s höjdpunkter ("… ur profilen och registret", "Preliminär registerträff"), poängrörelsen "efter registerdata" och förslaget "Bara delar av registret är hämtat". "Medianomsättning" i steg 03:s text är borta, eftersom siffran inte visas.
  - `adapters/demo/jonas.ts`: "registerbild" (steg 02, 03 och förslaget), "Kundprofil ur registret", "efter registerdata".
  - Medgrundaren (`cofounderScript.ts`, `jonasCofounderScript.ts`): "Söker i Bolagsverkets register", "Hämtar från Bolagsverket och SCB", "Hämtar från Bolagsverket", "de första riktiga siffrorna ur registret", "korsar din profil mot registret", "se vad registret säger".
  - Rundturen (`app/demo/_lib/tourCopy.ts`): stopp 3:s rubrik ("Medgrundaren hämtar siffror från Bolagsverket") och text, stopp 5 ("register- och kundunderlag"), stopp 6 ("Ingen siffra i Spark är gissad" under påhittade siffror), stopp 7:s rubrik och text ("ur registret"; "knappt någon annanstans", bugg 19, är borta).
  - Marknad i exempelläget: egna nycklar `subtitleExample` och `kpiTitleExample` ("Marknadsbilden"), och "Byråer i branschen" i stället för "Byråer i registret". `/app` är oförändrat.
  - Berättelsen om att Sara och Jonas registrerar firman hos Bolagsverket står kvar: det är en händelse i scenariot, ingen källa.
- **Rundturens stopp 19** säger 249 kr och "bygget ingår", som rubriken och `/priser` (bugg 18). Texten sa 199 kr och "bygget säljs separat".
- **Vakttest:** `adapters/demo/noRealSourceClaims.test.ts` (5): inga källpåståenden i scenariofilerna, inga myndighetsnamn i rundturens texter (utom juridikens riktiga källor).
- **Genomklickat:** alla 26 demosidor (inkl. `/demo/resan/1–12`) i alla 51 moment som textdump, och 616 skärmbilder i 1440 och 390 px (Sara vid beat 0, 5, 9 … 37, Jonas vid 0, 4, 8, 12). Inga sidfel eller konsolfel.
- **Rundturen** körd hela vägen i 1440 och 390 px: alla 20 stopp, rätt sida på varje, "Avsluta rundtur" stänger. Från Jonas är den låst.
- **`docs/demo-manus.md`** omskrivet rad för rad mot demot, med de fyra reglerna vid visning.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (857 gröna, 35 skippade), `pnpm build`.

### Kända problem (hittade vid genomklickningen, inte rättade)
- **Grå registertaggar på påhittad data.** "Bolagsverket och SCB" på Marknads nyckeltal, storleksfördelning och datalager samt i Affärsplanens Marknaden (`adapters/demo/RegistryProvider.ts`); "Bolagsverket" på poängdelarna Marknad, Konkurrens och Genomförbarhet (`sara.ts`, `jonas.ts`) och i Jonas idégenomlysning (`adapters/demo/ProjectRepository.ts`). Sidan säger "Exempel med påhittad data" ovanför. Största kvarvarande risken.
- **Andra icke-exempeltaggar på påhittad data:** "Sparks utskick (Gmail)", "Utskicket, steg 05" och "Kundsamtal, steg 05–06" på Validering, Marknad, Bygg och i Affärsplanens citat. Hem visar samma siffror med Exempel-tagg.
- **40 eller 20 mottagare.** Hem och Resan säger att utskicket gick till 40 byråer (`sara.ts`), Validering och Marknad säger 20 kontaktade och "9 av 20".
- **Jonas:** Marknad, Validering, Juridik och Bygg står som "Låst — inte genomfört i det här scenariot" fast Hem visar 25 mottagare, 13 svar och alla steg klara. Poäng ger Marknad 12/12. Affärsplanen står på 4/9 vid poäng 89 "Bevisad affär".
- **"Höj din poäng" följer inte momentet.** Vid steg 12 föreslår den "+3 Marknad" (redan 12/12), "+2 Registrera bolagsformen" (redan gjort, 8/8) och "+4 MVP:n är inte helt byggd" (Produkt 12/12).
- **"Vad som hänt sedan sist"** på Hem visar utskicket från steg 05 (januari) ända till steg 12 (april). Dagens signal är daterad 23 januari vid 10 april.
- **Validering på 390 px** har vågrät rullning (sidan 508–514 px bred) från steg 05, troligen tabellen "Alla kontaktade".
- **Tomma eller upprepade rutor:** omsättningskolumnen i "Alla kontaktade" visar "–" med samma lucktext på alla 20 rader; storleksfördelningen har tre rader med 0; simuleringskortet på Marknad har tre etiketter på rad (Simulering, Koncept, SIMULERING-taggen); Jonas poängkort på Hem har en stor tom yta.
- **Rundturens stopp 9** lovar fortfarande att Spark "bevakar öppningar och svar automatiskt" (bugg 15), och Validering visar en öppningsfrekvens. Manuset säger åt presentatören att inte lova det.
- **Rundturen hoppar i tiden:** stopp 3 (steg 03, poäng 14) → stopp 4 (steg 01, poäng 6) → stopp 5 (steg 04, 27) → stopp 6 (steg 03, 24).
- **Bygg** visar `https://kvittojakten.lovable.app` som publicerad adress (bugg 17). Sidan finns inte.
- **Simuleringen** säger "Simulerad population: 312", samma tal som byråerna (bugg 16).
- **Okänt ord:** Hem steg 12 säger "Ansökningsunderlag förberett ur Spåret". "Spåret" är en flik i Minnet men förklaras inte.
- **Kvar i delad text:** Validerings underrubrik "Allt som prövats mot verkliga kunder" och Affärsplanens "Registerbilden, alltid med täckningen …" delas med `/app` och är inte ändrade. Landningssidans stegtexter (`i18n` `journeySteps`) säger fortfarande "Riktiga siffror ur registret"; de beskriver produkten, inte demot.

### Beslut nästa session behöver känna till
- **Demots texter namnger ingen verklig källa för påhittad data.** Vakttestet blir rött annars. Juridikens kuraterade källor (riksdagen.se, Skatteverket, IMY) är riktiga och undantagna.
- **Marknad har exempelnycklar** (`subtitleExample`, `kpiTitleExample`, `companyCountLabel`); `/app` använder de gamla.
