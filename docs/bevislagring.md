# Bevislagringen: spec (förslag)

Status: **beslutad och byggd** 2026-10-01 på grenen `plattform/bevislagring`. Skrevs först som förslag på `design/en-design`. **Besluten står i avsnitt 11**, och de går före texten i avsnitt 1–10 där de skiljer sig.

Specen ska gå att bygga utan annan kontext. Varje beslut har ett motiv. Avsnitt 1–10 är förslaget som det skrevs, med de öppna besluten. Avsnitt 11 är vad som valdes och byggdes.

Underlag: `docs/uppdrag.md` (1.2, 1.5, 7, 14), `core/score.ts` med tester, alla filer i `ports/`, `docs/moduler/evidens-och-poang.md`, `adapters/live/EvidenceRepository.ts`, `supabase/migrations/`, `docs/status.md`.

> **Avsnittet "Datastatus per källa" finns inte i `docs/status.md`**, varken på den här grenen, på `prototyp` eller på `main`, och ingen commit har innehållit rubriken. Därför har jag läst `docs/moduler/registret.md`, statusavsnittet om Dataspiken och modulstatusen i `docs/moduler/*.md` i stället. Om avsnittet finns någon annanstans bör det läsas mot avsnitt 5.2 här.

---

## 0. Utgångsläge: vad som redan finns och vad som saknas

Uppgiften säger att ingenting sparar bevis. Det stämmer i praktiken, men det är bra att veta exakt var luckan sitter:

| Del | Finns i dag | Fil |
|---|---|---|
| Tabellen `evidence` med RLS | **Ja** | `supabase/migrations/20260918090100_evidence_memory.sql` |
| Läsväg: rader → `calculateScore` | **Ja** | `adapters/live/EvidenceRepository.ts` |
| Tabellen `score_snapshots` | **Ja**, men inget skriver i den | samma migration |
| **Skrivväg för bevis** | **Nej**: ingen port, ingen adapter, ingen server action | — |
| Regel för hur många poäng ett bevis ger | **Nej**: demots värden (`pt(5, …)` i `adapters/demo/sara.ts`) är handsatta per scenario | — |
| Skrivväg för avklarade steg (`journey_steps.completed_at`) | **Nej**. Fasen fastnar därför i `discover` | `adapters/live/JourneyRepository.ts` läser bara |

Luckan är alltså inte tabellen. Den är **skrivvägen och regeln för vad ett bevis är värt**. Den här specen fyller den luckan, ändrar tabellen där den inte räcker och pekar ut tre beroenden utanför bevislagringen som också måste lösas innan siffran kan röra sig på riktigt (avsnitt 5.2).

**Fyra fel i det som redan fanns**, upptäckta under läsningen. Alla fyra är rättade, se avsnitt 11.6:

1. **RLS-policyn `evidence: insert egen` låter en inloggad användare skriva rader med valfritt `points` direkt mot Supabase REST.** Anon-nyckeln är publik och användarens JWT finns i webbläsaren. Vem som helst kan alltså höja sin egen poäng till taket med ett `curl`-anrop. Det bryter mot 7.1, "går inte att prata sig till". Se 2.3 och 7.1.
2. **`calculateScore` kastar om en upplåst del saknar bevis** (`core/score.ts`, `scorePart`). I live händer det så fort fasen går vidare innan beviset finns. Ett exempel: steg 04 markeras klart, `scorePhaseForStep(5)` ger `tryAfterCalls`, och då är Problem och Betalningsvilja upplåsta utan ett enda kundsvar. Se 3.3.
3. **`previousTotal` blir fel när snapshots väl skrivs.** Läsvägen tar den *senaste* snapshotten som `previousTotal`. Om skrivvägen sparar en snapshot efter varje bevis är den senaste snapshotten lika med den nuvarande poängen, så `delta` blir alltid 0. Se 3.4.
4. **Fasen och upplåsningstexten säger emot varandra.** `LockedScorePart.unlocksAfterStep = 5` betyder "låses upp *efter* steg 05", men `scorePhaseForStep(deriveCurrentStepNumber(...))` låser upp delen medan steg 05 *pågår*. Se 3.3.

---

## 1. Vad är ett bevis?

### 1.1 Definition

> **Ett bevis är ett enskilt, daterat och källbelagt faktum om grundarens projekt, av en sort som koden känner till. Sorten avgör vilken del det hör till och hur mycket det är värt.**

Motiv: 7.1 kräver att poängen "kan räknas för hand" och "inte går att prata sig till". Båda kräver att värdet på ett bevis följer av *vad* beviset är, inte av vem som skrev in det eller vad hen tyckte att det var värt. Därför bär varje bevis en **sort** (`kind`). Sorten slås upp i en tabell i kod, och poäng, del och datatyp kommer ur den tabellen.

### 1.2 Bevissorterna (`core/evidenceKinds.ts`, ny fil)

En ren konstanttabell i `core/`. Den delas av live, demo, tester och migrationen (via ett synktest, se 2.4).

```ts
export type EvidenceKindSpec = {
  partId: ScorePartId;
  dataType: "register" | "customer";   // aldrig "simulation", se 7.6
  basePoints: number;                   // rått värde in i calculateScore
  contradicts: boolean;                 // t.ex. ett kundsvar som avvisar problemet
  freshForDays: number | null;          // null = föråldras aldrig (se 6)
  subjectKind: "company" | "response" | "registryQuery" | "profileField" | "url" | "legalItem";
  enteredBy: "founder" | "system" | "either";
};
export const EVIDENCE_KINDS: Record<EvidenceKind, EvidenceKindSpec>;
```

Förslag till sorter. **Siffrorna i `basePoints` och `freshForDays` är produktbeslut och inte mina att ta.** Jag har satt startvärden som ungefär återger demots kalibrering, så att de går att pröva. Se Öppet beslut B1.

| `kind` | Del | Datatyp | `basePoints` | Motsäger | `freshForDays` | Läggs in av |
|---|---|---|---|---|---|---|
| `profileFitAnswer` | fit | customer¹ | 3 | nej | null | founder |
| `registerMarketCount` | market | register | 4 | nej | 365 | system |
| `registerMarketRevenue` | market | register | 3 | nej | 365 | system |
| `registerCompetitorSet` | competition | register | 3 | nej | 365 | system |
| `customerProblemConfirmed` | problem | customer | 3 | nej | 180 | either |
| `customerProblemRejected` | problem | customer | 3 | **ja** | 180 | either |
| `customerPriceAccepted` | willingnessToPay | customer | 3 | nej | 180 | either |
| `customerPriceDeclined` | willingnessToPay | customer | 3 | **ja** | 180 | either |
| `productScopeFromEvidence` | product | customer | 4 | nej | null | founder |
| `productPublished` | product | customer | 6 | nej | 90 | founder |
| `formalRegistrationDone` | feasibility | register | 4 | nej | null | either² |
| `legalItemDone` | feasibility | register | 1 | nej | 365 | founder |
| `payingCustomer` | traction | customer | 4 | nej | 90 | either² |
| `activeUser` | traction | customer | 1 | nej | 30 | either² |

² Ändrat från `founder` till `either` vid bygget (beslut B6, avsnitt 11.2): de tre är fakta om en tredje part som går att kontrollera, så när grundaren anger dem är de självrapporterade.

¹ `DataType` har bara tre värden (`design/tokens.ts`), och inget av dem passar profilen. Demot använder redan `customer` för profilsvar. Jag behåller det i stället för att ändra tokens, eftersom en ny datatyp påverkar designsystemets färger och ligger utanför den här uppgiften.

Motiv för en sluten lista i stället för fri inmatning:
- Poängen blir reproducerbar. Samma bevis ger alltid samma poäng.
- Delen kan inte bli fel (avsnitt 7, "pekar på fel del"), eftersom den inte är ett eget fält i indatan.
- `contradicts` sätts av sorten och inte av den som skriver in beviset. Det spelar roll, för en grundare som själv får välja "motsäger" kommer aldrig att välja det.

### 1.3 Fälten

