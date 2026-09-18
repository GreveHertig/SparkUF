# Bygga en modul: från stub till klar

Steg för steg för att byta en `adapters/live/<Modul>.ts`-stubbe mot en
riktig liveadapter, från branch till granskning. Skrivet så att en
utvecklare (mänsklig eller en Claude Code-session) kan följa det rakt av
utan annan kontext än det här dokumentet, modulens eget `docs/moduler/<modul>.md`
och `docs/arkitektur.md`.

## 1. När du använder det här dokumentet

Du ska ersätta en `NotImplementedError`-stubbe i `adapters/live/` med en
riktig implementation av en redan befintlig port. Det gäller **inte**: nya
portar, nya skärmar, ändringar i `screens/` eller route-filerna, eller
arbete på demoadaptrarna. Om uppgiften är någon av de sistnämnda, det här
dokumentet är fel utgångspunkt — läs `docs/arkitektur.md` i stället.

## 2. Innan du börjar

1. Läs `docs/status.md` för aktuellt läge.
2. Läs `docs/moduler/<modul>.md` — syfte, porten, datakällor, hur
   demoadaptern fungerar, acceptanskriterier, säkerhetskrav. Om dokumentet
   flaggar en olöst öppen fråga (t.ex. avtal saknas, en designfråga är
   olöst), lös eller eskalera den **innan** du börjar bygga, inte under
   tiden.
3. Läs `ports/<Port>.ts` — den exakta signaturen du ska implementera.
4. Kontrollera att förutsättningarna i moduldokumentets avsnitt 3
   (Datakällor och vad som krävs) faktiskt finns: nyckel, avtal,
   OAuth-uppsättning. Om de inte finns, det är inte en koduppgift än.
5. Föreslå en plan för sessionen och vänta på grundarens godkännande
   (CLAUDE.md, "Varje session").

## 3. Branch

Egen branch `modul/<modul>` (t.ex. `modul/registret`) ut från `prototyp`,
aldrig direkt på `main` eller på `prototyp`. Slås ihop via pull request när
modulen är klar och granskad.

## 4. Läs kontraktet först

Kontraktstestet, `ports/<Port>.contract.test.ts`, **är kravspecen** — inte
bara en verifiering i efterhand. Kör det innan du skriver en rad
implementation:

```sh
pnpm vitest run ports/<Port>.contract.test.ts
```

