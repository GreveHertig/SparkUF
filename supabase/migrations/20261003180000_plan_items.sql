-- Min plan: uppgifter som grundaren själv lägger till, i dag från en spelbok
-- i Pulsen ("Lägg till i min plan"), och bockar av i Resan
-- (docs/moduler/min-plan.md, beslut i docs/beslut.md 2026-10-03).
--
-- Körs MANUELLT i SQL Editor efter granskning, som de andra migreringarna.
-- Adaptern tål att tabellen saknas: då visas varken knappen i Pulsen eller
-- listan i Resan, och inget kraschar.
--
-- Texten är grundarens egen plan: stegen kommer ur spelbokens i18n-texter på
-- servern, aldrig från klienten, och sammanhanget är signalens rubrik. Allt är
-- data, aldrig instruktion, och visas som ren text.
--
-- origin_ref pekar på signalen uppgiften kom ifrån, men utan främmande nyckel:
-- en signal som rensas bort ur pulse_signals ska inte ta grundarens plan med sig.

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 300 and text !~ '[[:cntrl:]]'),
  context text check (context is null or (char_length(context) <= 200 and context !~ '[[:cntrl:]]')),
  origin text not null check (origin in ('pulsen')),
  origin_ref uuid,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- Samma steg från samma signal en gång, oavsett stora och små bokstäver.
-- Samma allmänna steg från två olika signaler är två olika uppgifter.
create unique index plan_items_unique_step
  on public.plan_items (user_id, coalesce(origin_ref, '00000000-0000-0000-0000-000000000000'::uuid), lower(text));
create index plan_items_user_created on public.plan_items (user_id, created_at);

alter table public.plan_items enable row level security;

create policy "plan_items: select egen" on public.plan_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "plan_items: insert egen" on public.plan_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Bocka av och tillbaka. Det är grundarens egen plan, så hela raden får ändras,
-- men aldrig flyttas till någon annan.
create policy "plan_items: update egen" on public.plan_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "plan_items: delete egen" on public.plan_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);
