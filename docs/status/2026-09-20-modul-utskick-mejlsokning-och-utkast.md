## Modul: Utskick — mejlsökning och utkast (klar, grindad, branch `modul/utskick`)

Byggd enligt planner-agentens plan, godkänd av grundaren innan kod skrevs.
**Ingen riktig e-post kan skickas** och ingen kan skickas i kommande sessioner
heller utan uttryckligt ja från Theodor och grundaren.

### Klart
- **Ny port `ports/OutreachPrep.ts`** (`suggestEmail`, `draftMessage`), separat från `OutreachProvider` så att den strukturellt saknar `send`. Demoadapter (`.example`-adresser, RFC 2606) och liveadapter (`adapters/live/OutreachPrep.ts`). Ingen route eller skärm använder den, ingenting lagras.
- **Mejlsökning:** ett Tavily-anrop, ett Gemini-anrop. Modellens adress måste stå ordagrant i texten som skickades, ha ren syntax, och **adressens domän måste bära bolagets namn** (`core/emailVerification.ts`, strikt likhet, hårda avslag). Källan injiceras i kod; Gemini-schemat är `.strict()` och saknar käll-/url-fält. Nonce-avgränsade databloc för företagsnamn och sidtext.
- **Utkast:** mallbaserat ur i18n (`outreachDraft`, sv+en), `core/outreachDraft.ts`. Inte modellskrivet.
- **Grind** (`lib/server/outreachAccess.ts`): `OUTREACH_LIVE_ENABLED` exakt `true` **och** användaren i `OUTREACH_ALLOWED_USER_IDS`, första sats i båda metoderna, `OutreachLockedError` (visas som ComingSoon). Throttle 10/timme, 30/dygn per användare (i minnet).
- **Sändspärr:** `liveOutreachProvider.send/getStatuses/getCampaign` kastar `OutreachSendDisabledError` (ärver `NotImplementedError` bara för att bevara kontrakts- och stubtester). **`send()` tar nu `ConfirmedOutreach[]`**, en typ med `unique symbol`-brand som ingen kod kan skapa: ett förslag eller utkast kan inte matas in (kompileringsfel). Ingen konstruktör finns. Ändrad signatur på en befintlig port (`OutreachRecipient` borttagen, ingen anropade `send`).
- **`lib/server/tavily.ts`** är nu en riktig klient: fast URL (ingen SSRF), 10 s timeout, max 5 resultat × 20 000 tecken, resultat med http/`javascript:`/userinfo-URL kastas bort, ingen `cause` i fel. Webbresearch/Pulsen-adaptrarna är fortfarande stubbar.
- **Fyra CI-vakter** (alla verifierade röda vid försvagning): G1 `ports/stubStatus.test.ts` (beteende), G2 `adapters/live/outreachGate.guard.test.ts` (grind först, importkälla, bara godkända Tavily-användare), G3 `lib/server/noMailer.guard.test.ts` + ESLint (inga mejlpaket, alias, sändningsändpunkter), G4 `ports/outreachConfirmation.guard.test.ts` (ingen skapar/casta:r `ConfirmedOutreach`; kör dessutom `tsc` på filen så typskydden prövas i vitest). `test/repoFiles.ts` är gemensam filsökning.
- `.env.example`: `OUTREACH_LIVE_ENABLED`, `OUTREACH_ALLOWED_USER_IDS` (utan värden). ESLint: `no-restricted-imports` mot mejlpaket, sammanslagen med demoguarden (flat config ersätter regler, slår inte ihop dem).
- `core/text.ts`: `cleanText` flyttad hit och delad med Registret (ingen beteendeändring).
- **Granskat:** code-reviewer (0 CRITICAL, 3 HIGH, 6 MEDIUM) och security-reviewer (0 CRITICAL, 3 MEDIUM). Åtgärdat: domänkopplingen (sidans domän räknas inte längre, suffix/delade värdar/fria mejl, strikt namnlikhet), URL-validering, Unicode före adress, etikettsyntax, företagsnamnet i eget databloc, `cause` borttagen, käll-URL i utkast, typvakten (nu `tsc`), vakternas bredd (G2/G3, `sourceFiles`). Kvar och dokumenterat i moduldokumentet: brandet är bara kompileringstid, textbaserade vakter, in-memory-throttle, GDPR art. 14.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

### Beslut nästa session behöver känna till
- **Sändning är en egen uppgift** som inte påbörjas utan uttryckligt ja från Theodor och grundaren. Då: exakt en konstruktör av `ConfirmedOutreach` i `ports/outreachConfirmation.ts`, **och** en körningskontroll i `send` (typen ensam räcker inte, se moduldokumentet). Gmail OAuth och beslutet om `opened` är fortfarande öppna.
- **Ingen liveyta finns.** En framtida skärm/route måste gå via porten och visa `searchedUrl` och `källa.url` så att grundaren ser var adressen kom från innan hen bekräftar.
- **Nya användare av `lib/server/tavily.ts`** (Webbresearch, Pulsen) måste läggas till i G2:s lista, medvetet.
- **`OUTREACH_ALLOWED_USER_IDS`** (Erik och Theodor) sätts bara i `.env.local`.

### Kända problem / medvetna begränsningar
- Adaptern är aldrig körd mot riktiga Tavily/Gemini (bara mockat); opt-in-testet prövar bara Tavily-klienten. Gör en riktig provkörning (utan sändning) innan modulen exponeras.
- Bolag vars domän inte bär namnet avvisas; grundaren söker då manuellt.
- Öppen fråga till Theodor/Juridisk koll: GDPR artikel 14 för mottagarnas personuppgifter och om utkastets `gdprNotice` räcker.
- Detaljer: `docs/moduler/utskick-och-svar.md`, "Kända begränsningar".
