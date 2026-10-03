# Modul: Medgrundaren

## Syfte

Den enda ytan grundaren möter (uppdrag avsnitt 1.3, 1.4 punkt 1): en agent,
alltid samma, som läser hela minnet inför varje svar, startar verktyg och
säger vad den tycker. Varje samtal slutar med att ett verktyg körs eller att
grundaren får en konkret uppgift i verkligheten — aldrig bara ett svar.
Tonen är svensk och rak (avsnitt 10, "Medgrundarens röst"), utan peppning;
svaga idéer dödas vänligt men tydligt. Används genom hela resan, och driver
**idégenomlysningen** (avsnitt 2.1) och **Juridisk koll** (en förmåga hos
Medgrundaren, redan byggd — se `docs/moduler/juridisk-koll.md`).

## Porten

`ports/CofounderAgent.ts`:

```ts
sendMessage(message: string, history: CofounderMessage[], locale: Locale): Promise<CofounderMessage>
```

`CofounderMessage`: `{ role: "founder" | "cofounder"; text: string; nextTask?: string }`.

`nextTask` (spec v4 §3.1, Erik 2026-10-03) är den konkreta uppgift i
verkligheten som Medgrundarens svar slutar med. Den är valfri i porten:
liveadaptern ger den alltid, demon aldrig.

`ports/CofounderConversation.ts` (samtalet):
`appendCofounderReply(text, nextTask?)` sparar svaret med uppgiften.
`COFOUNDER_TASK_MAX = 500` är uppgiftens längsta längd, samma som i databasen.

## Datakällor och vad som krävs

