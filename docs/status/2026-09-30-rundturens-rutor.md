## Rundturens rutor (klar 2026-09-30, gren `fix/rundtur-rutor`, till `prototyp`)
Grundaren såg att rundturens ruta (spotlighten) inte täckte hela målet på vissa stopp, och efter första rättningen att kortet låg över rutan.

### Klart
- Regeln nu: kortet täcker aldrig rutan, rutan delar aldrig en rad eller ett kort, och målets början syns alltid. Kortet står helst bredvid, under eller över målet inom den säkra ytan; annars får det ligga över sidhuvudet eller demoraden (de är mörklagda under rundan).
- Ett mål som inte ryms bredvid kortet kortas vid en skarv mellan hela delar (`cutBetweenUnits` i `app/demo/_lib/tourGeometry.ts`, delarna mäts av `tourUnits` i `FondaTour.tsx`). Aldrig bara rubriken, och minst halva ytan. Går det inte skärs målet vid kortet med raka hörn, så att det syns att det fortsätter.
- Rättat: skrollen planerades efter förra stoppets korthöjd (fel läge när texten byttes), och en avrundning på 0,4 px kunde fälla placeringen med kortet överst.
- `scrimClipPath` tar radie per kant (raka hörn där målet fortsätter).
- Kontroll: alla 20 stopp i 1920×1080, 1440×900, 1366×768, 1280×720 och 390×844 med Playwright: inget överlapp, början syns på alla. `typecheck`, `lint` (0 fel), `test` (601 gröna).

### Kända problem / beslut
- Mål som är högre än skärmen (svaren på stopp 10, juridiken, poänglistan, pulsen) kan inte visas hela samtidigt som kortet. De kortas till de hela rader som ryms. På 1920×1080 gäller det bara stopp 10. Ska de synas hela måste stoppen peka på mindre delar av sidorna (ett innehållsbeslut, inte gjort).
