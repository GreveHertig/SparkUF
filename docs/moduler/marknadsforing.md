# Modul: Marknadsföring

> Föreslagen av Kingen (marknad och försäljning), godkänd av grundaren
> 2026-09-26. Demosidan är byggd; liveadaptern är en stubbe. De öppna
> frågorna längst ned gäller liveadaptern och priset, inte demot.

## Syfte

En **ny, fristående modul** som hjälper grundaren att marknadsföra sitt
företag. Den ändrar ingen befintlig modul eller något steg i resan, utan
läggs till bredvid dem. Den **används i steg 11 (Första kunderna)**, på samma
sätt som Juridisk koll används i steg 05 och 09: steget länkar till modulen,
men stegets innehåll ändras inte. Modulen låses upp i steg 11 och finns kvar
som egen sida i menyn efteråt. Den har nytta av bevisen
från tidigare steg (kundprofil i steg 04, svar och citat i steg 05, domen i
steg 06, pris i steg 07). Den vanligaste frågan efter lansering är "hur
hittar jag kunder?", och den besvaras i dag av generiska råd.

Modulen gör marknadsföringen **med** grundaren, inte **åt** hen: Spark
föreslår, skriver utkast och följer upp, men grundaren publicerar själv.
Samma princip som resten av Spark: allt bygger på grundarens egna bevis,
aldrig på påhittade påståenden.

Skillnad mot **Marknad** (`/demo/marknad`, steg 03): Marknad *analyserar*
marknaden (storlek, konkurrenter, simulering). Marknadsföring *når ut* till
den. Olika namn, olika sidor, ingen överlappande logik.

## Delsteg

1. **Budskapet.** Ett huvudbudskap och två till tre stödbudskap, skrivna ur
   kundernas egna ord från steg 05 (citaten), inte ur en mall. Varje budskap
   pekar på det bevis det bygger på.
2. **Kanalerna.** Högst två kanaler att börja med, valda ur kundprofilen
   (steg 04): var kunden faktiskt finns. Svenska kanaler först (LinkedIn,
   branschforum, Nyföretagarcentrum, lokala nätverk, mässor, uppdrag 1.5).
   Motivering per kanal, och vilka kanaler Spark avråder från och varför.
3. **30-dagarsplanen.** Konkreta aktiviteter vecka för vecka, i den takt
   grundarens tid tillåter (profilen, steg 01).
4. **Utkasten.** Färdiga texter per aktivitet: inlägg, profiltext, kort
   presentation, uppföljningsmejl. Grundaren redigerar och publicerar själv.
5. **Uppföljningen.** Grundaren rapporterar in utfall (visningar, svar,
   möten, kunder). Spark säger vad som fungerar, vad som ska bort och vad
   nästa vecka ska innehålla.

Steg 11 (Första kunderna) behåller sin definition i uppdrag 1.5.
Marknadsföring är verktyget grundaren använder för att genomföra steget, och
kan fortsätta använda efter det.

Varje delsteg slutar med en konkret uppgift i verkligheten, som i
Medgrundaren (`docs/moduler/medgrundaren.md`), aldrig bara ett svar.

## Porten

`ports/MarketingProvider.ts`:

```ts
getPlan(locale: Locale): Promise<MarketingPlan>
draftContent(activityId: string, locale: Locale): Promise<ContentDraft>
reportOutcome(activityId: string, outcome: MarketingOutcome): Promise<void>
```

- `MarketingPlan`: `{ headline, supporting, channels, weeks }`. Varje
  `MarketingMessage` bär en `source: Källa` och, när det finns, kundens
  eget citat (`quote`). Varje `ChannelChoice` har `verdict`
  (`"recommended" | "notNow"`) och en motivering.
- `MarketingWeek.outcome` finns när grundaren rapporterat veckan, med
  `source: Källa` och Sparks läsning (`takeaway`).
- `ContentDraft`: `{ activityId, channelId, text, basedOn: Källa[] }`,
  alltid ett utkast, aldrig publicerat.
