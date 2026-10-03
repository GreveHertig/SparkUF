-- Min plan, version 2: grundarens egna uppgifter (docs/moduler/min-plan.md,
-- beslut i docs/beslut.md 2026-10-03).
--
-- Körs MANUELLT i SQL Editor efter 20261003180000_plan_items.sql.
-- Utan den här migreringen fungerar allt som förut, men en egen uppgift
-- nekas av check-villkoret och skärmen visar "Det gick inte att spara".
--
-- Bara ursprunget vidgas: 'own' för en uppgift grundaren skriver själv.
-- RLS och policyerna är oförändrade (update-policyn tillåter redan att
-- grundaren ändrar texten på sina egna rader). En egen uppgift har inget
-- origin_ref, så det unika indexet hindrar samma egna text två gånger.

alter table public.plan_items drop constraint plan_items_origin_check;
alter table public.plan_items
  add constraint plan_items_origin_check check (origin in ('pulsen', 'own'));
