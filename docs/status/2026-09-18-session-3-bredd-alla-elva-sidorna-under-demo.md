## Session 3 — Bredd: alla elva sidorna under /demo/app (klar, breddfokus)

Mål för sessionen: ingen sida i sidomenyn tom eller död, bredd före djup. Nio commits, en per sida plus en grundcommit.

### Klart
- **`adapters/demo/sara.ts` omskriven helt:** Saras fulla scenario (9.3), 13 beats täcker alla 12 officiella steg (steg 05 har två beats — utskicket och svaren — för att visa poängen stiga till 47 och sedan sjunka till 43). `SARA_STEPS` exporterar den kanoniska 12-stegslistan Resan-vyn använder. `testScenario.ts` (Session 2:s wiring-bevis) borttagen, allt pekar om till `sara.ts`.
- **Alla elva sidorna** finns som riktiga skärmar under `/demo/app` och länkas från `AppShell` (ny `navBasePath`-prop, aktiv sida markerad via `usePathname`): Hem, Medgrundaren, Resan, Resan/[steg], Poäng, Marknad, Kunder, Pulsen, Minnet, Juridik, Bygg.
- **Sju portar utökade** med nya metoder (liveadaptrarna kastar `NotImplementedError` som vanligt för de nya metoderna också): `JourneyRepository` (`getSteps`, `getStepDetail`), `EvidenceRepository` (`getSuggestions`), `RegistryProvider` (`getMarketOverview`), `OutreachProvider` (`getCampaign`), `PulseProvider` (`getSignals`), `MemoryRepository` (`getProfileSummary`, `locale` tillagd på `getTraceEvents`), `BuildProvider` (`getSpec`), `SimulationProvider` (`locale` tillagd på `simulate`).
- **Nya komponenter:** `ChatMessage`, `ToolRunCard`, `TimeSkip` (`components/spark/`), `LegalMap` (`components/spark/`). Ny `@radix-ui/react-tabs`-dependens för Minnets flikar.
- Verifierat: `pnpm typecheck`/`lint`/`test`/`build` gröna vid varje commit. Alla 14 routes svarar 200 (verifierat med `curl` mot `pnpm start`) — se "Kända problem" för vad som INTE är verifierat.

### Moment per steg — vad som faktiskt är byggt
- 9.1 beskriver tre moment per steg (Före/Körning/Efter). Det är **inte** byggt generellt — bara steg 05 har två beats (utskicket, svaren). Övriga elva steg har **ett** moment/beat vardera.
- `ToolRunCard` (körning-momentet i Medgrundaren) finns bara för steg 02, 03, 04, 05 (utskicket), 07, 09, 10, 12. Steg 01, 05 (svaren), 06, 08, 11 har bara chattmeddelanden, ingen verktygskörning.
- Resan/[steg] visar samma djup för alla 12 steg (`why`-text + 2–4 `highlights`-punkter ur `sara.ts`) — men steg 07–12 saknar egna dedikerade vyer utöver det, se nedan.

### Poängkalibrering
- Uppmätta totalsummor per beat (`calculateScore`, kontrollerat med ett tillfälligt testskript som inte ligger kvar i repot): 6, 14, 26, 27, 47, 43, 54, 60, 66, 70, 77, 88, 92.
- Målvärden (9.3): 6, 16, 24, 29, 47, 43, 54, 60, 66, 69, 78, 88, 91.
- Avvikelse per steg: 0, −2, +2, −2, 0, 0, 0, 0, 0, +1, −1, 0, +1 — alla inom uppdragets "högst ±2", de flesta exakta. Slutlig nedbrytning (steg 12) matchar 9.3 exakt på Passform 8, Konkurrens 7, Problem 16, Betalningsvilja 16, Produkt 12, Traktion 13, Genomförbarhet 8. Marknad landar på 12 i stället för 11 (+1) — enda avvikande delen i slutnedbrytningen.
- Metod: en eller ett fåtal `EvidenceItem` per del och beat (inte en post per enskilt kundsvar), utom steg 05 "svaren" där motsägelsen medvetet är uppdelad i en positiv och en negativ post (den negativa med **negativa poäng**) för att trigga både avtagande värde och det skeva underlagets 0,85-straff i `core/score.ts` på riktigt.

### Steg 07–12 — mindre djup än 03–06/09/10
- Steg 07 (Affärsfall och pris), 08 (Omfånget), 11 (Första kunderna) och 12 (Kapital) har **ingen egen sida eller dedikerad vy** — bara Nästa steg-kortet och highlights-texten på Resan/[steg], plus poängbidraget.
- Steg 09 (Det formella) och 10 (Live) har delvis egna vyer via Juridik respektive Bygg, men de sidorna visar bara slutresultatet (juridisk karta, byggstatus) — inte den svenska kalkylen från steg 07, MVP-omfångsbeslutet från steg 08 i detalj, 30-dagarsplanens kanaler från steg 11, eller ansökningsunderlaget från steg 12.
- Kunder-sidan visar bara utskicksstatus (draft/sent/opened/responded) — **inte** att 5 av byråerna blivit betalande kunder med 5 950 kr MRR (steg 11). Den siffran syns bara som text i highlights och i Traktion-delens poäng, ingen egen "betalande kund"-status i tabellen.

### Återstår
- **Onboarding (`/demo/start`, `/start`, `/start/profil`, `/start/ide`):** inte byggd. Demot hoppar rakt in i `/demo/app` vid `beatIndex` 0 i stället för att börja i profilsamtalet/idégenomlysningen som 9.1 beskriver.
- **Jonas (Persona B):** inte byggd alls — ingen data, inga sidor. "Byt ingång" i demoraden är fortfarande bara kosmetiskt (växlar `entry`-state, påverkar inget innehåll) — känt sedan Session 2, oförändrat.
- **Engelska texter:** all ny UI-text (i18n) och allt nytt scenarioinnehåll (`sara.ts`, `cofounderScript.ts`, `RegistryProvider`, `OutreachProvider`, `PulseProvider`, `SimulationProvider`) finns på båda språken, typtvingat via `Dictionary`. **Undantag:** Juridik-sidan är svensk-bara — `getLegalMap` tar fortfarande inte emot `locale` (samma kända begränsning som liveadaptern, se modulsessionens anteckning ovan). Inte manuellt klickigenomgången på engelska i en riktig webbläsare — bara verifierat att typerna går ihop.
- **Guidad rundtur, kalibrering mot Jonas, publika sidor utöver befintlig platshållare (`/`, `/priser`, `/logga-in`, `/skapa-konto`), `docs/demo-manus.md`:** inte påbörjat, oförändrat sedan tidigare sessioner.

### Kända problem
- **Ingen webbläsarverifiering.** Claude in Chrome-tillägget var inte anslutet i den här sessionen — allt är verifierat med `typecheck`/`lint`/`test`/`build` och `curl` (200 på alla routes), inte manuellt klickat igenom i en riktig webbläsare. Gör det först i nästa session innan mer byggs ovanpå, särskilt SV/EN-växeln och demoradens Nästa/Bakåt genom alla 13 beats.
