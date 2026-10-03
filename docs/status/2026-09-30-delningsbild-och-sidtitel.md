## Delningsbild och sidtitel (klar 2026-09-30, gren `fix/delningsbild`, PR mot `prototyp`)
När länken delades (sms, DM, LinkedIn) visades ingen bild och bara titeln "Spark".

### Klart
- `app/opengraph-image.png` och `app/twitter-image.png` (1200×630) med alt-text i `*.alt.txt`. Samma uttryck som startsidans hero: ordmärket, `--paper-50` med blått sken, Castoro och Instrument Serif-kursiv i `--accent-600`, och ett förenklat poängkort. Förenklad med flit så att rubriken går att läsa även i en liten sms-förhandsvisning.
- Titel och beskrivning ligger i i18n (`meta` i `dictionary.ts`, `sv.ts`, `en.ts`); `app/layout.tsx` läser svenskan och sätter `openGraph` och `twitter` (`summary_large_image`).
- Ingen `metadataBase`: Next.js gör bildadressen absolut med Vercels `VERCEL_PROJECT_PRODUCTION_URL`. Bygget varnar lokalt om det, men det är väntat. Sätt `metadataBase` när en egen domän finns.
- Kontroll: taggarna finns på `/`, `/priser`, `/demo`, `/integritet` i produktionsbygget och bilden serveras. `typecheck`, `lint` (0 fel), `test` (601 gröna).
