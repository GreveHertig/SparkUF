## Merge av `prototyp` in i PR #16 (klar 2026-09-24, gren `modul/registret-bolagsverket`)

### Klart
- **`origin/prototyp` (med PR #17) är mergad in i `modul/registret-bolagsverket`**
  (merge, ingen rebase eller force push). PR #16 har inte längre någon konflikt.
- **Konflikter:**
  - `docs/status.md`: alla avsnitt behölls, i datumordning.
  - `eslint.config.mjs`: `registryTransportPattern` och `registryCachePattern`
    ligger i samma `no-restricted-imports`-regel. De tillåtna importörerna är
    en gemensam `registryImporters`.
- Konflikten i `eslint.config.mjs` som nämns ovan, under "Kända problem" och
  "I morgon", är därmed löst.

### Återstår
- **PR #16 väntar på Theos granskning** (GitHub: `BLOCKED`, mergebar). Mergea den
  inte innan dess.

### Kända problem
- `git fetch origin` uppdaterade en gång inte `origin/prototyp` i Codespacet.
  `git fetch origin prototyp:refs/remotes/origin/prototyp` fungerade.
  Kontrollera med `git ls-remote origin prototyp` före en merge.
