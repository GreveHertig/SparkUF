-- Bevislagringens skrivväg (docs/bevislagring.md, avsnitt 1, 2 och 7).
-- Rättar fel 1 i specens avsnitt 0: policyn "evidence: insert egen" lät en
-- inloggad användare skriva rader med valfritt points direkt mot Supabase
-- REST. Efter den här migreringen gäller:
--
-- * Ingen klient kan skriva i evidence eller score_snapshots direkt. Rätten
--   att skriva är indragen och skrivpolicyerna borttagna.
-- * Grundaren skriver bevis bara via public.record_evidence (security
--   definer, beslut B3). Användaren tas ur auth.uid() och projektet ur det
--   aktiva projektet, aldrig ur indata. entered_by blir alltid 'founder'.
-- * Del, datatyp, motsäger och poäng sätts av en trigger ur sorten i
--   public.evidence_kinds vid VARJE insert, även med service role (beslut B2).
--   Det som skickas in för de fälten skrivs över.
-- * Ett bevis kan inte ändras i efterhand, bara återkallas
--   (public.retract_evidence). Det raderas aldrig av grundaren.
-- * score_snapshots skrivs bara av servern med service role
--   (lib/server/scoreSnapshots.ts), eftersom totalen räknas i kod
--   (calculateScore) och aldrig i SQL. Beslut 2026-10-01, docs/beslut.md.
--
-- Rör inte profiles eller projects (Erik har en migrering i luften på dem).
-- projects läses bara, för att hitta det aktiva projektet.
--
-- Rollback: se blocket längst ner.

-- ---------------------------------------------------------------------
-- evidence_kinds — sorterna. Seedas här och hålls i synk med
-- core/evidenceKinds.ts av supabase/migrations/evidenceKinds.test.ts.
-- ---------------------------------------------------------------------
create table public.evidence_kinds (
  kind text primary key,
  part_id text not null check (part_id in (
    'market', 'competition', 'fit', 'problem',
    'willingnessToPay', 'product', 'traction', 'feasibility')),
  data_type text not null check (data_type in ('register', 'customer')),
  base_points numeric not null check (base_points > 0),
  contradicts boolean not null,
  -- 'founder': grundaren är själv källan. 'system': bara en modul som
  -- hämtat faktumet. 'either': ett faktum om en tredje part, som grundaren
  -- också får ange, men då självrapporterat och till halv poäng (beslut B6).
  entered_by text not null check (entered_by in ('founder', 'system', 'either')),
  fresh_for_days integer check (fresh_for_days is null or fresh_for_days > 0),
  unique (kind, part_id)
);

alter table public.evidence_kinds enable row level security;

create policy "evidence_kinds: select alla" on public.evidence_kinds
  for select to authenticated
  using (true);

-- Läsbar men stängd för skrivning: ändras bara via migreringar.
revoke insert, update, delete on table public.evidence_kinds from anon, authenticated;

insert into public.evidence_kinds (kind, part_id, data_type, base_points, contradicts, entered_by, fresh_for_days) values
  ('profileFitAnswer',         'fit',              'customer', 3, false, 'founder', null),
  ('registerMarketCount',      'market',           'register', 4, false, 'system',  365),
  ('registerMarketRevenue',    'market',           'register', 3, false, 'system',  365),
  ('registerCompetitorSet',    'competition',      'register', 3, false, 'system',  365),
  ('customerProblemConfirmed', 'problem',          'customer', 3, false, 'either',  180),
  ('customerProblemRejected',  'problem',          'customer', 3, true,  'either',  180),
  ('customerPriceAccepted',    'willingnessToPay', 'customer', 3, false, 'either',  180),
  ('customerPriceDeclined',    'willingnessToPay', 'customer', 3, true,  'either',  180),
  ('productScopeFromEvidence', 'product',          'customer', 4, false, 'founder', null),
  ('productPublished',         'product',          'customer', 6, false, 'founder', 90),
  ('formalRegistrationDone',   'feasibility',      'register', 4, false, 'either',  null),
  ('legalItemDone',            'feasibility',      'register', 1, false, 'founder', 365),
  ('payingCustomer',           'traction',         'customer', 4, false, 'either',  90),
  ('activeUser',               'traction',         'customer', 1, false, 'either',  30);