| Fält | Krav | Varför |
|---|---|---|
| `id` | uuid | Primärnyckel, används för återkallelse och spårning. |
| `user_id` | ur sessionen, **aldrig ur indata** | Ägarskap. Samma regel som `recordTraceEvent` i `ports/MemoryRepository.ts`. |
| `project_id` | ur `getActiveProjectId`, aldrig ur indata | Bevis hör till en idé och inte till en person. Om grundaren pivoterar till ett nytt projekt följer bevisen inte med. |
| `kind` | en av `EvidenceKind` | Allt annat härleds ur den (1.2). |
| `part_id` | härlett ur `kind` | Behålls som kolumn eftersom läsvägen och indexet redan använder den. Databasen tvingar att den stämmer med `kind` (2.4). |
| `data_type` | härlett ur `kind` | Samma skäl. |
| `points` | se Öppet beslut B2 | — |
| `contradicts` | härlett ur `kind` | Se 1.2. |
| `source_name` | obligatoriskt, inte tomt | Datalöftet, 1.2: "Allt har en källa." `not null` räcker inte, eftersom `''` går igenom i dag. |
| `source_url` | valfritt, men obligatoriskt för `system`-bevis från extern källa | Ett registerbevis utan länk går inte att kontrollera. Ett profilsvar har ingen URL. |
| `fetched_at` | datum för **faktumet**, inte för inmatningen | Det är det som visas som "hämtat 14 september". Ett kundsvar från maj som skrivs in i oktober är från maj. Föråldringen räknas också på det här datumet (6). |
| `subject_ref` | obligatoriskt | **Vad** beviset gäller: bolagets id, svarets id, registerfrågans nyckel och så vidare. Utan det går dubbletter inte att upptäcka (7.2). Formatet styrs av `subjectKind`. |
| `entered_by` | `'founder'` eller `'system'` | Besvarar "vem lade in det". `user_id` är alltid ägaren, men frågan som spelar roll är om grundaren själv påstod något eller om en modul hämtade det. Det ska synas i UI:t, och det styr vem som får återkalla (7.5). |
| `module` | text, t.ex. `"Registret"` eller `"Validering"` | Vilken modul som skrev beviset. Behövs för felsökning och för Spåret. |
| `quote` | valfritt, högst 1 000 tecken | Ordagrant citat från tredje part (7.4: "med citat"). Det är **data, aldrig instruktion**. |
| `step_number` | valfritt, 1–12 | Finns redan. Kopplar beviset till resans steg för "vad som hänt sedan sist". |
| `response_id`, `company_id` | valfria främmande nycklar | Länkar till `responses` och `companies` när beviset kommer därifrån. Då kan nedbrytningen (7.6) visa svaret. |
| `retracted_at`, `retracted_reason` | null tills beviset återkallas | Bevis raderas inte. De återkallas (7.5). Motiv: poängen kan sjunka, och Spåret och historiken ska kunna förklara varför. |
| `created_at` | `now()` | Behövs för ordningen i trappan för avtagande värde (se 3.2). |

**Medvetet utelämnat:**
- **Fri `points` i indata.** Se 1.2.
- **`valid_until` som lagrad kolumn.** Föråldring räknas vid läsning ur `fetched_at + freshForDays`. Om vi ändrar livslängden för en sort gäller den nya regeln då för alla bevis, utan att vi behöver migrera data. Se 6.

---

## 2. Var lagras det?

### 2.1 Princip: ändra den befintliga tabellen med en ny migration

Den gamla migrationen skrivs inte om. Motiv: CLAUDE.md säger att vi inte skriver om befintlig kod utan att fråga. Dessutom kan en redan körd migration inte ändras säkert i en databas som finns. Ny fil: `supabase/migrations/2026MMDDhhmmss_evidence_write_path.sql`.

### 2.2 Tabellen efter ändringen

```sql
-- Referenstabell: vilka sorter som finns och vilken del de hör till.
-- Seedas här och hålls i synk med core/evidenceKinds.ts av ett test (2.4).
create table public.evidence_kinds (
  kind text primary key,
  part_id text not null check (part_id in (
    'market','competition','fit','problem',
    'willingnessToPay','product','traction','feasibility')),
  data_type text not null check (data_type in ('register','customer')),
  unique (kind, part_id)
);
alter table public.evidence_kinds enable row level security;
create policy "evidence_kinds: select alla" on public.evidence_kinds
  for select to authenticated using (true);
-- Ingen insert/update/delete-policy: tabellen ändras bara via migrationer.

alter table public.evidence
  add column kind text,
  add column subject_ref text,
  add column entered_by text check (entered_by in ('founder','system')),
  add column module text,
  add column response_id uuid references public.responses (id) on delete set null,
  add column company_id uuid references public.companies (id) on delete set null,
  add column retracted_at timestamptz,
  add column retracted_reason text check (char_length(retracted_reason) <= 500),
  add constraint evidence_source_name_not_blank check (char_length(btrim(source_name)) > 0),
  add constraint evidence_quote_length check (quote is null or char_length(quote) <= 1000),
  add constraint evidence_subject_ref_length check (char_length(subject_ref) between 1 and 200),
  add constraint evidence_not_simulation check (data_type <> 'simulation'),
  -- Delen MÅSTE stämma med sorten (7.3, "fel del").
  add constraint evidence_kind_part_fk foreign key (kind, part_id)
    references public.evidence_kinds (kind, part_id);

-- Tabellen är tom i live i dag (ingen skrivväg finns), så not null kan
-- sättas direkt. Om rader ändå finns: radera eller fyll i dem först.
alter table public.evidence
  alter column kind set not null,
  alter column subject_ref set not null,
  alter column entered_by set not null,
  alter column module set not null;

-- Dubblettspärr (7.2): samma sort om samma sak får bara finnas en gång
-- bland de bevis som inte är återkallade.
create unique index evidence_one_per_subject
  on public.evidence (project_id, kind, subject_ref)
  where retracted_at is null;
```

`project_id` och `user_id` har redan den sammansatta främmande nyckeln `(project_id, user_id) → projects (id, user_id)`. Den gör det **omöjligt i databasen** att hänga ett bevis på någon annans projekt, oavsett RLS och oavsett vilken klient som skriver. Den behålls som den är. Se 7.4.

`fetched_at` får inte ligga i framtiden. Det kontrolleras i serverkod och inte med en `check`, eftersom `current_date` inte är oföränderlig och Postgres bara skulle pröva villkoret vid skrivning, med serverns tidszon.

### 2.3 RLS: läsa sitt eget, skriva bara via servern

- **`select`:** policyn `evidence: select egen` behålls. Grundaren ser sina egna bevis, inklusive återkallade, så att historiken går att förklara.
- **`insert`/`update`/`delete` för `authenticated` tas bort.** Motiv: fel 1 i avsnitt 0. Om klienten kan skriva direkt hjälper ingen validering i serverkoden. Det måste vara databasen som säger nej.

Hur servern sedan skriver är **Öppet beslut B3**. Repot har prejudikat för båda vägarna:

| Alternativ | Prejudikat | För | Emot |
|---|---|---|---|
| **(a) Service role i en `server-only`-modul** (`lib/server/evidenceWriter.ts`) | `registry_cache` (`lib/server/registryCache.ts`) | Enkelt, och all logik ligger i TypeScript nära `core/evidenceKinds.ts`. | Service role går förbi RLS, så serverkoden måste själv sätta `user_id` ur sessionen. Ett fel där skyddas bara av den sammansatta FK:n (som räcker för projektägarskapet, men inte mer). Nyckeln måste finnas i Vercel-miljön. |
| **(b) `security definer`-funktion** `public.record_evidence(...)` som använder `auth.uid()` | `waitlist` / `join_waitlist` | Användaren tas alltid ur JWT:n i databasen, och ingen service role-nyckel behövs. | Poängtabellen måste då finnas i SQL (eller så räknar funktionen inte poäng, se B2a), och valideringen delas mellan SQL och TS. |

Med båda alternativen läggs `evidence` till i `CLOSED_TABLES`-mönstret i `supabase/migrations/migrations.test.ts`. Tabellen har dock kvar en `select`-policy, så vakten behöver en tredje kategori: "läsbar men stängd för skrivning". Det är en liten ändring i testet och ett beslut i `docs/beslut.md`, enligt testets egen kommentar.

Samma resonemang gäller `score_snapshots`: om klienten kan skriva där kan historiken förfalskas. Insert, update och delete för `authenticated` tas bort på samma sätt.

### 2.4 Synk mellan `core/evidenceKinds.ts` och `evidence_kinds`

Ett statiskt test (`supabase/migrations/evidenceKinds.test.ts`) läser seed-raderna i migrationen och jämför dem med `EVIDENCE_KINDS`: samma nycklar, samma `part_id`, samma `data_type`. Motiv: listan finns på två ställen, och utan ett test glider de isär. Samma mönster som `migrations.test.ts`, alltså statiskt och utan Postgres.

---

## 3. Hur läser poängen bevisen?

### 3.1 Princip

