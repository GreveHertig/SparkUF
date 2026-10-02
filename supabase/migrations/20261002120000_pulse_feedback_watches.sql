-- Pulsen: grundarens omdöme om signaler och egna bevakningar
-- (docs/moduler/webbresearch-och-pulsen.md, "Omdöme och bevakningar").
--
-- pulse_feedback: "Relevant" eller "Inte relevant" per signal. En signal som
-- fått "Inte relevant" visas inte igen. En rad per grundare och signal.
--
-- pulse_watches: konkurrenter och nyckelord som grundaren vill att Pulsen
-- letar efter, per projekt. Orden skickas till Tavily som data (moduldokumentet,
-- "Säkerhet") och används i relevansfiltret.
--
-- Adaptern tål att tabellerna saknas (migreringen inte körd): då visas
-- varken knapparna eller bevakningarna, och inget kraschar.

create table public.pulse_feedback (
  user_id uuid not null references auth.users (id) on delete cascade,
  signal_id uuid not null references public.pulse_signals (id) on delete cascade,
  verdict text not null check (verdict in ('relevant', 'not_relevant')),
  created_at timestamptz not null default now(),
  primary key (user_id, signal_id)
);

alter table public.pulse_feedback enable row level security;

-- Bara egna rader, och bara om signalen också är grundarens egen: en annan
-- grundares signal-id kan inte användas, inte ens för att pröva om det finns.
create policy "pulse_feedback: select egen" on public.pulse_feedback
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pulse_feedback: insert egen" on public.pulse_feedback
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.pulse_signals s
      where s.id = signal_id and s.user_id = (select auth.uid())
    )
  );

create policy "pulse_feedback: update egen" on public.pulse_feedback
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.pulse_signals s
      where s.id = signal_id and s.user_id = (select auth.uid())
    )
  );

create policy "pulse_feedback: delete egen" on public.pulse_feedback
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.pulse_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  kind text not null check (kind in ('competitor', 'keyword')),
  -- Ren text: inga styrtecken, 2–60 tecken. Adaptern rensar också.
  term text not null check (char_length(term) between 2 and 60 and term !~ '[[:cntrl:]]'),
  created_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

-- Samma ord en gång per projekt, oavsett stora och små bokstäver.
create unique index pulse_watches_unique_term on public.pulse_watches (project_id, lower(term));
create index pulse_watches_project on public.pulse_watches (project_id);

alter table public.pulse_watches enable row level security;

create policy "pulse_watches: select egen" on public.pulse_watches
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pulse_watches: insert egen" on public.pulse_watches
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Ingen update-policy: en bevakning tas bort och läggs till på nytt.
create policy "pulse_watches: delete egen" on public.pulse_watches
  for delete to authenticated
  using ((select auth.uid()) = user_id);
