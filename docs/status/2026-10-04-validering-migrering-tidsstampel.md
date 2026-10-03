## Ny tidsstämpel för Valideringens migrering (2026-10-04, gren `plattform/validering-migrering-tidsstampel`, PR mot `prototyp`)

Två migreringar hade samma tidsstämpel, `20261004090000` (`pulsen_v3` och `validation_contacts`). Det fungerar när de körs för hand i SQL Editor, men `supabase db push` klagar. Uppdrag från Erik.

### Klart
- `supabase/migrations/20261004090000_validation_contacts.sql` heter nu `20261004100000_validation_contacts.sql`. **Innehållet är oförändrat** (ren namnbyte, git ser 100 % likhet). Den sorteras efter `pulsen_v3` och före `cofounder_next_task`.
- Hänvisningarna till filnamnet uppdaterade i `docs/moduler/validering.md`, `core/validationLog.ts` och `supabase/migrations/validationContacts.pg.test.ts`. Statusraden i `docs/moduler/validering.md` säger nu att migreringen är körd.
- Migreringstesterna gröna (RLS-täckningen och `validationContacts.pg.test.ts`), liksom typecheck och lint.

### Återstår
- Inget i databasen: migreringen är redan körd och ska inte köras igen. Om ni senare använder `supabase db push` mot en databas där den redan är körd för hand, kan migreringshistoriken behöva markera den som körd (`supabase migration repair --status applied 20261004100000`).

### Kända problem
- `docs/status/2026-10-04-validering-samtalsloggen.md` nämner fortfarande det gamla filnamnet. Den filen ändras inte (regeln om statusfiler); den här filen gäller.

### Beslut
- Inga.
