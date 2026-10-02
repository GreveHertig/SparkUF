-- Steg 1 räknas klart när onboardingen är klar, och bara onboardingflödet
-- kan markera onboardingen klar. Beslut Erik 2026-10-01 och 2026-10-02 i
-- docs/status.md ("Onboarding live, PR 2", "plattform/steg1-klart").
--
-- Före den här migreringen:
-- * complete_journey_step krävde fyra profileFitAnswer-bevis för steg 1 och
--   en journey_steps-rad för steg 1 innan steg 2. Onboardingen skriver bara
--   till profiles, så steg 2 gick inte att markera klart. Onboardingen skapar
--   aldrig profileFitAnswer-bevis: det vore påhittade bevis (Datalöftet).
-- * Klienten kunde sätta profiles.onboarding_completed_at och
--   onboarding_entry med ett eget PostgREST-anrop (policyn "update egen"),
--   hoppa över spärren mot /app och, när flaggan blir ett krav här, låsa upp
--   steg 1 och 2 själv.
--
-- Efter migreringen gäller:
-- * Steg 1 är klart när onboarding_completed_at är satt, och bara då.
--   complete_journey_step(1) kräver inget projekt och skriver ingen rad. Steg
--   2 kräver klar onboarding i stället för en rad för steg 1. Gamla
--   journey_steps-rader för steg 1 räknas inte längre (beslut 2026-10-02).
-- * Klienten kan inte skapa eller radera profilrader. Raden skapas av
--   handle_new_user() vid signup och försvinner med kontot (on delete
--   cascade). Ingen kod skapade eller raderade profilrader.
-- * Klienten får uppdatera bara kolumnerna i grant-satsen nedan. En ny
--   kolumn i profiles är stängd för klienten tills den läggs till där, och
--   migrations.test.ts kräver ett beslut för varje kolumn.
-- * Onboardingen markeras klar bara via public.complete_onboarding (security
--   definer), som prövar ingången och svaren och skriver allt i en
--   uppdatering. Frågorna per ingång speglar PROFILE_QUESTIONS_BY_ENTRY i
--   core/onboarding.ts, vaktat av supabase/migrations/onboardingWrite.pg.test.ts.
--
-- Hålls i synk med core/journeyRequirements.ts av
-- supabase/migrations/journeyStepCompletion.pg.test.ts.
--
-- Körs MANUELLT i SQL Editor (hela filen) efter granskning. Kör sedan
-- adapters/live/rls.live.test.ts.
--
-- Rollback: se blocket längst ner.

begin;

-- ---------------------------------------------------------------------
-- profiles: stängd för insert och delete, update bara på svarskolumnerna.
-- "profiles: select egen" och "profiles: update egen" behålls.
-- ---------------------------------------------------------------------
drop policy "profiles: insert egen" on public.profiles;
drop policy "profiles: delete egen" on public.profiles;
revoke insert, update, delete on table public.profiles from anon, authenticated;
grant update (name, initials, role, bio, time_available, money_available, risk_appetite)
  on table public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- complete_onboarding — enda vägen att markera onboardingen klar. Tar
