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
```

- `ProfileSummary`: `{ name, role, bio, time, money, risk }` — Profilen-fliken.
- `TraceEvent`: `{ id, timestampIso, description }` — en rad i Spåret.
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
  (`time`, `money`, `risk`) — alla ur `adapters/demo/sara.ts`.
- `getBrainNotes` returnerar **alltid den svenska** texten
  (`saraBackground.sv.quote`) — grundarens egna ord i profilsamtalet
  översätts medvetet inte till engelska ens när gränssnittet är på
  engelska.
- `setBrainNotes` är en tom no-op (demot har ingen backend att skriva
  till).
- `getTraceEvents` härleds ur `saraBeats.slice(0, beatIndex + 1)` — en rad
  per moment som redan hänt i demot, inte en separat hårdkodad historik.

## Acceptanskriterier

- `getProfileSummary` har alla sex fält ifyllda (`name`, `role`, `bio`,
  `time`, `money`, `risk`).
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

stub — `adapters/live/MemoryRepository.ts` kastar `NotImplementedError`
för alla fyra metoderna. Demoadaptern är klar och används av
`/demo/app/minnet`. Bygg efter att `trace_events` skrivs av åtminstone en
annan modul (t.ex. Utskick och svar), så Spåret har något riktigt att visa
första gången liveadaptern testas end-to-end.
