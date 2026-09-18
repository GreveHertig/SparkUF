-- Session P1 (docs/uppdrag.md 14.4): companies, outreach_messages,
-- responses, legal_items, pulse_signals. Ingen liveadapter kopplas till de
-- här tabellerna i den här sessionen (Registret väntar på ett dataavtal,
-- Utskick och svar på Gmail OAuth, Pulsen på Tavily — se
-- docs/status.md "Session P2"). Kolumnerna formas efter typerna som redan
-- finns i ports/RegistryProvider.ts, ports/OutreachProvider.ts,
-- core/domain.ts (PulseSignal) och types/legal.ts (JuridisktKrav).
-- Engelsk snake_case genomgående — adaptern som byggs senare mappar till de
-- svenska fältnamnen i porten. RLS på varje tabell (docs/uppdrag.md 14.6).

-- ---------------------------------------------------------------------
-- companies — delad cache av registerdata (Bolagsverket/SCB), inte
-- användarägd (docs/moduler/registret.md). Läsbar för alla inloggade,
-- ingen klient skriver — Registret-modulens liveadapter skriver via en
-- servermiljö den dagen dataavtalet finns.
-- ---------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sni_code text not null,
  employees integer,
  revenue_ksek integer,
  county text,
  source_name text not null,
  source_url text,
  fetched_at date not null,
  created_at timestamptz not null default now()
);

create index companies_sni_code on public.companies (sni_code);

alter table public.companies enable row level security;

create policy "companies: select alla inloggade" on public.companies
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- outreach_messages — grundarens utskick (docs/moduler/utskick-och-svar.md).
-- ---------------------------------------------------------------------
create table public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  company_id uuid references public.companies (id),
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'opened', 'responded')),
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

alter table public.outreach_messages enable row level security;

create policy "outreach_messages: select egen" on public.outreach_messages
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "outreach_messages: insert egen" on public.outreach_messages
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "outreach_messages: update egen" on public.outreach_messages
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "outreach_messages: delete egen" on public.outreach_messages
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- responses — svar på ett utskick (docs/moduler/utskick-och-svar.md).
-- ---------------------------------------------------------------------
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outreach_message_id uuid not null,
  received_at timestamptz not null default now(),
  body text,
  quote text,
  foreign key (outreach_message_id, user_id) references public.outreach_messages (id, user_id) on delete cascade
);

alter table public.responses enable row level security;

create policy "responses: select egen" on public.responses
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "responses: insert egen" on public.responses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "responses: update egen" on public.responses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "responses: delete egen" on public.responses
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- legal_items — grundarens juridiska karta (docs/moduler/juridisk-koll.md,
-- types/legal.ts: JuridisktKrav). LegalAdvisor-porten har redan en klar
-- liveadapter (adapters/live/LegalAdvisor.ts, Gemini + kuraterade källor)
-- men den skriver inte till Supabase än — kopplas i en senare session.
-- ---------------------------------------------------------------------
create table public.legal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  item_key text not null,
  title text not null,
  description text not null,
  applies_to text[] not null default '{}',
  status text not null default 'ej_tillampligt' check (
    status in ('uppfyllt', 'ej_uppfyllt', 'ej_tillampligt')
  ),
  deadline date,
  cost_sek integer,
  authority text,
  source_name text not null,
  source_url text,
  fetched_at date not null,
  created_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

alter table public.legal_items enable row level security;

create policy "legal_items: select egen" on public.legal_items
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "legal_items: insert egen" on public.legal_items
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "legal_items: update egen" on public.legal_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "legal_items: delete egen" on public.legal_items
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- pulse_signals — Pulsen (docs/moduler/webbresearch-och-pulsen.md,
-- core/domain.ts: PulseSignal).
-- ---------------------------------------------------------------------
create table public.pulse_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  category text not null,
  headline text not null,
  why_it_matters text not null,
  signal_at timestamptz not null default now(),
  source_name text not null,
  source_url text,
  fetched_at date not null,
  created_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

create index pulse_signals_project_time on public.pulse_signals (project_id, signal_at desc);

alter table public.pulse_signals enable row level security;

create policy "pulse_signals: select egen" on public.pulse_signals
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pulse_signals: insert egen" on public.pulse_signals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pulse_signals: update egen" on public.pulse_signals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "pulse_signals: delete egen" on public.pulse_signals
  for delete to authenticated
  using ((select auth.uid()) = user_id);
