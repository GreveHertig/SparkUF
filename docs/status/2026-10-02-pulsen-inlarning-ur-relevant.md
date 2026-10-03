## Pulsen: inlärning ur Relevant (2026-10-02, Bruno, gren `modul/pulsen-relevant`, PR mot `prototyp`)

"Relevant" ändrade tidigare ingenting. Nu visar och söker Pulsen mer av det grundaren gillar. Detaljer i `docs/moduler/webbresearch-och-pulsen.md`, "Inlärning ur Relevant".

### Klart
- **Ordningen:** det som liknar gillade signaler, alltså samma sort (risk eller möjlighet i samma område, eller vanlig nyhet) eller ett inlärt ord i rubriken, visas först. Utan omdömen är ordningen exakt som förut.
- **Sökningen:** ord som står i minst två gillade rubriker läggs till sökorden, högst tre. Siffror, vanliga nyhetsord och ord som redan söks räknas inte.
- **Temat:** varannan dag blir det mest gillade risk- eller möjlighetsområdet dagens tema. De andra dagarna roterar temat genom alla åtta. Fortfarande högst två Tavily-anrop per grundare och dag.
- **Texten efter "Relevant"** är nu "Tack! Pulsen visar mer av sådant här." (sv och en). Den syns bara i `/app`.
- **Bara liveadaptern och i18n är ändrade.** Ingen migrering, ingen ändring i `screens/`, porten eller demot.
- Tester: tio nya fall i `adapters/live/PulseProvider.test.ts` ("inlärning ur Relevant").
- Säkerhetsgranskning: inga fynd. Sökorden ur rubriker är bara bokstäver och siffror, högst tre, och bara egna omdömen i det aktiva projektet läses.
- Kontroll: `pnpm typecheck`, `pnpm lint` (0 fel, 3 gamla varningar), `pnpm test` (1218 gröna, 42 skippade).

### Beslut
- Ett ord kräver två gillade rubriker innan det blir sökord, så att ett enstaka gillande inte styr sökningen åt fel håll. Ett enda gillande påverkar bara ordningen.
- Favoritområdet tar varannan dag, inte varje dag, så att alla risker och möjligheter fortfarande bevakas.
- Omdömena läses med ett tak, de 500 nyaste per sidvisning (granskningen av #50, 2026-10-03). `pulse_feedback` saknar `project_id`, så taket är det enda som begränsar läsningen.

### Kända problem
- **Grundare som valt ingång A i /start har inget projekt.** Då har Pulsen inget att söka på: listan är tom och bevakningar ger "Starta ett projekt först". Det finns ingen väg till ett projekt inifrån `/app`. Upptäckt 2026-10-02, till Erik och Theodor.
- **Tomtexten i `/app` säger "Inga signaler för det här scenariot."** Den är skriven för demot. Ändras i `screens/`, alltså Theodors beslut.