-- ---------------------------------------------------------------------
-- evidence — nya kolumner och villkor.
-- ---------------------------------------------------------------------
alter table public.evidence
  add column kind text,
  add column subject_ref text,
  add column entered_by text check (entered_by in ('founder', 'system')),
  add column module text check (char_length(module) between 1 and 60),
  add column response_id uuid references public.responses (id) on delete set null,
  add column company_id uuid references public.companies (id) on delete set null,
  add column retracted_at timestamptz,
  add column retracted_reason text check (char_length(retracted_reason) <= 500),
  add constraint evidence_source_name_not_blank check (char_length(btrim(source_name)) > 0),
  add constraint evidence_source_name_length check (char_length(source_name) <= 200),
  -- Bara http(s): record_evidence går att anropa direkt, förbi serverns kontroll.
  add constraint evidence_source_url_http check (source_url is null or source_url ~* '^https?://'),
  add constraint evidence_quote_length check (quote is null or char_length(quote) <= 1000),
  add constraint evidence_subject_ref_length check (char_length(subject_ref) between 1 and 200),
  add constraint evidence_not_simulation check (data_type <> 'simulation'),
  add constraint evidence_retraction_has_reason check (
    (retracted_at is null and retracted_reason is null)
    or (retracted_at is not null and char_length(btrim(retracted_reason)) > 0)
  ),
  -- Delen MÅSTE stämma med sorten (7.4, "fel del").
  add constraint evidence_kind_part_fk foreign key (kind, part_id)
    references public.evidence_kinds (kind, part_id);

-- Tabellen är tom i live (ingen skrivväg fanns före den här migreringen).
-- Finns rader ändå misslyckas set not null nedan och hela migreringen
-- rullas tillbaka. Ingenting raderas automatiskt.
alter table public.evidence
  alter column kind set not null,
  alter column subject_ref set not null,
  alter column entered_by set not null,
  alter column module set not null;

-- Dubblettspärr (7.2): samma sort om samma sak finns bara en gång bland de
-- bevis som inte är återkallade.
create unique index evidence_one_per_subject
  on public.evidence (project_id, kind, subject_ref)
  where retracted_at is null;

-- ---------------------------------------------------------------------
-- Triggern: del, datatyp, motsäger och poäng kommer ALLTID ur sorten.
-- Gäller varje insert, oavsett roll, så att inte heller serverkod med
-- service role kan sätta egna poäng.
-- ---------------------------------------------------------------------
create function public.evidence_derive_from_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  k public.evidence_kinds%rowtype;
begin
  select * into k from public.evidence_kinds where kind = new.kind;
  if not found then
    raise exception 'Okänd bevissort: %', new.kind using errcode = '22023';
  end if;
  if new.entered_by = 'founder' and k.entered_by = 'system' then
    raise exception 'Sorten % kan bara läggas in av systemet.', new.kind using errcode = '42501';
  end if;
  if new.entered_by = 'system' and k.entered_by = 'founder' then
    raise exception 'Sorten % kan bara läggas in av grundaren.', new.kind using errcode = '22023';
  end if;

  new.part_id := k.part_id;
  new.data_type := k.data_type;
  new.contradicts := k.contradicts;
  -- Beslut B6: självrapporterat (grundaren anger ett faktum om en tredje
  -- part) ger halv poäng. Samma tal som SELF_REPORTED_MULTIPLIER i
  -- core/evidenceKinds.ts, synktestat.
  new.points := k.base_points * (case when new.entered_by = 'founder' and k.entered_by = 'either' then 0.5 else 1 end);
  new.retracted_at := null;
  new.retracted_reason := null;
  new.created_at := now();
  return new;
end;
$$;

create trigger evidence_derive_from_kind
  before insert on public.evidence
  for each row execute function public.evidence_derive_from_kind();

-- Ett bevis ändras aldrig i efterhand. Det enda som får hända är att det
-- återkallas en gång (retracted_at och retracted_reason sätts).
create function public.evidence_only_retraction()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.retracted_at is not null then
    raise exception 'Beviset är redan återkallat.' using errcode = '22023';
  end if;
  if (to_jsonb(new) - 'retracted_at' - 'retracted_reason') <> (to_jsonb(old) - 'retracted_at' - 'retracted_reason') then
    raise exception 'Ett bevis kan inte ändras, bara återkallas.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger evidence_only_retraction
  before update on public.evidence
  for each row execute function public.evidence_only_retraction();

