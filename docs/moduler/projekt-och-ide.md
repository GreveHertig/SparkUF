# Modul: Projekt och idé

## Syfte

Bär idén grundaren jobbar på genom hela resan. Sätts antingen av
**idégenomlysningen** (uppdrag avsnitt 2.1, "Jag har redan en idé") eller
växer fram ur **02 Möjligheter** ("Jag har ingen idé än"). Innan något av
det har hänt finns inget projekt — `getProject()` returnerar `null`, och det
är ett giltigt, väntat svar, inte ett feltillstånd.

## Porten

`ports/ProjectRepository.ts`:

```ts
getProject(): Promise<Project | null>
```

`Project` (definierad i porten, inte i `core/domain.ts`): `{ id: string;
name: string; oneLiner: string }`.

## Datakällor och vad som krävs

- **Supabase**, tabell `projects` (uppdrag 14.4) — en rad per grundare (en
  grundare har ett projekt i taget i prototypen; flera projekt per
  användare är inte en del av 14.4:s datamodell och kräver ett beslut innan
  det byggs). RLS på ägarens `user_id`.
- Ingen extern tjänst. Idégenomlysningen som *sätter* `Project`-raden går
  via Medgrundaren (`docs/moduler/medgrundaren.md`, Gemini) — den här
  porten är bara läsningen/lagringen av resultatet, inte själva analysen.
- Ingen skrivande metod finns än i porten (bara `getProject`) — en
  `setProject`/`createProject`-metod behöver läggas till när **02
  Möjligheter**/idégenomlysningen faktiskt kopplas in mot en skärm.
  Flagga det behovet till den session som bygger `/app`s onboarding, det är
  inte löst här.

## Hur demoadaptern fungerar i dag

`adapters/demo/ProjectRepository.ts` returnerar ett hårdkodat objekt
(`{ id: "kvittojakten", name: "Kvittojakten", oneLiner: "Automatisk
insamling av kvittounderlag åt redovisningsbyråer." }`) — aldrig `null`.
Ingen skärm i `/demo/app` använder porten i dag (kommentar i filen:
onboarding/idévalet är inte byggt, se `docs/status.md` "Återstår").

## Acceptanskriterier

- `getProject()` returnerar `null` för en användare som inte gjort
  idégenomlysningen eller valt en idé än — ingen skärm får krascha på det.
- När ett projekt finns är `id`, `name` och `oneLiner` alltid ifyllda.
- Klarar kontraktstestet i `ports/ProjectRepository.contract.test.ts`.

## Säkerhet

RLS på `projects`, policy begränsad till ägarens `user_id`. Idéns
`oneLiner` kan innehålla grundarens fria text — om den någonsin skickas
vidare till Gemini (t.ex. för att generera ett nytt förslag) är den data,
aldrig instruktion (avsnitt 14.6).

## Status

stub — `adapters/live/ProjectRepository.ts` kastar `NotImplementedError`.
Demoadaptern är en enkel platshållare, inte kopplad till någon skärm än.
Bygg den här modulen tillsammans med onboardingen (idégenomlysning/**02
Möjligheter**), inte isolerat — porten saknar troligen en skrivmetod som
den sessionen behöver lägga till.
