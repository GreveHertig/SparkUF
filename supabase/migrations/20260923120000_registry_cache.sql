-- registry_cache — SKISS inför SCB-nyckeln (30 september 2026). Cache för
-- råa registersvar (SCB:s företagsregister-API, Bolagsverkets API för
-- värdefulla datamängder), så att samma fråga inte hämtas om inom giltighetstiden.
--
-- INGET SKRIVER HIT ÄN. Transporten (lib/server/scb.ts, bolagsverket.ts) är
-- oskriven och Registret ligger bakom licensgrinden (docs/moduler/registret.md,
-- "Licensgrind" punkt 4: ingen lagring förrän dataspiken §6 fråga 4 är avgjord).
-- Svarsformen är okänd tills SCB publicerar det nya API:t (docs/dataspiken.md,
-- "SCB:s företagsregister-API"), därför lagras svaret som jsonb.
--
-- Ägs per användare: RLS ger bara åtkomst till egna rader (CLAUDE.md, samma
-- mönster som pulse_signals). Ingen service role behövs, och raderna tas bort
-- med kontot. Källa och hämtdatum finns på varje rad (Datalöftet).

create table public.registry_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source text not null check (source in ('scb_foretagsregistret', 'bolagsverket_vdm')),
  -- Normaliserad nyckel byggd i kod av strukturerad indata (t.ex. SNI-kod +
  -- storleksklass), aldrig fritext från användaren.
  request_key text not null check (char_length(request_key) between 1 and 512),
  response jsonb not null,
  row_count integer not null check (row_count >= 0),
  source_name text not null,
  source_url text not null,
  fetched_at timestamptz not null,
  -- SCB uppdaterar varje natt utom lördag–söndag, så en vecka är taket.
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, source, request_key),
  check (expires_at > fetched_at and expires_at <= fetched_at + interval '7 days')
);

create index registry_cache_expires_at on public.registry_cache (expires_at);

alter table public.registry_cache enable row level security;

create policy "registry_cache: select egen" on public.registry_cache
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "registry_cache: insert egen" on public.registry_cache
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "registry_cache: update egen" on public.registry_cache
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "registry_cache: delete egen" on public.registry_cache
  for delete to authenticated
  using ((select auth.uid()) = user_id);