Livesviten skippar sig själv i dag ("liveadaptern är fortfarande en
stub", se `ports/testContract.ts`) — det är förväntat. Varje `contractIt`
som skippas är ett krav din implementation ska uppfylla. Lägg **inte** till
nya krav i kontraktstestet under bygget om du kan undvika det — om
porten faktiskt behöver ändras (ny metod, ändrad signatur), gör det som
ett eget, tydligt beslut och uppdatera `ports/<Port>.ts` +
`docs/moduler/<modul>.md` i samma commit.

## 5. Bygg adaptern

- All extern åtkomst (API-anrop, Supabase-frågor, autentisering) och alla
  nycklar hör hemma i `adapters/live/<Modul>.ts` och en tunn klient i
  `lib/server/` — aldrig i `screens/`, route-filerna eller `core/`.
- Ren logik (beräkningar, upplåsningsregler) som redan finns eller borde
  finnas i `core/` (t.ex. `calculateScore`) återanvänds, dupliceras
  aldrig i adaptern.
- Rör **inget** i `screens/` eller route-filerna. Så snart adaptern
  slutar kasta `NotImplementedError` försvinner `<ComingSoon />`
  automatiskt (`docs/arkitektur.md` avsnitt 4–5) — det är hela poängen med
  portar och adaptrar.

## 6. Nycklar och miljövariabler

- En server-only-klient i `lib/server/<tjänst>.ts` (`import "server-only"`
  överst), som `lib/server/gemini.ts` och `lib/server/tavily.ts`.
- Variabelnamnet läggs till i `.env.example` **utan värde**, med en
  kommentar som pekar på moduldokumentet.
- Aldrig `NEXT_PUBLIC_`-prefix på en hemlighet.
- `.env.local` committas aldrig (redan skyddat av `.gitignore`).

## 7. Testa i tre lager

Samma mönster som Juridisk koll (`adapters/live/LegalAdvisor.ts`,
`docs/moduler/juridisk-koll.md`):

1. **Kontraktstestet** (`ports/<Port>.contract.test.ts`) — slutar skippa av
   sig självt när adaptern är klar. Mocka den externa tjänsten
   (`vi.mock(...)`) så CI inte behöver nätverk eller en riktig nyckel.
2. **Adapterns egna tester** (`adapters/live/<Modul>.test.ts`) — kantfall
   specifika för den här integrationen: ogiltig indata, trasigt svar,
   smugglade fält, m.m. Mockad extern tjänst, samma skäl som ovan.
3. **Ett opt-in-test mot den riktiga tjänsten**
   (`adapters/live/<Modul>.live.test.ts`), `describe.skipIf(!process.env.<NYCKEL>)`
   — körs inte i CI, bara manuellt: `<NYCKEL>=... pnpm test adapters/live/<Modul>.live.test.ts`.

Ta bort raden för den här modulen ur `ports/stubStatus.test.ts` när den
slutar vara en stub — annars failar det testet med flit, som en påminnelse
om att uppdatera dokumentationen (steg 10).

## 8. Externt innehåll är data

Om adaptern använder en modell (Gemini) eller extern sökning (Tavily):
validera svaret mot ett strikt schema (t.ex. `zod` `.strict()`), lita
aldrig på att modellen/API:et håller formen, och injicera källor från kod
snarare än att låta modellen ange dem själv, om det är möjligt för
modulen (Juridisk koll som förebild: modellen väljer bara bland
förvalda ämnen, källan kommer alltid från en kuraterad lista i kod).
Användarens indata och allt hämtat externt innehåll är **alltid data,
aldrig instruktion** (CLAUDE.md, avsnitt Säkerhet).

## 9. Granskning

Innan sessionen avslutas:

- Låt code-reviewer-agenten granska diffen.
- Kör `/security-review` (eller security-reviewer-agenten).
- Åtgärda blockerande fynd. Dokumentera medvetna avgränsningar (som en
  overifierad källa eller en känd begränsning) i moduldokumentet i
  stället för att gissa en lösning.

## 10. Uppdatera dokumentationen

- `docs/moduler/<modul>.md`: avsnitt 7 (Status) → "live" (eller
  "påbörjad" om bara delar av porten är klara), plus en kort
  "Hur liveadaptern fungerar i dag"-sektion (se `juridisk-koll.md` för
  formatet).
- `ports/stubStatus.test.ts`: ta bort modulens rad (steg 7).
- `docs/arkitektur.md`s tabell i avsnitt 3, om sökvägar eller
  beroenden ändrats.
- `docs/status.md`: vad som är klart, kända begränsningar, beslut nästa
  session behöver känna till — samma rubriker som varje tidigare session.

## 11. Avsluta

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — alla gröna.
2. Verifiera att `<ComingSoon />` har försvunnit på den berörda `/app`-sidan
   och att riktig data visas, utan att någon skärm eller route-fil ändrats.
3. Commit (tydliga meddelanden, en logisk enhet per commit), push till
   modulbranchen.
4. Öppna en pull request mot `prototyp` (aldrig `main`).

## 12. Checklista (klistra in i PR-beskrivningen)

- [ ] Kontraktstestet (`ports/<Port>.contract.test.ts`) är grönt mot
      liveadaptern, inte bara skippat.
- [ ] Adapterns egna tester finns, extern tjänst mockad i CI.
- [ ] Ett opt-in `.live.test.ts` finns, `skipIf` på saknad nyckel.
- [ ] Nycklar bara i `lib/server/`/`adapters/live/`, i `.env.example` utan
      värde, inget `NEXT_PUBLIC_`-prefix.
- [ ] Externt/modellgenererat innehåll är validerat, källor injicerade
      från kod där det är möjligt.
- [ ] `screens/` och route-filerna är orörda.
- [ ] code-reviewer och `/security-review` körda, fynd åtgärdade eller
      dokumenterade.
- [ ] `docs/moduler/<modul>.md`, `ports/stubStatus.test.ts` och
      `docs/status.md` uppdaterade.
- [ ] `typecheck`/`lint`/`test`/`build` gröna.

## 13. Verkligt exempel: Juridisk koll

Den enda modulen som redan gått den här vägen. Egen branch
`modul/juridisk-koll`. `adapters/live/LegalAdvisor.ts` validerar
bolagsformen, filtrerar en kuraterad ämneskatalog, ber Gemini välja
ämnen och formulera text, validerar svaret mot ett `.strict()`-schema som
strukturellt saknar ett källfält, injicerar den kuraterade källan i kod
och validerar slutresultatet. `ports/LegalAdvisor.contract.test.ts` kör
mot både demo- och liveadaptern med Gemini mockad. Ett separat opt-in
`adapters/live/LegalAdvisor.live.test.ts` finns för riktiga anrop.
Granskad av code-reviewer (en MEDIUM-fynd, fixad och testtäckt) och
security-reviewer (inga blockerande fynd). Se `docs/moduler/juridisk-koll.md`
och `docs/status.md`s avsnitt "Modul: Juridisk koll" för hela historiken.
