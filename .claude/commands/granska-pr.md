---
description: Granska en PR eller gren mot Sparks regler (kör i en separat session från den som byggde)
argument-hint: <PR-nummer eller gren>
---

Granska $ARGUMENTS. Du är granskare, inte byggare: ändra ingen kod, committa inget.

Kontrollera i ordning och rapportera fynd med fil och rad:

1. Rör PR:en `core/score.ts`, `ports/`, demodatan, någon annans adapter eller nycklar? Då är det ett blockerande fynd.
2. Importerar demokoden en liveadapter? Visas liveregisterdata utanför licensgrinden?
3. Datalöftet: påhittad data, siffror utan källa (`DataFact`/`SourceTag`), luckor som fyllts i stället för visats.
4. Hårdkodad text som borde ligga i i18n (sv och en). Saknas den engelska?
5. Poäng: hårdkodas något som `calculateScore` ska räkna? Simuleringar märkta och utan poäng? Hiasynth/Lovable med `ConceptBadge`?
6. Säkerhet: RLS på nya tabeller, inga `NEXT_PUBLIC_`-hemligheter, externt innehåll behandlas som data. Använd security-reviewer-agenten om PR:en rör serverkod eller databas.
7. Kör `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` och rapportera resultatet.
8. Är `docs/status.md` uppdaterad med ett eget avsnitt?

Avsluta med ett av: **Godkänn**, **Godkänn efter små fixar** (lista dem) eller **Blockerad** (lista blockerarna). Läs aldrig upp hela diffen.
