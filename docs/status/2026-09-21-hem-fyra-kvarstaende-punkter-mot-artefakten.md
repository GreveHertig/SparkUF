## Hem, fyra kvarstående punkter mot artefakten (klar, gren `prototyp`)

Fyra specifika avvikelser från `design-referens/artefakt/app.js`/`app.css`
som grundaren pekade ut efter förra sessionens omtag: poängvisningen,
poängdelarna, handlingskortet och sidomenyn. `core/score.ts`, `adapters/live/`,
`lib/server/`, `ports/` och demodatan rördes inte. Full motivering i
`DESIGN.md` under samma rubrik.

### Klart
- **Poängvisningen:** ny `components/spark/ScoreRing.tsx` (tunn SVG-ring,
  talet i mitten) ersätter `ScoreBadge` i sidhuvudet
  (`screens/AppShell.tsx`). `ScorePanel.tsx`s topp byggd om från en
  tonfärgad, fylld `ScoreBadge`-pill (det beigea blocket vid låga/mellan-
  poäng) till vanlig text: stort tal (medvetet UTAN `.font-numeric` —
  grundarens skriftliga undantag från "alla siffror är Funnel Display"),
  `/100`, nivånamn, rörelse, tunn skala. **Flaggad lucka:** ingen tak-
  markör på skalan — `PhaseId` (fem värden i `core/score.ts`) går inte att
  entydigt härleda ur `JourneyStepView.journeyPhase` (fyra värden) utan att
  gissa eller röra poängmotorn, så skalan visas utan den.
- **Poängdelarna:** varje rad i `ScorePanel.tsx` är nu namn vänster/poäng
  höger på en rad, en tunn kortare stapel under. `SourceTag` visas bara på
  den utfällda delen (ny lokal `useState`), inte på varje rad.
- **Handlingskortet (`NextStepCard.tsx`):** `why` delas vid meningsgränser
  till pilpunkter (ingen ny text — kontrollerat mot alla `why`-strängar i
  `sara.ts`, inga förkortningar som hade delat fel); en ensam mening visas
  fortfarande som vanlig text, inte en duplicerande ensam punkt. Tre val:
  huvudhandlingen, en ny "Senare" (lokalt UI-state, ingen egen data) och en
  ny "Visa/Dölj underlaget" som fäller ut `doneItems`. Poängen högerställd
  (`+N poäng`). Kravlistan har nu tomma kryssrutor + en äkta räknare
  (`ScoreSnapshot.parts.length` / `+ lockedParts.length`, nya valfria props
  `unlockedPartsCount`/`totalPartsCount`) — ingen bespoke kravtext hittades
  på, samma gräns som noterades i förra sessionens `DESIGN.md`-post. Fyra
  nya i18n-nycklar (`common.laterLabel`/`deferredLabel`/`showEvidenceLabel`/
  `hideEvidenceLabel`, sv+en); allt annat återanvänder befintliga nycklar.
- **Sidomenyn:** nytt `--navy`-alias i `design/tokens.css` (samma ton som
  `slate-800`), `--sidebar-bg: var(--navy)` i stället för den ljusa tonen.
  Kontrast uträknad, inte ögonmått: `slate-200` mot navy 10.67:1,
  `slate-400` 5.92:1, vit på `accent-600` (aktiv länk) 5.27:1 — alla klarar
  WCAG AA. **Inget föll under gränsen.**
- **Manuell webbläsarverifiering genomförd:** `pnpm dev` + en redan cachad
  `npx`-installation av Playwright (från en tidigare session, inget nytt
  projektberoende) — skärmdumpar av `/demo/app` (två beats) och
  `/demo/app/poang`, plus klickade interaktioner (expandera en poängdel,
  "Visa underlaget", "Senare"). Allt renderade och togglade korrekt, inga
  konsolfel. Hittade och städade bort en kvarglömd `next start`-process på
  port 3000 (gav 500:or pga `.next`-mismatch, samma mönster som en
  tidigare sessions `DESIGN.md`-notering) — testade mot `pnpm dev`s egen
  port (3001) i stället.
- Verifierat: `pnpm typecheck`/`lint`/`test` (373 gröna, 36 skippade som
  väntat) och `pnpm build` gröna.

### Beslut nästa session behöver känna till
- **Talets typsnitt i `ScorePanel.tsx`s topp är ett medvetet, skriftligt
  godkänt undantag** från "alla siffror är `.font-numeric`" — rör det inte
  utan att fråga igen.
- **Taköverst-markören på poängskalan saknas** (se "Flaggad lucka" ovan).
  Om den ska in måste antingen `ScoreSnapshot` börja bära den aktuella
  `PhaseId` (ett portkontrakt-beslut, inte en ren formgivningsändring) eller
  `journeyEngine.ts` börja skilja `tryBeforeCalls`/`tryAfterCalls` i det som
  redan exponeras — avgör med grundaren innan poängmotorn eller portarna
  rörs för det.
- **"Senare" i `NextStepCard` är rent kosmetiskt UI-state**, precis som
  artefaktens `S.deferred` — ingen backend, ingen persistens, nollställs vid
  omladdning. Samma avgränsning som demoradens "Byt ingång" hade innan den
  gjordes funktionell (Session 5).

### Kända problem
- Inga nya.
