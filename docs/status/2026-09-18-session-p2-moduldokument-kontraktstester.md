## Session P2 — Moduldokument, kontraktstester, Tavily-skelett, bygga-en-modul (klar, branch `plattform-p2`)

Mål: dokumentera alla 12 moduler enligt 14.5, bygga kontraktstester per port
som redan idag går gröna mot demo och automatiskt börjar pröva liveadaptern
den dagen den slutar vara en stub, förbereda Tavily-serverstrukturen, och
skriva den generella "stub → klar modul"-guiden. Sju commits, planerade med
planner-agenten och godkända av grundaren innan kod skrevs.

### Klart
- **`ports/testContract.ts`:** `describeContract`/`contractIt` — kör samma
  svit mot en ports demo- och liveadapter. `contractIt` fångar
  `NotImplementedError` och kallar vitest 5:s dynamiska `ctx.skip()`, så en
  kontraktstestfil skrivs en gång och gäller automatiskt både idag (demo
  grön, live skippad) och den dag liveadaptern är klar (live börjar prövas
  på riktigt, ingen omskrivning av testfilen krävs). Två regler dokumenterade
  i filen: aldrig egen try/catch runt en `contractIt`-body, och negativa
  tester måste kontrollera feltypen (`.rejects.toBeInstanceOf`) — annars blir
  de falskt gröna mot en stubbe. Bevisat mot en redan byggd liveadapter
  (`ports/LegalAdvisor.contract.test.ts` skrevs om till mönstret först).
- **Kontraktstester för alla 12 portar** (`ports/<Port>.contract.test.ts`):
  Registret och Utskick och svar (steg 05) byggda först enligt prioritet,
  sedan de återstående nio. Prövar kontraktet (form, invarianter, källa på
  varje påstående) — inte Saras specifika scenarioinnehåll. 34 nya
  live-tester skippar sig själva idag (alla liveadaptrar utom LegalAdvisor
  är fortfarande stubbar).
- **`ports/stubStatus.test.ts`:** ett litet vakttest, skilt från
  kontraktstesterna — failar högljutt om en av de 11 obyggda liveadaptrarna
  slutar kasta `NotImplementedError` utan att raden tagits bort här (vilket
  tvingar fram en samtidig uppdatering av `docs/moduler/<modul>.md` och
  `docs/status.md`, se `docs/bygga-en-modul.md` steg 7 och 10).
  *Senare:* listan är i dag 7 helstubbar (Medgrundaren, Webbresearch,
  Pulsen, Simuleringar, Utskick och svar, Bygg, Domen) plus 3 partiella metoder
  (`PARTIELLA_STUBBAR`); övriga har byggts eller grindats sedan dess.
- **`docs/moduler/*.md` — alla 12 moduler har nu ett dokument.** De två
  prioriterade (`registret.md`, `utskick-och-svar.md`) skrevs först och mest
  utförligt. De nio återstående: `profil.md`, `projekt-och-ide.md`,
  `resan.md`, `evidens-och-poang.md`, `minnet.md`, `medgrundaren.md`,
  `webbresearch-och-pulsen.md` (ett dokument för både `ResearchProvider` och
  `PulseProvider` — de delar redan samma `DOC`-hänvisning i koden),
  `simuleringar.md`, `bygg.md`. Alla följer 14.5s sjupunktsstruktur och
  samma stil som den handskrivna `juridisk-koll.md` (facit för sessionen).
  Simuleringar och Bygg flaggade som **avsiktligt permanenta stubbar** tills
  ett Hiasynth- respektive Lovable-partnerskap ingås (uppdrag 2.2, 2.3) —
  skiljer sig från övriga moduler, som väntar på kod, dataavtal eller en
  OAuth-uppsättning.
- **`lib/server/tavily.ts` + test:** server-only-klientskelett, speglar
  `lib/server/gemini.ts`. `search()` kontrollerar `TAVILY_API_KEY` och
  kastar sedan `NotImplementedError` — ingen riktig sökning än.
  `TAVILY_API_KEY` tillagd i `.env.example` utan värde. Gemini-klienten
  rördes inte (redan klar sedan Juridisk koll-sessionen).
  *Senare:* inte längre ett skelett — byggd till riktig klient i
  "Modul: Utskick — mejlsökning och utkast" nedan.
