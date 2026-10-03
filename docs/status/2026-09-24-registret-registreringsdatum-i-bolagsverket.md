## Registret: registreringsdatum i Bolagsverket-transporten (klar 2026-09-24, gren `modul/bv-registreringsdatum`, PR mot `prototyp`)

### Klart
- **`BolagsverketOrganisation.registrationDate`** (`string | null`, YYYY-MM-DD)
  läses från `organisationsdatum.registreringsdatum`
  (`lib/server/bolagsverket.ts`, `lib/server/bolagsverketSchemas.ts`).
- **Validering:** fältet valideras med `z.iso.date()`, som också avvisar
  datum som inte finns, som `2023-02-29`.
- **`null` i stället för att bolaget faller bort:** ett saknat eller ogiltigt
  datum ger `null` (`.catch(null)`), liksom ett ifyllt `fel` i delobjektet
  (via `ok()`). Bolagets övriga uppgifter kommer ändå med.
- **Tester** (`lib/server/bolagsverket.test.ts`): fixtur-testet förväntar
  `"1918-08-19"` för Ericsson. Ett nytt test täcker de fall där datumet ska
  bli `null`: saknat delobjekt, `null`, `2023-02-29`, `1918-8-19` och
  ifyllt `fel`.
- **`docs/dataspiken.md`:** fältet är beskrivet under "Svarsformat, verifierat
  mot riktiga anrop".
- **Gamla grenen `a/bolagsverket-klient`:** fältet `registreringsdatum` var
  det enda den hade som saknades i den nya transporten, och det finns nu med.
  Grenen finns kvar, lokalt och på GitHub.

### Återstår
- **Adaptern:** `registrationDate` når inget gränssnitt än. Adaptern
  (`adapters/live/RegistryProvider.ts`) använder bara `fetchAnnualFigures`,
  inte `lookupOrganisation`, och `RegistryCompany` har inget sådant fält. Det
  avgörs när `lookupOrganisation` kopplas till adaptern.
- **Gamla grenen:** ta bort `a/bolagsverket-klient` när den här PR:en är
  mergad, om du vill.

### Beslut nästa session behöver känna till
- **Ett ogiltigt registreringsdatum blir `null`**, det fäller inte hela bolaget.
  Samma princip som för övriga fält: saknat eller trasigt betyder okänt.
