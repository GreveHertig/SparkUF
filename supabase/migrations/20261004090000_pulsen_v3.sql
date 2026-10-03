-- Pulsen v3 (docs/moduler/webbresearch-och-pulsen.md, "Pulsen v3", och
-- docs/moduler/min-plan.md; beslut i docs/beslut.md 2026-10-04).
--
-- Körs MANUELLT i SQL Editor efter 20261003210000_plan_items_egna.sql.
-- Utan den här migreringen fungerar Pulsen och Min plan som förut: adaptrarna
-- läser och skriver utan de nya kolumnerna (felkod 42703/PGRST204), och
-- varken sista ansökningsdag eller AI-texten visas.
--
-- Bara nya, valfria kolumner. RLS och policyerna är oförändrade: raderna är
-- fortfarande grundarens egna.

-- Sista ansökningsdag som artikeln själv anger (core/deadline.ts), bara för
-- möjligheter. Källan är signalens egen källa (source_name, fetched_at).
alter table public.pulse_signals add column deadline date;

-- Sant när why_it_matters är skriven av en språkmodell för just den här
-- nyheten (PULSE_AI_WHY, avstängd som standard). Skärmen märker texten.
alter table public.pulse_signals add column why_ai boolean not null default false;

-- Sista dag för en uppgift i Min plan, med källan den kom från: artikelns
-- namn och dagen den hämtades. Alla tre sätts tillsammans eller inte alls.
alter table public.plan_items add column due_date date;
alter table public.plan_items
  add column due_source text check (due_source is null or (char_length(btrim(due_source)) between 1 and 100 and due_source !~ '[[:cntrl:]]'));
alter table public.plan_items add column due_fetched date;
alter table public.plan_items
  add constraint plan_items_due_together check (
    (due_date is null and due_source is null and due_fetched is null)
    or (due_date is not null and due_source is not null and due_fetched is not null)
  );