`core/score.ts` rörs inte. `calculateScore` får `PartEvidence[]` och vet inget om tabeller, datum eller föråldring. Allt som skiljer "en rad i databasen" från "ett `EvidenceItem`" görs **före** anropet, av en ny ren funktion i `core/`.

```
Supabase (rader)
  → adapters/live/EvidenceRepository.ts   hämtar: evidence, journey_steps, score_snapshots
  → core/evidenceInput.ts (NY, ren)       rader + idag + etiketter → PartEvidence[]
  → core/score.ts calculateScore (orörd)  PartEvidence[] + fas → ScoreSnapshot
```

### 3.2 `core/evidenceInput.ts` (ny)

```ts
export type StoredEvidence = {
  id: string;
  kind: EvidenceKind;
  points: number;          // se B2
  source: Källa;
  createdAtIso: string;
  retracted: boolean;
};

export function toPartEvidence(
  rows: StoredEvidence[],
  todayIso: string,                       // in som argument, aldrig Date.now()
  labels: Record<ScorePartId, string>,
): { parts: PartEvidence[]; freshness: Record<string, "fresh" | "stale"> };
```

Funktionen gör följande, i den här ordningen:
1. Tar bort återkallade bevis.
2. Härleder `partId`, `dataType` och `contradicts` ur `EVIDENCE_KINDS[kind]`, inte ur raden. Om raden och tabellen inte stämmer överens kastas ett fel, för det betyder att någon har skrivit förbi skrivvägen.
3. Avgör om varje bevis är färskt eller föråldrat (6) med `todayIso`.
4. Ordnar och viktar bevisen enligt föråldringsregeln (6.3).
5. Returnerar `freshness` per bevis-id vid sidan av. `ScoreSnapshot` kan inte bära den informationen utan att `core/score.ts` ändras, men UI:t behöver den för att märka föråldrade bevis.

Motiv för att lägga detta i `core/` och inte i adaptern: CLAUDE.md säger att ren logik ligger i `core/`, och `docs/moduler/evidens-och-poang.md` säger att adaptern bara hämtar. Föråldring är en poängregel, och en poängregel i en adapter är exakt den dubblering modulen varnar för. Dessutom blir den testbar utan Supabase. Den befintliga `buildPartEvidence` i `adapters/live/EvidenceRepository.ts` ersätts av den här funktionen.

`todayIso` tas som argument så att funktionen är ren. Samma indata ger samma utdata, och testerna kan pröva "om ett år" utan att fejka klockan.

### 3.3 Problemet med tomma upplåsta delar

`calculateScore` kastar om en upplåst del saknar bevis (fel 2 i avsnitt 0). Det är en riktig regel (7.4: "ingen källa, ingen poäng"), men i live leder den till att hela poängen kraschar så fort fasen hinner före bevisen.

**Uteslutet:** att fylla delen med ett platshållarbevis ("Inget bevis än", 0 poäng). Det vore en påhittad källa och bryter mot Datalöftet.

**Öppet beslut B4.** Alternativen, som alla lämnar `core/score.ts` orörd:

| Alternativ | Vad det innebär | För | Emot |
|---|---|---|---|
| **(a) Fasen räknas ur högsta *avklarade* steg** och inte ur aktuellt steg. Ändringen görs i adaptern: `scorePhaseForStep(max(completed))`. | Problem låses upp först när steg 05 är klart. | Stämmer med `unlocksAfterStep` och med texten "Låses upp efter steg 05" (fel 4). Liten ändring. | Löser bara halva problemet: steg 05 kan fortfarande markeras klart utan kundsvar. Demot använder sin egen fas per moment, så demo och live räknar fasen olika tills demot rättas. |
| **(b) Ett steg kan inte markeras klart förrän varje del det låser upp har minst ett färskt bevis.** Regeln läggs i `core/journey.ts`. | Resan tvingar fram beviset. | Stämmer med 1.4: "Det hindrar grundaren från att hoppa till bygget innan valideringen är gjord." | Kräver att `journey_steps` får en skrivväg, vilket den inte har i dag (5.2). Ett bevis som föråldras eller återkallas *efter* att steget är klart tömmer ändå delen, så (c) behövs ändå. |
| **(c) "Effektiv fas"**: `min(fas ur steg, högsta fas där alla upplåsta delar har bevis)`. Räknas i `core/evidenceInput.ts`. | Poängen räknas i den fas underlaget räcker till. | Kraschar aldrig. Speglar "bevisgrad" ärligt. | Grundaren ser då "Låses upp efter steg 05" trots att steg 05 är klart. Det kräver en ny text ("Låst tills första kundsvaret"), och den texten kan inte komma ur `calculateScore`. |
| **(d) Ändra `calculateScore`** så att en tom upplåst del ger 0 poäng med "ingen källa". | — | Enklast i sak. | Uttryckligen utanför den här uppgiften ("core/score.ts rörs inte"), och det bryter mot dess test "kastar om en upplåst del helt saknar bevis". Kräver ditt beslut. |

Jag är osäker. (a) behövs troligen oavsett, eftersom den rättar en faktisk inkonsekvens. Frågan är om (b), (c) eller (d) ska ta resten.

### 3.4 `previousTotal` och `deltaReason`

Fel 3 i avsnitt 0 rättas så här: **varje snapshot lagrar sin egen `delta` och `delta_reason`.** Kolumnerna finns redan. Läsvägen visar den senaste snapshottens `delta` och skickar `previousTotal = senaste.total - senaste.delta` till `calculateScore`. Motiv: deltat hör till händelsen som orsakade det, inte till läsningen. Med regeln ovan visar läsningen "+3 efter kundsvar från X" ända tills nästa händelse inträffar.

Om föråldring sänkt poängen sedan den senaste snapshotten (6.4) skiljer sig den nya totalen från `senaste.total`. Då blir `previousTotal = senaste.total`, och `deltaReason` sätts till i18n-nyckeln för "bevis har föråldrats".

---

## 4. Porten

### 4.1 Ny port eller utökad port? (Öppet beslut B5)

| Alternativ | Prejudikat | För | Emot |
|---|---|---|---|
| **(a) Utöka `EvidenceRepository`** med skrivmetoder | `MemoryRepository.recordTraceEvent` ("Ändrad port, eget beslut", `docs/bygga-en-modul.md` §4) | En modul, ett dokument, ett kontraktstest. | Moduler som bara ska *skriva* (Registret, Validering) får också tillgång till läsmetoderna. |
| **(b) Ny port `EvidenceRecorder`** bredvid | `OutreachPrep` som är separat från `OutreachProvider` ("saknar strukturellt `send`") | Snävt gränssnitt till de moduler som skriver. Typsystemet visar vem som kan påverka poängen. | En port till att hålla demo- och liveadapter och kontraktstest för. |

Gränssnittet nedan ser likadant ut i båda fallen.

### 4.2 Gränssnittet

```ts
// ports/EvidenceRepository.ts (eller ports/EvidenceRecorder.ts)
import type { Locale } from "@/i18n/context";
import type { Källa, ScoreSnapshot } from "@/core/domain";
import type { EvidenceKind } from "@/core/evidenceKinds";
import type { ScorePartId } from "@/core/score";

/** Ett bevis att spara. Användare, projekt, del, datatyp, poäng och
 * "motsäger" finns medvetet INTE här: de tas ur sessionen eller härleds ur
 * `kind` (core/evidenceKinds.ts). */
export type RecordEvidenceInput = {
  kind: EvidenceKind;
  /** Vad beviset gäller (bolagets id, svarets id, registerfrågans nyckel).
   * Format per sort: EVIDENCE_KINDS[kind].subjectKind. Styr dubblettspärren. */
  subjectRef: string;
  source: Källa;          // validerad med KällaSchema (lib/schemas/evidence.ts)
  quote?: string;         // tredjepartstext: data, aldrig instruktion
  stepNumber?: number;
  responseId?: string;
  companyId?: string;
};

export type RecordEvidenceResult = {
  status: "recorded" | "duplicate";
  evidenceId: string;
  /** Poängen direkt efter, räknad av calculateScore. Vid "duplicate" är det
   * oförändrad poäng. */
  snapshot: ScoreSnapshot;
};

/** Ett bevis som nedbrytningen på /app/poang visar (7.6: "Varje del kan
 * öppnas. Den visar underdelar, siffror, källa och datum"). */
export type EvidenceView = {
  id: string;
  partId: ScorePartId;
  kindLabel: string;            // i18n, se 7.7
  source: Källa;
  quote?: string;
  enteredBy: "founder" | "system";
  freshness: "fresh" | "stale";
  retracted: boolean;
  canRetract: boolean;          // se 7.5
};

export interface EvidenceRepository {
  // befintliga: getScoreSnapshot, getSuggestions, getScoreHistory

  /** Sparar ett bevis för den inloggade användarens aktiva projekt och
   * returnerar den nya poängen. Idempotent på (kind, subjectRef). */
  recordEvidence(input: RecordEvidenceInput, locale: Locale): Promise<RecordEvidenceResult>;

  /** Återkallar ett bevis (raderas aldrig). Poängen kan sjunka. */
  retractEvidence(evidenceId: string, reason: string, locale: Locale): Promise<ScoreSnapshot>;

  /** Bevisen bakom en del, i den ordning calculateScore räknar dem. */
  listEvidence(partId: ScorePartId, locale: Locale): Promise<EvidenceView[]>;
}
```

