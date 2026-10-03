## Öppningsfrekvensen: 40 %, inte 38 % (2026-10-01, direkt på `design/en-design`)
Undantag från frysningen, på Theodors begäran inför pitchen. Rättar "Öppningsfrekvensen 38 % går inte jämnt ut på 20 mottagare" under "Fem rättningar inför pitchen", Kända problem.

### Klart
- **40 % = 8 av 20.** Talet är inte nyvalt. Det är vad demodatan redan visar: två dagar efter utskicket har exakt 8 av de 20 byråerna status "öppnat" (`OPENED_BEFORE_RESPONSES` i `adapters/demo/OutreachProvider.ts`).
- Ändrat, sv och en:
  - `adapters/demo/sara.ts`: alla 24 `openRate: 38`, höjdpunkten "2 dagar senare: 40 % har öppnat (8 av 20)." och Minnets spårrad
  - `adapters/demo/OutreachProvider.ts`: `outreachOpenRate` (Valideringens nyckeltal), med kommentar om var talet kommer ifrån
  - `adapters/demo/cofounderScript.ts`: "40 % har öppnat, 8 av 20."
  - `docs/uppdrag.md` 9.3: "till 20 byråer", "40 % har öppnat (8 av 20)" (stod 40 byråer och 38 %)
- Jonas 44 % på 25 mottagare (11) går redan jämnt ut och är orörd. `screens/Validation.test.tsx` har ett eget testvärde 38 som inte är demodata, också orört.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (866 gröna, 35 skippade), `pnpm build`. I webbläsaren: Saras alla 38 moment på Hem, Validering, Medgrundaren, Resan steg 5 och Minnet. 38 % syns ingenstans, 40 % på alla fem.

### Kvar (inte rättat, demot fryst)
- **Validering visar 40 % öppningsfrekvens, men tabellen "Alla kontaktade" visar alla 20 som "Öppnat" eller "Svarat"** från första svarsvågen. 40 % är läget två dagar efter utskicket, tabellen är läget efter svaren. Antingen ska nyckeltalet räknas ur tabellen (då blir det 100 %) eller märkas med sin tidpunkt. Ett innehållsbeslut.
