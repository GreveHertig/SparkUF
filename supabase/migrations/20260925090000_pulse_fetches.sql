-- pulse_fetches — Pulsens dagscache (docs/moduler/webbresearch-och-pulsen.md,
-- "Dagscachen"). En rad per grundare och svensk kalenderdag. Adaptern gör
-- "insert ... on conflict do nothing returning" på (user_id, fetch_date)
-- INNAN Tavily anropas. Bara den förfrågan som fick raden söker, så samtidiga
-- förfrågningar ger ett enda Tavily-anrop. En dag utan träffar sparas som
-- 'empty' och söks inte om samma dag. Signalerna själva ligger kvar i
-- pulse_signals, som den här migreringen inte rör.
--
-- fetch_date räknas i Europe/Stockholm, i databasen, så att dagsgränsen inte
-- beror på serverprocessens tidszon (Vercel kör i UTC).
--
-- claimed_at gör att en rad som fastnat på 'pending' (servern dog mellan claim
-- och Tavily) kan tas över med en villkorad update. Beslut Erik 2026-09-25,
-- docs/beslut.md.

create table public.pulse_fetches (
  user_id uuid not null references auth.users (id) on delete cascade,
  fetch_date date not null default ((now() at time zone 'Europe/Stockholm')::date),
  status text not null default 'pending'
    check (status in ('pending', 'done', 'empty', 'error')),
  claimed_at timestamptz not null default now(),
  -- Sätts när hämtningen är avslutad, dvs. när status lämnar 'pending'.
  fetched_at timestamptz,
  primary key (user_id, fetch_date),
  check ((status = 'pending') = (fetched_at is null))
);

alter table public.pulse_fetches enable row level security;

-- Användaren läser, skapar och uppdaterar bara sina egna rader. Ingen
-- delete-policy: raderna försvinner med kontot (on delete cascade).
create policy "pulse_fetches: select egen" on public.pulse_fetches
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "pulse_fetches: insert egen" on public.pulse_fetches
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "pulse_fetches: update egen" on public.pulse_fetches
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