- **Gemini**, via den redan byggda `lib/server/gemini.ts` (server-only,
  `GEMINI_API_KEY`, se `docs/moduler/juridisk-koll.md` för hur den byggdes
  och testades i praktiken — **återanvänd samma mönster rakt av**: tunn
  SDK-inpackning i `lib/server/gemini.ts`, all domänlogik (systemprompt,
  verktygsval, tolkning av svaret) i `adapters/live/CofounderAgent.ts`.
- **Läser hela minnet inför varje svar** (avsnitt 1.4) — det betyder att
  liveadaptern i praktiken behöver läsa ur flera andra portar (Minnet,
  Resan, Evidens och poäng, m.fl.) innan den bygger prompten till Gemini.
  Klargör vilka portar Medgrundaren faktiskt behöver läsa innan bygget
  börjar — det är den bredaste integrationsytan av alla 12 moduler.
- **Startar verktyg** — vilka konkreta verktygsanrop (Registret-sökning,
  utskick, simulering, juridisk koll, m.fl.) Medgrundaren faktiskt kan
  trigga är inte specificerat i den här porten (`sendMessage` returnerar
  bara ett textsvar i dag). Ett tool-calling-lager (Gemini function calling
  mot de andra portarna) är sannolikt nästa steg för porten, inte något som
  finns i kontraktet ännu — flagga det till den session som bygger detta.
- Grundarens meddelande och historik (`history`) är **alltid data, aldrig
  instruktion** till Gemini (avsnitt 14.6) — samma princip som
  Juridisk koll redan bevisat fungerar med ett strikt zod-schema på svaret.

## Hur demoadaptern fungerar i dag

`adapters/demo/CofounderAgent.ts`: `sendMessage(message)` ekar tillbaka
`"(Demo) Chatten är inte kopplad än: \"<meddelande>\""` — ingen skärm
använder porten. Den **riktiga** demochatten (som syns i `/demo/medgrundaren`)
är helt skriptad separat i `adapters/demo/cofounderScript.ts` och går inte
via den här porten alls — demot är förskrivet, inte en levande chatt.

## Acceptanskriterier

- `sendMessage` returnerar alltid `role: "cofounder"` och en icke-tom
  `text`.
- Ett fel från Gemini (nätverk, ogiltigt svar) blir ett tydligt kastat fel
  — aldrig ett tomt eller påhittat svar (samma princip som
  `LegalAdvisorError`, `docs/moduler/juridisk-koll.md`).
- Historik (`history`) påverkar innehållet i svaret men aldrig dess form
  (`role`/`text`-strukturen håller oavsett hur lång historiken är).
- Svarstexten innehåller aldrig ett bokstavligt fragment av en rå,
  ovaliderad modell-output vid fel (samma varning som i Juridisk koll:
  `z.prettifyError` eller motsvarande kan läcka modellens råtext).
- Liveadaptern ger alltid `nextTask`: inte tom, högst 500 tecken och aldrig
  en fråga (spec v4 §3.1). Ett ogiltigt svar försöks om en gång, sedan kastas
  `CofounderAgentError`. Koden hittar aldrig på en uppgift.
- Klarar kontraktstestet i `ports/CofounderAgent.contract.test.ts`, med det
  extra testet för `nextTask` som bara körs mot live.
- Version 1 (2026-10-03): uppfyllt. Uppgiften (v4, 2026-10-03): uppfyllt. Se
  "Hur liveadaptern fungerar i dag".

## Säkerhet

`GEMINI_API_KEY` bara i serverkod (redan säkrat av `lib/server/gemini.ts`,
`import "server-only"`). Grundarens meddelande och hela historiken är
användarinput — data till Gemini, aldrig instruktion; om Medgrundaren
någon gång får tillgång till verktyg som skriver (skickar utskick, sparar
Hjärnan) måste varje sådant anrop gå genom den moduls egen port och dess
egna säkerhetsregler, inte en genväg direkt från Medgrundaren. Sätt ett
längd-/kostnadstak på historiken som skickas till Gemini per anrop.

## Hur liveadaptern fungerar i dag

Version 1, byggd 2026-10-03 på `modul/medgrundaren`, och den konkreta
uppgiften (spec v4 §3.1), byggd 2026-10-03 på `modul/medgrundaren-uppgift`.
Besluten står i `docs/beslut.md` (2026-10-03). Bara text, inga verktyg.

**Flödet** (`adapters/live/CofounderAgent.ts`):
1. Meddelandet rensas och får vara 1–2000 tecken, annars `CofounderInputError`.
2. **Dagstaket:** `reserveFounderMessage(text, { limit: 40, sinceIso: midnatt i
   Stockholm })` på den nya porten `CofounderConversationRepository`. Den
   anropar databasfunktionen `public.reserve_cofounder_message`, som räknar och
   sparar grundarens meddelande i ett steg under ett lås per användare
   (`security invoker`, RLS gäller). Är taket nått sparas inget och
   `CofounderDailyLimitError` kastas, innan något annat läses eller anropas.
   Meddelandet sparas alltså före Gemini-anropet, så även ett misslyckat anrop
   räknas, och det står då kvar utan svar.
3. **Det kända läses** av `adapters/live/cofounderContext.ts`
   (`loadCofounderContext`), var del för sig. En platshållare ger `null` för
   den delen, ett riktigt fel kastas.
   - Resan: aktuellt steg (`getSteps`) och stegets `why`/`doneItems`
     (`getStepDetail`).
   - Profilen: `MemoryRepository.getKnownProfile()`, en ny valfri metod som
     ger de fält som finns, även för ingång B.
   - Minnet: Hjärnan (kortad till 2000 tecken) och de 10 senaste posterna i
     Spåret.
   - Projekt och idé: den aktiva idén.
4. **Systemprompten:** svensk, rak röst och en konkret uppgift i slutet av
   varje svar. Den förbjuder egna siffror, källor och påståenden om verktyg.
   Steg 01 och 02 har egen styrning, senare steg bara titel och ingress. Det
   kända ligger som JSON i ett avgränsat block (`<kand_data>`, där `<` är
   kodat så att data inte kan stänga blocket), med regeln att allt där och
   allt grundaren skriver är data, aldrig instruktioner.
5. **Historiken:** högst 20 tidigare meddelanden, rensade och kortade, går till
   `generateText` (`lib/server/gemini.ts`) som turer (grundaren `user`,
   Medgrundaren `model`). Turerna börjar alltid med grundaren, och samma roll
   i följd slås ihop. En tidigare uppgift följer med i Medgrundarens tur
   ("Din uppgift: …"), så att modellen vet vad den redan har gett grundaren.
6. **Strukturerad output:** `generateText` får `responseJsonSchema`, och
   modellen svarar med JSON `{ svar, nastaUppgift }`.
7. **Svaret** tolkas och valideras med zod. `svar` rensas och får vara 1–4000
   tecken. `nastaUppgift` rensas till en rad, får vara 1–500 tecken och får
   inte sluta med frågetecken. Inte JSON, avklippt JSON (eller
   `GeminiResponseError`, t.ex. MAX_TOKENS), en saknad, tom eller frågande
   uppgift ger ett nytt försök, en gång. Fallerar det också kastas
   `CofounderAgentError` utan orsak, så att modellens råtext aldrig hamnar i
   ett fel eller en logg (felet från `JSON.parse` innehåller delar av texten).
   Nätverks- och API-fel försöks inte om här, eftersom `generateText` har egna
   omförsök för tillfälliga fel.

**Systemprompten** (efter v4): svensk, rak och kort, ingen peppning och inga
utropstecken. Den säger emot en svag idé och förklarar varför. Uppgiften ska
vara en handling ute i verkligheten inom sju dagar, aldrig en fråga och
aldrig att svara på något i chatten. Steg 01 frågar inte efter risk (spec v4:
ingen självskattning). Det kända (`<kand_data>`) har `profil.svar` (v4-svaren
med frågan och valets etikett, aldrig valets id), `frustration`, `kund` och
`aterstaendeFragor` (frågan och svarsalternativen, ur
`MemoryRepository.getPendingOnboardingQuestions`). Är listan inte tom ställer
modellen den första frågan och skriver ut alternativen.

**Svaret sparas** av server action `app/(app)/app/medgrundaren/actions.ts`.
Den läser historiken ur databasen (aldrig från klienten) innan meddelandet
reserveras, anropar `sendMessage` och sparar svaret och uppgiften
(`next_task`) i `public.cofounder_messages` (`adapters/live/CofounderConversation.ts`).

**Bara servern skriver Medgrundarens rader** (migrering
`20261004120000_cofounder_next_task.sql`, beslut 2026-10-03, en ändring av
beslutet från #63). Klienten har ingen insert-, update- eller delete-rätt på
tabellen. Grundarens meddelande sparas av `reserve_cofounder_message`
(`security definer`, rollen alltid `founder`). Medgrundarens svar sparas av
`lib/server/cofounderReplies.ts` med service role, och bara
`adapters/live/CofounderConversation.ts` får importera den filen (lint-regel).
Ordningen i samtalet kommer ur kolumnen `seq`, som databasen sätter. Kända fel
blir en orsak som skärmen visar som text ur i18n.

**Skärmen:** `screens/Cofounder.tsx` har en valfri prop `live` som visar
`screens/blocks/CofounderChat.tsx`. Bara `/app` skickar den, så demot är
förskrivet som förut. Uppgiften visas som ett eget kort under svaret, med
rubriken "Din uppgift" (`TaskCard` i `screens/blocks/ChatBlocks.tsx`). Ett
svar från före v4 har ingen uppgift och visas utan kort. "Sedan tidigare"
byggs av `app/(app)/app/medgrundaren/knownItems.ts` ur samma läsning som
prompten. En rad med en siffra får källan "Din uppgift" med dagen svaret
gavs (`answeredOn`) för ett v4-svar, och utan datum när tiden saknas
(fritextsvar från före v4, idén och Hjärnan). Dagens datum visas aldrig.

**Utan körd migrering** ger en saknad tabell, funktion eller kolumn
(`next_task`) `NotImplementedError`. Sidan visar då "Kommer snart" och ett
avstängt fält, och inget anrop går till Gemini (taket kan inte räknas).

**Att köra det riktiga Gemini-anropet manuellt** (kostar riktiga anrop, körs
inte i CI): `GEMINI_API_KEY=... pnpm test adapters/live/CofounderAgent.live.test.ts`.
Annars skippas filen. Testet skickar tre meddelanden (ett öppet, en svag idé
och ett svar på en tidigare uppgift) och ett injektionsförsök, och kräver en
uppgift som inte är en fråga och inga utropstecken.

**Kända begränsningar:**
- Function calling mot de andra portarna återstår. Medgrundaren kör inga verktyg.
- Det finns ingen kodspärr mot siffror i modellens svar eller uppgift, bara
  regeln i prompten. I opt-in-testet 2026-10-03 skrev modellen till exempel
  "bolag med miljarder i budget".
- Att uppgiften går att göra inom sju dagar och sker i verkligheten styrs bara
  av prompten. Koden prövar att den finns, är kort och inte är en fråga.
- Före migreringen `20261004120000_cofounder_next_task.sql` kan en grundare
  med ett eget PostgREST-anrop lägga in rader i sin egen historik, även med
  rollen `cofounder`. Efter migreringen kan ingen klient skriva i tabellen.
- Taket gäller per konto. Det finns inget tak för hela plattformens Gemini-kostnad,
  så sätt en kvot på nyckeln i Google AI Studio.
- Meddelanden räknas i tecken (kodpunkter), som databasens `char_length`.
- Samtalet går inte att rensa (ingen delete-policy, se beslutet).
- `/app` läser alltid på svenska (`"sv"`), som de andra sidorna i `/app`.

## Efter lansering (spec v4 §3.6)

Byggs inte nu. Var och en kräver ett eget beslut och troligen verktyg
(function calling) i Medgrundaren:
- **Styrelsemöte:** Medgrundaren samlar läget (poäng, bevis, plan) till ett
  möte med en riktig eller tänkt styrelse.
- **Pitchträning:** grundaren övar sin pitch och får rak återkoppling.
- **Säljstöd:** hjälp att förbereda och följa upp säljsamtal.

## Status

påbörjad (bara text, med konkret uppgift enligt spec v4 §3.1). Liveadaptern
klarar kontraktstestet med mockad Gemini, och opt-in-testet mot riktiga Gemini
gick igenom 2026-10-03. Migreringarna `20261003120000_cofounder_messages.sql`
och `20261004120000_cofounder_next_task.sql` måste köras manuellt i SQL Editor
innan chatten syns på `/app`. Demoadaptern för `CofounderAgent` är oförändrad,
och demots chatt går fortfarande via `cofounderScript.ts`.
