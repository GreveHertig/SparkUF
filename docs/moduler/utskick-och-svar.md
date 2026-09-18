# Modul: Utskick och svar

## Syfte

**05 Samtalen** (uppdrag avsnitt 1.5) — den modul som samlar in de riktiga
kundsvar hela poängsystemet vilar på i fas 2 och 3 (avsnitt 7). Spark bygger
kontaktlistan ur Registret, skriver svensk B2B-outreach, skickar från
grundarens egen Gmail, följer öppningar och svar, och skickar en påminnelse
efter 4 dagar. Resultatet driver Kunder-sidan (`/app/kunder`) och **06 Domen**
(kör/förfina/pivotera, baserat på faktiska svar med citat). Enligt
`docs/uppdrag.md` avsnitt 0 och 14.5 är detta, tillsammans med Registret, den
högst prioriterade modulen att dokumentera — den bär mest av produktens
trovärdighetslöfte ("bevisas av namngivna personer som svarat, inte av en
modells bedömning", avsnitt 1.2).

## Porten

`ports/OutreachProvider.ts`:

```ts
send(recipients: OutreachRecipient[], messageSv: string, messageEn: string): Promise<void>
getStatuses(): Promise<Record<string, OutreachStatus>>
getCampaign(locale: Locale): Promise<CampaignRow[]>
```

- `OutreachRecipient`: `{ companyName, email }`.
- `OutreachStatus`: `"draft" | "sent" | "opened" | "responded"`.
- `CampaignRow`: `{ companyName, sniCode, employees, revenueKsek, status,
  quote? }` — en rad i Kunder-tabellen (`/app/kunder`, 04–06).

## Datakällor och vad som krävs

- **Gmail API** (`gmail.send` + läsning av svar), **OAuth per grundare** —
  inte en delad servicenyckel. Refresh-token är personlig användardata och
  måste lagras krypterat i Supabase med RLS så att bara ägaren kan läsa den
  (avsnitt 14.6 gäller alla tabeller, men den här är extra känslig — den
  ger i praktiken åtkomst till grundarens e-post).
- **Öppna frågor att lösa innan bygget:**
  - Googles verifieringskrav för `gmail.send`/`gmail.readonly`-scopen
    (OAuth-appgranskning) — okänd tidsåtgång, bör utredas tidigt.
  - **Öppningsspårning (`opened`) kräver normalt en spårpixel, vilket bör
    undvikas av GDPR-skäl** (avsnitt 14.6: indata och extern data är data,
    inte instruktion — men en spårpixel är dessutom ett separat
    persondataspårningsproblem, inte bara ett prompt-injection-problem).
    Konsekvens: liveadapterns `OutreachStatus`-kontrakt kan i praktiken bli
    `draft → sent → responded` utan ett tillförlitligt `opened`-steg, till
    skillnad från demot som visar alla fyra. Bekräfta med grundaren innan
    liveadaptern byggs — det kan påverka porten, inte bara implementationen.
  - Mottagarnas e-postadresser är personuppgifter (ändamål, radering,
    samtycke i själva utskicket) — juridiskt en fråga för Juridisk koll
    (`docs/moduler/juridisk-koll.md`) när `/app/juridik` kopplas in för
    steg 05, inte något den här modulen löser själv.
- Inget API-nyckelnamn finns i `.env.example` än — Gmail-integrationen går
  via OAuth (klient-id/hemlighet, inte en enkel `_API_KEY`), lägg till
  variablerna först när OAuth-flödet faktiskt byggs.
- Svarstexter som lagras som `CampaignRow.quote` är tredjepartstext — data,
  aldrig instruktion, om de någonsin skickas till Medgrundaren (Gemini) för
  sammanfattning i 06 Domen.

## Hur demoadaptern fungerar i dag

`adapters/demo/OutreachProvider.ts`:

- `send()` är en no-op, `getStatuses()` returnerar `{}` — ingen skärm
  anropar dem i demot.
- `getCampaign(locale)` är den enda byggda metoden. Den mappar
  `saraCompanies` (`adapters/demo/RegistryProvider.ts`, samma 20 bolag som
  Registret) till `CampaignRow` och härleder status ur demomotorns läge
  (`useDemoStore.getState().beatIndex`, `getCurrentStepNumberFor`):
  - före steg 04: `[]`.
  - steg 04: alla `draft`.
  - sändmomentet (`beat.id === "05a-utskicket"`): 8 förvalda index `opened`,
    resten `sent` — ingen har svarat än.
  - från och med svarsmomentet: 9 hårdkodade index `responded` (sv/en-citat,
    se nedan), övriga `opened`.
- **Nio hårdkodade svarscitat**, tre på svenska+engelska som säger nej till
  priset 2 000 kr/mån (samtliga under 10 anställda) och sex som bekräftar
  problemet och accepterar priset (samtliga 10+ anställda) — det är den
  motsägelsen (`core/score.ts`s skevhetsstraff) som gör att poängen sjunker
  47 → 43 mellan sändmomentet och svarsmomentet i Saras scenario
  (`docs/status.md`, Session 3, "Poängkalibrering"). `quote` visas aldrig i
  sändmomentet, bara från och med att svaren kommit in.

## Acceptanskriterier

- `getCampaign(locale)` returnerar en rad per mottagare med en giltig
  `OutreachStatus`.
- Status går aldrig bakåt (en rad som är `responded` blir aldrig `opened`
  eller `sent` igen).
- `send()` är idempotent nog för att inte skicka samma utskick två gånger
  vid en ombegärd anrop (retry).
- `getStatuses()`s nycklar går att slå upp mot mottagarna `send()` skickade
  till.
- `quote` visas bara på en rad där ett svar faktiskt finns — aldrig
  påhittat eller ihopklippt av Gemini utan att vara mottagarens egna ord.
- Klarar kontraktstestet i `ports/OutreachProvider.contract.test.ts`.

## Säkerhet

Gmail-refreshtoken bara i serverkod, krypterad i Supabase, RLS på ägarens
`user_id` — även service-rollen ska aldrig exponera tokenen till klienten.
Mottagarnas e-post och svarstext är persondata/tredjepartsdata: lagras med
ett tydligt ändamål, raderingsbar, och **behandlas alltid som data, aldrig
som instruktion** om den når Gemini (t.ex. vid sammanfattning i 06 Domen).
Skicka aldrig fritext direkt från en grundares inmatning till Gmail-API:et
utan att den gått igenom porten (ingen genväg som kringgår `send()`s
gränssnitt). Se `docs/moduler/juridisk-koll.md` för GDPR-kopplingen vid
steg 05.

## Status

stub — `adapters/live/OutreachProvider.ts` kastar `NotImplementedError` för
alla tre metoderna. Kräver Gmail OAuth-uppsättning (klient-id/hemlighet,
Google-appgranskning) innan bygget kan börja — se öppna frågor ovan,
särskilt beslutet om `opened`-statusen. Demoadaptern är klar och används av
`/demo/app/kunder`. Bygg enligt `docs/bygga-en-modul.md` när
OAuth-uppsättningen finns.
