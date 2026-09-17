# Claude Code-sessioner för Spark UF

## Förberedelse
Klart: branchen `prototyp` finns och filerna ligger i `CLAUDE.md` (tillagt under befintligt innehåll), `docs/`, `public/brand/` och `design-referens/fonda/`.

## Kom ihåg under arbetet
- **En session per uppgift.** Starta en ny chatt för varje session nedan.
- **När en chatt blir lång:** be den uppdatera `docs/status.md` och committa. Starta sedan en ny chatt och klistra in samma sessionsprompt igen. Den nya chatten fortsätter där den förra slutade.
- **Session 6** kan köras parallellt med 2–5 när session 1 är klar.

---

## Session 1 – Grund och designsystem
```
Läs CLAUDE.md och docs/uppdrag.md avsnitt 0, 3, 4, 5 och 8. Studera också design-referens/fonda/ om mappen finns.

Obs: repot har redan ett Next.js-projekt (app/, lib/, types/, AGENTS.md). Läs AGENTS.md och bygg vidare i den befintliga strukturen i stället för att skapa src/. Ta inte bort eller skriv om befintlig kod utan att fråga mig.

Uppgift: byt till branchen prototyp (den finns redan, kör git pull) och bygg grunden:
- Next.js-appen med stacken
- tokens (färger, typografi, radier, spacing, rörelse)
- typsnitt
- loggan i ljus och mörk variant
- i18n-strukturen med SV/EN-växel
- /designsystem med grundkomponenterna: Eyebrow, EditorialHeading, SourceTag, DataFact, ConceptBadge, DemoDataBadge, ScoreBadge, LockedState, NextStepCard, PulseCard och VerdictCard

Skapa även docs/status.md och DESIGN.md.

Stanna när designsystemet är klart. Beskriv den visuella riktningen och vänta på mitt godkännande. Bygg inga appsidor än.
```

## Session 2 – Poängmotor och demomotor
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 7 och 9.

Uppgift:
- Bygg datatyperna för demot (demo/types.ts i repots struktur).
- Bygg calculateScore med tester för alla regler i avsnitt 7, inklusive förslagen och typerna av luckor.
- Bygg demo-store (Zustand + localStorage) och demoraden med tangentbordsstyrning.
- Skapa ett minimalt testscenario som bevisar att motorn fungerar.

Inga riktiga scenarier och inga appsidor i den här sessionen.
```

## Session 3 – Appen och Sara, steg 01–06
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 1, 2, 6, 8, 9.1, 9.3, 9.5 och 10.

Uppgift:
- Bygg applayouten och alla /app-sidor.
- Lägg in Saras scenario för steg 01–06 med alla moment (före, körning, efter) på båda språken.
- Pulsen och den juridiska kollen för dessa steg ingår.
- Poängen ska hamna på målvärdena ±2.

Varje sida ska spegla demots aktuella läge.
```

## Session 4 – Sara, steg 07–12
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 2.3, 2.4, 9.3, 9.5 och 10.

Uppgift: lägg in Saras steg 07–12 med alla moment på båda språken. Det omfattar:
- affärsfallet och priset
- omfånget
- det formella med den juridiska kartan
- bygget via Lovable (koncept) med förhandsvisning och publicering
- de första kunderna
- kapitalet
- slutvyn "Bevisad affär"

Kör hela Saras demo från start till slut och kontrollera att poängen följer målvärdena.
```

## Session 5 – Onboarding och Jonas
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 2.1, 6 (Onboarding), 9.4 och 10.

Uppgift:
- Bygg /start med de två ingångarna, profilsamtalet och idégenomlysningen.
- Lägg in hela Jonas scenario (alla 12 steg, inklusive pivoten i steg 06) på båda språken.
- Knappen "Byt ingång" i demoraden ska fungera.
```

## Session 6 – Landningssida och publika sidor
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 1, 2, 5 och 6 (Publika sidor). Studera design-referens/fonda/ noggrant.

Uppgift: skapa branchen prototyp-landning från prototyp och bygg /, /priser, /logga-in och /skapa-konto.
- Det här är produktens skyltfönster och ska hålla världsklass.
- Använd designsystemets komponenter och visa riktiga produktkort i sektionerna.
- Allt ska finnas på båda språken.

Börja med att föreslå sektionsordning och layout för landningssidan och vänta på godkännande. Öppna en pull request mot prototyp när du är klar.
```

## Session 7 – Rundtur, manus och polering
```
Läs CLAUDE.md, docs/status.md och docs/uppdrag.md avsnitt 9.2, 11 och 12.

Uppgift:
- Bygg den guidade rundturen, knuten till demots moment.
- Skriv docs/demo-manus.md i en 5- och en 10-minutersversion.
- Polera:
  - kontrollera att de engelska texterna är kompletta
  - gå igenom rörelser och övergångar
  - gå igenom tillgängligheten
- Kör båda demona på båda språken från start till slut.
- Slutför README.md och DESIGN.md.
- Kontrollera att next build går igenom utan varningar.
```
