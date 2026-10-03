# Modul: Min plan

## Syfte

Grundarens egen att-göra-lista. I dag fylls den från spelböckerna i Pulsen
("Lägg till stegen i min plan") och bockas av i Resan. Stegen är förskrivna
i18n-texter (spelbokens "Så löser du det" eller "Så tar du vara på det"),
och signalens rubrik följer med som sammanhang. Beslut i `docs/beslut.md`
(2026-10-03).

## Porten

`ports/PlanRepository.ts`:

```ts
getItems(): Promise<PlanItem[]>            // öppna först, sedan avbockade, äldst först
addItems(items: NewPlanItem[]): Promise<number>  // antal som faktiskt lades till
setDone(id: string, done: boolean): Promise<void>
removeItem(id: string): Promise<void>
```

Gränserna ligger i `core/plan.ts`: text högst 300 tecken, sammanhang högst
200, högst 50 öppna uppgifter (`PlanLimitError` i `core/errors.ts`).

## Data

`public.plan_items` (migrering `supabase/migrations/20261003180000_plan_items.sql`,
körs manuellt i SQL Editor). RLS: select, insert, update och delete bara på
egna rader. `origin` är i dag bara `pulsen`, `origin_ref` signalens id utan
främmande nyckel (en signal som rensas ur `pulse_signals` tar inte planen
med sig). Unikt index på användare, ursprung och text (utan skillnad på
stora och små bokstäver), så knappen kan tryckas två gånger.

## Ytor

- **Pulsen** (`app/(app)/app/pulsen/actions.ts`, `addPlaybookToPlan`):
  klienten skickar signalens id, sort, område och rubrik. Stegen slås upp i
  i18n på servern. Okänd sort eller okänt område sparar ingenting.
- **Resan** (`app/(app)/app/resan/actions.ts`): bocka av, bocka tillbaka och
  ta bort. Skärmen visar ändringen direkt och går tillbaka vid fel.
- **Demot** visar ingen plan. Demoadaptern finns för kontraktstestet.

## Utan tabellen

Är migreringen inte körd ger liveadaptern `NotImplementedError`. Då visas
varken knappen i Pulsen eller delen i Resan, och inget kraschar.

## Säkerhet

Användaren tas alltid ur sessionen (`requireSupabaseUser`), aldrig ur indata.
Text och sammanhang rensas från styrtecken och kapas, och visas som ren text.
Fel loggas bara med felets namn eller databasens kod, aldrig dess text.

## Status

påbörjad — byggd 2026-10-03 på `modul/pulsen-spelbok`, väntar på granskning
och på att migreringen körs.
