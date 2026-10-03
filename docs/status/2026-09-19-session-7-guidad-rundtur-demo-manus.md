## Session 7 — Guidad rundtur, demo-manus (klar, gren `prototyp`)

Uppdrag: bygga klart den guidade rundturen (avsnitt 9.2), skriva
`docs/demo-manus.md` i en 5- och en 10-minutersversion, och klicka igenom
båda personorna på båda språken och rätta det som var trasigt. Sessionen
återupptog ett tidigare avbrott (commit `a96fd80`, "Session 7 pågående")
som redan hade skrivit alla 20 stoppens innehåll (`adapters/demo/
tourSteps.ts`) och satt `data-tour-id` på 8 av 15 mål — men ingen
overlay-komponent renderade rundturen än. Två commits: overlayen +
kvarvarande mål, sedan manuset + status.md.

### Klart
- **Verklig bugg fixad innan overlayen ens byggdes:** `demoStore.ts`s
  `toggleTour()` navigerar till stopp 1:s route (`/demo/app`) men satte
  inte `onboardingDone`. `app/demo/app/layout.tsx`s onboarding-koll hade
  därför skickat tillbaka till `/demo/start` direkt så fort någon startade
  rundturen innan de klickat sig igenom onboardingen — samma mönster som
  `DemoBar.tsx`s redan existerande `jumpToStep` löser, nu tillämpat på
  `toggleTour` också.
- **De 7 kvarvarande `data-tour-id`-målen** tillagda: `journey-verdict`/
  `journey-highlights` (`screens/JourneyStep.tsx`), `score-breakdown`/
  `score-suggestions` (`screens/Score.tsx`), `legal-map`
  (`screens/Legal.tsx`), `build-spec` (`screens/Build.tsx`), `pulse-list`
  (`screens/Pulse.tsx`) — alla 15 mål som `tourSteps.ts` refererar finns
  nu i markupen.
- **`components/spark/TourOverlay.tsx`, ny:** hela overlay-lagret.
  Navigerar till stoppets route och hoppar till stoppets `beatId` (sökt
  upp i `saraBeats` — rundturen tvingar alltid entry till "noIdea", se
  `demoStore.ts`s `toggleTour`) i två separata effekter. Spotlighten hittas
  via `document.querySelector('[data-tour-id="…"]')` och mäts om **varje
  animationsframe** medan ett stopp med `target` är aktivt (inte
  engångs-scroll/resize-lyssnare) — självläkande om innehållet under
  hinner flytta sig efter att demodatan laddat klart, utan att behöva
  gissa en fördröjning. Spotlighteffekten är en enda osynlig ruta i målets
  storlek vars 9999px-spridda `box-shadow` fyller resten av skärmen (`0 0
  0 9999px rgba(...)`), inte ett separat dimmat lager ovanpå — se
  kommentaren i filen om varför ett sådant extra lager hade täckt över
  hålet igen (upptäcktes och fixades under bygget, aldrig committat i det
  trasiga skedet). Kort med titel/text (båda språken), "Stopp X av 20",
  Nästa/Hoppa över/Avsluta rundtur, en liten CSS-pilspets mellan kort och
  spotlight, centrerat kort för de tre stoppen utan `target`. Respekterar
  `prefers-reduced-motion` via den redan befintliga
  `design/usePrefersReducedMotion.ts`. Monterad i `app/demo/app/layout.tsx`
  och `app/demo/start/layout.tsx`, bredvid `<DemoBar />` — ingen skärm vet
  att den finns.
- **Verklig layoutbugg hittad med en riktig webbläsare, inte bara
  jsdom:** kortets "ovanför spotlighten"-placering använde
  `translateY(-100%)` från en okänd renderad höjd. För ett mål nära
  toppen av skärmen (kort plats ovanför, mer plats nedanför skulle egentligen
  väljas — men villkoret jämförde bara relativt utrymme ovanför/nedanför,
  inte om utrymmet faktiskt räckte) kunde kortet hamna ovanför `y = 0`,
  helt utanför viewporten och därmed **fysiskt oklickbart** — bekräftat med
  en Playwright-klickgenomgång som fastnade med "element is outside of the
  viewport". Fixat: ett rimligt höjdöverslag (`ESTIMATED_CARD_HEIGHT`,
  220px) och `Math.max`/`Math.min`-clampning i stället för
  `transform: translateY(-100%)` — kortet garanteras nu innanför skärmen i
  båda lägena. Ett bra exempel på varför komponenttester i jsdom (som alla
  gick gröna även med buggen kvar — jsdom mäter aldrig verkliga
  bounding-rects) inte ersätter en riktig browser-klickgenomgång för
  positioneringslogik.