-- ingången och svaren som ett jsonb-objekt {frågans id: svar}. Användaren
-- tas ur auth.uid(), aldrig ur indata. Svaren är data, aldrig instruktioner.
-- En klar onboarding skrivs aldrig över (ingen omgörning i v1): ett andra
-- anrop ger felkod 55000.
-- ---------------------------------------------------------------------
create function public.complete_onboarding(p_entry text, p_answers jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_questions text[];
  v_question text;
  v_answer text;
  v_answers jsonb := '{}';
  v_completed_at timestamptz;
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;

  -- Speglar PROFILE_QUESTIONS_BY_ENTRY i core/onboarding.ts.
  v_questions := case p_entry
    when 'noIdea' then array['role', 'bio', 'time', 'money', 'risk']
    when 'hasIdea' then array['role', 'time', 'money']
  end;
  if v_questions is null then
    raise exception 'Okänd ingång.' using errcode = '22023';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Svaren saknas.' using errcode = '22023';
  end if;
  -- Exakt ingångens frågor. Ett jsonb-objekt har varje nyckel en gång.
  if (select array_agg(k order by k) from jsonb_object_keys(p_answers) k)
     is distinct from (select array_agg(q order by q) from unnest(v_questions) q) then
    raise exception 'Svaren ska vara exakt ingångens frågor.' using errcode = '22023';
  end if;

  foreach v_question in array v_questions loop
    if jsonb_typeof(p_answers -> v_question) <> 'string' then
      raise exception 'Svaret på % är inte text.', v_question using errcode = '22023';
    end if;
    v_answer := regexp_replace(p_answers ->> v_question, '^\s+|\s+$', '', 'g');
    if char_length(v_answer) not between 1 and 1000 then
      raise exception 'Svaret på % är tomt eller för långt.', v_question using errcode = '22023';
    end if;
    v_answers := v_answers || jsonb_build_object(v_question, v_answer);
  end loop;

  -- En fråga som inte hör till ingången lämnar sin kolumn orörd.
  update public.profiles set
      role = coalesce(v_answers ->> 'role', role),
      bio = coalesce(v_answers ->> 'bio', bio),
      time_available = coalesce(v_answers ->> 'time', time_available),
      money_available = coalesce(v_answers ->> 'money', money_available),
      risk_appetite = coalesce(v_answers ->> 'risk', risk_appetite),
      onboarding_entry = p_entry,
      onboarding_completed_at = now()
    where user_id = v_user and onboarding_completed_at is null
    returning onboarding_completed_at into v_completed_at;
  if v_completed_at is not null then
    return v_completed_at;
  end if;

  if exists (select 1 from public.profiles where user_id = v_user) then
    raise exception 'Onboardingen är redan klar.' using errcode = '55000';
  end if;
  raise exception 'Profilraden saknas.' using errcode = 'P0002';
end;
$$;

revoke execute on function public.complete_onboarding(text, jsonb) from public;
grant execute on function public.complete_onboarding(text, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- journey_step_requirements: steg 1 kräver klar onboarding, inte fyra
-- passformssvar. Passformssvaren ger fortfarande poäng i Passform.
-- ---------------------------------------------------------------------
alter table public.journey_step_requirements drop constraint journey_step_requirements_condition_check;
alter table public.journey_step_requirements add constraint journey_step_requirements_condition_check
  check (condition in ('activeProject', 'onboardingCompleted'));

delete from public.journey_step_requirements where step_number = 1;
insert into public.journey_step_requirements (step_number, req_group, evidence_kind, subject_ref, condition) values
  (1, 'onboardingCompleted', null, null, 'onboardingCompleted');

-- ---------------------------------------------------------------------
-- complete_journey_step — samma funktion som i 20261001180000, med tre
-- ändringar: steg 1 avgörs av onboarding_completed_at före projektet, steg 2
-- kräver klar onboarding i stället för en rad för steg 1, och villkoret
-- onboardingCompleted räknas bland kraven.
-- ---------------------------------------------------------------------
create or replace function public.complete_journey_step(p_step_number smallint)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_project uuid;
  v_today date := (now() at time zone 'Europe/Stockholm')::date;
  v_completed_at timestamptz;
  v_onboarded_at timestamptz;
  v_missing text;
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;
  if p_step_number is null or p_step_number not between 1 and 12 then
    raise exception 'Okänt steg.' using errcode = '22023';
  end if;

  select onboarding_completed_at into v_onboarded_at from public.profiles where user_id = v_user;

  -- Steg 1 är klart när onboardingen är klar och bara då. Ingång A har inget
  -- projekt att hänga en rad på, så inget projekt krävs och ingen rad skrivs.
  if p_step_number = 1 then
    if v_onboarded_at is null then
      raise exception 'Stegets krav är inte uppfyllda (onboardingCompleted).' using errcode = '42501';
    end if;
    return v_onboarded_at;
  end if;

  select id into v_project from public.projects where user_id = v_user and is_active limit 1;
  if v_project is null then
    raise exception 'Inget aktivt projekt.' using errcode = '22023';
  end if;

  -- En skrivning i taget per projekt (samma lås som record_evidence), så att
  -- ett återkallat bevis och en stegmarkering inte kan korsa varandra.
  perform pg_advisory_xact_lock(hashtextextended(v_project::text, 0));

  select completed_at into v_completed_at from public.journey_steps
    where project_id = v_project and step_number = p_step_number and completed_at is not null;
  if v_completed_at is not null then
    return v_completed_at;
  end if;

  if (p_step_number = 2 and v_onboarded_at is null)
     or (p_step_number > 2 and not exists (
       select 1 from public.journey_steps
         where project_id = v_project and step_number = p_step_number - 1 and completed_at is not null
     )) then
    raise exception 'Föregående steg är inte klart.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.journey_step_requirements where step_number = p_step_number) then
    raise exception 'Steget har inget krav som kan uppfyllas än.' using errcode = '42501';
  end if;

  -- Första grupp som inte är uppfylld. Ett bevis räknas om det inte är
  -- återkallat och inte äldre än sortens livslängd (samma gräns som isStale i
  -- core/evidenceInput.ts). Villkoren på beviset sitter i join-villkoret, så
  -- att en grupp utan bevis ändå kommer med (med 0).
  select g.req_group into v_missing
    from (
      select r.req_group,
        coalesce(bool_or(
          r.condition = 'activeProject'
          or (r.condition = 'onboardingCompleted' and v_onboarded_at is not null)
        ), false) as has_condition,
        count(distinct e.id) as n,
        count(distinct e.subject_ref) as subjects
      from public.journey_step_requirements r
      left join public.evidence e
        on r.evidence_kind is not null
        and e.project_id = v_project
        and e.kind = r.evidence_kind
        and (r.subject_ref is null or e.subject_ref = r.subject_ref)
        and e.retracted_at is null
        and exists (
          select 1 from public.evidence_kinds k
            where k.kind = e.kind and (k.fresh_for_days is null or v_today - e.fetched_at <= k.fresh_for_days)
        )
      where r.step_number = p_step_number
      group by r.req_group
    ) g
    left join public.journey_step_group_thresholds t
      on t.step_number = p_step_number and t.req_group = g.req_group
    where not (
      g.has_condition
      or (g.n >= coalesce(t.min_count, 1) and g.subjects >= coalesce(t.min_subjects, 1))
    )
    order by g.req_group
    limit 1;
  if v_missing is not null then
    raise exception 'Stegets krav är inte uppfyllda (%).', v_missing using errcode = '42501';
  end if;

  insert into public.journey_steps (user_id, project_id, step_number, completed_at)
    values (v_user, v_project, p_step_number, now())
    on conflict (project_id, step_number)
      do update set completed_at = excluded.completed_at, updated_at = now()
    returning completed_at into v_completed_at;
  return v_completed_at;
end;
$$;

revoke execute on function public.complete_journey_step(smallint) from public;
grant execute on function public.complete_journey_step(smallint) to authenticated;

commit;

-- ---------------------------------------------------------------------
-- ROLLBACK (körs för hand, i den här ordningen). OBS: steg 3 öppnar
-- onboarding-kolumnerna för klienten igen, och därmed hålet (spärren mot
-- /app går att hoppa över). Steg 2 kan då inte markeras klart igen.
--
-- 1. Kör om create or replace function public.complete_journey_step ur
--    20261001180000_journey_steps_06_07_12.sql.
-- 2. delete from public.journey_step_requirements where step_number = 1;
--    insert into public.journey_step_requirements (step_number, req_group, evidence_kind, subject_ref, condition) values
--      (1, 'fit_skills', 'profileFitAnswer', 'fit:skills', null),
--      (1, 'fit_network', 'profileFitAnswer', 'fit:network', null),
--      (1, 'fit_time', 'profileFitAnswer', 'fit:time', null),
--      (1, 'fit_money', 'profileFitAnswer', 'fit:money', null);
--    alter table public.journey_step_requirements drop constraint journey_step_requirements_condition_check;
--    alter table public.journey_step_requirements add constraint journey_step_requirements_condition_check
--      check (condition in ('activeProject'));
-- 3. drop function public.complete_onboarding(text, jsonb);
--    grant insert, update, delete on table public.profiles to authenticated;
--    create policy "profiles: insert egen" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
--    create policy "profiles: delete egen" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);
--    Återgå sedan till liveadapterns direkta update i ProfileRepository.completeOnboarding.
-- ---------------------------------------------------------------------
