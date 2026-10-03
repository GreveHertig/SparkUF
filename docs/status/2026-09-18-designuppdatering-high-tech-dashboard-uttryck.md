## Designuppdatering — high-tech dashboard-uttryck

Grundarens uppdrag: ta uttrycket från tre referensbilder (tät instrumentpanel, KPI-rad med sparklines, centrerad promptruta), inte färgerna. Ren token-/komponentsession — inget innehåll ändrat. Full motivering i `DESIGN.md` under samma rubrik.

### Klart
- **Typsnitt:** Manrope → **Funnel Display** (`--font-sans`, motiverat i DESIGN.md), ny **JetBrains Mono** (`--font-mono`) för alla siffror. Båda självhostade `.woff2` under `design/fonts/`, hämtade ur `@fontsource-variable/*` (samma Google Fonts-källa som tidigare typsnitt, OFL-1.1) men **inte** tillagda som npm-beroenden — bara filerna kopierades in, exakt samma mönster som Manrope/Instrument Serif. Instrument Serif Italic oförändrad.
- **`.font-numeric`-utility** i `app/globals.css` (inte Tailwinds `.font-mono` — se DESIGN.md för varför) satt på alla siffror: `ScoreBadge`, `DataFact`, nya `KpiTile`, poäng/vikt-texter, tabellceller i Kunder, registersiffror i Marknad. Medvetet **inte** satt på meningar som råkar innehålla ett tal (t.ex. Pulsens tidsstämpel).
- **Nya komponenter:** `components/ui/Sparkline.tsx` (minimal inline-SVG, ingen ny dependency), `components/spark/KpiTile.tsx` + `KpiRow.tsx`, `components/spark/PromptBox.tsx`.
- **KPI-rader** på Hem (5 rutor) och Poäng (4 rutor). Sparkline bara på totalpoängen, som har en genuin flerpunktsserie (per-beat-historik, ny `EvidenceRepository.getScoreHistory`-portmetod — demo härleder ur `sara.ts`s nya `getScoreHistoryUpToBeat`, live kastar `NotImplementedError`). Övriga KPI:er utan sparkline snarare än en påhittad form.
- **Medgrundaren:** ny centrerad `PromptBox` under transkriptet — ljus, rundade hörn, tunn kant, mjuk skugga, liten rund accent-skickaknapp. Medvetet **inert** (disabled) eftersom demot är helt förskrivet, ingen ny funktion. `ChatMessage` slimmad (tätare padding/radavstånd), fortsatt bubbelbaserad.
- **Täthetspass:** padding/gap ner ett steg i alla kort och i `AppShell` (sidomeny, sidhuvud). Sidomenyns aktiva länk `bg-slate-700` → `bg-accent-600 text-white` (återanvänder Session 1:s kontrollräknade 5.01:1-kontrast, inga nya toner).
- **Verkligt fel hittat och fixat:** deltachippen i de nya KPI-rutorna visade `−0` vid det allra första momentet (samma rotorsak som det kända `−0`-felet i "Poängrörelse"-kortet, `docs/status.md` Session 2) — fixat genom att bara rendera chippen när `delta !== 0`.
- **Verifierat:** `pnpm typecheck`/`lint`/`test`/`build` gröna. **Webbläsarverifiering genomförd** (Playwright, headless Chromium mot `pnpm dev`) — alla elva `/demo/app`-sidor + `/resan/[steg]`, på **både sv och en**, inga konsol-/sidfel på någon av de 22 kombinationerna. Detta var en explicit känd lucka från Session 3 (EN aldrig klickad igenom i en riktig webbläsare) — nu täppt till, åtminstone för den här designuppdateringen.

### Beslut nästa session behöver känna till
- **`--font-mono` mappas inte in i `@theme inline`** i `app/globals.css`, av samma skäl som `--font-sans`/`--font-serif-italic` sedan Session 1. Siffror får typsnittet via `.font-numeric`-klassen, inte Tailwinds `font-mono`-utility.
- **Sparkline-data måste vara genuin.** Lägg aldrig till en sparkline i `KpiTile` utan en riktig flerpunktsserie bakom — se databeslutet i DESIGN.md. Fler serier (t.ex. öppningsfrekvens över tid) kräver att adaptern faktiskt modellerar historik, inte bara ett nu-värde.
- **`PromptBox` är avsiktligt inert.** Om Medgrundaren någon gång får riktig inmatning (utanför den förskrivna demon) är det en separat, större uppgift — inte något den här sessionen förberedde funktionellt.
- **Juridik-sidan är fortfarande svensk-bara** (`getLegalMap` tar inte `locale`, känt sedan tidigare session) — synligt i EN-skärmdumparna, inte adresserat här, inte i scope för en designsession.

### Kända problem / medvetna begränsningar
- **KPI-raden duplicerar viss information** som redan visas i korten nedanför (t.ex. "Vad som hänt sedan sist" på Hem). Avsiktligt — en dashboards KPI-rad är en sammanfattning. Flagga till grundaren om det känns för upprepande i en riktig genomgång.
- Ingen ny `recharts`-dependency — `Sparkline` är en egen minimal SVG-komponent. Om fler/mer avancerade diagram behövs (interaktiva, tooltip, zoom) är `recharts` fortfarande rätt val då, inte en utökning av `Sparkline`.