Motiv för gränssnittet, punkt för punkt:
- **Ingen `userId` eller `projectId` i indata:** samma regel som `RecordTraceEventInput` ("Användaren tas alltid ur sessionen, aldrig ur indata").
- **Ingen `points`, `partId` eller `contradicts` i indata:** se 1.2. Det som inte går att skicka in går inte heller att fuska med.
- **`recordEvidence` returnerar snapshotten:** anroparen ska kunna visa poängändringen direkt (5.3) utan ett andra anrop som kan hinna se ett annat läge.
- **`listEvidence` finns med:** utan den kan 7.6 ("Varje del kan öppnas") inte byggas i live, och grundaren kan inte se vilket bevis hen ska återkalla.

### 4.3 Adaptrarna

- **Liveadaptern** (`adapters/live/EvidenceRepository.ts`) gör följande: `requireSupabaseUser`, `getActiveProjectId`, validering (7), skrivning via den väg som väljs i B3, läsning tillbaka, `toPartEvidence`, `calculateScore`, skrivning av en snapshot (5.3), `recordTraceEvent`, och sist returnerar den resultatet. Den kastar `EmptyStateError` utan aktivt projekt, samma som i dag.
- **Demoadaptern** returnerar `{ status: "recorded", evidenceId: "demo-…", snapshot: <aktuellt moments snapshot> }` utan att ändra något. `listEvidence` bygger vyerna ur det aktuella momentets `PartEvidence` i `sara.ts`/`jonas.ts`. Motiv: demots poäng är manusstyrd per moment (9.1) och ska gå att räkna för hand ur scenariofilen. Om demot sparade bevis vid klick skulle rundturen och manuset glida isär. Demot importerar fortfarande aldrig liveadaptern.
- **Kontraktstestet** utökas med: `recordEvidence` ger en snapshot inom 1–100; samma `(kind, subjectRef)` två gånger ger `duplicate` andra gången; `listEvidence` returnerar bara bevis för den efterfrågade delen och bara med källa. Felfallen (fel del, saknad källa, simulering, någon annans projekt) testas i `adapters/live/EvidenceRepository.test.ts` och `rls.live.test.ts`, enligt regel 2 i `ports/testContract.ts`.

---

## 5. Hur läggs ett bevis in?

### 5.1 Flödena per del

Det finns två sorters flöden. I det ena hämtar **systemet** beviset ur en extern källa (`entered_by = 'system'`). I det andra **påstår grundaren** något som ingen extern källa kan bekräfta (`entered_by = 'founder'`). Det senare är oundvikligt för vissa delar, men det ska synas i UI:t (5.4).

| Del | Sida | Flöde | Sort | Kan det göras i live i dag? |
|---|---|---|---|---|
| Passform | `/start/profil` (onboarding) och `/app/minnet` (Profilen) | Varje besvarad profilfråga om kompetens, nätverk, tid och pengar sparas som ett bevis. `subjectRef` = frågans id. | `profileFitAnswer` | **Delvis.** Profilen sparas, men onboardingens svar är chips ur ett manus (`ports/ProfileRepository.ts`). |
| Marknad, Konkurrens | `/app/marknad` | När `getMarketOverview` returnerar riktiga siffror skriver servern bevis för antal, omsättning och konkurrenter. `subjectRef` = SNI och frågans nyckel. Källan kommer från `MarketOverview.source`. | `registerMarketCount`, `registerMarketRevenue`, `registerCompetitorSet` | **Nej.** Registret är grindat tills licensen är verifierad (`docs/moduler/registret.md`). |
| Problem, Betalningsvilja | `/app/validering` (steg 05) | Ett svar klassificeras som bekräftar eller avvisar problemet och som accepterar eller avböjer priset. Varje klassning ger högst ett bevis per del. `subjectRef` = bolagets id (se 7.2). `quote` = citatet. | `customerProblem*`, `customerPrice*` | **Nej, inte automatiskt.** Sändningen är spärrad (`ports/outreachConfirmation.ts`). Bara manuell inmatning återstår (B6). |
| Produkt | `/app/resan/08`, `/app/bygg` | Steg 08: grundaren knyter en MVP-avgränsning till minst ett kundbevis. Steg 10: grundaren anger en publicerad URL, och servern kontrollerar att den svarar. | `productScopeFromEvidence`, `productPublished` | **Nej.** Bygg är ett koncept och alltid en stub. Den manuella URL-vägen går att bygga. |
| Genomförbarhet | `/app/juridik`, `/app/resan/09` | En juridisk punkt markeras klar. Registrering av bolag eller F-skatt anges med organisationsnummer. | `legalItemDone`, `formalRegistrationDone` | **Delvis.** Juridisk koll har en liveadapter, men statusändring per punkt saknas. |
| Traktion | `/app/resan/11` | Grundaren anger en betalande kund (bolag och datum) eller antal aktiva användare. | `payingCustomer`, `activeUser` | Kan byggas, men kräver beslut B6. |

**Öppet beslut B6: får grundaren själv lägga in kundbevis?** Det här är den svåraste frågan i specen, och jag vill inte välja åt dig.
- **(a) Ja, med märkning.** Grundaren skriver in bolag, datum och citat. Beviset märks "Angivet av dig" och räknas fullt. För: siffran kan röra sig *nu*, trots sändspärren, och grundare har ofta pratat med kunder utanför Spark. Emot: 7.1 säger att poängen "inte går att prata sig till", och 1.2 säger att efterfrågan "bevisas av namngivna personer som svarat". Ett eget påstående är inte ett svar Spark sett.
- **(b) Ja, men med lägre värde.** `founder`-bevis ger till exempel hälften av `basePoints`. För: en mellanväg. Emot: halveringen är ett godtyckligt tal, och reglerna i 7.4 nämner det inte.
- **(c) Nej.** Kundbevis kommer bara från `responses`, alltså svar Spark själv tagit emot. För: det håller Datalöftet strikt. Emot: Problem och Betalningsvilja kan då inte röra sig i live förrän sändspärren hävs, och det beslutet är uttryckligen Theodors och grundarens (`ports/outreachConfirmation.ts`).

**Öppet beslut B7: vem klassificerar ett svar?** Om Gemini avgör om ett svar "bekräftar problemet" påverkar en språkmodell poängen, även om själva beräkningen sker i kod. Alternativ: (a) grundaren väljer klassning och modellen får bara föreslå; (b) modellen klassificerar och grundaren bekräftar varje gång; (c) bara regelbaserad klassning i kod. Domen (`core/verdict.ts`) tar redan `problemStance` och `priceStance` som indata och lämnar frågan om var de kommer ifrån öppen. B7 bör beslutas en gång för både domen och poängen.

### 5.2 Beroenden utanför bevislagringen

Även med skrivvägen på plats rör sig siffran bara i Passform, och delvis i Genomförbarhet, förrän följande är lösta:

1. **`journey_steps` saknar skrivväg.** Fasen fastnar därför i `discover`, och bara Passform och Marknad är upplåsta (med Marknad till halv vikt). Taket är 18. Siffran kan röra sig, men inte förbi 18.
2. **Registret är grindat.** Marknad och Konkurrens får inga systembevis.
3. **Sändningen är spärrad.** Problem och Betalningsvilja får inga svar via Spark, se B6.

Det här är ingen invändning mot att bygga bevislagringen först, eftersom de andra tre behöver den. Men det betyder att den inte ensam får siffran att röra sig.

### 5.3 Vad händer med poängen direkt efter?

Allt sker i en och samma server action (mönster: `app/(app)/app/minnet/actions.ts`):

