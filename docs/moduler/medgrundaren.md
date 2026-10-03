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

`CofounderMessage`: `{ role: "founder" | "cofounder"; text: string }`.

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
- Klarar kontraktstestet i `ports/CofounderAgent.contract.test.ts`.
- Version 1 (2026-10-03): uppfyllt, se "Hur liveadaptern fungerar i dag".

## Säkerhet

`GEMINI_API_KEY` bara i serverkod (redan säkrat av `lib/server/gemini.ts`,
`import "server-only"`). Grundarens meddelande och hela historiken är
användarinput — data till Gemini, aldrig instruktion; om Medgrundaren
någon gång får tillgång till verktyg som skriver (skickar utskick, sparar
Hjärnan) måste varje sådant anrop gå genom den moduls egen port och dess
egna säkerhetsregler, inte en genväg direkt från Medgrundaren. Sätt ett
längd-/kostnadstak på historiken som skickas till Gemini per anrop.

## Hur liveadaptern fungerar i dag

Version 1, byggd 2026-10-03 på `modul/medgrundaren`. Besluten står i
`docs/beslut.md` (2026-10-03). Bara text, inga verktyg.

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
   i följd slås ihop.
6. **Svaret** rensas och valideras med zod (icke-tomt, högst 4000 tecken).
   Varje fel blir `CofounderAgentError` med ett fast meddelande, aldrig
   modellens råtext.

**Svaret sparas** av server action `app/(app)/app/medgrundaren/actions.ts`.
Den läser historiken ur databasen (aldrig från klienten) innan meddelandet
reserveras, anropar `sendMessage` och sparar svaret i
`public.cofounder_messages` (`adapters/live/CofounderConversation.ts`).
Ordningen i samtalet kommer ur kolumnen `seq`, som databasen sätter. Kända fel
blir en orsak som skärmen visar som text ur i18n.

**Skärmen:** `screens/Cofounder.tsx` har en valfri prop `live` som visar
`screens/blocks/CofounderChat.tsx`. Bara `/app` skickar den, så demot är
förskrivet som förut. "Sedan tidigare" byggs av
`app/(app)/app/medgrundaren/knownItems.ts` ur samma läsning som prompten. En
rad med en siffra får källan "Din uppgift".

**Utan körd migrering** ger en saknad tabell `NotImplementedError`. Sidan visar
då "Kommer snart" och ett avstängt fält, och inget anrop går till Gemini
(taket kan inte räknas).

**Att köra det riktiga Gemini-anropet manuellt** (kostar riktiga anrop, körs
inte i CI): `GEMINI_API_KEY=... pnpm test adapters/live/CofounderAgent.live.test.ts`.
Annars skippas filen.

**Kända begränsningar:**
- Function calling mot de andra portarna återstår. Medgrundaren kör inga verktyg.
- Det finns ingen kodspärr mot siffror i modellens svar, bara regeln i prompten.
- En grundare kan med ett eget PostgREST-anrop lägga in rader i sin egen
  historik, även med rollen `cofounder`. Det påverkar bara den egna sessionen
  och kan inte sänka den egna räkningen.
- Taket gäller per konto. Det finns inget tak för hela plattformens Gemini-kostnad,
  så sätt en kvot på nyckeln i Google AI Studio.
- Meddelanden räknas i tecken (kodpunkter), som databasens `char_length`.
- Samtalet går inte att rensa (ingen delete-policy, se beslutet).
- `/app` läser alltid på svenska (`"sv"`), som de andra sidorna i `/app`.

## Status

påbörjad (v1, bara text). Liveadaptern klarar kontraktstestet med mockad
Gemini. Migreringen `20261003120000_cofounder_messages.sql` måste köras
manuellt i SQL Editor innan chatten syns på `/app`. Demoadaptern för
`CofounderAgent` är oförändrad, och demots chatt går fortfarande via
`cofounderScript.ts`.
