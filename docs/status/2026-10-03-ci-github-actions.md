## CI med GitHub Actions (2026-10-03, gren `plattform/ci`, PR mot `prototyp`)
Theo bad om CI i #59: typecheck, lint, test och build per PR, så att granskningen inte behöver göras för hand.

### Klart
- `.github/workflows/ci.yml` körs på varje `pull_request` och på push till `prototyp`. Ett jobb: checkout, pnpm (versionen ur `packageManager`, 10.11.0), Node 22 (samma som devcontainerns `typescript-node:1-22`), `pnpm install --frozen-lockfile`, `pnpm next typegen`, sedan `pnpm typecheck`, `pnpm lint`, `pnpm test` och `pnpm build`.
- pnpm-lagret cachas av `actions/setup-node` (`cache: pnpm`, nyckel ur `pnpm-lock.yaml`).
- Inga hemligheter. Bygget får platshållare för `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_ANON_KEY`, bara i build-steget. Testerna får inga Supabase-variabler, så `rls.live.test.ts` hoppas över, liksom de andra `*.live.test.ts` (de kräver `GEMINI_API_KEY`, `TAVILY_API_KEY` eller `REGISTRY_LIVE_SMOKE`). pg-testerna kör PGlite i processen.
- `permissions: contents: read`, och en ny körning avbryter en pågående för samma gren.
- `CLAUDE.md`: CI måste vara grön innan merge.
- Provat lokalt i en ny worktree, med en tom miljö (`env -i`): typecheck, lint (0 fel), test (1238 gröna, 42 skippade) och build gröna.

### Återstår
- Göra CI till ett krav i GitHub (branch protection på `prototyp`, "Require status checks to pass": `CI / check`). Det är en repoinställning, inte en fil; Erik eller den som administrerar repot.
- Playwright-testerna (`pnpm test:e2e`) körs inte i CI än.

### Kända problem
- Första körningen i GitHub är den riktiga provningen; lokalt provat, inte i Actions.

### Beslut
- CI körs på alla PR:er, inte bara mot `prototyp`, så att PR:er mot `design/en-design` också prövas.
