## Pulsen: bättre signaler för alla idéer (2026-10-03, Bruno, gren `modul/pulsen-kund`)

Efter genomklickningen med Laddkollen på förhandsversionen av #50. Samma gren och PR som "kunden i sökningen". Detaljer i `docs/moduler/webbresearch-och-pulsen.md`, "Bättre signaler för alla idéer".

### Klart
- **Bara nyheter från de senaste 30 dagarna** (Tavily `topic: "news"`), så att konkurrenters produktsidor och guider inte kommer med. Reserv: vanlig sökning om nyhetssökningen ger noll träffar, fortfarande högst två anrop per dag.
- `lib/server/tavily.ts`: valfria `topic` och `days`. Andra anropare (Utskick) får exakt samma anrop som förut.
- **Sajtnamnet tas bort** ur rubriken när det matchar källan.
- **Engelska rubriker** sparas och visas inte.
- **Samma nyhet** från två källor visas en gång.
- **En signal per risk- och möjlighetsområde.**
- Äldre rader rensas på samma sätt vid läsning.
- Kontrakttestets fejkade Tavily-svar (`ports/PulseProvider.contract.test.ts`) har nu fyra olika rubriker i stället för samma rubrik fyra gånger. Bara testdata, porten är orörd.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1236 gröna, 45 skippade). Säkerhetsgranskning: inga fynd över låg nivå. De två låga (`days` måste vara ett ändligt tal, rubriken kapas innan regexen) är rättade.

### Kända problem
- En artikel utan publiceringsdatum får hämtdagen som datum. Kräver en kolumn att rätta.
- Kortet som blir kvar med "Dold. Den visas inte igen." efter "Inte relevant" ligger i `screens/` (Theodors).
