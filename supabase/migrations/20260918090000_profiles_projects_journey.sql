-- Session P1 (docs/uppdrag.md 14.4): profiles, projects, journey_steps.
-- RLS på varje tabell, policyer begränsade till auth.uid() = user_id
-- (docs/uppdrag.md 14.6 — ingen tabell utan RLS-policy).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- profiles — en rad per inloggad användare (docs/moduler/profil.md,
-- docs/moduler/minnet.md: ProfileSummary är en bredare vy av samma rad).
-- ---------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  initials text not null default '',
  -- Minnets Profilen-flik (docs/moduler/minnet.md: ProfileSummary).
  -- "time"/"money" är reserverade ord i SQL, döpta om till *_available.
  role text,
  bio text,
  time_available text,
  money_available text,
  risk_appetite text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select egen" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "profiles: insert egen" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "profiles: update egen" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "profiles: delete egen" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Skapar profilraden automatiskt när ett konto skapas, så getProfile()
-- (ports/ProfileRepository.ts) alltid hittar en rad — även för ett konto
-- skapat i Supabase-dashboarden — utan ett andra, misslyckbart skrivanrop
-- från applikationen efter signup.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  full_name text := coalesce(new.raw_user_meta_data ->> 'name', '');
  name_parts text[] := array_remove(string_to_array(trim(full_name), ' '), '');
  derived_initials text := '';
begin
  if array_length(name_parts, 1) >= 1 then
    derived_initials := upper(left(name_parts[1], 1));
  end if;
  if array_length(name_parts, 1) >= 2 then
    derived_initials := derived_initials || upper(left(name_parts[2], 1));
  end if;

  insert into public.profiles (user_id, name, initials)
  values (new.id, full_name, derived_initials);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- projects — en grundare har ett projekt i taget i prototypen
-- (docs/moduler/projekt-och-ide.md).
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  one_liner text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Mål för sammansatta främmande nycklar (journey_steps m.fl.) så att en
  -- rad aldrig kan hängas på någon annans projekt.
  unique (id, user_id)
);

-- Ett aktivt projekt per användare (14.4: "en grundare har ett projekt i
-- taget i prototypen" — flera projekt per användare kräver ett eget beslut).
create unique index projects_ett_aktivt_per_user on public.projects (user_id)
  where is_active;

alter table public.projects enable row level security;

create policy "projects: select egen" on public.projects
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "projects: insert egen" on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "projects: update egen" on public.projects
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "projects: delete egen" on public.projects
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- journey_steps — framsteg per steg (docs/moduler/resan.md). De 12
-- stegens metadata (titel, fas, maxPoints) är produktkonstanter i
-- core/journey.ts, inte databasrader. Ingen status-kolumn: done/current/
-- locked härleds av core/journey.ts ur "högsta avklarade steg", så
-- invarianten "högst ett current" är sann av konstruktion.
-- ---------------------------------------------------------------------
create table public.journey_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  step_number smallint not null check (step_number between 1 and 12),
  completed_at timestamptz,
  why text,
  done_items text[] not null default '{}',
  highlights text[] not null default '{}',
  action_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, step_number),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

alter table public.journey_steps enable row level security;

create policy "journey_steps: select egen" on public.journey_steps
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "journey_steps: insert egen" on public.journey_steps
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "journey_steps: update egen" on public.journey_steps
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "journey_steps: delete egen" on public.journey_steps
  for delete to authenticated
  using ((select auth.uid()) = user_id);
