# Modul: Minnet

## Syfte

Profilen, Hjärnan och Spåret (uppdrag avsnitt 1.3, 1.4 punkt 2): vem
grundaren är, grundarens egna fria anteckningar (som Spark läser men aldrig
städar), och allt som hänt, skrivet automatiskt. Visas på `/app/minnet` i tre
flikar (uppdrag 9.3, `@radix-ui/react-tabs`). Den här modulen är den enda i
listan med en **skrivande** metod (`setBrainNotes`) — Hjärnan är grundarens
egen text, inte ett härlett värde.

## Porten

`ports/MemoryRepository.ts`:

```ts
getProfileSummary(locale: Locale): Promise<ProfileSummary>
getBrainNotes(): Promise<string>
setBrainNotes(notes: string): Promise<void>
getTraceEvents(locale: Locale): Promise<TraceEvent[]>
recordTraceEvent(event: RecordTraceEventInput): Promise<void>   // tillagd med Domen
getKnownProfile?(): Promise<Partial<ProfileSummary>>        // valfri, tillagd med Medgrundaren (docs/beslut.md 2026-10-03)
```

- `ProfileSummary`: `{ entry, name, role, bio, time, money, risk }` — Profilen-fliken.
  `entry` är ingången i onboardingen. De sex fälten är `string | null`
  (ändrad port 2026-10-03): `role`–`risk` är svaren på onboardingens
  profilfrågor, och `null` betyder obesvarad. Ingång B ställer bara `role`,
  `time` och `money`. Skärmen visar en obesvarad fråga som en lucka och
  fyller aldrig i den.
  Två valfria fält kom till med de nya frågorna (2026-10-03):
  `frustrations` (ingång A) och `customer` (ingång B, kolumnen
  `customer_guess`). Liveadaptern skickar dem alltid som text eller `null`.
  Demoadaptern skickar dem inte, och skärmen visar bara en fråga vars fält
  finns.
- `TraceEvent`: `{ id, timestampIso, description }` — en rad i Spåret.
- `RecordTraceEventInput`: `{ module, description, occurredAtIso }` — vad en annan modul skriver till Spåret. Användaren tas alltid ur sessionen, aldrig ur indata.
- `getBrainNotes`/`setBrainNotes` har medvetet ingen `locale` — Hjärnan är
  grundarens egna ord på det språk hen faktiskt skrev dem, den översätts
  aldrig automatiskt (se demoadaptern nedan).

## Datakällor och vad som krävs

- **Supabase**, tre delar av datamodellen (uppdrag 14.4): `profiles`
  (delas med `docs/moduler/profil.md` — `ProfileSummary` är en bredare vy
  av samma person, inte en separat tabell), `brain_notes` (fritext,
  grundarens egen), `trace_events` (händelselogg, skrivs av andra moduler
  när de gör något — t.ex. "utskick skickat", "juridisk karta genererad" —
  inte bara av den här modulen själv).
- Ingen extern tjänst. `setBrainNotes` är den första skrivande porten i
  hela systemet som tar emot fri text direkt från grundaren utan
  validering mot ett schema — sätt en rimlig längdgräns och lagra som
  ren text (aldrig `dangerouslySetInnerHTML` eller motsvarande när den
  visas, se Säkerhet).
- `trace_events` fylls på av andra moduler (Utskick och svar,
  Medgrundaren, Juridisk koll m.fl.) när de gör något som hör hemma i
  Spåret — den här modulens liveadapter behöver bara kunna **läsa**
  händelser andra redan skrivit, inte känna till varje annan moduls
  interna logik.

## Hur demoadaptern fungerar i dag

`adapters/demo/MemoryRepository.ts`:

- `getProfileSummary` bygger ihop `saraProfile.name` +
  `saraBackground[locale]` (`role`, `bio`) + `saraResources[locale]`
  (`time`, `money`, `risk`) — alla ur `adapters/demo/sara.ts`, eller
  `jonas.ts` i ingång B. Demot ger alltid alla sex fält, även Jonas `bio`
  och `risk` som ingång B inte frågar efter: demot är fryst inför
  pitcharna (beslut 2026-10-03). Bara liveadaptern ger `null`.
