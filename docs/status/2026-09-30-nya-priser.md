## Nya priser (klar 2026-09-30, direkt på `prototyp`)
Priserna på sajten och i demot följer nu prisplanen som Kingen (marknad/sälj) tog fram. Allt är fortfarande märkt som förslag.

### Klart
- `/priser`: Gratis blev **Provvecka** (0 kr i 7 dagar, kort krävs, steg 01–04, begränsad Puls). **Grundare** kostar 249 kr/mån (årsvis 2 490 kr) och innehåller hela resan 01–12, även bygget, med 3 miljoner gnistor i månaden. Bygg-credits blev **Gnistpaket**: 2 miljoner gnistor för 99 kr, 5 miljoner för 229 kr.
- Startsidans priskort, pristeasern och FAQ-svaret "Vad kostar det?" säger samma sak. Raden "Steg 10, bygget, ingår inte" är ersatt med provvecka, årspris och gnistpaket.
- Rundturens stopp 19 och `docs/demo-manus.md`: "249 kr i månaden, bygget ingår". `docs/uppdrag.md` avsnittet om `/priser` uppdaterat.
- Bara texter i `i18n/sv.ts` och `i18n/en.ts` (plus `tourCopy.ts`); inga komponenter eller nycklar ändrade.
- Kontroll: `typecheck` (efter `next typegen`), `lint` (0 fel), `test` (601 gröna).

### Beslut
- Gnistor är Sparks krediter: 1 input-token = 1 gnista, 1 output-token = 5 gnistor. Då kostar en gnista lika mycket oavsett användning och påfyllning går aldrig med förlust.
- Ingen permanent gratisnivå. Provveckan har AI-tak 10 kr per konto och 500 kr/mån totalt.
- Marknadsföringsmodulen säljs inte som tillägg för 99 kr (struket).

### Återstår
- Momsen: bekräfta med UF-rådgivaren att Spark varken tar ut eller drar av moms. Kalkylen bygger på det.
- Priset är ännu inte testat mot väntelistan (fyra prisfrågor).
- `pnpm typecheck` kräver att `next typegen` har körts (typen `LayoutProps` i `app/layout.tsx` genereras av Next). Värt att lägga in i skriptet.
