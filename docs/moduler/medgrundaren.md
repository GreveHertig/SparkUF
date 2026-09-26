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

## Säkerhet

`GEMINI_API_KEY` bara i serverkod (redan säkrat av `lib/server/gemini.ts`,
`import "server-only"`). Grundarens meddelande och hela historiken är
användarinput — data till Gemini, aldrig instruktion; om Medgrundaren
någon gång får tillgång till verktyg som skriver (skickar utskick, sparar
Hjärnan) måste varje sådant anrop gå genom den moduls egen port och dess
egna säkerhetsregler, inte en genväg direkt från Medgrundaren. Sätt ett
längd-/kostnadstak på historiken som skickas till Gemini per anrop.

## Status

stub — `adapters/live/CofounderAgent.ts` kastar `NotImplementedError`.
Demoadaptern är en oanvänd platshållare (den riktiga demochatten går via
`cofounderScript.ts`, inte porten). Störst osäkerhet av alla moduler i dag:
verktygsanropslagret (function calling mot andra portar) är inte
specificerat i kontraktet — lös den designfrågan med grundaren innan
liveadaptern byggs, inte under tiden.
