---
description: Förbered en PR enligt Sparks regler (kontroller, egen statusfil, PR-text)
---

Förbered en pull request för den aktuella grenen. Gör inga ändringar utanför vad som behövs.

1. Kör `git status` och `git diff --stat prototyp...HEAD` (använd `design/en-design` som bas om grenen kommer därifrån). Rapportera filer som rörs.
2. Stoppa och rapportera om diffen rör `core/score.ts`, `ports/`, demodatan, någon annans adapter, `.env*` eller innehåller något som liknar en nyckel.
3. Kör `pnpm typecheck`, `pnpm lint`, `pnpm test` och `pnpm build`. Alla ska vara gröna. Laga fel som hör till din ändring; rapportera resten.
4. Kontrollera Datalöftet: ingen påhittad data, inga nya siffror utan källa, ingen hårdkodad text (allt i i18n sv/en), fiktivt märkt i demot.
5. Skapa en egen fil `docs/status/<datum>-<kort-namn>.md` (klart, återstår, kända problem, beslut), se regeln i `docs/status.md`. Redigera aldrig andras filer och skriv inget i `docs/status.md`.
6. Committa. Pusha grenen. Skriv aldrig till `main` eller direkt till `prototyp`.
7. Öppna PR med en kort text: vad och varför, vilka filer som är känsliga, hur det verifierats (vilka kommandon, vad som klickats igenom), och vad granskaren ska titta extra på.
8. Avsluta med två rader: PR-länken och det enda Theo måste göra härnäst.
