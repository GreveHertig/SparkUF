## Fem rättningar inför pitchen (2026-10-01, direkt på `design/en-design`)

`origin/prototyp` mergad först (konflikt i `docs/beslut.md`, båda sidornas text behållen). En commit per rättning, pushad direkt.

### Klart
1. **Exempeltagg på påhittade registersiffror och poängdelar.** Marknads nyckeltal, storleksfördelning och datalager (ny valfri `MarketData.registrySource`, satt av demots route), Affärsplanens Marknaden-avsnitt och Jonas registerfakta (`adapters/demo/businessPlan.ts`), och alla poängdelar utom simuleringar (`adapters/demo/EvidenceRepository.ts`, nytt exempelursprung "poängunderlaget"). Inget register- eller myndighetsnamn står kvar på de sidorna.
2. **Exempeltagg på påhittade svar, citat och underlag.** Validering (nyckeltal, öppningsfrekvens, antaganden), Marknads utskick, Byggs underlag (ny valfri `BuildData.underlagSource`) och Affärsplanens citat, dom och underlag. Skärmarna Validering och Marknad ger svaren datatypen `example` när `dataKind` är `example`, annars `customer`. `/app` är oförändrat.
3. **20 mottagare, inte 40.** Kontaktlistan (`saraCompanies`) har 20 namngivna byråer, och Validering och Marknad räknar ur den. 40 hade krävt 20 påhittade bolag till. Berättelsen och `recipientCount` i `sara.ts` och Medgrundarens manus säger nu 20.
4. **Rundturen går framåt i tiden.** Stoppen 3–8 är omordnade: profilen (poäng 6), Medgrundarens marknadskörning (14), Marknads tre stopp (24), taket på 30 (27). Poängen sjunker bara vid 47 → 43, som stoppet handlar om. Nytt test, `adapters/demo/tourSteps.test.ts`, håller stoppens moment i ordning. Manuset och stoppnumren i `tourCopy.ts` följer.
5. **Bygg visar `kvittojakten.example` som text**, ingen länk (ny valfri `BuildData.publishedUrlIsExample`). `.example` är reserverad (RFC 2606) och kan aldrig leda till en död sida.
- Nya vakttester i `app/demo/demo.test.tsx`: Validering, Marknad, Bygg och Affärsplanen bär bara exempel- eller simuleringstaggar; Poängs delar bär "poängunderlaget"; Hems mottagare är lika många som kontaktlistan.
- `docs/demo-manus.md`: varningen om grå taggar och "rundturen hoppar i tiden" är borta, stoppen omnumrerade.

### Kända problem
- **Demot är fryst efter den här sessionen.** De åtta återstående punkterna från genomklickningen (se "Pitchsäkring av demot" ovan) tas efter lanseringen, inte före: Jonas motsägelser, "Höj din poäng" följer inte momentet, "Vad som hänt sedan sist" på Hem, Validering rullar vågrätt på 390 px, tomma eller upprepade rutor, rundturens stopp 9 lovar bevakning av öppningar, simuleringens population 312, och ordet "Spåret".
- **Öppningsfrekvensen 38 % går inte jämnt ut på 20 mottagare** (7,6 personer). Den kommer från `docs/uppdrag.md` 9.3, som räknar med 40 byråer (15 av 40). Inte ändrad.
- Landningssidans text "Skriver 40 personliga mejl" (`landingPage.cofounder.toolRun` i i18n) och Jonas `hallprognos.lovable.app` i löptext är inte ändrade.

### Beslut nästa session behöver känna till
- **I demot bär ingen tagg datatypen `register` eller `customer`.** Påhittad data får exempelkällan för sitt steg. Skärmarna tar emot källan och datatypen från routen (`registrySource`, `underlagSource`, `competitorsSource`, `creditsSource`) eller väljer `example` ur `dataKind`.
- **Demots utskick gick till 20 byråer.**
