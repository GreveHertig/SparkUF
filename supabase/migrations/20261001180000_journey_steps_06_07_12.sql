-- Krav för steg 06, 07 och 12 i resan. Beslut 2026-10-01 i docs/beslut.md.
--
-- * Steg 06 Domen: minst fem kundsvar som räknas i Problem och
--   Betalningsvilja tillsammans, från minst tre olika bolag (subject_ref).
--   Kräver en tröskel per grupp: public.journey_step_group_thresholds.
-- * Steg 07 Affärsfall och pris: ett beslutat pris, ny sort priceDecided.
--   Självrapporterbart och märkt som självrapporterat. Ett godtaget pris är
--   inte ett krav: det kräver svar utifrån och dubblerar steg 05 och 06.
-- * Steg 12 Kapital: en inskickad ansökan till en finansiär, ny sort
--   fundingApplied.
--
-- De två nya sorterna ger ingen poäng (base_points 0). Ett pris grundaren
-- själv satt bevisar inte att någon betalar det, och en ansökan är inte
-- beviljade pengar. core/evidenceInput.ts skickar dem inte till
-- calculateScore, så de fyller aldrig en tom del (beslut B4).
--
-- Hålls i synk med core/evidenceKinds.ts (evidenceWritePath.pg.test.ts) och
-- core/journeyRequirements.ts (journeyStepCompletion.pg.test.ts).
--
-- Rör inte profiles eller projects.
--
-- Rollback: se blocket längst ner.

-- ---------------------------------------------------------------------
-- evidence_kinds: sorter utan poäng tillåts, två nya sorter.
-- ---------------------------------------------------------------------
alter table public.evidence_kinds drop constraint evidence_kinds_base_points_check;
alter table public.evidence_kinds add constraint evidence_kinds_base_points_check check (base_points >= 0);

insert into public.evidence_kinds (kind, part_id, data_type, base_points, contradicts, entered_by, fresh_for_days) values
  ('priceDecided',   'willingnessToPay', 'customer', 0, false, 'either', 365),
  ('fundingApplied', 'feasibility',      'register', 0, false, 'either', null);

-- ---------------------------------------------------------------------
-- journey_step_group_thresholds — grupper som kräver mer än ett bevis.
-- En grupp utan rad här kräver ett bevis (min_count 1, min_subjects 1).
-- ---------------------------------------------------------------------
create table public.journey_step_group_thresholds (
  step_number smallint not null check (step_number between 1 and 12),
  req_group text not null check (char_length(req_group) between 1 and 60),
  min_count smallint not null check (min_count >= 1),
  min_subjects smallint not null check (min_subjects >= 1),
  check (min_subjects <= min_count),
  primary key (step_number, req_group)
);

alter table public.journey_step_group_thresholds enable row level security;

create policy "journey_step_group_thresholds: select alla" on public.journey_step_group_thresholds
  for select to authenticated
  using (true);

-- Läsbar men stängd för skrivning: ändras bara via migreringar.
revoke insert, update, delete on table public.journey_step_group_thresholds from anon, authenticated;

insert into public.journey_step_requirements (step_number, req_group, evidence_kind, subject_ref, condition) values
  (6,  'verdictAnswers', 'customerProblemConfirmed', null, null),
  (6,  'verdictAnswers', 'customerProblemRejected',  null, null),
  (6,  'verdictAnswers', 'customerPriceAccepted',    null, null),
  (6,  'verdictAnswers', 'customerPriceDeclined',    null, null),
  (7,  'priceDecided',   'priceDecided',             null, null),
  (12, 'fundingApplied', 'fundingApplied',           null, null);

insert into public.journey_step_group_thresholds (step_number, req_group, min_count, min_subjects) values
  (6, 'verdictAnswers', 5, 3);

-- ---------------------------------------------------------------------
-- complete_journey_step — samma funktion som i 20261001150000, men en grupp
-- räknas nu som helhet: bevis som matchar någon av gruppens rader (varje
-- bevis en gång) mot gruppens tröskel, och antalet olika subject_ref bland
-- dem mot min_subjects. Utan tröskel räcker ett bevis, som förut.
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

  -- Första grupp som inte är uppfylld. Ett bevis räknas om det inte är
  -- återkallat och inte äldre än sortens livslängd (samma gräns som isStale i
  -- core/evidenceInput.ts). Villkoren på beviset sitter i join-villkoret, så
  -- att en grupp utan bevis ändå kommer med (med 0).
  select g.req_group into v_missing
    from (
      select r.req_group,
        coalesce(bool_or(r.condition = 'activeProject'), false) as has_condition,
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

-- ---------------------------------------------------------------------
-- ROLLBACK (körs för hand, i den här ordningen). Steg 06, 07 och 12 kan
-- då inte markeras klara igen.
--
-- 1. Kör om create or replace function public.complete_journey_step ur
--    20261001150000_journey_step_completion.sql.
-- 2. delete from public.journey_step_requirements where step_number in (6, 7, 12);
--    drop table public.journey_step_group_thresholds;
-- 3. Bara om inga bevis av de nya sorterna finns (främmande nyckel från evidence):
--    delete from public.evidence_kinds where kind in ('priceDecided', 'fundingApplied');
--    alter table public.evidence_kinds drop constraint evidence_kinds_base_points_check;
--    alter table public.evidence_kinds add constraint evidence_kinds_base_points_check check (base_points > 0);
-- ---------------------------------------------------------------------
