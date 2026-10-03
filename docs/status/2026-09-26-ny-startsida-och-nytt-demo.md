## Ny startsida och nytt demo (klar 2026-09-26, gren `landning-ny-startsida`, PR mot `prototyp`)
Landningssidan och demot från `experiment/landning-fonda` är de officiella sidorna.

### Klart
- **`/`** (`app/(marketing)/page.tsx`) är den nya startsidan, med egen ram och egna stilar (`design/site.css`, skopat under `.fd`). `(marketing)/layout.tsx` laddar bara stilarna; **`/priser`** har fått egen `layout.tsx` med `PublicHeader`/`PublicFooter` och ser ut som förut. `noindex` från experimentet är borttaget.
- **`/integritet`**: integritetstexten (personuppgiftsansvarig Spark UF, samtycke, lagras inom EU, raderas efter lanseringen eller på begäran).
- **Mejlfältet:** `landingActions.ts` (`joinLandingWaitlist`) framför Oskars `joinWaitlist` (`actions.ts`, orörd): honeypot, spärr per IP, MX-kontroll (`_lib/mxCheck.ts`), och "Menade du …?" i formuläret (`_lib/emailTypos.ts`). Oskars `WaitlistForm.tsx` används inte längre av startsidan men är kvar.
- **`next.config.ts`:** `allowedOrigins` bara när `CODESPACES` är satt (se väntelistans avsnitt ovan, går emot Oskars tidigare beslut).
- **`/demo`**: det gamla demots sidor (`app/demo/**`, 19 sidor och layouter plus `demo-bar.test.tsx` och `locale-switch.test.tsx`) är **borttagna** (finns i git-historiken) och ersatta av demot från experimentet, på `/demo`, `/demo/start/...` och `/demo/<sida>`. `adapters/demo/` är orörd utom `sara.ts` (nedan). `adapters/demo/tourSteps.ts` är orörd: den används av nya demots rundtur, som översätter dess `/demo/app/...`-rutter (`app/demo/_lib/paths.ts`). `screens/*` och `components/spark/DemoBar.tsx`/`TourOverlay.tsx` finns kvar; de två sistnämnda används inte längre av någon sida.
- **Arkitektur:** nya demot har egna sidor och monterar inte `screens/`. Portregeln gäller (bara via portarna, inga liveadaptrar). Beskrivet i `docs/arkitektur.md`.
- **i18n:** namnrymden heter `site` (var `experimentFonda`). Demots sidhuvud säger "Exempel med påhittad data" på varje sida.
- **Datalöftet och buggrapporten (`docs/buggar-2026-09.md`):**
  - Punkt 20: etiketten "Exempel med påhittad data. Företagen finns inte på riktigt." på Valideringens svar och tabell, och på Marknads registersiffror och konkurrenter (`ExampleLabel`).
  - Punkt 13: anställda visas som SCB-storleksklass (`app/demo/_lib/sizeClass.ts`), inte exakt antal.
  - Punkt 11: Pulsen visar inte längre adapterns fasta "3 dagar sedan"; datumet står i källan.
  - Punkt 14: `adapters/demo/sara.ts` säger 5–19 och 10–19 anställda (var 5–20 och 10–20), som rubriken på Marknad och SCB:s klasser. Bara datan, kontraktstesterna gröna.
- **Docs:** `arkitektur.md`, `uppdrag.md` och modulerna pekar på de nya rutterna; `DESIGN.md`, `sessioner.md` och `beslut.md` har en not överst (historiken är inte omskriven); `demo-manus.md` har nya rubriker och adresser, replikerna är inte omskrivna.
- Verifierat: `typecheck`, `lint` (0 fel, 3 gamla varningar i `design-referens/`), `test` (590 gröna), `pnpm build`. I produktionsbygget: `/`, `/priser`, `/integritet`, `/demo`, Validering, Pulsen och rundturens första sju stopp, inga konsolfel.

### Återstår
- Granskning av PR:en (Theo och Oskar), särskilt att gamla demot tas bort och `allowedOrigins` i Codespaces.
- Punkt 14 i övriga adaptrar: `5–20`/`10–20` står kvar i `OutreachProvider.ts`, `SimulationProvider.ts`, `BuildProvider.ts`, `PulseProvider.ts` och `cofounderScript.ts` (inte ändrade, bara `sara.ts` fick röras).
- Punkt 9 (Juridik på svenska i engelska läget): Oskar, vecka 7.
- Frågor till Theo: punkt 15 (Gmail och öppningsspårning, stopp 9), 16 (Hiasynth 312 byråer), 17 (Lovable utan koncept-etikett i rundturskortet, "kvittojakten.lovable.app"), 18 (199 kr, stämmer med startsidan). `demo-manus.md`: replikerna i stopp 9 och 10 krockar med skärmen.
- Kolla manuellt att inget av de påhittade företagsnamnen i demot är ett riktigt bolag.
- Testadresser som läggs på väntelistan vid test ska tas bort i Supabase efteråt.

### Kända problem
- Interna namn säger fortfarande Fonda (`FondaTour`, `FondaDemoBar`, `fondaDemoIsolation`, lagringsnyckeln `spark:fonda-demo-state`). Nyckeln är medvetet kvar så att besökares sparade läge från gamla demot inte läses in.