```
server action (indata: unknown, valideras)
 → liveEvidenceRepository.recordEvidence(input, locale)
    1. kontrollera indata (7)
    2. skriv raden (insert ... on conflict do nothing). Konflikt → status "duplicate"
    3. läs alla bevis för projektet + avklarade steg + senaste snapshot
    4. toPartEvidence(...) → calculateScore(...)
    5. om totalen skiljer sig från senaste snapshot: skriv en ny snapshot
       med total, phase, delta och delta_reason (i18n-nyckel + kind)
    6. recordTraceEvent: "Bevis tillagt: <sort>, <källa>"
    7. returnera { status, evidenceId, snapshot }
 → revalidatePath("/app", "layout")   så att sidhuvudets poäng uppdateras
 → klienten visar poängändringen med den befintliga delta-animationen
```

Motiv för stegen:
- **Poängen räknas om på servern direkt (steg 3–4) och inte i klienten.** Klienten ska aldrig ha `calculateScore`-indata som går att manipulera, och svaret ska vara samma siffra som nästa sidladdning visar.
- **En ny snapshot skrivs bara när totalen ändras (steg 5).** Sparklinen ska visa rörelse, och en duplicerad punkt är brus. Om du hellre vill ha en snapshot per händelse, för att kunna visa "bevis tillagt, ingen ändring på grund av fastaket", är det ett rimligt alternativ (Öppet beslut B8).
- **Ett bevis som inte ändrar poängen ska ändå förklaras.** Om delen är full eller fasens tak är nått returneras `delta = 0`, och UI:t säger varför: "Taket i den här fasen är 30." Annars ser det ut som ett fel.
- **Steg 2–5 är inte en transaktion** med Supabase-klienten. Om steg 5 misslyckas finns beviset men ingen snapshot. Det är acceptabelt, eftersom nästa skrivning tar igen det och läsningen alltid räknar från bevisen och aldrig från snapshotten. Väljer vi `security definer` (B3b) kan alltihop göras atomärt i en funktion.

### 5.4 Märkning i UI:t

- Varje bevis i nedbrytningen visas med `SourceTag` (källa och datum), som Datalöftet kräver.
- `entered_by = 'founder'` visas som "Angivet av dig". Motiv: ärlighet mot grundaren själv och mot den som läser affärsplanen.
- Föråldrade bevis märks, se 6.5.

---

## 6. När ett bevis blir gammalt

### 6.1 Varför

7.4 säger att "poängen kan sjunka". Ett kundsvar från förra året säger lite om betalningsviljan i dag, och registersiffror byts ut när nya årsredovisningar kommer in. Utan föråldring kan poängen bara stiga.

### 6.2 När är ett bevis föråldrat?

`fetched_at + EVIDENCE_KINDS[kind].freshForDays < todayIso` → `stale`. `freshForDays = null` betyder att beviset aldrig föråldras. Det gäller till exempel att bolaget är registrerat eller att en profilkompetens finns.

Motiv för att räkna från `fetched_at` och inte `created_at`: faktumets ålder är det som spelar roll. Om ett gammalt svar matas in i dag ska det inte räknas som färskt.

Motiv för att räkna vid läsning och inte lagra: se 1.3 ("Medvetet utelämnat").

**Livslängderna i tabellen i 1.2 är förslag, inte beslut (B1).**

### 6.3 Vad gör föråldringen med delpoängen? (Öppet beslut B9)

Det finns en teknisk fälla i alla alternativ, och den förklarar varför valet inte är trivialt. **`calculateScore` använder bevisets *position* i listan.** Positionerna 1–10 ger fullt värde, 11–19 ger 0,25 och 20 och uppåt ger 0,05. Dessutom visas **det sista beviset** som delens källa (`scorePart`, `items[items.length - 1]`). Ordningen in i funktionen styr alltså både värdet och vilken källa som visas.

| Alternativ | Vad det innebär | Effekt på ordning och källa | För | Emot |
|---|---|---|---|---|
| **(a) Uteslut** föråldrade bevis | Föråldrade bevis skickas inte till `calculateScore`. Om en upplåst del bara har föråldrade bevis skickas *det senaste* föråldrade med 0 poäng, så att delen inte blir tom. | Färska bevis får platserna 1–10, och delens källa blir ett färskt bevis när ett sådant finns. | Enklast att förklara: "Det här svaret är för gammalt för att räknas." Inget av färskt bevis går förlorat. | Poängen faller i ett steg den dag ett bevis passerar gränsen. |
| **(b) Avtagande värde** | Poängen skalas ner linjärt, till exempel från 100 % vid `freshForDays` till 0 % vid `2 × freshForDays`. | Om de föråldrade ligger först tar de platserna 1–10, och färska bevis hamnar på 0,25. Om de ligger sist visas en föråldrad källa som delens källa. Båda är fel. | Mjukare kurva. | Ordningsproblemet ovan saknar en ren lösning utan att `core/score.ts` ändras. |
| **(c) Steg** | Hälften av värdet efter `freshForDays` och inget efter `2 × freshForDays`. | Samma ordningsproblem som (b). | Ett mellanting. | Samma som (b). |

Jag lutar åt att (a) är det enda alternativet som fungerar rent utan att `core/score.ts` rörs, men det är en produktfråga om poängen ska falla i steg eller i en kurva. Väljer du (b) eller (c) behövs troligen en ändring i `scorePart` så att källan väljs ur det mest värdefulla beviset och inte ur det sista. Det kräver ditt godkännande.

### 6.4 När syns det?

Föråldringen räknas vid **varje läsning**, så siffran i sidhuvudet sjunker samma dag som ett bevis passerar gränsen. Men läsningen skriver aldrig en snapshot (det är beslutat i `docs/moduler/evidens-och-poang.md`), så **historikgrafen visar fallet först vid nästa skrivning.** Öppet beslut B10:
- (a) Acceptera det. Grafen visar fallet vid nästa händelse, med `deltaReason` "bevis har föråldrats".
- (b) Ett schemalagt jobb, till exempel dagligen via Vercel Cron och en route handler med service role, räknar om alla aktiva projekt och skriver snapshots vid förändring.
- (c) Läsningen får skriva en snapshot när totalen skiljer sig från den senaste. Då upphävs det tidigare beslutet.

### 6.5 Hur märks det?

- I nedbrytningen på `/app/poang` får ett föråldrat bevis etiketten "Föråldrat · hämtat 12 mars 2026" och en åtgärd: "Hämta igen" för `system`-bevis och "Uppdatera" för `founder`-bevis.
- "Höj din poäng" (7.6) får en kandidat per del där föråldrade bevis kostar poäng. Lucktypen är "Otillräckligt underlag", och poängvinsten räknas genom att köra `calculateScore` en gång till med beviset färskt och jämföra resultaten (7.6: "Förslagen härleds ur evidensen med kod"). Den uträkningen ligger i `core/evidenceInput.ts` eller i en ny `core/evidenceSuggestions.ts`.
- `deltaReason` vid föråldring är en i18n-nyckel, eftersom ingen text får vara hårdkodad.

---

## 7. Vad kan gå fel?

Tabellen är ordnad efter allvar. Kolumnen "Spärr" anger **var** skyddet sitter, och för varje sak som går att fuska med ska skyddet sitta i databasen.