- `getBrainNotes` returnerar **alltid den svenska** texten
  (`saraBackground.sv.quote`) — grundarens egna ord i profilsamtalet
  översätts medvetet inte till engelska ens när gränssnittet är på
  engelska.
- `setBrainNotes` är en tom no-op (demot har ingen backend att skriva
  till).
- `getTraceEvents` härleds ur `saraBeats.slice(0, beatIndex + 1)` — en rad
  per moment som redan hänt i demot, inte en separat hårdkodad historik.

## Acceptanskriterier

- `getProfileSummary` ger `entry` och varje fält som text eller `null`,
  aldrig tom text. `role`, `time` och `money` är besvarade efter
  onboardingen (båda ingångarna ställer dem). `EmptyStateError` bara om
  onboardingen inte är gjord.
- `getBrainNotes` returnerar en sträng (tom sträng är giltigt för en
  grundare som inte skrivit något än).
- Ett `setBrainNotes`-anrop följt av ett `getBrainNotes`-anrop ger samma
  text tillbaka **på liveadaptern** — demoadaptern kan inte uppfylla det
  kriteriet (ingen backend) och är ett medvetet undantag, se ovan.
- `getTraceEvents` är kronologiskt ordnad, äldst till senast (eller
  konsekvent omvänt — bestäm en riktning och håll den, `/app/minnet`
  bestämmer visningsordningen separat).
- Hjärnanteckningar tolkas **aldrig** som instruktioner av någon modul som
  läser dem (t.ex. om Medgrundaren någon gång sammanfattar Hjärnan).
- Klarar kontraktstestet i `ports/MemoryRepository.contract.test.ts`
  (obs: testet kan inte pröva skriv-läs-konsistensen mot demoadaptern av
  skälet ovan — bara att `setBrainNotes` inte kastar).

## Säkerhet

RLS på `profiles`, `brain_notes` och `trace_events`, policy begränsad till
ägarens `user_id`. `setBrainNotes`-indata är **användarens egen fria
text** — lagra och visa den som ren text (ingen HTML-rendering av
innehållet), och om den någonsin skickas till Gemini (t.ex. en framtida
"sammanfatta min Hjärna"-funktion) är den data, aldrig instruktion
(avsnitt 14.6). Sätt en rimlig längdgräns på `notes` för att undvika
obegränsad lagring.

## Status

klar (Session P1, branch `plattform-p1-adaptrar`) — alla fyra metoderna
byggda och testade mot Supabase. Byggd FÖRE att någon annan modul skriver
till `trace_events` (avviker från den tidigare planen nedan, ett medvetet
val i P1 — `getTraceEvents` är fullt fungerande men returnerar en tom lista
tills en skrivande modul, t.ex. Utskick och svar, finns).

### Hur liveadaptern fungerar i dag

`adapters/live/MemoryRepository.ts`:

- `getProfileSummary`: läser `profiles`-radens sex fält och
  `onboarding_entry`/`onboarding_completed_at`. Kastar `EmptyStateError`
  bara om onboardingen inte är klar. Annars blir varje saknat eller tomt
  fält `null` (2026-10-03; tidigare krävdes alla sex, så ingång B såg
  ingen profil alls).
- `getBrainNotes`/`setBrainNotes`: `setBrainNotes` trimmar och hävdar
  ≤20000 tecken (samma gräns som databasens `check`-villkor, en andra
  spärr), `upsert`ar på `user_id`. Skriv-läs-rundtur bevisad med ett test —
  kriteriet demoadaptern inte kan uppfylla (se ovan).
- `getTraceEvents`: kronologisk ordning, äldst först, tom lista tills
  någon modul faktiskt skriver händelser.
- `recordTraceEvent` (tillagd med Domen, ändrad port enligt
  `docs/bygga-en-modul.md` §4): rensar `module`/`description` med
  `cleanText` (≤ 60/500 tecken), kräver giltig tid, är idempotent (samma
  modul + beskrivning + tid sparas en gång) och infogar en rad i
  `trace_events` för sessionens användare (RLS "insert egen" är den bindande
  spärren). `project_id` lämnas null (kontonivå). Demoadaptern är en no-op.
