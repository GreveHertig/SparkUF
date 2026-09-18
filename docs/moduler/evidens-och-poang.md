# Modul: Evidens och poäng

## Syfte

Poängen (uppdrag avsnitt 1.4 punkt 4, och hela avsnitt 7): 1–100, alltid
synlig, mäter bevisgrad — inte idékvalitet. Den här modulen hämtar
**underlaget** poängen räknas ifrån; själva räkningen görs av
`calculateScore` i `core/score.ts`, delad ren logik som **aldrig** får
dupliceras i en adapter (CLAUDE.md: "Poängen räknas alltid av
`calculateScore` och hårdkodas aldrig"). Används av Hem (poängbricka,
"Poängrörelse"-kortet), `/app/poang` och KPI-radens sparkline
(`getScoreHistory`, designuppdateringen i `docs/status.md`).

## Porten

`ports/EvidenceRepository.ts`:

```ts
getScoreSnapshot(locale: Locale): Promise<ScoreSnapshot>
getSuggestions(locale: Locale): Promise<ScoreSuggestion[]>
getScoreHistory(locale: Locale): Promise<number[]>
```

- `ScoreSnapshot` (`core/domain.ts`): `{ total, previousTotal, delta,
  deltaReason, calculatedAtIso, parts: ScorePart[], lockedParts:
  LockedScorePart[] }`.
- `ScorePart`: `{ name, points, weight, source: Källa, dataType }` — en
  upplåst del, alltid med källa.
- `LockedScorePart`: `{ name, unlocksAfterStep }` — visas aldrig som en del
  med 0 poäng (avsnitt 7.3).
- `ScoreSuggestion` (`core/score.ts`): en kandidat för "Höj din poäng"
  (avsnitt 7.6), med ett härlett `pointsPerMinute`.

## Datakällor och vad som krävs

- **Supabase**, tabell `evidence` (uppdrag 14.4: "med `source`, `fetched_at`,
  `data_type`") — varje enskilt bevis (`EvidenceItem`, `core/score.ts`)
  grundaren eller en annan modul samlat in, plus `score_snapshots` för
  historik (`getScoreHistory`).
- **`calculateScore` (`core/score.ts`) är delad ren logik — adaptern
  hämtar bevis, den räknar.** Liveadaptern ska aldrig räkna ut `total`
  eller `parts` själv; den samlar ihop `PartEvidence[]` ur `evidence`-tabellen
  och skickar det genom `calculateScore`, exakt som demoadaptern gör mot
  `sara.ts`s beats (se nedan). Att bryta det mönstret är den vanligaste
  risken i den här modulen — det skulle duplicera reglerna i 7.2–7.4 på två
  ställen som kan glida isär.
- Ingen extern tjänst. Andra moduler (Registret, Utskick och svar,
  Webbresearch/Pulsen, Simuleringar — den sistnämnda **ger aldrig poäng**,
  7.4) skriver in bevis i `evidence`-tabellen; den här porten läser bara.

## Hur demoadaptern fungerar i dag

`adapters/demo/EvidenceRepository.ts` räknar aldrig poäng själv:

- `getScoreSnapshot`/`getScoreHistory` går via `getScoreSnapshotForBeat`/
  `getScoreHistoryUpToBeat` i `adapters/demo/sara.ts`, som anropar
  `calculateScore` på det aktuella (eller varje tidigare) momentets
  `PartEvidence[]`.
- `getSuggestions` kombinerar `saraSuggestionCandidates[locale]`
  (hårdkodade kandidater i `sara.ts`) med `deriveSuggestions`
  (`core/score.ts`), och filtrerar bort delar som är låsta i den aktuella
  fasen via `PHASE_UNLOCKED_PARTS`.
- Allt läser `useDemoStore.getState().beatIndex` (Zustand, utanför React)
  för att veta var i Saras scenario demot står.

## Acceptanskriterier

- `total` ligger alltid inom 1–100 (avsnitt 7.1: aldrig 0, klämt vid 100).
- Varje del i `parts` har en ifylld `source` (Datalöftet) — ingen poäng
  utan källa (avsnitt 7.3s regel, "ett upplåst del utan bevis kastar ett
  tydligt fel").
- `lockedParts`-poster är aldrig samma sak som en `ScorePart` med 0 poäng.
- `getSuggestions` returnerar bara delar som faktiskt är upplåsta i den
  aktuella fasen.
- `getScoreHistory` ligger alltid inom 1–100, kronologisk ordning (behöver
  inte vara stigande — poängen kan sjunka, avsnitt 7.4, se steg 05 i
  `docs/moduler/utskick-och-svar.md`).
- Klarar kontraktstestet i `ports/EvidenceRepository.contract.test.ts`.

## Säkerhet

RLS på `evidence` och `score_snapshots`, policy begränsad till ägarens
`user_id`/`project_id`. Ingen extern nyckel för själva räkningen (ren
funktion). Om `EvidenceItem`-citat kommer från extern källa (t.ex. Pulsen
eller Utskick och svar) är citatet data som redan validerats av den modulen
— den här porten litar på att `source` är sann, den verifierar den inte på
nytt.

## Status

stub — `adapters/live/EvidenceRepository.ts` kastar `NotImplementedError`
för alla tre metoderna. Demoadaptern är klar (`core/score.ts` byggdes och
testades i Session 2, `docs/status.md`) och används av alla poängvisande
`/demo/app`-sidor. `calculateScore` i sig är redan produktionsklar ren
logik — den här modulens arbete är bara att koppla in Supabase-hämtningen
runt den, inte att skriva om räkningen.
