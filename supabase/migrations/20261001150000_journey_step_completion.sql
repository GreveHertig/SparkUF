-- Resans skrivväg: ett steg markeras klart bara när dess krav är uppfyllda.
-- Beslut 2026-10-01 i docs/beslut.md, docs/bevislagring.md 11.7.
--
-- Före den här migreringen kunde en inloggad användare skriva completed_at i
-- journey_steps direkt mot Supabase REST (policyerna "insert/update/delete
-- egen"). Fasen räknas ur högsta avklarade steg, så den som markerade steg
-- 11 som klart låste upp alla delar och höjde taket till 100. Samma hål som
-- fel 1 i bevislagringen, och samma lösning: villkoret sitter i databasen.
--
-- Efter migreringen gäller:
-- * Ingen klient kan skriva i journey_steps direkt. Rätten är indragen och
--   skrivpolicyerna borttagna. Läsning av egna rader står kvar.
-- * Ett steg markeras klart bara via public.complete_journey_step (security
--   definer). Användaren tas ur auth.uid() och projektet ur det aktiva
--   projektet, aldrig ur indata.
-- * Funktionen kräver att föregående steg är klart och att stegets krav i
--   public.journey_step_requirements är uppfyllda av bevis som räknas (inte
--   återkallade, inte äldre än sortens livslängd). Ett steg utan krav kan inte
--   markeras klart alls.
-- * Kraven hålls i synk med core/journeyRequirements.ts av
--   supabase/migrations/journeyStepCompletion.pg.test.ts.
--
-- Rör inte profiles eller projects. projects läses bara, för att hitta det
-- aktiva projektet. Redan avklarade steg (skrivna direkt före migreringen)
-- lämnas orörda, se docs/status.md.
--
-- Rollback: se blocket längst ner.

-- ---------------------------------------------------------------------
-- journey_step_requirements — kraven per steg. Raderna i samma grupp är
-- alternativ (en räcker), och alla grupper måste vara uppfyllda.
-- ---------------------------------------------------------------------
create table public.journey_step_requirements (
  id smallint generated always as identity primary key,
  step_number smallint not null check (step_number between 1 and 12),
  req_group text not null check (char_length(req_group) between 1 and 60),
  evidence_kind text references public.evidence_kinds (kind),
  subject_ref text check (char_length(subject_ref) between 1 and 200),
  condition text check (condition in ('activeProject')),
  -- Antingen ett bevis eller ett villkor, aldrig båda och aldrig inget.
  check ((evidence_kind is null) <> (condition is null)),
  check (subject_ref is null or evidence_kind is not null),
  unique nulls not distinct (step_number, req_group, evidence_kind, subject_ref, condition)
);

alter table public.journey_step_requirements enable row level security;

create policy "journey_step_requirements: select alla" on public.journey_step_requirements
  for select to authenticated
  using (true);

-- Läsbar men stängd för skrivning: ändras bara via migreringar.
revoke insert, update, delete on table public.journey_step_requirements from anon, authenticated;

insert into public.journey_step_requirements (step_number, req_group, evidence_kind, subject_ref, condition) values
  (1,  'fit_skills',       'profileFitAnswer',         'fit:skills',  null),
  (1,  'fit_network',      'profileFitAnswer',         'fit:network', null),
  (1,  'fit_time',         'profileFitAnswer',         'fit:time',    null),
  (1,  'fit_money',        'profileFitAnswer',         'fit:money',   null),
  (2,  'activeProject',    null,                       null,          'activeProject'),
  (3,  'marketCount',      'registerMarketCount',      null,          null),
  (4,  'competitorSet',    'registerCompetitorSet',    null,          null),
  (5,  'problem',          'customerProblemConfirmed', null,          null),
  (5,  'problem',          'customerProblemRejected',  null,          null),
  (5,  'willingnessToPay', 'customerPriceAccepted',    null,          null),
  (5,  'willingnessToPay', 'customerPriceDeclined',    null,          null),
  (8,  'productScope',     'productScopeFromEvidence', null,          null),
  (9,  'registration',     'formalRegistrationDone',   null,          null),
  (10, 'published',        'productPublished',         null,          null),
  (11, 'payingCustomer',   'payingCustomer',           null,          null);

-- ---------------------------------------------------------------------
-- journey_steps: läsa sitt eget, skriva bara via complete_journey_step.
-- "journey_steps: select egen" från 20260918090000 behålls.
-- ---------------------------------------------------------------------
drop policy "journey_steps: insert egen" on public.journey_steps;
drop policy "journey_steps: update egen" on public.journey_steps;
drop policy "journey_steps: delete egen" on public.journey_steps;
revoke insert, update, delete on table public.journey_steps from anon, authenticated;

-- ---------------------------------------------------------------------
-- complete_journey_step — grundarens enda väg att markera ett steg klart.
-- Tar bara emot stegnumret. Går att anropa direkt via Supabase REST, så
-- varje kontroll sitter här. Idempotent: ett redan klart steg ger tillbaka
-- sitt datum utan att ändras.
-- ---------------------------------------------------------------------
create function public.complete_journey_step(p_step_number smallint)
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
  v_missing text;
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;
  if p_step_number is null or p_step_number not between 1 and 12 then
    raise exception 'Okänt steg.' using errcode = '22023';
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

  if p_step_number > 1 and not exists (
    select 1 from public.journey_steps
      where project_id = v_project and step_number = p_step_number - 1 and completed_at is not null
  ) then
    raise exception 'Föregående steg är inte klart.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.journey_step_requirements where step_number = p_step_number) then
    raise exception 'Steget har inget krav som kan uppfyllas än.' using errcode = '42501';
  end if;

  -- Första grupp där ingen rad är uppfylld. Ett bevis räknas om det inte är
  -- återkallat och inte äldre än sortens livslängd (samma gräns som isStale i
  -- core/evidenceInput.ts: i dag minus faktumets datum får vara högst
  -- fresh_for_days).
  select r.req_group into v_missing
    from public.journey_step_requirements r
    where r.step_number = p_step_number
    group by r.req_group
    having not bool_or(
      case
        when r.condition = 'activeProject' then true
        else exists (
          select 1 from public.evidence e
            join public.evidence_kinds k on k.kind = e.kind
            where e.project_id = v_project
              and e.kind = r.evidence_kind
              and (r.subject_ref is null or e.subject_ref = r.subject_ref)
              and e.retracted_at is null
              and (k.fresh_for_days is null or v_today - e.fetched_at <= k.fresh_for_days)
        )
      end
    )
    order by r.req_group
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

-- ---------------------------------------------------------------------
-- ROLLBACK (körs för hand, i den här ordningen). OBS: steg 2 öppnar
-- journey_steps för direkt skrivning igen, och därmed hålet (fasen går att
-- sätta själv). Backa bara om skrivvägen ska byggas om.
--
-- 1. drop function public.complete_journey_step(smallint);
-- 2. grant insert, update, delete on table public.journey_steps to authenticated;
--    create policy "journey_steps: insert egen" on public.journey_steps for insert to authenticated with check ((select auth.uid()) = user_id);
--    create policy "journey_steps: update egen" on public.journey_steps for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
--    create policy "journey_steps: delete egen" on public.journey_steps for delete to authenticated using ((select auth.uid()) = user_id);
-- 3. drop table public.journey_step_requirements;
-- ---------------------------------------------------------------------
