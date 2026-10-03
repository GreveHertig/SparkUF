## Arbetsflöde för parallella sessioner (Theo, 2026-10-02)

### Klart
- `docs/arbetsflode.md`: tre sessioner (huvudbygge, bakgrundsjobb i cloud session, granskare), regler, uppgiftsmall och dagsrytm.
- Slash-kommandon i `.claude/commands/`: `/forbered-pr`, `/granska-pr`, `/session-bygg`, `/session-bakgrund`, `/session-granska` och `/klicka-igenom` (Claude verifierar ytor visuellt med Playwright).

### Återstår
- Erik beslutar om CI (GitHub Actions med typecheck/lint/test/build) och Vercel-previews per PR. Inget av det är satt upp här.
- Kommandona är oprövade; första körningen bör ske på en liten uppgift.

### Beslut
- Inga kodändringar, bara dokument och kommandon. Ingen ny beroende.