- Okänt aktivitets-id ger `UnknownMarketingActivityError`.

Kontraktstestet `ports/MarketingProvider.contract.test.ts` är kravspecen:
budskap med källa, högst två rekommenderade kanaler, aktiviteter som hör
till en kanal, utkast med minst ett bevis, och felet för okänd aktivitet.

## Datakällor och vad som krävs

- **Gemini**, via befintliga `lib/server/gemini.ts`. Ingen ny nyckel.
  Samma mönster som Juridisk koll: strikt zod-schema på svaret.
- **Läser andra portar**, skriver inte i dem: `ProjectRepository` (idén),
  `JourneyRepository` (var grundaren är), `OutreachProvider` (citaten ur
  steg 05), `VerdictProvider` (domen), profilen (tid och kompetens).
- **Tavily** (valfritt, senare), via befintliga `lib/server/tavily.ts`, för
  att hitta konkreta svenska nätverk, forum och evenemang i branschen.
- **Supabase**, en ny tabell för planen och utfallen (migrering skrivs när
  porten är godkänd).
- Ingen publicering till externa tjänster i första versionen. Koppling till
  schemaläggningsverktyg (t.ex. Buffer) är ett eget, senare beslut.

## Hur demoadaptern fungerar

`adapters/demo/MarketingProvider.ts`, Saras scenario (Kvittojakten).
Budskapen bygger på citaten i `adapters/demo/OutreachProvider.ts` och på
Saras steg 04, 05, 07 och 08. Utfallen visas successivt: inga i
`11-forsta-kunderna-fore`, veckorna 1–2 i `-korning`, alla fyra i `-efter`.
`reportOutcome` sparar inget i demot.

Sidan `/demo/marknadsforing` (`app/demo/(app)/marknadsforing/page.tsx`) har
en egen flik i demomenyn och är låst tills Sara når steg 11 ("Låses upp
efter steg 10"). Påhittad data märks "Exempel med påhittad data". `/app`
har ingen sida för modulen än.

## Acceptanskriterier

- Varje budskap och varje utkast pekar på minst ett bevis (citat, siffra,
  domen). Inget budskap utan källa.
- Spark hittar aldrig på kundcitat, siffror, kundlogotyper eller omdömen i
  utkasten. Saknas bevis säger Spark det.
- Högst två startkanaler, var och en med motivering.
- Utkast publiceras aldrig automatiskt.
- Ett fel från Gemini blir ett tydligt kastat fel, aldrig ett tomt eller
  påhittat svar (som `LegalAdvisorError`).
- Svenska och engelska via `i18n/`, som resten av demot.

## Säkerhet och juridik

- Grundarens indata och allt hämtat externt innehåll är data, aldrig
  instruktion (CLAUDE.md, avsnitt Säkerhet).
- `GEMINI_API_KEY`/`TAVILY_API_KEY` bara i serverkod, redan säkrat.
- Marknadsföringslagen: utkast får inte innehålla vilseledande påståenden.
  Juridisk koll täcker redan regler för e-postmarknadsföring (steg 05) och
  kan utökas med ett ämne för marknadsföring i sociala medier.
- Kostnadstak per användare på antalet Gemini-anrop.

## Öppna frågor till grundaren

1. **Plats i appen:** används i steg 11 och egen post i sidomenyn, upplåst
   från steg 11?
2. **Prisnivå:** ingår i Grundare (199 kr/mån) eller en högre nivå?
3. **B2C-kanaler:** Samtalen (steg 05) är bara B2B. Ska Marknadsföring också
   stödja konsumentkanaler som Instagram och TikTok?
4. **Namnet:** "Marknadsföring" för att inte krocka med "Marknad"?
5. **Ordning:** demosidan först, liveadaptern efter godkänd port?

## Status

påbörjad — port, demoadapter, demosida och kontraktstest byggda.
`adapters/live/MarketingProvider.ts` kastar `NotImplementedError` (står i
`ports/stubStatus.test.ts`).
