-- Session P1 (docs/uppdrag.md 14.4): evidence, score_snapshots, brain_notes,
-- trace_events. RLS på varje tabell (docs/uppdrag.md 14.6).

-- ---------------------------------------------------------------------
-- evidence — underlaget calculateScore (core/score.ts) räknar poängen
-- ifrån (docs/moduler/evidens-och-poang.md). "source", "fetched_at" och
-- "data_type" krävs uttryckligen av 14.4. Liveadaptern räknar aldrig
-- poäng själv — den hämtar rader här och skickar dem genom calculateScore.
-- ---------------------------------------------------------------------
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  -- Samma åtta delar som ScorePartId i core/score.ts.
  part_id text not null check (
    part_id in (
      'market', 'competition', 'fit', 'problem',
      'willingnessToPay', 'product', 'traction', 'feasibility'
    )
  ),
  -- Rått värde före core/score.ts's avtagande värde-trappa. Kan vara
  -- negativt (Saras steg 05: ett motsägande svar sänker delens poäng).
  points numeric not null,
  contradicts boolean not null default false,
  -- Samma tre värden som DataType i design/tokens.ts.
  data_type text not null check (data_type in ('register', 'simulation', 'customer')),
  source_name text not null,
  source_url text,
  fetched_at date not null,
  quote text,
  step_number smallint check (step_number between 1 and 12),
  created_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

-- Ordningen (created_at, id) är signifikant: den styr avtagande
-- värde-trappan i core/score.ts (item 1–10 fullt värde, 11–19 · 0.25, ...).
create index evidence_project_part_order on public.evidence (project_id, part_id, created_at, id);

alter table public.evidence enable row level security;

create policy "evidence: select egen" on public.evidence
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "evidence: insert egen" on public.evidence
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "evidence: update egen" on public.evidence
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "evidence: delete egen" on public.evidence
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- score_snapshots — historik för getScoreHistory (KPI-radens sparkline,
-- designuppdateringen i docs/status.md — bara en genuin sekvens).
-- ---------------------------------------------------------------------
create table public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  total smallint not null check (total between 1 and 100),
  phase text not null check (
    phase in ('discover', 'tryBeforeCalls', 'tryAfterCalls', 'launch', 'grow')
  ),
  delta smallint not null default 0,
  delta_reason text not null default '',
  calculated_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

create index score_snapshots_project_time on public.score_snapshots (project_id, calculated_at);

alter table public.score_snapshots enable row level security;

create policy "score_snapshots: select egen" on public.score_snapshots
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "score_snapshots: insert egen" on public.score_snapshots
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "score_snapshots: update egen" on public.score_snapshots
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "score_snapshots: delete egen" on public.score_snapshots
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- brain_notes — Hjärnan (docs/moduler/minnet.md): grundarens egen fritext,
-- en rad per användare, längdgräns satt både här och i adaptern.
-- ---------------------------------------------------------------------
create table public.brain_notes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notes text not null default '' check (char_length(notes) <= 20000),
  updated_at timestamptz not null default now()
);

alter table public.brain_notes enable row level security;

create policy "brain_notes: select egen" on public.brain_notes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "brain_notes: insert egen" on public.brain_notes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "brain_notes: update egen" on public.brain_notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "brain_notes: delete egen" on public.brain_notes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- trace_events — Spåret (docs/moduler/minnet.md): skrivs av andra moduler
-- när de gör något (utskick skickat, juridisk karta genererad, ...), läses
-- av Minnet. project_id är nullbar — vissa händelser är kontonivå.
-- ---------------------------------------------------------------------
create table public.trace_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  occurred_at timestamptz not null default now(),
  module text not null,
  description text not null,
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

create index trace_events_user_time on public.trace_events (user_id, occurred_at);

alter table public.trace_events enable row level security;

create policy "trace_events: select egen" on public.trace_events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "trace_events: insert egen" on public.trace_events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "trace_events: update egen" on public.trace_events
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "trace_events: delete egen" on public.trace_events
  for delete to authenticated
  using ((select auth.uid()) = user_id);
