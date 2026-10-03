-- Valideringen: samtalsloggen (docs/moduler/validering.md, beslut i
-- docs/beslut.md 2026-10-04).
--
-- Körs MANUELLT i SQL Editor efter granskning, som de andra migreringarna.
-- Adaptern tål att tabellen saknas: då visar /app/validering "Kommer snart"
-- i loggen, och inget kraschar.
--
-- Grundaren pratar själv med kunderna (telefon, LinkedIn, möte, egen mejl)
-- och loggar samtalen här. Spark skickar ingenting (sändspärren i
-- docs/moduler/utskick-och-svar.md gäller orörd). Ett loggat svar blir
-- självrapporterade bevis via public.record_evidence (beslut B6: halv vikt,
-- högst hälften av delen), så poängen rör sig och steg 06 går att nå.
--
-- En rad per bolag och projekt. Ett nytt svar från samma bolag skriver över
-- det gamla, som ersättningsregeln i record_evidence (7.2b).
--
-- Personuppgifter: bara bolagets namn, aldrig en persons namn eller adress.
-- Citatet är den svarandes egna ord, tredjepartstext: data, aldrig
-- instruktion, och visas som ren text.

create table public.validation_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  company_name text not null
    check (char_length(btrim(company_name)) between 1 and 120 and company_name !~ '[[:cntrl:]]'),
  size_class text
    check (size_class in ('oneToFour', 'fiveToNine', 'tenToNineteen', 'twentyToFortyNine', 'fiftyPlus')),
  channel text check (channel in ('phone', 'email', 'linkedin', 'meeting', 'other')),
  status text not null default 'planned' check (status in ('planned', 'contacted', 'responded', 'declined')),
  contacted_on date,
  responded_on date,
  problem_stance text check (problem_stance in ('confirms', 'partial', 'rejects')),
  price_stance text check (price_stance in ('accepts', 'declines', 'undecided')),
  price_tested_kr integer check (price_tested_kr between 1 and 10000000),
  counter_offer_kr integer check (counter_offer_kr between 0 and 10000000),
  quote text check (quote is null or (char_length(btrim(quote)) between 1 and 1000)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Raden hör alltid till ett av grundarens egna projekt.
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade,
  -- Ett svar är komplett eller finns inte: utan storlek, ställning, pris och
  -- citat går det varken att döma på eller att visa med källa.
  constraint validation_contacts_answer_complete check (
    status <> 'responded' or (
      responded_on is not null and size_class is not null and problem_stance is not null
      and price_stance is not null and price_tested_kr is not null and quote is not null
    )
  ),
  -- Ett datum i framtiden skulle göra att beviset aldrig blev för gammalt (7.3b).
  constraint validation_contacts_dates_not_future check (
    (contacted_on is null or contacted_on <= current_date + 1)
    and (responded_on is null or responded_on <= current_date + 1)
  )
);

-- Samma bolag en gång per projekt, oavsett stora bokstäver och mellanslag.
-- Annars gick tröskeln för steg 06 (tre olika bolag) att fylla med ett bolag.
create unique index validation_contacts_one_per_company
  on public.validation_contacts (project_id, lower(regexp_replace(btrim(company_name), '\s+', ' ', 'g')));
create index validation_contacts_user_project on public.validation_contacts (user_id, project_id, created_at);

-- Status går aldrig bakåt (acceptanskriterium i docs/moduler/utskick-och-svar.md):
-- planerad → kontaktad → svarat eller nej tack. Ett nej tack kan bli ett svar
-- (bolaget ångrade sig), men ett svar blir aldrig ett nej tack. Ett svar kan
-- däremot uppdateras, till exempel när samma bolag säger något nytt.
create function public.validation_contacts_forward_only()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rank_old integer := case old.status when 'planned' then 0 when 'contacted' then 1 when 'declined' then 2 else 3 end;
  rank_new integer := case new.status when 'planned' then 0 when 'contacted' then 1 when 'declined' then 2 else 3 end;
begin
  if rank_new < rank_old then
    raise exception 'Statusen kan inte gå bakåt.' using errcode = '22023';
  end if;
  if new.project_id <> old.project_id or new.user_id <> old.user_id then
    raise exception 'Raden kan inte flyttas.' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger validation_contacts_forward_only
  before update on public.validation_contacts
  for each row execute function public.validation_contacts_forward_only();

alter table public.validation_contacts enable row level security;

create policy "validation_contacts: select egen" on public.validation_contacts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "validation_contacts: insert egen" on public.validation_contacts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "validation_contacts: update egen" on public.validation_contacts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Bara bolag som inte svarat går att ta bort. Ett svar ligger bakom ett bevis
-- och en dom; att ta bort det skulle gömma ett obekvämt svar.
create policy "validation_contacts: delete egen utan svar" on public.validation_contacts
  for delete to authenticated
  using ((select auth.uid()) = user_id and status in ('planned', 'contacted'));

-- ROLLBACK (körs för hand):
-- drop table public.validation_contacts;
-- drop function public.validation_contacts_forward_only();
