# Modul: Min plan

## Syfte

Grundarens egen att-göra-lista. Den fylls från spelböckerna i Pulsen
("Lägg till stegen i min plan") och med grundarens egna uppgifter, och den
ändras och bockas av i Resan. Stegen är förskrivna
i18n-texter (spelbokens "Så löser du det" eller "Så tar du vara på det"),
och signalens rubrik följer med som sammanhang. Beslut i `docs/beslut.md`
(2026-10-03).

## Porten

`ports/PlanRepository.ts`:

```ts
getItems(): Promise<PlanItem[]>            // öppna först, sedan avbockade, äldst först
addItems(items: NewPlanItem[]): Promise<number>  // antal som faktiskt lades till
updateText(id: string, text: string): Promise<void>  // PlanTextError("empty" | "duplicate")
setDone(id: string, done: boolean): Promise<void>
removeItem(id: string): Promise<void>
```

Gränserna ligger i `core/plan.ts`: text högst 300 tecken, sammanhang högst
200, högst 50 öppna uppgifter (`PlanLimitError` i `core/errors.ts`).

## Data

`public.plan_items` (migreringarna `supabase/migrations/20261003180000_plan_items.sql`
och `20261003210000_plan_items_egna.sql`, körs manuellt i SQL Editor i den
ordningen). RLS: select, insert, update och delete bara på
egna rader. `origin` är `pulsen` eller `own` (grundarens egen uppgift), `origin_ref` signalens id utan
främmande nyckel (en signal som rensas ur `pulse_signals` tar inte planen
med sig). Unikt index på användare, ursprung och text (utan skillnad på
stora och små bokstäver), så knappen kan tryckas två gånger.

## Ytor

- **Pulsen** (`app/(app)/app/pulsen/actions.ts`, `addPlaybookToPlan`):
  klienten skickar signalens id, sort, område och rubrik. Stegen slås upp i
  i18n på servern. Okänd sort eller okänt område sparar ingenting.
- **Resan** (`app/(app)/app/resan/actions.ts`): bocka av, bocka tillbaka, ta
  bort, ändra text och lägg till en egen uppgift. Uppgifterna grupperas per
  nyhet (`groupPlanItems` i `screens/Journey.tsx`), egna för sig. Varje öppen
  uppgift har "Hjälp mig med det här".
- **Medgrundaren** (`/app/medgrundaren?task=<id>`): uppgiften blir en
  förifylld fråga (`toTaskDraft` i `app/(app)/app/medgrundaren/signalDraft.ts`).
- **Hem**: "Nästa i din plan": den öppna uppgiften med närmast sista dag,
  annars den första öppna.
- **Sista dag** (Pulsen v3): `PlanItem.due` med källa (artikelns namn och
  hämtdag), kolumnerna `due_date`, `due_source`, `due_fetched`
  (migrering `20261004090000_pulsen_v3.sql`). Datumet hämtas ur grundarens
  egen signal på servern, aldrig från klienten.
- **Demot** visar ingen plan. Demoadaptern finns för kontraktstestet.

## Utan tabellen

Är migreringen inte körd ger liveadaptern `NotImplementedError`. Då visas
varken knappen i Pulsen eller delen i Resan, och inget kraschar.

## Säkerhet

Användaren tas alltid ur sessionen (`requireSupabaseUser`), aldrig ur indata.
Text och sammanhang rensas från styrtecken och kapas, och visas som ren text.
Fel loggas bara med felets namn eller databasens kod, aldrig dess text.

## Status

påbörjad — version 1 mergad 2026-10-03 (#69). Version 2 (grupper, hjälp,
ändra, egna uppgifter, Hem) på `modul/min-plan-v2`, väntar på granskning och
på att `20261003210000_plan_items_egna.sql` körs.
