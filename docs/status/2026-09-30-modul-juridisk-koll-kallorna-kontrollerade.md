## Modul: Juridisk koll — källorna kontrollerade (klar 2026-09-30, gren `modul/juridisk-koll-kallor`)

**Rekonstruerad vid sammanslagningen till `design/pr2-skalet` 2026-09-30** — det här avsnittet (rubrik + hela innehållet) saknades helt i `origin/prototyp`s version av filen: commit `91be3ef` ("Delningsbild och sidtitel för länkförhandsvisning") skrev över hela sektionen i stället för att lägga till sin egen efter den, en riktig dataförlust på `prototyp` (inte bara en mergekonflikt). Återställt här från `design/pr2-skalet`s egen historik, som hade sektionen intakt. Flaggat i rapporten till grundaren — samma bugg som `.gitattributes`s `merge=union`-rad (se den filen) är till för att förhindra framöver.

### Klart
- **Källorna från Bolagsverket, verksamt.se och Bokföringsnämnden är nu kontrollerade av en människa** (i webbläsaren 2026-09-30). Hela kontrollistan med adresser står som verifieringslogg i `docs/moduler/juridisk-koll.md`. **Ingenting är juristgranskat.**
- `adapters/live/legalSources.ts`:
  - En källa per undersida i stället för startsidor för Bolagsverket, verksamt.se och BFN, `hämtad: "2026-09-30"`. Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen är oförändrade (2026-09-17, startsidor).
  - De två DELVIS-punkterna har nya texter: `aktiekapital` (minst 25 000 kr för privat AB; bankintyg vid betalning med pengar, revisorns yttrande vid apport) och `bolagsavtal` (rekommenderas men inget formellt krav; solidariskt ansvar).
  - `bolagsordning_styrelse` är uppdelat i `bolagsordning`, `styrelse` och `revisor`. `arsredovisning` är uppdelat i `arsredovisning_ab` och `arsredovisning_ek_forening`. Varje ämne har sin egen adress. Katalogen har nu 17 ämnen i stället för 14.
  - Verifieringskommentaren i filhuvudet är omskriven.
- Inga ändringar i `ports/`, `types/`, `LegalAdvisor.ts`, `legalSchema.ts` eller demoadaptern. Källan väljs fortfarande med `KURERADE_KÄLLOR[topic.källId]`, och Geminis enum läser ämnes-id:na dynamiskt.
- `adapters/live/legalSources.test.ts`: fyra nya tester. Varje källa ligger på rätt myndighets domän, de kontrollerade källorna pekar på en undersida, aktiebolag och ekonomisk förening får var sin årsredovisningskälla, och bolagsordning, styrelse och revisor är tre ämnen med var sin adress.
- Verifierat: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar i `design-referens/`) och `pnpm test` (605 gröna, 35 skippade) och `pnpm build` (grönt med påhittade platshållarvärden för de två Supabase-variablerna, bara i kommandot, ingen `.env.local` skapad — se Kända problem).

### Återstår
- **Fråga till Erik:** `adapters/live/LegalAdvisor.ts:91` sätter `status: "ej_uppfyllt"` på varje krav. Bolagsavtalet för handelsbolag visas då som ett krav som inte är uppfyllt, fast det bara rekommenderas. Ska `LegalAdvisor.ts` (och kanske `types/legal.ts`) kunna skilja på krav och rekommendationer?
- Skatteverket, IMY, EUR-Lex, Konsumentverket och Riksdagen är inte kontrollerade av en människa och pekar fortfarande på startsidorna.
- Juristgranskning av hela ämneskatalogen: vilka ämnen som gäller per bolagsform, avgifter, deadlines och lagrum.

### Kända problem
- `pnpm build` misslyckas i en Codespace utan `.env.local`: prerenderingen av `/app` kastar "NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY saknas". Felet finns också på en ren `origin/prototyp` och beror inte på den här ändringen. Med påhittade platshållarvärden för de två variablerna går bygget igenom.
- En gammal `.next/`-cache från tidigare `next dev` (med de borttagna `app/demo/app/*`-sidorna) gjorde att `pnpm typecheck` gav fel. Lösningen är att ta bort `.next/`.

### Beslut
- Ämnes-id:na `bolagsordning_styrelse` och `arsredovisning` finns inte längre. Inget i repot använde dem utanför `legalSources.ts`.
- Källnycklarna (`KällId`) är per sida, till exempel `bolagsverket_starta_ab`. Nya ämnen får en egen nyckel när de har en egen undersida.