| # | Risk | Spärr | Var | Test |
|---|---|---|---|---|
| 7.1 | **Grundaren skriver bevis direkt mot Supabase REST med påhittade `points`** (möjligt i dag) | Skrivpolicyerna tas bort (2.3). `points` och `contradicts` kommer bara ur `kind`. | DB och core | `rls.live.test.ts`: insert, update och delete som `authenticated` nekas. `migrations.test.ts`: `evidence` har ingen skrivpolicy. |
| 7.2 | **Dubbletter**: dubbelklick, en ny körning av en modul, eller samma svar som importeras två gånger | Unikt index på `(project_id, kind, subject_ref) where retracted_at is null`, och `on conflict do nothing` som ger `duplicate`. | DB | Livetest: två anrop ger en rad och `duplicate`. |
| 7.2b | **Samma bolag svarar två gånger** (två mejl, två citat) | `subject_ref` = bolagets id för kundsorterna, så ett bolag ger ett bevis per sort. Motiv: trappan för avtagande värde i 7.4 förutsätter *olika* svarande, och annars går den att fylla med ett enda bolag. **Osäker:** ska ett senare svar *ersätta* det tidigare (återkalla det gamla, spara det nya) eller nekas som dubblett? Jag lutar åt att det ersätter, eftersom det senaste beskedet gäller. | DB och adapter | Enhetstest i adaptern. |
| 7.3 | **Bevis utan källa** | `KällaSchema` (zod, finns redan i `lib/schemas/evidence.ts`) i servern, plus `check (char_length(btrim(source_name)) > 0)` och `fetched_at not null` i databasen. Typen `EvidenceItem.source` är redan obligatorisk. | Server, DB och typ | Livetest med `source_name = '  '` nekas. Enhetstest av zod. |
| 7.3b | **Datum i framtiden** (gör att beviset aldrig föråldras) | Servern nekar `fetched_at > idag` (svensk tid). | Server | Enhetstest. |
| 7.3c | **`system`-bevis utan URL** | Servern kräver `source.url` när `enteredBy` är `system` och källan är extern. | Server | Enhetstest. |
| 7.4 | **Bevis som pekar på fel del** | Delen tas ur `kind`, och FK:n `(kind, part_id) → evidence_kinds` gör en felaktig kombination omöjlig. `toPartEvidence` kastar om raden och `core` inte stämmer. | DB och core | Livetest: en manuell insert med `kind = profileFitAnswer, part_id = traction` nekas. Enhetstest i `core/evidenceInput.test.ts`. |
| 7.5 | **Bevis på någon annans projekt** | `project_id` kommer bara från `getActiveProjectId(session)` och aldrig ur indata. Den sammansatta FK:n `(project_id, user_id) → projects (id, user_id)` finns redan och gör det omöjligt även om servern skulle ha fel. RLS `select egen` gör att andras bevis aldrig läses. **Obs vid B3a (service role):** RLS gäller då inte för skrivningen, så FK:n och sessionskontrollen är det enda skyddet. | DB och server | `rls.live.test.ts` utökas: användare B kan varken läsa A:s bevis eller skriva på A:s projekt, inte ens via skrivvägen med A:s `project_id` inskickat. |
| 7.6 | **Simulering som bevis** (7.4: ger aldrig poäng, `docs/moduler/simuleringar.md`: får aldrig nå `EvidenceRepository`) | Ingen `kind` har `dataType: "simulation"`, och `check (data_type <> 'simulation')` sitter i databasen. | Core och DB | Statiskt test: ingen sort i `EVIDENCE_KINDS` är en simulering. |
| 7.7 | **Grundaren återkallar motsägande svar** för att slippa straffet för skevt underlag (7.4) | Bara `founder`-bevis kan återkallas av grundaren. `system`-bevis (svar Spark tagit emot) kan inte återkallas. Varje återkallelse kräver en anledning och skrivs i Spåret. **Osäker:** räcker det, eller ska motsägande bevis aldrig kunna återkallas? | Server och Spåret | Enhetstest. |
| 7.8 | **Instruktioner i ett citat** (promptinjektion när Medgrundaren senare läser bevisen) | `quote` lagras som ren text med en längdgräns och skickas till Gemini bara inom data-avgränsning, aldrig som instruktion (CLAUDE.md). Samma rensning som `cleanText` i `MemoryRepository`. | Server | Befintligt mönster. |
| 7.9 | **Två skrivningar samtidigt** ger två snapshots med fel delta | Deltat räknas mot den snapshot som lästes. I värsta fall blir en delta fel en gång, och nästa skrivning rättar det. Med B3b kan funktionen låsa projektet (`select … for update`) för att undvika det helt. | Adapter eller DB | — |
| 7.10 | **En del blir tom efter återkallelse eller föråldring** så att `calculateScore` kastar | Se 3.3 (B4) och 6.3a. | Core | Enhetstest: en upplåst del med bara föråldrade eller återkallade bevis kastar inte. |
| 7.11 | **Ett projekt byts** (pivot) | Bevisen hör till `project_id`. Det nya projektet börjar på nytt, och det gamla behåller sina bevis för historiken. Passform är dock knutet till *personen*. **Osäker:** ska `profileFitAnswer` följa med till ett nytt projekt (kopieras), eller ska Passform räknas på användarnivå? | — | — |
| 7.12 | **Källnamn och i18n**: källan "Kundsamtal, steg 05" är text, inte ett egennamn | Förslag: `source_name` lagras som ett egennamn ("Bolagsverket", ett bolagsnamn) när det är ett, och som en i18n-nyckel (`evidence.source.profileChat`) när det är Sparks egen källa. Visningen slår upp nyckeln. **Osäker** på om det är värt komplexiteten, eller om interna källor alltid ska lagras på svenska. | Adapter | — |
| 7.13 | **Kontot raderas** | `on delete cascade` på `user_id` finns redan. | DB | — |

---

## 8. Byggordning

Varje punkt är en egen PR som går att granska för sig. Typecheck, lint och tester ska vara gröna efter varje.

1. **`core/evidenceKinds.ts` och `core/evidenceInput.ts`** med tester. Ren logik, ingen databas. Den befintliga `buildPartEvidence` i liveadaptern byts mot `toPartEvidence`. Läsvägen ska ge exakt samma resultat för befintliga fixturer, och det bevisas med det test som redan jämför mot `calculateScore` direkt.
2. **Migrationen** (2.2–2.4): `evidence_kinds`, nya kolumner, villkor, skrivpolicyer bort från `evidence` och `score_snapshots`, synktestet och en ny kategori i `migrations.test.ts`. Beslutet förs in i `docs/beslut.md`.
3. **Porten** (B5) och demoadaptern. Kontraktstestet utökas, och livesviten skippas (`NotImplementedError`) tills punkt 4 är klar.
4. **Liveadaptern**: skrivvägen (B3), `recordEvidence`, `retractEvidence`, `listEvidence`, snapshots och rättelsen av `previousTotal` (3.4). `rls.live.test.ts` utökas.
5. **Första flödet: Passform från profilen** (5.1). Det är det enda flödet utan beroenden till grindade moduler, och därmed det första som kan få siffran att röra sig i live.
6. **Nedbrytningen på `/app/poang`** med `listEvidence`, föråldringsmärkning och återkallelse.
7. Övriga flöden efter beslut B6 och B7, i takt med att Registret, Utskick och skrivvägen för Resan blir klara (5.2).

`docs/moduler/evidens-och-poang.md` uppdateras i samma PR som porten (enligt `docs/bygga-en-modul.md` §4). Kör `/security-review` före punkt 2 och punkt 4, eftersom båda rör RLS och skrivbehörighet.

---

## 9. Tester att skriva

- `core/evidenceKinds.test.ts`: alla åtta delar har minst en sort; ingen sort är en simulering; alla `basePoints ≥ 0`.
- `core/evidenceInput.test.ts`: återkallade bevis räknas inte; ett föråldrat bevis sänker delpoängen (vid B9a: utesluts); en del med bara föråldrade bevis kastar inte; ordningen är stabil vid samma `created_at`; samma indata ger samma utdata; en rad vars `part_id` inte stämmer med `kind` kastar.
- `supabase/migrations/evidenceKinds.test.ts`: SQL-seed och `EVIDENCE_KINDS` stämmer överens.
- `migrations.test.ts`: `evidence` och `score_snapshots` saknar skrivpolicy för `authenticated`.
- `ports/EvidenceRepository.contract.test.ts`: se 4.3.
- `adapters/live/EvidenceRepository.test.ts`: dubblett, saknad källa, framtida datum, `system` utan URL, återkallelse av ett `system`-bevis nekas, snapshot skrivs bara vid förändring, `previousTotal` rätt efter två skrivningar.
- `adapters/live/rls.live.test.ts`: direkt insert, update och delete nekas; användare B kan inte läsa A:s bevis eller skriva på A:s projekt.

---

## 10. Öppna beslut, samlade

