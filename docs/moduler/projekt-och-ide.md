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
getIdeaScreening(locale: Locale): Promise<IdeaScreening>
```

`Project` (definierad i porten, inte i `core/domain.ts`): `{ id: string;
name: string; oneLiner: string }`.

`getIdeaScreening` (tillagd i Session 5, `docs/status.md`) är själva
idégenomlysningen (`/start/ide`): idén nedbruten i antaganden (märkta
testbara mot registret nu eller inte), en första registerbild, Medgrundarens
raka omdöme om vad som är svagt och den skarpare versionen. Den **sätter
inget** — läsning/presentation bara. Skrivmetoden som faktiskt sparar det
grundaren till slut väljer (den ursprungliga idén, eller den skarpare
versionen) till `projects`-tabellen finns fortfarande inte, se
"Acceptanskriterier" och "Status" nedan — samma lucka den här modulens
dokument redan flaggade innan Session 5.

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
Ingen skärm använder `getProject` i dag.

`getIdeaScreening` returnerar Jonas fiktiva idégenomlysning (padelhallar,
uppdrag 9.4) — den enda ingången som är byggd (`/demo/start/ide`, Session
5). Jonas fulla 12-stegsresa efter genomlysningen är inte byggd, så
`/demo` visar fortfarande bara Saras scenario oavsett vilken ingång
demot startades med (flaggat i `docs/status.md` Session 5).

## Acceptanskriterier

- `getProject()` returnerar `null` för en användare som inte gjort
  idégenomlysningen eller valt en idé än — ingen skärm får krascha på det.
- När ett projekt finns är `id`, `name` och `oneLiner` alltid ifyllda.
- Klarar kontraktstestet i `ports/ProjectRepository.contract.test.ts` mot
  BÅDA adaptrarna nu (prövar fortfarande bara `getProject` —
  `getIdeaScreening` är inte kontraktstestad, se `docs/status.md` Session 5
  och Session P1).

## Säkerhet

RLS på `projects`, policy begränsad till ägarens `user_id`. Idéns
`oneLiner` kan innehålla grundarens fria text — om den någonsin skickas
vidare till Gemini (t.ex. för att generera ett nytt förslag) är den data,
aldrig instruktion (avsnitt 14.6).

## Status

påbörjad (Session P1, branch `plattform-p1-adaptrar`) — `getProject` är
klar och testad mot Supabase, returnerar `null` för ett konto utan aktivt
projekt (giltigt). `getIdeaScreening` är MEDVETET kvar som
`NotImplementedError`: den är i praktiken Medgrundaren/Gemini-analys, och
porten saknar fortfarande en skrivmetod för att spara vad grundaren väljer
— båda olösta sedan Session P2/5, inte löst i förbifarten här
(`ports/stubStatus.test.ts`s `PARTIELLA_STUBBAR`). Bygg skrivmetoden och
`getIdeaScreening` tillsammans med Jonas fulla resa, inte isolerat.

### Hur liveadaptern fungerar i dag

`adapters/live/ProjectRepository.ts`: `getProject()` läser den inloggade
användarens aktiva projekt (`is_active = true`) ur `projects` via
`requireSupabaseUser()`. Ett unikt partiellt index
(`projects_ett_aktivt_per_user`, i migreringen) håller "ett projekt i
taget"-regeln på databasnivå, inte bara i applikationskoden.
