## Session — Två flödesfixar, Saras steg 07–12 i djup (klar, gren `prototyp`)

Uppdrag: (1) profilsamtalet ska gå framåt utan klick, (2) Medgrundaren ska
visa en ren chattyta i stället för hela historiken, (3) Session 4 — Saras
steg 07–12 i samma tre-momentsdjup som 01–06 (uppdrag 9.1), med extra
noggrannhet på steg 07:s prissättningsunderlag och steg 10:s
Lovable-koncept. Två commits: flödesfixarna, sedan djupet i 07–12.

### Klart — flödesfixar
- **`screens/OnboardingProfile.tsx`:** profilsamtalet går nu framåt av sig
  själv. Medgrundarens fråga visas, svaret dyker upp ~900 ms senare, och
  samtalet går vidare till nästa fråga ~1 400 ms efter det — ingen knapp
  att klicka på längre. Implementerat med två `useEffect` som bara sätter
  state inuti `setTimeout`-callbacks (ESLints `react-hooks/set-state-in-
  effect` tillåter inte synkrona `setState`-anrop i en effekts body direkt
  — se kommentarerna i filen). Ett bytt ingång (annat persona-samtal)
  monteras om via `key={entry}` på anropande route
  (`app/demo/start/profil/page.tsx`) i stället för att skärmen nollställer
  sitt eget state — enklare och undviker samma lintregel.
  `screens/OnboardingProfile.test.tsx` omskrivet till `vi.useFakeTimers()`
  och `vi.advanceTimersByTime(...)` i stället för `fireEvent.click`.
- **`screens/Cofounder.tsx` + `app/demo/app/medgrundaren/page.tsx`:**
  Medgrundaren visade tidigare HELA historiken (`saraBeats.slice(0,
  beatIndex + 1)`, alla nådda moments transkript i följd) — en skärm som
  bara växte längre för varje klick i demoraden. Visar nu bara det
  AKTUELLA momentets transkript. Tidigare "-efter"-moments Spår-
  sammanfattningar visas i stället som en kort "Sedan tidigare"-rad
  (`CofounderData.context`, ny i18n-nyckel `cofounderPage.contextTitle`)
  — kort text, inga chattbubblor, ingen scroll. `CofounderData.moments`
  (array) ersatt av `CofounderData.moment` (singular, kan vara `null`).
  Ingen befintlig skärmtest fanns för `Cofounder.tsx` (bara portkontrakt
  och en stubStatus-referens), så inget att uppdatera där.
- **Avsnitt 10 tillämpat på riktigt:** lade till Medgrundarens föreslagna
  exempelrad från uppdraget rakt av ("Du sa i steg 06 att du hellre
  tappar småbyråerna än sänker priset") i `07-affarsfall-korning` —
  Medgrundaren tar nu tillbaka ett tidigare beslut i själva repliken, inte
  bara i en textrad ovanför chatten.

### Klart — Session 4: Saras steg 07–12 i djup
- **`adapters/demo/sara.ts`:** steg 07–12 omskrivna från ett enda
  `momentKind: "after"`-beat vardera till samma `makeStepBeats`-mönster
  som 01–06 (`-fore`/`-korning`/`-efter`, 18 nya beats totalt). Poängen
  ändrades INTE — samma `partsAfter`/`EvidenceItem`-poäng som innan,
  bara ompaketerat. Verifierat med ett tillfälligt testskript (inte
  kvarlämnat, se nedan) att totalsummorna per steg är oförändrade: 60,
  66, 70, 77, 88, 92 — identiska med Session 3:s redan godkända
  kalibrering (±2 mot 9.3:s 60, 66, 69, 78, 88, 91).
- **Fasövergång rättad på riktigt under arbetet:** `makeStepBeats` kräver
  att `phaseBefore`/`phaseAfter` matchar VILKEN fas som faktiskt låser upp
  en dels bevis (`core/score.ts`s `PHASE_UNLOCKED_PARTS`) — en del som är
  upplåst men saknar bevis kastar `calculateScore`s "ingen poäng utan
  källa"-fel. Steg 07 sattes först fel till `phaseBefore: "launch"` (borde
  vara `"tryAfterCalls"` — Produkt/Genomförbarhet låses upp först i
  steg 07:s EGET "-efter") och steg 11 fel till `phaseBefore: "grow"`
  (borde vara `"launch"` — Traktion låses upp först i steg 11:s EGET
  "-efter"). Båda upptäcktes direkt av `pnpm test` mot ett tillfälligt
  kalibreringsskript och rättades. Ett bra exempel på varför `makeStepBeats`
  är värt att återanvända rakt av i stället för att fritt välja
  fas per steg.