- **`docs/bygga-en-modul.md`:** generell steg-för-steg-guide (branch →
  läs kontraktet → bygg → nycklar → tre testlager → extern data är data →
  granskning → dokumentation → avslutning → checklista), med Juridisk koll
  som verkligt genomfört exempel. `docs/arkitektur.md` avsnitt 5 kortat till
  en hänvisning hit; avsnitt 3 uppdaterat (moduldokumenten finns nu).
- **Bekräftat, inget kodarbete krävdes:** alla 12 liveadaptrar kastade redan
  korrekt `NotImplementedError` med hänvisning till sitt (nu existerande)
  moduldokument innan sessionen började — uppdragets punkt 3 var redan
  uppfylld i koden.
- Granskat av code-reviewer- och security-reviewer-agenterna mot hela
  sessionens diff. Security: inga blockerande fynd. Code review: APPROVE,
  en LOW (`TavilySearchInput` exporterad men oanvänd i skelettet) — fixad
  med en förklarande kommentar.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` (89 tester gröna,
  39 skippade — förväntat, de obyggda liveadaptrarnas kontraktstester),
  `pnpm build` går alla igenom utan fel.

### Beslut nästa session (eller den som bygger en modul) behöver känna till
- **`docs/bygga-en-modul.md` är nu den kanoniska guiden** för att gå från
  stub till klar liveadapter — `docs/arkitektur.md` avsnitt 5 är bara en
  kort hänvisning dit. Följ den, inklusive att ta bort modulens rad ur
  `ports/stubStatus.test.ts` och uppdatera moduldokumentets statusavsnitt i
  samma commit som liveadaptern blir klar.
- **Kontraktstestens skip-mönster har en känd, dokumenterad begränsning**
  (code-reviewer-fyndet ovan, inte ett fel i den här sessionen): `contractIt`
  kan inte skilja "hela adaptern är en avsiktlig stub" från "en enskild
  metod i en annars byggd (`påbörjad`) adapter kastar `NotImplementedError`
  av misstag". Ingen modul är i det läget än (LegalAdvisor är helt byggd,
  resten helt ostubbade), men **var extra uppmärksam på det** första gången
  en modul byggs delvis — en metod som av misstag kastar
  `NotImplementedError` skulle tystas som "fortfarande en stub" i stället
  för att faila.
- **Registret och Utskick och svar är inte kod-blockerade, de väntar på
  affärsbeslut:** Registret på ett dataavtal (Bolagsverket/SCB), Utskick och
  svar på en Gmail OAuth-uppsättning **och** ett beslut om `opened`-status
  ens går att mäta live utan en GDPR-problematisk spårpixel (flaggat i
  `docs/moduler/utskick-och-svar.md`) — ta upp det med grundaren innan den
  modulen byggs, det kan påverka portens kontrakt.
- **Medgrundaren-porten saknar ett verktygsanropslager** (function calling
  mot andra portar) — `sendMessage` returnerar i dag bara text.
  `docs/moduler/medgrundaren.md` flaggar det som en öppen designfråga att
  lösa med grundaren innan liveadaptern byggs.
- **Projekt och idé-porten saknar troligen en skrivmetod** — `getProject()`
  är allt som finns idag; idégenomlysningen (uppdrag 2.1) som ska *sätta*
  ett projekt är inte kopplad till porten än. Bygg den här modulen
  tillsammans med onboardingen, inte isolerat.

### Kända problem
- Inga nya. `.mcp.json` (otrackad i arbetskatalogen) rördes inte, utanför
  uppdraget.

### Återstår (andra sessioner)
- Alla 12 liveadaptrar väntar fortfarande på att byggas (Session P1 för
  Profil/Projekt/Resan/Evidens/Minnet via Supabase och inloggning, separata
  modulsessioner för Medgrundaren, Registret, Webbresearch/Pulsen, Utskick
  och svar — Simuleringar och Bygg förblir avsiktligt stubbar).
- Se `docs/uppdrag.md` avsnitt 13 och `docs/sessioner.md` för resten av
  sessionsplanen.
