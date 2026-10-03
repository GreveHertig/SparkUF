## Dataspiken — källa för RegistryProvider (research klar, PR mot `prototyp`, gren `dataspiken`)

Ren research, ingen kod. Resultat i `docs/dataspiken.md`.

### Inga blockerare kvar för Fas 1
1. **Licens för namngivna företag: Verifierat (Erik läste https://bolagsverket.se/apierochoppnadata/hamtaforetagsinformation/vardefulladatamangder.5294.html 2026-09-20).** Lagring, visning och vidaredistribution av bolagsdata tillåtet; enskilda firmors personuppgifter (GDPR) får inte profileras/samköras och reklamspärr ska respekteras. Rekommendationen står kvar: namngivna listor bara för aktiebolag utan reklamspärr. Uppdaterad i `docs/dataspiken.md` (status, kort svar, avsnitt 1, 2, 6, 7).
   *Senare (2026-09-23):* nedgraderat till **Sekundärt**. Sidan är en
   informationssida, inte villkorstexten, och ingen ordalydelse citerades.
2. **Mottagarnas kontaktuppgifter (steg 05): beslut.** Hunter.io valdes bort (gratisnivån delar 50 krediter per hela kontot/månad). Egen mejlsökning med Tavily (sök "Kontakta oss"-sidan) + Gemini (extrahera adressen). Grundaren bekräftar/redigerar alltid adressen före utskick. **Beslut för Fas 2 (`OutreachProvider`), byggs inte nu.**

### Klart
- **`docs/dataspiken.md`:** källa, kostnad, villkor och rekommendation per källa, varje uppgift märkt Verifierat / Sekundärt / Osäkert, med de två blockerarna överst.
- **Rekommendation:** bygg `RegistryProvider` på Bolagsverkets och SCB:s "API för värdefulla datamängder" (gratis, inget avtal, öppen licens enligt förordning (EU) 2023/138). Allabolag/UC: inte i MVP, öppet avtalsbeslut. Ratsit: gå inte vidare.
- **Årsredovisningarna** är iXBRL: taggade siffror inuti en dokumentfil per bolag och år, inte en färdig tabell. Bara aktiebolag lämnar in digitalt.
- **`docs/moduler/registret.md`:** rättade "blockeraren är avtal" med hänvisning till dataspiken.

### Var vi står / vad som är kvar innan nästa session
- **Kundanmälan till Bolagsverket är inte skickad än** (Erik 2026-09-19; tidigare stod här felaktigt att den väntade på godkännande).
- **Erik:** kontrollera detaljer (t.ex. källhänvisning) när nycklarna kommer (blockerar inte Fas 1). Licensfrågan är Verifierad 2026-09-20. *Senare (2026-09-23): nedgraderad till Sekundärt, se ovan.*
- **Fas 2:** bygg `OutreachProvider` med Tavily + Gemini för mottagarnas e-post (punkt 2 ovan).
- **Grundaren + partner + vuxen/handledare:** Allabolag/UC är ett öppet avtalsbeslut. Villkoren förbjuder regelbunden, systematisk lagring utan skriftligt medgivande. Ingen kontakt tas och inget formulär skickas innan dess.
- **Först därefter:** en spik med riktiga nycklar (ordning i `dataspiken.md` avsnitt 3), sedan bygg enligt `docs/bygga-en-modul.md`.

### Beslut nästa session behöver känna till
- **Avgjort 2026-09-21: Bolagsverkets API kan inte söka eller lista på SNI-kod.** Swagger-specen (läst av Erik) har bara fyra endpoints (`/isalive`, `POST /organisationer`, `POST /dokumentlista`, `GET /dokument/{dokumentId}`), alla uppslag på känt organisationsnummer. `searchCompanies` måste bygga på SCB (statistikdatabas, nedladdningsbara filer eller företagsregister-API). SCB-spåret är nästa steg.
- **Reklamspärr och enskilda firmor:** SCB-registret innehåller fysiska personer och en reklamspärr-variabel. Förslag: namngivna listor bara för aktiebolag och utan reklamspärrade. Kräver Juridisk koll och en vuxen/handledare.
- **Rättighetshavaren för Allabolag** står som Proff AS i villkoren men UC Affärsinformation AB i integritetspolicyn. Oklart vem som ska ge tillstånd.

### Kända problem / öppna frågor
- **Ratsit** verifierades bara via sökresultat (403 på deras sidor). En söksammanfattning antyder ett API, vilket inte bekräftades.
- SCB:s statistikdatabas (branschaggregat) är inte undersökt. SCB byter från certifikat till API-nycklar i september 2026.

### Uppdatering 2026-09-21 — spik med nycklar (branch `docs/dataspik-bolagsverket`)
- **Verifierat (Erik körde `scratchpad/bv-test.mjs`, gitignorad):** OAuth 2 client credentials fungerar mot `portal.api.bolagsverket.se` med scope `vardefulla-datamangder:read`; uppslag på organisationsnummer (Volvo) ger riktig data. Nycklarna ligger i `.env.local` (`BOLAGSVERKET_CLIENT_ID`/`_SECRET`). Claude Codes miljö når inte portalen, så inget här är egna anrop.
- **Bolagsverkets API saknar sök/listning på SNI: bekräftat, inte längre "sannolikt".** Beskrivet i `docs/dataspiken.md` (avsnittet "Bolagsverkets API — sökning/listning på SNI-kod").
- **Nästa steg: SCB-spåret.** Jämför statistikdatabasen, nedladdningsbara filer och företagsregister-API:et mot kravet lista bolag per SNI och storleksklass (`docs/dataspiken.md` fråga 7).
- **Öppna TODO:s (inte lösta):** svarsformatet för `POST /organisationer` är rekonstruerat ur specen, inte verifierat mot ett riktigt anrop; `/dokumentlista` gav tom lista för Volvo; bas-URL:en är inte inskriven från specen. Se "TODO — öppna punkter" i `docs/dataspiken.md`.
- **Hantering av `scratchpad/`:** `.gitignore` ignorerar nu `/scratchpad/` (mergead in från `scratchpad-gitignore`). Engångsskript med nycklar från `.env.local` committas inte.
