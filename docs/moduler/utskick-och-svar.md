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
send(confirmed: ConfirmedOutreach[]): Promise<void>   // AVSTÄNGD, se "Sändspärr"
getStatuses(): Promise<Record<string, OutreachStatus>>
getCampaign(locale: Locale): Promise<CampaignRow[]>
```

- `ConfirmedOutreach` (`ports/outreachConfirmation.ts`): adress + ämne + text som
  grundaren manuellt bekräftat. **Kan inte skapas av någon kod i repot**, se
  "Bekräftelse". (Ersätter det tidigare `OutreachRecipient`.)
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

## Förberedelsen: mejlsökning och utkast (byggd, grindad)

Beslut i `docs/dataspiken.md` (rad 21–29, §6 fråga 5): egen mejlsökning med
Tavily och Gemini i stället för Hunter.io. Den ligger i en **separat port**,
`ports/OutreachPrep.ts`, som strukturellt saknar `send` och därför aldrig kan bli
en sändväg. Modulen har alltså två portar men ett dokument.

```ts
suggestEmail(companyName: string): Promise<EmailLookupResult>
draftMessage(input: DraftInput): Promise<Record<Locale, OutreachDraft>>
```

Implementation: `adapters/live/OutreachPrep.ts` (live), `adapters/demo/OutreachPrep.ts`
(demo: fiktiva adresser på `.example`, RFC 2606, kan aldrig nå en brevlåda).
Ingen route eller skärm använder porten, och ingenting lagras.

### Så fungerar `suggestEmail`
1. Grinden (första satsen), throttle (10/timme, 30/dygn per användare, i minnet,
   best-effort), validering av namnet.
2. **Ett** Tavily-anrop (`"<namn> kontakta oss"`, `lib/server/tavily.ts`, fast URL).
   Sidor utan `@` kastas bort; en sida vars värd bär bolagets namn föredras.
   Ingen sida med `@` ger tom lista utan Gemini-anrop.
3. **Ett** Gemini-anrop med företagsnamnet och sidtexten (rensad, max 12 000
   tecken) i avgränsade databloc med en slumpad avgränsare per anrop. Schemat är
   `.strict()` och har **inget** url-/källfält.
4. **Koden verifierar varje kandidat** (`core/emailVerification.ts`): ren
   syntax (NFKC, inga dolda tecken, strikta etiketter), står **ordagrant** i
   texten som skickades (som egen adress, inte del av en längre; sidans egen
   stavning returneras), och **adressens domän bär bolagets namn**: strikt
   likhet (bindestreck bortsedda) mot bolagets särskiljande ord, dessa ord ihop
   eller hela namnet utan bolagsform, aldrig "innehåller". Sidans domän räknas
   inte: en katalog- eller konkurrentsida kan inte göra sin egen adress till
   bolagets. Tvådelade suffix (`co.uk`), delade värdar (`vercel.app`,
   `github.io` …) och fria mejltjänster (`gmail.com` …) avvisas. Namn som bara
   består av branschord ("Svenska Bygg") ger alltid avslag. Avslag är **hårda**
   (färre men pålitliga förslag). Rollbaserade adresser (`info@`, `kontakt@` …)
   sorteras först; personliga returneras flaggade.
5. Källan (`url`, värdnamn, datum) injiceras i kod ur Tavily-träffen. Avvisade
   kandidater räknas i `rejectedCount` men returneras aldrig. Ingen träff är
   `suggestions: []`, inget fel.

### Utkastet
Mallbaserat ur i18n (`outreachDraft`, sv + en) via `core/outreachDraft.ts`, inte
modellskrivet: avsändare, var adressen hittades, personuppgiftsnotis och
avregistreringsmening får inte kunna parafraseras bort. Alla variabler rensas
(företagsnamnet är extern text); käll-URL:en måste vara `https`, utan userinfo och högst 300 tecken. Ett Gemini-formulerat utkast är avsiktligt
utanför scope.

## Grind

`lib/server/outreachAccess.ts`: `OUTREACH_LIVE_ENABLED` måste vara exakt `true`
**och** inloggad `user.id` måste finnas i `OUTREACH_ALLOWED_USER_IDS`
(kommaseparerad, bara i `.env.local`: Erik och Theodor). Nekat som standard,
anropas som **första sats** i båda metoderna, före validering och externa anrop.
Nekat ger `OutreachLockedError` (visas som `ComingSoon`, avslöjar inte
allowlisten). Samma mönster som Registrets licensgrind.

CI-vakter (alla blir röda om grinden tas bort eller försvagas; verifierat
genom att försvaga dem en i taget):
- **G1** `ports/stubStatus.test.ts`: med rensad env nekar varje metod, även vid ogiltig indata.
- **G2** `adapters/live/outreachGate.guard.test.ts`: varje portmetod börjar med grinden, och adaptern har inga metoder utöver portens.
- **G3** `lib/server/noMailer.guard.test.ts` (+ ESLint `no-restricted-imports`): inga mejlpaket, Gmail-sändningsändpunkter eller SMTP.
- **G4** `ports/outreachConfirmation.guard.test.ts`: ingen kod skapar eller casta:r till `ConfirmedOutreach`.

G2–G4 läser källtext, inte AST, och kan kringgås av en tillräckligt kreativ
omskrivning. De är lager, inte det enda skyddet.

## Sändspärr

**Ingen riktig e-post får någonsin skickas automatiskt.** Gmail-koppling, sända
mejl, öppningsspårning och automatiska påminnelser är en egen, separat uppgift
som **inte påbörjas förrän Theodor och grundaren uttryckligen sagt ja**, eftersom
den påverkar riktiga företag utanför Spark. Tills dess kastar `send`,
`getStatuses` och `getCampaign` i `adapters/live/OutreachProvider.ts`
`OutreachSendDisabledError`. Den ärver `NotImplementedError` enbart så att
`contractIt` och `ports/stubStatus.test.ts` fortsätter fungera; den betyder
**inte** "bygg mig". Att ta bort spärren är inte en koduppgift.

## Bekräftelse

Ingenting får skickas till en riktig mottagare utan att grundaren manuellt
bekräftat **adressen och texten**. Ingen automatisk logik får hoppa över det,
nu eller i framtiden. Tre lager:
1. **Typ:** `EmailSuggestion.status` och `OutreachDraft.status` är literaler
   (`"suggested"`, `"draft"`). `send()` tar bara `ConfirmedOutreach`, en typ med
   `unique symbol`-brand som ingen kod kan skapa. Att mata `send` med ett förslag
   eller utkast är ett **kompileringsfel** (typtest i G4).
2. **Ingen konstruktör finns.** Den byggs först när Theodor och grundaren sagt ja
   till sändning: exakt en funktion, i `ports/outreachConfirmation.ts`, som tar
   redigerad adress **och** redigerad text från en människohandling.
3. **G4** blir röd om någon annan fil nämner brandet, casta:r till typen eller
   skriver ett `status: "confirmed"`-literal.

## Kända begränsningar
- **Bolag vars domän inte bär namnet avvisas** (hård avvisning), t.ex. en byrå
  med en varumärkesdomän. Grundaren söker då manuellt. Det är priset för att
  aldrig föreslå fel bolags adress.
- Listan över tvådelade suffix, delade värdar och fria mejltjänster i
  `core/emailVerification.ts` är förenklad, inte en publik suffixlista.
- **`ConfirmedOutreach` är ett kompileringstidsbrand.** `any`, `as never` eller
  `JSON.parse(...)` kan kringgå typen; G4 fångar bara vanliga casts. Den dag
  `send` byggs måste den **även kontrollera bekräftelsen vid körning**
  (t.ex. att bekräftelsen skapats av den enda tillåtna funktionen och att
  användaren är allowlistad). Typen ersätter inte den kontrollen.
- Typskydden i G4 körs av `tsc` inuti testet (vitest tar bort typer), så
  `pnpm test` kräver att `node_modules/.bin/tsc` finns.
- G2–G4 läser källtext, inte AST. ESLint-regeln mot mejlpaket täcker bara
  statiska imports; dynamisk `import()` och `fetch` mot mejl-API:er fångas av
  vakttestet.
- Namnkrock i Tavily: `searchedUrl` returneras alltid så att grundaren ser
  sidan före bekräftelse.
- Throttlen är i minnet och överlever inte flera serverinstanser. Allowlisten
  på två personer är det riktiga taket.
- Personliga adresser kan returneras (flaggade), och upp till 12 000 tecken
  sidtext går till Gemini. **Öppen fråga till Theodor/Juridisk koll:**
  mottagarnas personuppgifter (artikel 14: information om källa och rättslig
  grund) och om utkastets `gdprNotice` räcker. Formuleringen är medvetet
  återhållen ("jag använder ditt svar bara för att …") och lovar inte att inget
  sparas.
- Felmeddelandena är på svenska direkt i koden, som Registrets fel. De visas
  aldrig för användare rakt av (samma regel som `LegalAdvisorError`).
- Adaptern är inte körd mot riktiga Tavily/Gemini än (bara mockat). Opt-in-testet
  `adapters/live/OutreachPrep.live.test.ts` prövar bara Tavily-klienten.

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

**stub för sändning, byggd men grindad för förberedelsen.**
- `OutreachProvider` (`send`/`getStatuses`/`getCampaign`): avsiktligt avstängd,
  se "Sändspärr". Kräver dessutom Gmail OAuth och beslutet om `opened` (öppna
  frågor ovan) innan den ens får övervägas.
- `OutreachPrep` (mejlsökning och utkast): byggd, grindad, ingen liveyta, testad
  mot mockade tjänster. Exponering är spärrad till allowlisten.
- Demoadapterna är klara; `/demo/app/kunder` använder `OutreachProvider`.