| # | Fråga | Alternativ | Avsnitt |
|---|---|---|---|
| B1 | Poäng och livslängd per bevissort | Tabellen i 1.2 är ett startförslag | 1.2, 6.2 |
| B2 | Lagras `points`, eller härleds de vid läsning? | **(a)** Härleds ur `kind` vid varje läsning: en ändrad poängtabell slår igenom på alla bevis, så det finns en enda sanning, men historiska snapshots stämmer inte längre med en ny omräkning. **(b)** Sätts av servern vid skrivning och lagras: varje bevis behåller sitt värde, men två likadana bevis kan vara olika mycket värda beroende på när de lades in. | 1.3 |
| B3 | Hur servern skriver | (a) service role, (b) `security definer`-funktion | 2.3 |
| B4 | Upplåsta delar utan bevis | (a) fas ur avklarat steg, (b) stegspärr, (c) effektiv fas, (d) ändra `calculateScore` | 3.3 |
| B5 | Ny port eller utökad port | (a) utöka `EvidenceRepository`, (b) ny `EvidenceRecorder` | 4.1 |
| B6 | Får grundaren själv lägga in kundbevis? | (a) ja med märkning, (b) ja med lägre värde, (c) nej | 5.1 |
| B7 | Vem klassificerar ett svar? | (a) grundaren, (b) modellen med bekräftelse, (c) regler i kod | 5.1 |
| B8 | När skrivs en snapshot? | Vid ändrad total, eller vid varje händelse | 5.3 |
| B9 | Vad föråldring gör med poängen | (a) utesluta, (b) linjär nedtrappning, (c) steg | 6.3 |
| B10 | När syns föråldringen i historiken? | (a) vid nästa händelse, (b) dagligt jobb, (c) läsningen skriver | 6.4 |
| — | Ersätter ett nytt svar från samma bolag det gamla? | ersätta eller neka | 7.2b |
| — | Kan motsägande bevis återkallas? | bara `founder`-bevis, eller aldrig | 7.7 |
| — | Följer Passform med vid pivot? | kopiera eller räkna per användare | 7.11 |
| — | Källnamn som i18n-nyckel eller som text | nyckel för interna källor, eller alltid svenska | 7.12 |

---

## 11. Beslut och vad som byggdes (2026-10-01)

Besluten B4, B6 och B9 tog Theodor. De övriga sju (B1, B2, B3, B5, B7, B8, B10) och de fyra omärkta frågorna i avsnitt 10 valde jag, efter vad specen lutade åt där den lutade.

### 11.1 Theodors beslut

**B4: en upplåst del utan bevis ger 0 och visar luckan.** Aldrig ett kastat fel. `core/score.ts` är ändrad, men bara den regeln: `scorePart` anropas inte längre med en tom lista. Delen läggs i stället i den nya listan `ScoreSnapshot.emptyParts` (valfritt fält i `core/domain.ts`), och `screens/Score.tsx` visar den som "Inget underlag än", aldrig som "0/18". Ingen `ScorePart` med 0 poäng skapas, eftersom en sådan kräver en källa (7.4). Det befintliga testet "kastar om en upplåst del helt saknar bevis" beskrev exakt den regel som skulle bort. Det är därför omskrivet till den nya regeln. Alla andra tester i `core/score.test.ts` är oförändrade och gröna.

**B6: grundaren får lägga in bevis själv, men de märks och väger mindre.**
- *Självrapporterat* betyder att grundaren anger ett faktum om en tredje part, alltså en sort med `enteredBy: "either"` som läggs in med `entered_by = 'founder'`. Det gäller kundsvar, betalande kunder, aktiva användare och registrering.
- Profilsvar, MVP-avgränsning, publicerad produkt och juridiska punkter är inte självrapporterade, eftersom grundaren själv är källan där.
- **Vikt:** ett självrapporterat bevis ger **hälften** av sortens poäng (`SELF_REPORTED_MULTIPLIER = 0.5`). Det är databasen som sätter det, i triggern.
- **Tak:** självrapporterade bevis kan tillsammans ge en del **högst 50 % av delens vikt** (`SELF_REPORTED_PART_SHARE = 0.5`). Det räknas i `core/evidenceInput.ts`. Problem och Betalningsvilja (vikt 18) når alltså högst 9 på egna påståenden, och Traktion (14) högst 7. Resten kräver bevis som Spark själv tagit emot.
- **Varför 50 %:**
  - Utan tak kan grundaren fylla en del med påhittade bolag. `record_evidence` går att anropa direkt, och dubblettspärren hindrar inte att man anger nya bolagsnamn.
  - Med 50 % kan poängen röra sig i live redan nu, innan utskicken fungerar. Ett eget påstående är svagt bevis med känd källa, inte inget bevis.
  - Hälften är också lätt att förklara i en mening: "Det du själv angett kan ge högst hälften av delen."
  - Ett lägre tak, till exempel 25 %, skulle göra Problem i praktiken orörligt (högst 4 av 18). Ett högre skulle låta självrapporterat dominera.
- Över taket räknas ett bevis med 0 poäng och märks `capped`. Det ligger ändå kvar i underlaget, så att ett självrapporterat avböjt pris fortfarande drar in delen i "skevt underlag" (7.4).

**B9: gamla bevis utesluts, de graderas inte ner.** Livslängd per sort, räknat från faktumets datum (`fetched_at`):

| Sort | Livslängd | Varför |
|---|---|---|
| Registersiffror (antal, omsättning, konkurrenter) | 365 dagar | Registren uppdateras när årsredovisningarna kommer in, en gång om året. Äldre siffror beskriver ett annat år. |
| Kundsvar om problem och pris | 180 dagar | En kunds besked om problem och betalningsvilja håller ungefär en säsong. Efter ett halvår har marknaden, priset eller idén ofta ändrats. |
| Publicerad produkt | 90 dagar | En sida som inte kontrollerats på ett kvartal kan vara nere. Det ska kontrolleras igen, inte förutsättas. |
| Betalande kund | 90 dagar | En betalning för mer än ett kvartal sedan säger inte att kunden fortfarande betalar. |
| Aktiva användare | 30 dagar | "Aktiv" är per definition färskt. Siffran från förra månaden gäller inte nu. |
| Juridisk punkt klar | 365 dagar | Deklarationer, årsredovisning och tillstånd återkommer årligen. |
| Profilsvar, MVP-avgränsning, registrering | aldrig | Faktum som inte blir gammalt: en kompetens, ett beslut, ett bolag som finns. |

Gränsen är skarp: ett kundsvar räknas i exakt 180 dagar (testat). Ett uteslutet bevis märks `stale` i `listEvidence`. Blir en del tom på det sättet gäller B4.

### 11.2 Mina val på de sju öppna punkterna

| # | Val | Varför |
|---|---|---|
| **B1** | Startvärdena i 1.2. `payingCustomer`, `activeUser` och `formalRegistrationDone` ändrade till `either`. | Specen lutade uttryckligen åt startvärdena. Ändringen följer av B6. |
| **B2** | **Databasen** sätter `points` ur `evidence_kinds` när beviset skrivs, och värdet lagras. Läsningen använder det lagrade värdet. Del, datatyp och motsäger kontrolleras mot `core/evidenceKinds.ts`, och en avvikelse kastar `EvidenceIntegrityError`. | Theodors krav: poängen härleds ur sorten i databasen och kommer aldrig ur inmatningen. Historiken stämmer med en omräkning. Nackdel: en ändrad poängtabell gäller bara nya bevis, så gamla bevis behåller sitt värde. |
| **B3** | Security definer-funktionen `public.record_evidence` för grundarens bevis, plus en trigger som skriver över del, datatyp, motsäger och poäng ur sorten vid **varje** insert, även med service role. | Det är den enda vägen där ett direkt anrop mot Supabase inte kan sätta poäng, del eller "system". Användaren tas ur `auth.uid()`, projektet ur det aktiva projektet och `entered_by` blir alltid `'founder'`. |
| **B5** | En ny port, `ports/EvidenceRecorder.ts`. | Specen lutade inte tydligt åt något håll. En ny port gör att `EvidenceRepository`s adaptrar inte behöver fler metoder, och typsystemet visar vilka moduler som kan påverka poängen. |
| **B7** | Grundaren väljer klassningen själv (bekräftar eller avvisar). En modell får bara föreslå. | Så fungerar den enda väg som finns i dag, den manuella. En språkmodell rör aldrig poängen. När svar via Spark finns (systembevis) behöver frågan tas upp igen för de svaren. |
| **B8** | En snapshot skrivs bara när totalen ändras jämfört med den senaste. | Specens huvudförslag. En duplicerad punkt i grafen är brus. |
| **B10** | (a): historiken visar ett fall vid nästa händelse. | Inget cron-jobb behövs, och beslutet att en läsning aldrig skriver står kvar. Läsningen visar ändå fallet direkt, med orsaken "Bevis har blivit för gamla för att räknas". |

### 11.3 De fyra omärkta frågorna

- **7.2b, nytt svar från samma bolag:** det nya **ersätter** det gamla. Det gamla återkallas med en anledning, och svaret blir `replaced`. Det gäller bara när båda är grundarens egna. Ett svar som Spark tagit emot (system) kan grundaren aldrig ersätta.
  - Om samma sort, sak *och* datum skickas en gång till blir svaret `duplicate`, till exempel vid ett dubbelklick.