- **Steg 07 (Affärsfall och pris) — prissättningsunderlaget gjort
  explicit:** highlights radar nu upp alla fyra underlagen enskilt (1.5:
  vad kunderna tål, vad jämförbara aktörer tar, vad kunderna själva sagt,
  vad som krävs för att gå ihop), med faktiska tal för var och en, i
  stället för en enda sammanfattande mening. Kostnadsgolvets aritmetik
  verifierad: 8 × 1 190 kr = 9 520 kr > 8 500 kr (break-even vid 8 kunder
  stämmer). Steg 07 fick också en egen `simulationKind: "price"` (återanvänder
  steg 06:s prissimulering, 1 000–1 300 kr) — avsnitt 2.2 nämner
  uttryckligen steg 03, 04, 06 OCH 07 som Hiasynth-ytor; bara 03/04/06 hade
  en simulering kopplad innan den här sessionen.
- **Steg 10 (Live) — Lovable-konceptet fördjupat:**
  - `ports/BuildProvider.ts`/`adapters/demo/BuildProvider.ts`:
    `getStatus()` returnerar nu även `creditsUsed` (avsnitt 2.3: "Visa att
    bygget kostar credits") — 40 credits under byggfasen, 62 efter
    publicering, `undefined` innan bygget påbörjats. `screens/Build.tsx`
    visar talet bredvid statuspillret (`buildPage.creditsUsedLabel`, ny
    i18n-nyckel). `types/bygg.ts`s `ByggBrief` rördes INTE (grundarens
    regel om att den filen inte skrivs om) — credits ligger i porten, inte
    i briefen.
  - `cofounderScript.ts` "10-live-korning": `ToolRunCard`s steg utökade
    till att uttryckligen spegla 2.3:s "skelett → komponenter → färdig
    sida" i stället för de tre vagare stegen som fanns innan.
  - `sara.ts` steg 10:s highlights nämner nu uttryckligen "Bygg drivs av
    Lovable · Koncept · partnerskap utforskas" (avsnitt 2.3:s exakta
    märkningstext) och credits-kostnaden.
- **`traceSummaryAfter` tillagt för alla sex stegen** — saknades helt
  innan (Spåret föll tillbaka på en generisk `momentLabel — title`-rad),
  nu en egen kort retrospektiv rad per steg, som för 01–06.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (227 tester, 192
  gröna + 35 förväntat skippade — oförändrat antal, inga nya testfiler
  behövdes) och `pnpm build` går alla igenom utan fel eller varningar.

### Beslut nästa session behöver känna till
- **`makeStepBeats`s `phaseBefore`/`phaseAfter` måste matcha exakt VILKET
  steg som introducerar en dels FÖRSTA bevis**, inte bara vilken fas som
  "känns rätt" för stegets nummer — se resonemanget ovan om steg 07/11.
  Kontrollera alltid mot `core/score.ts`s `PHASE_UNLOCKED_PARTS` innan en
  ny makeStepBeats-instans skrivs, särskilt för Jonas (nästa session).
- **Kalibreringsverifiering:** mönstret med ett tillfälligt
  `scratch.<namn>.test.ts` (vitest, skriver till `/tmp/...` eftersom
  `console.log` inte alltid syns i CI-liknande körning) som körs med
  `pnpm test scratch.<namn>` och sedan tas bort igen — INTE committat —
  är det etablerade sättet att kontrollräkna `calculateScore`-summor
  under utveckling. Använd samma mönster för Jonas.
- **`CofounderData` har ett nytt skal** (`context` + `moment` i stället
  för `moments`) — om Jonas kopplas in i Medgrundaren, bygg vidare på det
  skalet (en `context`-rad per tidigare "-efter"-beat, ett `moment` för
  den aktuella), inte den gamla `moments`-arrayen.

### Kända problem / medvetna begränsningar
- Inga nya. `07-affarsfall-korning`/`10-live-korning`s nya
  `ToolRunCard`-steg är fortfarande bara text, ingen ny animation eller
  komponent.
