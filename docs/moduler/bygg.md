# Modul: Bygg

## Syfte

**10 Live** (uppdrag avsnitt 1.5, 2.3): grundaren bygger direkt i Spark via
Lovable, inbäddat i gränssnittet. Medgrundaren skriver byggspecen ur
bevisen från **08 Omfånget**, en förhandsvisning byggs upp (skelett →
komponenter → färdig sida), och sidan publiceras till en fiktiv domän i
demot. **Alltid koncept** — inget avtal finns (samma princip som
Simuleringar/Hiasynth, uppdrag 2.3: "Märk ytan … Koncept · partnerskap
utforskas … Använd bara namnet i text, ingen Lovable-logotyp").

## Porten

`ports/BuildProvider.ts`:

```ts
startBuild(brief: ByggBrief): Promise<{ status: BuildStatus }>
getStatus(): Promise<{ status: BuildStatus; url?: string }>
getSpec(locale: Locale): Promise<ByggBrief | null>
```

`BuildStatus`: `"not_started" | "building" | "published"`.

`ByggBrief` (`types/bygg.ts`, återexporterad via `core/domain.ts`):
`{ sammanfattning, målgrupp, sidor: string[], ton, underlag: Bevis[],
referensbilder?, referenssidor? }` — `underlag` är `Bevis[]`
(`types/evidence.ts`): varje påstående i specen kräver en `källa`.

## Datakällor och vad som krävs

- **Lovable — koncept, alltid stub**, som Hiasynth. Ingen liveintegration
  planeras förrän ett faktiskt partnerskap finns; till dess fortsätter
  liveadaptern kasta `NotImplementedError` även efter att andra moduler är
  klara.
- **Märkningskrav (uppdrag 2.3), gäller varje yta som visar Bygg:**
  "Bygg drivs av Lovable · Koncept · partnerskap utforskas", `ConceptBadge`,
  ingen Lovable-logotyp, och bygget ska visa att det kostar credits (ett
  UI-krav, inte en del av portens datakontrakt i dag — flagga om
  `startBuild`/`getStatus` någon gång behöver bära ett creditsaldo).
- Publicerad URL (`getStatus().url`) blir, om/när en riktig integration
  någonsin byggs, en verklig extern webbplats — behandla den som
  användardata (visa och länka, men verifiera den innan den renderas som
  en klickbar länk utan varning).
- Byggspecen (`ByggBrief`) skrivs av Medgrundaren
  (`docs/moduler/medgrundaren.md`) ur bevisen från steg 08 — den här porten
  lagrar/serverar specen, den genererar den inte själv.

## Hur demoadaptern fungerar i dag

`adapters/demo/BuildProvider.ts` härleder allt ur demomotorns läge
(`getCurrentStepNumberFor(useDemoStore.getState().beatIndex)`), ingen skärm
anropar `startBuild`:

- `getStatus`: `not_started` före steg 8, `building` steg 8–9, `published`
  från steg 10 — med en fast publicerad URL,
  `https://kvittojakten.lovable.app`, bara när `published`.
- `getSpec`: `null` före steg 8, annars en `ByggBrief` per språk
  (sammanfattning, målgrupp "Redovisningsbyråer med 10–20 anställda",
  fyra sidor, en ton-beskrivning, två `underlag`-poster med källan
  "Kundsamtal, steg 05–06" — de bygger en brygga tillbaka till de riktiga
  kundsvaren från Utskick och svar, inte påhittade krav).
- `startBuild` returnerar alltid `{ status: "building" }` — en
  platshållare, ingen skärm använder den.

## Acceptanskriterier

- `getSpec` returnerar `null` innan steg 08 är klart, aldrig en påhittad
  eller tom-men-"klar" spec.
- Varje `underlag`-post i en icke-null spec har en ifylld `källa`
  (Datalöftet gäller specen precis som poängen).
- `getStatus().status`-övergångar går bara framåt
  (`not_started → building → published`), aldrig bakåt.
- `url` finns bara när `status === "published"`.
- Klarar kontraktstestet i `ports/BuildProvider.contract.test.ts`.

## Säkerhet

Ingen hemlig nyckel i dag (ingen riktig integration). Om ett Lovable-avtal
någon gång ingås: nycklar bara i serverkod, publicerad URL visas för
användaren men behandlas som extern, overifierad data tills den faktiskt
laddats och kontrollerats. `ByggBrief`s fria textfält (`sammanfattning`,
`ton`) är grundarens/Medgrundarens text — data, aldrig instruktion, om de
någonsin skickas vidare till en extern byggtjänst.

## Status

stub, **avsiktligt permanent tills ett Lovable-partnerskap ingås** — samma
situation som Simuleringar. `adapters/live/BuildProvider.ts` kastar
`NotImplementedError` för alla tre metoderna. Demoadaptern är klar och
används av `/demo/bygg`.