-- ---------------------------------------------------------------------
-- RLS: läsa sitt eget, skriva bara via record_evidence/retract_evidence.
-- "evidence: select egen" från 20260918090100 behålls.
-- ---------------------------------------------------------------------
drop policy "evidence: insert egen" on public.evidence;
drop policy "evidence: update egen" on public.evidence;
drop policy "evidence: delete egen" on public.evidence;
revoke insert, update, delete on table public.evidence from anon, authenticated;

drop policy "score_snapshots: insert egen" on public.score_snapshots;
drop policy "score_snapshots: update egen" on public.score_snapshots;
drop policy "score_snapshots: delete egen" on public.score_snapshots;
revoke insert, update, delete on table public.score_snapshots from anon, authenticated;

-- ---------------------------------------------------------------------
-- record_evidence — grundarens enda väg att lägga in ett bevis.
-- Tar medvetet INTE emot user_id, project_id, part_id, data_type, points,
-- contradicts eller entered_by. Det som inte går att skicka in går inte att
-- fuska med. Funktionen går att anropa direkt via Supabase REST, så varje
-- kontroll sitter här och inte bara i serverkoden.
--
-- Svar: status 'recorded', 'duplicate' (samma sort, sak och datum finns
-- redan) eller 'replaced' (ett nyare bevis om samma sak i samma del ersatte
-- ett tidigare självinlagt bevis, som återkallades: 7.2b, det senaste
-- beskedet gäller).
-- ---------------------------------------------------------------------
create function public.record_evidence(
  p_kind text,
  p_subject_ref text,
  p_source_name text,
  p_source_url text,
  p_fetched_at date,
  p_quote text,
  p_step_number smallint,
  p_module text
)
returns table (evidence_id uuid, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_subject text := btrim(p_subject_ref);
  v_project uuid;
  v_kind public.evidence_kinds%rowtype;
  v_existing uuid;
  v_replaced integer := 0;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;

  select id into v_project from public.projects where user_id = v_user and is_active limit 1;
  if v_project is null then
    raise exception 'Inget aktivt projekt.' using errcode = '22023';
  end if;

  select * into v_kind from public.evidence_kinds where kind = p_kind;
  if not found then
    raise exception 'Okänd bevissort.' using errcode = '22023';
  end if;
  if v_kind.entered_by = 'system' then
    raise exception 'Den här sorten kan bara läggas in av systemet.' using errcode = '42501';
  end if;

  -- Sparks egna källor lagras som nyckel ("spark:profile", 7.12) och visas
  -- som "Profilsamtalet". Bara sorter där grundaren själv är källan får bära
  -- en sådan, så att ett påstående om en kund aldrig ser ut att komma från Spark.
  if p_source_name like 'spark:%' and v_kind.entered_by <> 'founder' then
    raise exception 'Källan får inte vara en av Sparks egna för den här sorten.' using errcode = '22023';
  end if;

  if p_fetched_at is null or p_fetched_at > (now() at time zone 'Europe/Stockholm')::date then
    raise exception 'Datumet saknas eller ligger i framtiden.' using errcode = '22023';
  end if;

  -- En skrivning i taget per projekt, så att dubblettkontrollen och
  -- ersättningen nedan inte kan köras samtidigt (7.9). Rådgivande lås:
  -- rör inte projects-raden.
  perform pg_advisory_xact_lock(hashtextextended(v_project::text, 0));

  select id into v_existing from public.evidence
    where project_id = v_project and kind = p_kind and subject_ref = v_subject
      and fetched_at = p_fetched_at and retracted_at is null
    limit 1;
  if v_existing is not null then
    return query select v_existing, 'duplicate'::text;
    return;
  end if;

  -- Ett bevis Spark själv tagit emot kan grundaren aldrig ersätta (7.7).
  if exists (
    select 1 from public.evidence
      where project_id = v_project and part_id = v_kind.part_id and subject_ref = v_subject
        and entered_by = 'system' and retracted_at is null
  ) then
    raise exception 'Det finns redan ett bevis om det här som Spark tagit emot.' using errcode = '23505';
  end if;

  update public.evidence
    set retracted_at = now(), retracted_reason = 'Ersatt av ett nyare bevis om samma sak.'
    where project_id = v_project and part_id = v_kind.part_id and subject_ref = v_subject
      and entered_by = 'founder' and retracted_at is null;
  get diagnostics v_replaced = row_count;

  insert into public.evidence (
    user_id, project_id, kind, subject_ref, entered_by, module,
    source_name, source_url, fetched_at, quote, step_number,
    -- Skrivs över av triggern ur sorten. Anges bara för not null.
    part_id, data_type, points, contradicts
  ) values (
    v_user, v_project, p_kind, v_subject, 'founder', btrim(p_module),
    btrim(p_source_name), nullif(btrim(p_source_url), ''), p_fetched_at, nullif(btrim(p_quote), ''), p_step_number,
    v_kind.part_id, v_kind.data_type, 0, v_kind.contradicts
  )
  returning id into v_id;

  return query select v_id, (case when v_replaced > 0 then 'replaced' else 'recorded' end)::text;
end;
$$;

revoke execute on function public.record_evidence(text, text, text, text, date, text, smallint, text) from public;
grant execute on function public.record_evidence(text, text, text, text, date, text, smallint, text) to authenticated;

-- ---------------------------------------------------------------------
-- retract_evidence — grundaren återkallar ett eget bevis. Bara bevis
-- grundaren själv lagt in (7.7). Kräver en anledning.
-- ---------------------------------------------------------------------
create function public.retract_evidence(p_evidence_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) = 0 then
    raise exception 'En anledning krävs.' using errcode = '22023';
  end if;

  update public.evidence
    set retracted_at = now(), retracted_reason = btrim(p_reason)
    where id = p_evidence_id and user_id = v_user
      and entered_by = 'founder' and retracted_at is null;
  if not found then
    raise exception 'Beviset finns inte eller kan inte återkallas.' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.retract_evidence(uuid, text) from public;
grant execute on function public.retract_evidence(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- ROLLBACK (körs för hand, i den här ordningen, om migreringen måste
-- backas). OBS: steg 3 öppnar skrivpolicyerna igen, och därmed fel 1
-- (egna points via REST). Backa bara om skrivvägen ska byggas om.
--
-- 1. drop function public.retract_evidence(uuid, text);
--    drop function public.record_evidence(text, text, text, text, date, text, smallint, text);
-- 2. drop trigger evidence_only_retraction on public.evidence;
--    drop trigger evidence_derive_from_kind on public.evidence;
--    drop function public.evidence_only_retraction();
--    drop function public.evidence_derive_from_kind();
-- 3. grant insert, update, delete on table public.evidence to authenticated;
--    grant insert, update, delete on table public.score_snapshots to authenticated;
--    create policy "evidence: insert egen" on public.evidence for insert to authenticated with check ((select auth.uid()) = user_id);
--    create policy "evidence: update egen" on public.evidence for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
--    create policy "evidence: delete egen" on public.evidence for delete to authenticated using ((select auth.uid()) = user_id);
--    create policy "score_snapshots: insert egen" on public.score_snapshots for insert to authenticated with check ((select auth.uid()) = user_id);
--    create policy "score_snapshots: update egen" on public.score_snapshots for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
--    create policy "score_snapshots: delete egen" on public.score_snapshots for delete to authenticated using ((select auth.uid()) = user_id);
-- 4. drop index public.evidence_one_per_subject;
--    alter table public.evidence
--      drop constraint evidence_kind_part_fk,
--      drop constraint evidence_retraction_has_reason,
--      drop constraint evidence_not_simulation,
--      drop constraint evidence_subject_ref_length,
--      drop constraint evidence_quote_length,
--      drop constraint evidence_source_url_http,
--      drop constraint evidence_source_name_length,
--      drop constraint evidence_source_name_not_blank,
--      drop column retracted_reason,
--      drop column retracted_at,
--      drop column company_id,
--      drop column response_id,
--      drop column module,
--      drop column entered_by,
--      drop column subject_ref,
--      drop column kind;
-- 5. drop table public.evidence_kinds;
-- ---------------------------------------------------------------------
