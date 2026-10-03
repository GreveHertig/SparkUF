## Session 6 — Landningssida (klar, gren `prototyp-landning`, mergead in i `prototyp`)

Uppdrag: bygg `/`, `/priser`, `/logga-in` och `/skapa-konto` enligt
`docs/uppdrag.md` avsnitt 5 och 6, i Fonda-stilen, med riktiga produktkort i
sektionerna. Fullständig motivering per sektion i `DESIGN.md` under samma
rubrik — det här är en kort sammanfattning.

### Klart
- **`app/(marketing)/layout.tsx`, ny:** delad ram för `/` och `/priser` —
  `components/spark/PublicHeader.tsx` (ljus, sticky: logga, Priser, Logga in,
  SV/EN, "Starta demo") och `PublicFooter.tsx` (tagline, produkt-/
  kontolänkar, fiktions-/ansvarsnot). `/logga-in`/`/skapa-konto` (P1, redan
  riktiga Supabase-formulär) **återanvända oförändrade** — behöll sin egna
  minimala `AuthLayout`-header i stället för `PublicHeader`, se `DESIGN.md`
  för varför.
- **`app/(marketing)/page.tsx` omskriven helt:** hero ("Din idé. *Spark* gör
  resten.", `NextStepCard` som levande produktkort) plus alla nio sektionerna
  i uppdrag 6 (Problemet, Datalöftet, Resan i rutnät, fyra saker
  Medgrundaren gör, Poängen, Juridisk koll, Minnet som chattutdrag, Koncept
  på väg — Hiasynth/Lovable tydligt märkta, Priser/FAQ/avslutning). Bygger
  uteslutande på befintliga designsystemkomponenter
  (`NextStepCard`/`ToolRunCard`/`ChatMessage`/`PulseCard`/`VerdictCard`/
  `LegalMap`/`SimulationCard`/`DataFact`/`ConceptBadge`) plus en liten ny
  lokal `FeatureCard`-hjälpare (återanvänd fem gånger, motiverar sig själv).
  Inga konkurrenter nämnda vid namn. Nämnda datasiffror (312 byråer,
  4,2 Mkr, 18 %) är uppdragets egna exempeltal ur avsnitt 1.1, med
  Bolagsverket/SCB som källa via `DataFact`/`SourceTag`.
- **`app/(marketing)/priser/page.tsx`, ny:** tre nivåer (Gratis, Grundare
  199 kr/mån, Bygg-credits) under en gemensam "Förslag — inte fastställda
  priser"-etikett, enligt uppdrag 6. Grundare-nivån visuellt högsta
  prioritet ("Mest valt").
- **i18n:** fyra nya toppnycklar i `i18n/dictionary.ts`
  (`publicNav`/`publicFooter`/`landingPage`/`pricingPage`), fullt typade och
  skrivna på båda språken. Egennamn (Bolagsverket m.fl.) förklaras med en
  kort parentes vid första engelska förekomsten i stället för en ny
  tooltip-komponent — se "Kända problem" nedan.
- **Test:** `app/(marketing)/page.test.tsx` — SV-innehåll och EN-innehåll
  (EN verifierad via `localStorage`-satt `spark:locale`, inte en klickad
  `LanguageSwitch`, eftersom headern med växeln ligger i layouten och inte
  testas här), plus `/priser`s tre nivåer.
- **Manuell verifiering i webbläsare** (Playwright, headless Chromium,
  tillfälligt installerat i en scratch-mapp utanför repot — inget
  webbläsarverktyg anslutet i den här sessionen): `/` och `/priser` på båda
  språken, alla nio sektionerna, inga konsolfel. En verklig layoutbugg
  hittades och fixades under det: "Ett steg i taget"-kortet i "Fyra saker
  Medgrundaren gör" var tomt jämfört med sina tre syskon i samma
  grid-rad-par — fixad med en liten poäng-/tidsrad, se `DESIGN.md`.
- Verifierat: `pnpm typecheck`, `pnpm lint`, `pnpm test` och `pnpm build`
  går alla igenom utan fel eller varningar. Branchen `prototyp-landning`
  skapad från `prototyp`, committad, pushad och mergead tillbaka in i
  `prototyp` (ingen PR-genomgång — sessionens instruktion bad uttryckligen
  om en sammanslagen branch, inte en öppen PR).

### Beslut nästa session behöver känna till
- **`/logga-in`/`/skapa-konto` är oförändrade sedan P1** — riktiga
  Supabase-formulär, inte de "fejkade formulär" uppdragstextens
  ursprungliga avsnitt 6 beskrev. `docs/sessioner.md`s egen
  Session 6-anteckning ("återanvänd inloggningen från P1 om den finns")
  väger tyngre här.
- **`FeatureCard`** (lokal i `app/(marketing)/page.tsx`, inte exporterad)
  är en enkel titel+brödtext+children-kortmall, medvetet inte flyttad till
  `components/spark/` — används bara på den här sidan i dag. Flytta den dit
  först om ett tredje ställe faktiskt behöver den.
- **`VerdictCard`s `score={54}`** på landningssidan är avsiktligt samma
  poäng som Saras riktiga steg 06 i demot (kontinuitet), inte en generisk
  platshållarsiffra — ändra den bara om steg 06:s facit någonsin ändras.

### Kända problem / medvetna begränsningar
- **Ingen tooltip-komponent** för att förklara svenska myndighetsnamn på
  engelska (uppdrag 4) — löst med en inline-parentes i stället
  ("Bolagsverket and SCB, Sweden's company registry and statistics
  agency"). En riktig tooltip-primitiv finns inte i designsystemet än.
- **`DataFact`s `SourceTag`-pill kan radbryta** i den smalaste av
  Datalöftet-sektionens tre rutor vid 1440 px bredd — samma komponent och
  mönster som redan används i `screens/Market.tsx` (fast med 4 kolumner
  där, trängre här med 3 kolumner i en halv `max-w-6xl`-bredd). Kosmetiskt,
  ingen bruten layout.
- **Ingen webbläsarverifiering av `/logga-in`/`/skapa-konto`** i den här
  sessionen (de rördes inte, och var redan verifierade i P1).