- **`components/spark/TourOverlay.test.tsx`, ny:** rendering av stopp 1
  (centrerat kort), Nästa/Hoppa över, sista stoppets "Avsluta rundtur", och
  att ett `data-tour-id`-mål hittas utan att krascha.
- **`docs/demo-manus.md`, ny:** en 10-minutersversion som går igenom alla
  20 rundturstopp med ett talat stycke per stopp (utöver kortens egna korta
  UI-text), och en kurerad 5-minutersversion (10 av de 20 stoppen). Följer
  rundturens klick rakt av, med en kort not om motsvarande "Hoppa till
  steg"-klick för den som demar utan overlay.
- **Verklig webbläsarverifiering** (Playwright, headless Chromium,
  installerat i en scratch-mapp utanför repot enligt samma mönster som
  Session 6 — inget webbläsarverktyg anslutet i den här sessionen heller):
  `pnpm build` + `pnpm start`, ett skript som klickar igenom **hela
  onboardingen och alla beats för både Sara (ingång A) och Jonas (ingång
  B), på både sv och en** (fyra fulla körningar), plus rundturen från
  stopp 1 till stopp 20 på båda språken — noll `pageerror`/`console.error`
  i samtliga sex körningar. Detta är grundligare än tidigare sessioners
  `curl`-baserade verifiering (som bara ser den statiska skalet före
  klienthydrering) — se "Beslut nästa session" om att återanvända mönstret.
- Verifierat: `pnpm typecheck`/`lint`/`test` (37 filer, 205 gröna + 35
  förväntat skippade — fem nya gröna från `TourOverlay.test.tsx`) och
  `pnpm build` går alla igenom utan fel eller varningar.

### Beslut nästa session behöver känna till
- **Playwright-mönstret i den här sessionen gav en verklig bugg jsdom
  aldrig kunde hittat** (positioneringen ovan). Nästa session som bygger
  UI med egen positionslogik (`getBoundingClientRect`, `position:
  fixed`/`absolute` med beräknade koordinater) bör upprepa mönstret:
  `npm install playwright@1.63.0` i en scratch-mapp utanför repot
  (Chromium låg redan cachad under `~/.cache/ms-playwright`, ingen
  nedladdning behövdes), `pnpm build && pnpm start -p <ledig port>` (kolla
  `ss -ltnp` för porten först — en gammal `next start`-process kan sitta
  kvar och svara med gammalt byggresultat, precis vad som hände en gång
  under den här sessionen), sedan ett Playwright-skript som faktiskt
  klickar och skärmdumpar i stället för att bara läsa DOM:en.
- **`TourOverlay.tsx`s spotlight-mätning kör kontinuerligt via
  `requestAnimationFrame` så länge ett stopp med `target` är aktivt** —
  medvetet, inte en optimering som glömdes bort. Se kommentaren i filen
  innan den byts mot engångs-lyssnare.
- **Rundturens 20 stopp är fortfarande bara skrivna mot Saras scenario**
  (oförändrat sedan det avbrutna skedet) — samma medvetna avgränsning som
  `demoStore.ts`s `toggleTour` redan dokumenterar. Att bygga en egen
  rundtur för Jonas är inte gjort och inte efterfrågat än.
- **`docs/demo-manus.md`s talpunkter är skrivna av den här sessionen**,
  utöver rundturkortens egna korta UI-texter — om `tourSteps.ts`s
  titel/text ändras i en framtida session, uppdatera manuset i samma
  commit så de inte glider isär.

### Kända problem / medvetna begränsningar
- Inga nya. Onboardingen, alla nio undersidorna och rundturen klickades
  igenom på riktigt (se ovan) utan fel för båda personorna på båda
  språken — de tidigare sessionernas upprepade "ingen
  webbläsarverifiering"-anteckning gäller inte längre för just den här
  ytan.
- De sju icke-ingångsmedvetna modulerna (Pulsen, Kunder, Marknad, Bygg,
  Juridik — se "Session — Jonas hela resan" ovan) är oförändrade: Jonas
  klickgenomgång i den här sessionen bekräftar bara att sidorna inte
  kraschar för honom, inte att de visar hans data. Redan känt, inte
  löst här (utanför sessionens uppdrag).
