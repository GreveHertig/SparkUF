## Registret: Bolagsverket-transporten provkörd (klar 2026-09-24, gren `docs/registret-provkorning`, PR mot `prototyp`)

### Klart
- **Grindkrav 1, Bolagsverket-delen: provkörd.** Erik körde den riktiga
  `lookupOrganisation` och `fetchDocumentList` från sin dator mot Volvo,
  Ericsson och H&M. Alla sex anropen lyckades.
- **Så kördes den:** en fristående bunt (`scratchpad/bv-transport-prov.mjs`,
  gitignorerad, byggd med rolldown som redan fanns i `node_modules`). Grinden
  var den riktiga. Bara `server-only` och inloggningen var utbytta i bunten,
  och inloggningen ersattes av Eriks user.id från en miljövariabel. Id,
  secret och token maskades.
- **Resultat:** varje bolag gav ett svar med alla fält mappade, även
  `registrationDate` (Volvo 1915-05-05, Ericsson 1918-08-19, H&M 1943-08-07).
  `advertisingBlock` var `null` (okänt) för alla tre. Detaljerna står i
  `docs/moduler/registret.md`, "Provkörning 2026-09-24".
- Punkten "Provkörning av TypeScript-transporten" under "Återstår" i avsnittet
  om steg A och B ovan är därmed klar.

### Återstår
- **`/dokumentlista` var tom för alla tre bolagen**, som i steg A. Prova med
  mindre aktiebolag som har lämnat årsredovisningen digitalt, med samma bunt:
  `node bv-transport-prov.mjs <org.nr> ...`. Det behövs innan `/dokument` och
  iXBRL byggs.
- **Grindkrav 1, SCB-delen:** `lib/server/scb.ts` kastar fortfarande.
  Grindkrav 2 och 3 återstår också, så grinden förblir stängd.

### Beslut nästa session behöver känna till
- **Provbunten är gitignorerad** och byggs om med
  `node scratchpad/bv-transport-bygg.mjs` om transporten ändras.
