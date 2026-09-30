-- Onboardingen live (docs/status.md, "Onboarding live, PR 1"): profilsamtalets
-- status på profilraden, längdgränser på det grundaren skriver och
-- updated_at som sätts av databasen. Inga nya tabeller och inga nya
-- policyer: profiles och projects har redan select/insert/update/delete
-- "egen" (20260918090000_profiles_projects_journey.sql).
--
-- Körs MANUELLT i SQL Editor efter granskning. Kör först kontrollfrågan
-- nedan. Den ska ge 0 rader, annars fäller de nya check-villkoren
-- migreringen (hela filen körs i en transaktion, så inget halvt läge blir
-- kvar). Rensa eller korta de rader den visar först.
--
--   select 'profiles' as tabell, user_id::text as id,
--          char_length(role) as role, char_length(bio) as bio,
--          char_length(time_available) as time_available,
--          char_length(money_available) as money_available,
--          char_length(risk_appetite) as risk_appetite
--     from public.profiles
--    where char_length(role) > 1000 or char_length(bio) > 1000
--       or char_length(time_available) > 1000
--       or char_length(money_available) > 1000
--       or char_length(risk_appetite) > 1000
--   union all
--   select 'projects', id::text, char_length(btrim(name)),
--          char_length(btrim(one_liner)), null, null, null
--     from public.projects
--    where char_length(btrim(name)) not between 1 and 80
--       or char_length(btrim(one_liner)) not between 1 and 280;
--
-- Gränserna speglar core/onboarding.ts (PROFILE_ANSWER_MAX_LENGTH,
-- PROJECT_NAME_MAX_LENGTH, PROJECT_ONE_LINER_MAX_LENGTH), vaktat av
-- supabase/migrations/onboarding.test.ts. zod i server actions är det
-- första lagret. Villkoren här gäller även den som skriver direkt mot
-- PostgREST med sin egen session, förbi appen.

begin;

-- ---------------------------------------------------------------------
-- profiles: var grundaren står i onboardingen. Steg 1 ("Om dig") räknas
-- som klart när onboarding_completed_at är satt (docs/moduler/resan.md),
-- eftersom ingång A inte har något projekt att hänga en journey_steps-rad på.
-- Svaren skrivs till de befintliga kolumnerna role, bio, time_available,
-- money_available och risk_appetite (core/onboarding.ts).
-- ---------------------------------------------------------------------
alter table public.profiles
  add column onboarding_entry text,
  add column onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_onboarding_entry_giltig
    check (onboarding_entry in ('noIdea', 'hasIdea')),
  add constraint profiles_onboarding_klar_har_ingang
    check (onboarding_completed_at is null or onboarding_entry is not null),
  add constraint profiles_role_langd check (char_length(role) <= 1000),
  add constraint profiles_bio_langd check (char_length(bio) <= 1000),
  add constraint profiles_time_available_langd check (char_length(time_available) <= 1000),
  add constraint profiles_money_available_langd check (char_length(money_available) <= 1000),
  add constraint profiles_risk_appetite_langd check (char_length(risk_appetite) <= 1000);

-- ---------------------------------------------------------------------
-- projects: namn och ingress är alltid ifyllda (docs/moduler/projekt-och-ide.md)
-- och har ett tak.
-- ---------------------------------------------------------------------
alter table public.projects
  add constraint projects_name_langd
    check (char_length(btrim(name)) between 1 and 80),
  add constraint projects_one_liner_langd
    check (char_length(btrim(one_liner)) between 1 and 280);

-- ---------------------------------------------------------------------
-- updated_at sätts av databasen vid varje update, inte av adaptrarna.
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger journey_steps_set_updated_at
  before update on public.journey_steps
  for each row execute function public.set_updated_at();

commit;
