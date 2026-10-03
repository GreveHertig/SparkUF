## Medgrundaren, version 1: liveadaptern (bara text) (2026-10-03, gren `modul/medgrundaren`, PR mot `prototyp`)

Uppdrag från Bruno. Besluten står i `docs/beslut.md` (2026-10-03), och hur det fungerar står i `docs/moduler/medgrundaren.md` ("Hur liveadaptern fungerar i dag").

### Klart
- **Migrering** `supabase/migrations/20261003120000_cofounder_messages.sql`:
  - tabellen `public.cofounder_messages` med RLS, där grundaren bara kan läsa och skriva sina egna rader, utan update och delete
  - kolumnen `seq` för ordningen
  - funktionen `public.reserve_cofounder_message` (`security invoker`, lås per användare) som håller dagstaket
  - prövad i PGlite (`cofounderMessages.pg.test.ts`)
  - ingen service role
- **Ny port** `ports/CofounderConversation.ts` med demo- och liveadapter och ett kontraktstest.
- **`adapters/live/CofounderAgent.ts`:**
  - Gemini via den nya `generateText` i `lib/server/gemini.ts`
  - det kända läses av `adapters/live/cofounderContext.ts`: Resan, Profilen, Minnet och den aktiva idén
  - egen styrning för steg 01 och 02
  - taken 20 och 40
  - felen `CofounderAgentError`, `CofounderDailyLimitError` och `CofounderInputError`, utan modellens råtext
- **`MemoryRepository.getKnownProfile()`:** ny valfri metod med de profilfält som finns, även för ingång B.
- **`/app/medgrundaren`:**
  - server action `actions.ts`
  - en levande chatt (`screens/blocks/CofounderChat.tsx`) via en valfri prop `live` på `screens/Cofounder.tsx`
  - "Sedan tidigare" ur samma läsning som prompten (`knownItems.ts`), där en siffra får källan "Din uppgift"
  - demot är oförändrat (förskrivet, avstängt fält)
- **Övrigt:**
  - `textHasFigure` är flyttad från `app/demo/_lib/figures.ts` till `core/figures.ts`, så att `/app` kan använda den
  - `core/stockholmDay.ts` (midnatt i Stockholm, med sommartid)
  - `cleanMultilineText` och `charLength`
  - `test/stubs/supabaseFake.ts` har fått `gte` och identitetskolumner
- **Liten CSS-ändring i `design/site.css`:**
  - radbrytningar i chattbubblor (`white-space: pre-line`)
  - `cursor: not-allowed` bara när promptfältet är avstängt
  - felraden `.fdd-prompt__error`
- **Tester i tre lager:**
  - kontraktstestet körs nu mot liveadaptern med mockad Gemini
  - enhetstester med mockad modell
  - opt-in `adapters/live/CofounderAgent.live.test.ts` (`GEMINI_API_KEY=... pnpm test adapters/live/CofounderAgent.live.test.ts`)
  - Medgrundaren är borttagen ur `STILL_STUBS`
- **Granskning:** security-reviewer och code-reviewer hittade inga CRITICAL- eller HIGH-fynd. Deras MEDIUM-fynd var att taket gick att kringgå med samtidiga anrop och att misslyckade anrop inte räknades. Det är rättat med databasfunktionen och reservationen före Gemini. Övriga fynd som är rättade:
  - ordningen kom från en tid som klienten kunde sätta (nu `seq`)
  - längden räknades i olika enheter (nu tecken överallt)
  - fokus försvann efter att ett meddelande skickats
- **Kontroll:**
  - `pnpm typecheck` och `pnpm build` gick igenom
  - `pnpm lint` gav 0 fel och 3 gamla varningar i `design-referens/`
  - `pnpm test` gav 1328 gröna och 42 skippade

### Återstår
- **Migreringen måste köras manuellt** i SQL Editor (SparkUF2). Tills dess visar `/app/medgrundaren` "Kommer snart" och ett avstängt fält.
- **Opt-in-testet mot riktiga Gemini är inte kört** i den här sessionen, eftersom det inte fanns någon nyckel i miljön.
- **Function calling** (verktyg mot de andra portarna) tas i en senare session.
- **Klickgenomgång i webbläsaren** är inte gjord: det finns ingen Playwright-webbläsare i miljön. Gör den med `/klicka-igenom` när webbläsaren finns.
- **Lägg till kolumnen och funktionen i `adapters/live/rls.live.test.ts`** (mot ett riktigt projekt) när migreringen är körd.

### Kända problem
- **Ingen kodspärr mot siffror i modellens svar.** Det finns bara regeln i prompten (Brunos val). En siffra kan slinka igenom utan källa.
- **Taket gäller per konto.** Det finns inget tak för hela plattformen. Sätt en kvot på Gemini-nyckeln.
- **Grundaren kan skriva i sin egen historik.** Med ett eget PostgREST-anrop går det att lägga in rader, även med rollen `cofounder`. Det påverkar bara den egna sessionen.
- **Ett misslyckat Gemini-anrop räknas mot taket**, och meddelandet står kvar utan svar.
- **`/app` läser alltid på svenska**, som de andra sidorna.

### Beslut
- Se `docs/beslut.md`, 2026-10-03. I korthet:
  - bara text
  - steg 01 och 02 har egen styrning, och senare steg svarar ändå
  - Gemini via `gemini.ts`
  - en egen tabell med RLS och utan service role
  - taken 20 och 40, hållna av databasen
  - siffror förbjuds i prompten
  - den valfria `getKnownProfile` i Minnet
- **`docs/status.md` är inte ändrad.** CLAUDE.md säger att den bara är ett index, så den här filen ersätter "uppdatera status.md" i uppdraget.