- **7.7, återkallelse:** bara grundarens egna bevis går att återkalla, och det kräver en anledning som skrivs i Spåret. Motsägande självrapporterade bevis kan alltså återkallas. Det är grundarens eget påstående, och taket i B6 gör att det inte lönar sig att gömma ett motsägande svar för att hämta in poäng.
- **7.11, pivot:** Passform följer **inte** med till ett nytt projekt. Bevisen hör till `project_id`. Enklast, och samma regel för alla sorter. Profilsvaren får läggas in igen i det nya projektet.
- **7.12, källnamn:** Sparks egna källor lagras som nyckel, med prefixet `spark:` (i dag bara `spark:profile`, som visas som "Profilsamtalet"). Egennamn lagras som text. Både databasen och servern nekar `spark:`-källor på sorter där grundaren inte själv är källan, så att ett påstående om en kund aldrig ser ut att komma från Spark.

### 11.4 Var reglerna sitter

| Regel | Var |
|---|---|
| Klienten kan inte skriva i `evidence`, `score_snapshots` eller `evidence_kinds` | Migrationen: skrivpolicyer borttagna, `revoke insert, update, delete`. Vakt: `WRITE_CLOSED_TABLES` i `migrations.test.ts`. |
| Poäng, del, datatyp och motsäger ur sorten | Triggern `evidence_derive_from_kind` |
| Ett bevis ändras aldrig, det återkallas | Triggern `evidence_only_retraction` |
| Bara `http(s)`-länkar | `check` i tabellen och zod i servern |
| Datum inte i framtiden, ingen registerdata från grundaren, en skrivning i taget per projekt | `record_evidence` (plus servern för begripliga fel) |
| Föråldring, återkallade bevis, ordning och tak för självrapporterat | `core/evidenceInput.ts`, ren funktion |
| Snapshots skrivs bara av servern | `lib/server/scoreSnapshots.ts` (service role, lint-spärrad). Beslut i `docs/beslut.md`. |

SQL:en prövas mot en riktig Postgres i CI med PGlite (`supabase/migrations/evidenceWritePath.pg.test.ts`, `test/pgMigrations.ts`), inklusive testet att egna `points` avvisas.

### 11.5 Avvikelser från avsnitt 1–10

- `RecordEvidenceInput` har inte `responseId` och `companyId`. Grundarens väg har inga sådana, och kolumnerna finns för systemvägen.
- Ingen server action byggdes på grenen `plattform/bevislagring`. Den första, Passform från profilen, kom på `plattform/poangen-ror-sig` (se 11.7).
- `previousTotal`-regeln i 3.4 är utökad: har totalen ändrats sedan den senaste snapshotten blir orsaken antingen "för gamla" (om totalen sjönk och något bevis är för gammalt) eller "räknad om".

### 11.6 De fyra felen i avsnitt 0

1. **Insert-policyn:** borttagen, se 11.4.
2. **`calculateScore` kastade:** se B4.
3. **`previousTotal`:** varje snapshot bär sin egen förändring. Läsningen visar `senaste.total − senaste.delta` när totalen fortfarande stämmer (`previousFromLatest` i `adapters/live/evidenceScore.ts`). Testat hela vägen genom två skrivningar och en läsning.
4. **Fasen mot upplåsningstexten:** "efter steg N" gäller. Fasen räknas ur högsta *avklarade* steg (`scorePhaseForCompletedSteps` i `core/journey.ts`). Beslutet står i `docs/beslut.md`.
   - **Rättat på `plattform/poangen-ror-sig`:** `UNLOCK_STEP` i `core/score.ts` sade "efter steg 08" för Produkt och "efter steg 09" för Genomförbarhet, men fasen Lansera låser upp båda efter steg 07. Nu står 07 för båda. Beslut i `docs/beslut.md`.

### 11.7 Skrivvägen i bruk och stegmarkeringen (grenen `plattform/poangen-ror-sig`, 2026-10-01)

**Passform från profilen (byggordning punkt 5).**
- **Var:** Under Profilen i `/app/minnet` finns fyra frågor: kompetens, nätverk, tid och pengar (`core/fitQuestions.ts`).
- **Hur ett svar sparas:** Server action `saveFitAnswer` i `app/(app)/app/minnet/actions.ts` anropar `liveEvidenceRecorder.recordEvidence` med
  - sorten `profileFitAnswer`
  - `subjectRef` = `fit:<fråga>`
  - källan `spark:profile` och dagens datum
  - svaret i `quote`.
- **Poängen efteråt:** Den räknas om på servern, och skalets poäng uppdateras via `revalidatePath("/app", "layout")` utan omladdning. Formuläret visar den nya poängen som en länk till Poäng-sidan.
- **Märkning:** Ett profilsvar är inte självrapporterat i B6:s mening, så det räknas fullt. Det märks "Ditt eget svar" och visas med källa och datum.
- **Ändra ett svar:** Det går inte än. Ett svar med samma fråga och samma datum blir `duplicate`.

**Stegmarkeringen.**
- **Var kravet sitter:** `public.complete_journey_step` med kraven i `journey_step_requirements`. Kraven speglas i `core/journeyRequirements.ts`, och tabellen och beslutet står i `docs/beslut.md`.
- **Skrivvägen:** `journey_steps` är stängd för skrivning från klienter.
- **Port och adapter:** `ports/JourneyProgress.ts`. Liveadaptern räknar om poängen efter ett avklarat steg och skriver en snapshot med orsaken `unlocked` om totalen ändrats (via `settleScore` i `adapters/live/EvidenceRecorder.ts`, den enda filen som får skriva snapshots).
- **UI:** Steget i `/app/resan/[steg]` visar vad som saknas, eller knappen "Markera som klart".

**Taket följer med.** Fasen räknas ur högsta avklarade steg, så taket höjs när steg 03 blir klart (`adapters/live/JourneyProgress.test.ts` prövar 16 → 20). I live stannar fasen ändå i Upptäck så länge Registret är grindat, eftersom steg 03 kräver registerdata.

### 11.8 Krav för steg 06, 07 och 12 (grenen `plattform/stegkrav`, 2026-10-01)

Theodors beslut på de tre öppna punkterna står i `docs/beslut.md` 2026-10-01. Migrationen är `supabase/migrations/20261001180000_journey_steps_06_07_12.sql`.

- **Steg 06:** minst fem kundsvar som räknas i Problem och Betalningsvilja tillsammans, från minst tre olika bolag (`subject_ref`).
  - Det kräver en tröskel per kravgrupp: tabellen `journey_step_group_thresholds` och `GROUP_THRESHOLDS` i `core/journeyRequirements.ts`.
  - En grupp räknas som helhet. Varje bevis som matchar någon av gruppens rader räknas en gång, och antalet olika `subject_ref` jämförs med `min_subjects`. Utan tröskel räcker ett bevis, som förut.
  - Ersättningsregeln i `record_evidence` (7.2b) gör att grundaren har högst två egna besked per bolag (ett om problemet, ett om priset). Fem svar kräver alltså minst tre bolag redan där. Tröskeln om tre bolag gäller ändå, även för svar som Spark tagit emot.
- **Steg 07:** ett beslutat pris, ny sort `priceDecided` (Betalningsvilja). Ett godtaget pris är inte ett krav. En kund som godtar priset är fortfarande `customerPriceAccepted` och höjer Betalningsvilja.
- **Steg 12:** en inskickad ansökan till en finansiär, ny sort `fundingApplied` (Genomförbarhet).
- **De två nya sorterna ger ingen poäng** (`base_points` 0, villkoret ändrat till `>= 0`):
  - Ett pris grundaren själv satt bevisar inte att någon betalar det, och en ansökan är inte beviljade pengar.
  - Båda är `either`, så att de märks "Angivet av dig" när grundaren lägger in dem.
  - `core/evidenceInput.ts` skickar dem inte till `calculateScore` och märker dem `noPoints`. Därför fyller de aldrig en tom del, som annars skulle visas som 0 i stället för som en lucka (B4).
- **Livslängd:** `priceDecided` 365 dagar, eftersom ett pris blir gammalt. `fundingApplied` föråldras aldrig.
- **UI:** `/app/resan/06` visar kravet i text. Antalet svar och bolag hittills räknas (`progress` i `StepCompletionView`) men visas inte. Det vore en uträknad sammanfattning, och de enskilda kundsvaren visas inte med källa någonstans i live. Poäng-sidan visar en källa per del. Antalet kan visas när en lista över svaren finns (CLAUDE.md, undantaget för uträknade sammanfattningar).
- **Inte byggt:** något formulär för att ange ett beslutat pris, en ansökan eller kundsvar. Kraven går att uppfylla så fort skrivvägen anropas.

