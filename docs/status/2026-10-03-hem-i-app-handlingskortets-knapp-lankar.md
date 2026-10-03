## Hem i /app: handlingskortets knapp länkar till steget (2026-10-03, gren `bygg/hem-knapp`, PR mot `prototyp`)
Rättar att knappen i handlingskortet på `/app` inte gjorde något: `app/(app)/app/page.tsx` är en Server Component och kunde inte skicka `onNextStep`. Plan godkänd av Theo 2026-10-03.

### Klart
- **`screens/AppHome.tsx`:** ny valfri prop `nextStepHref`. När den är satt renderas handlingskortets knapp som `<Link>` (samma etikett och klass), annars som `<button onClick={onNextStep}>` som förut. Demot skickar bara `onNextStep` och är oförändrat. Ingen ny text.
- **`app/(app)/app/page.tsx`:** skickar `nextStepHref` = `/app/resan/<stegnummer>` för steget med `status: "current"` i `journeySteps`, bara när handlingskortet finns (`homeSummary`) och ett aktuellt steg finns. Annars ingen länk. Resans bas-väg är en konstant som delas med `journeyBasePath`.
- **Tester:** `screens/AppHome.test.tsx` (länk med rätt `href`, ingen knapp), `app/(app)/app/page.test.tsx` (länk till aktuellt steg, ingen länk utan aktuellt steg; ett äldre test väntade sig en knapp och väntar nu en länk).
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1213 gröna före testrättningen, de berörda 16 filerna gröna efter) och `pnpm build` (med platshållarvärden för `NEXT_PUBLIC_SUPABASE_*`).
- **Klickat igenom (Playwright, sv/en, 1280 och 390):** `AppHome` i en tillfällig rutt som inte är committad. Länken har `href="/app/resan/3"`, rätt etikett, inga konsolfel.

### Kända problem
- Det riktiga inloggade flödet är inte provat mot SparkUF2 (inga nycklar i molnmiljön). Den tillfälliga rutten låg utanför skalet och saknade designens CSS, så layouten är inte bedömd.
- Demons Hem ligger bakom den guidade rundturen och klickades inte igenom; demons kod är oförändrad och dess enhetstest för `onNextStep` är grönt.
- Fixturen i `page.test.tsx` ("Resans riktiga handlingskort") har steg 1 som aktuellt men kortet säger steg 02, så länken blir `/app/resan/1` där. Testet kontrollerar bara att länken finns.

### Beslut
- Stegnumret hämtas ur `journeySteps` (aktuellt steg) i stället för att ändra `NextStep` eller `ports/`, som inte får röras. Det är samma steg som `getHomeSummary` bygger kortet på.
