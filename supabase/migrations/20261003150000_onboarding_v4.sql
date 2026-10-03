-- Onboarding enligt spec v4 §4 och §3.2. Plan och beslut: Erik 2026-10-03,
-- docs/beslut.md (2026-10-03, "Onboarding v4") och
-- docs/status/2026-10-03-onboarding-v4.md.
--
-- * Konkreta frågor, val där det går och högst en fritext per ingång. Ett
--   val lagras som sitt stabila id. Frågorna speglar ONBOARDING_CHOICES och
--   ONBOARDING_QUESTIONS_BY_ENTRY i core/onboarding.ts, vaktat av
--   supabase/migrations/onboardingWrite.pg.test.ts.
-- * Varje svar sparas för sig (save_onboarding_answer), så att samtalet kan
--   avbrytas och fortsätta senare.
-- * Onboardingen är klar när ingångens kärnfrågor är besvarade
--   (complete_onboarding). De övriga frågorna är återstående frågor: de
--   härleds ur svaren (ingångens frågor minus de besvarade) och lagras inte
--   som en egen lista, som skulle kunna hamna i otakt med svaren.
--
-- Nya kolumner i profiles:
-- * onboarding_answers: {frågans id: {"answer": svar, "answered_at": tid}}.
--   answered_at sätts av databasen (now()) när svaret sparas, så att Minnet
--   kan visa källans datum utan att hitta på ett. Bara de två funktionerna skriver
--   den (ingen kolumnrättighet för klienten, migrations.test.ts).
-- * onboarding_version: 1 = klar med fritextfrågorna före v4 (svaren står
--   kvar i role, bio, time_available, money_available, risk_appetite,
--   frustrations och customer_guess och skrivs inte längre), 2 = klar med
--   v4. null = inte klar.
--
-- RLS: inga nya policyer. "profiles: select egen" och "update egen" gäller
-- radvis för de nya kolumnerna, och klienten saknar update-rättighet på dem.
--
-- ORDNING: kör den här filen i SQL Editor DIREKT VID MERGE. complete_onboarding
-- byts ut med samma signatur: gammal kod mot ny funktion skickar
-- fritextsvar som avvisas (22023), och ny kod mot gammal databas saknar
-- kolumnerna och save_onboarding_answer. Kör sedan adapters/live/rls.live.test.ts.
--
-- Körs MANUELLT i SQL Editor (hela filen) efter granskning.
--
-- Rollback: se blocket längst ner.

begin;

alter table public.profiles
  add column onboarding_answers jsonb not null default '{}'::jsonb,
  add column onboarding_version smallint;

alter table public.profiles
  add constraint profiles_onboarding_answers_objekt check (jsonb_typeof(onboarding_answers) = 'object'),
  -- Högst tolv frågor (efter ett byte av ingång), varav två fritext på högst
  -- 280 tecken, med en tid per svar: 8000 byte räcker gott.
  add constraint profiles_onboarding_answers_storlek check (octet_length(onboarding_answers::text) <= 8000),
  add constraint profiles_onboarding_version_giltig check (onboarding_version in (1, 2)),
  -- En version betyder en klar onboarding, och en klar onboarding har en version.
  add constraint profiles_onboarding_version_klar check ((onboarding_version is null) = (onboarding_completed_at is null)) not valid;

-- De som redan är klara blev det med fritextfrågorna.
update public.profiles set onboarding_version = 1 where onboarding_completed_at is not null;
alter table public.profiles validate constraint profiles_onboarding_version_klar;

-- Frågorna per ingång. `choices` null betyder fritext. Speglar
-- core/onboarding.ts (ONBOARDING_CHOICES, ONBOARDING_QUESTIONS_BY_ENTRY).
create function public.onboarding_v4_questions()
returns table (entry text, question_id text, "position" int, is_core boolean, choices text[])
language sql
immutable
set search_path = ''
as $$
  select * from (values
    ('noIdea', 'situation', 1, true, array['upperSecondary', 'university', 'employed', 'between']),
    ('noIdea', 'time', 2, true, array['under3', 'h3to6', 'h6to10', 'over10']),
    ('noIdea', 'money', 3, true, array['none', 'under1000', 'k1to5', 'over5000']),
    ('noIdea', 'soldB2b', 4, true, array['yes', 'no']),
    ('noIdea', 'archetype', 5, false, array['builder', 'seller', 'organizer']),
    ('noIdea', 'knowsOwner', 6, false, array['yes', 'no']),
    ('noIdea', 'frustration', 7, false, null::text[]),
    ('hasIdea', 'situation', 1, true, array['upperSecondary', 'university', 'employed', 'between']),
    ('hasIdea', 'payer', 2, true, array['business', 'consumer', 'public', 'unsure']),
    ('hasIdea', 'customer', 3, true, null::text[]),
    ('hasIdea', 'talkedTo', 4, true, array['none', 'few', 'many']),
    ('hasIdea', 'soldB2b', 5, false, array['yes', 'no']),
    ('hasIdea', 'time', 6, false, array['under3', 'h3to6', 'h6to10', 'over10']),
    ('hasIdea', 'money', 7, false, array['none', 'under1000', 'k1to5', 'over5000'])
  ) as q(entry, question_id, "position", is_core, choices);
$$;

-- Ett svar, prövat mot ingångens fråga: ett val måste vara ett av frågans
-- id:n, fritext trimmas och ska vara 1–280 tecken. Ger det rensade svaret
-- eller kastar 22023. Anropas bara av de två funktionerna nedan.
create function public.onboarding_v4_clean_answer(p_entry text, p_question text, p_answer jsonb)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_choices text[];
  v_found boolean := false;
  v_answer text;
begin
  select q.choices, true into v_choices, v_found
    from public.onboarding_v4_questions() q
    where q.entry = p_entry and q.question_id = p_question;
  if not coalesce(v_found, false) then
    raise exception 'Frågan hör inte till ingången.' using errcode = '22023';
  end if;
  if p_answer is null or jsonb_typeof(p_answer) <> 'string' then
    raise exception 'Svaret på % är inte text.', p_question using errcode = '22023';
  end if;
  if v_choices is not null then
    v_answer := p_answer #>> '{}';
    if not (v_answer = any (v_choices)) then
      raise exception 'Okänt val för %.', p_question using errcode = '22023';
    end if;
    return v_answer;
  end if;
  v_answer := regexp_replace(p_answer #>> '{}', '^\s+|\s+$', '', 'g');
  if char_length(v_answer) not between 1 and 280 then
    raise exception 'Svaret på % är tomt eller för långt.', p_question using errcode = '22023';
  end if;
  return v_answer;
end;
$$;

-- Ingången för den som inte är klar: ingång B skapar alltid ett aktivt
-- projekt före profilsamtalet (/start/ide), ingång A har inget. Samma regel
-- som resolveOnboardingEntry i app/start/_lib/entry.ts. Klienten väljer
-- aldrig ingång själv.
create function public.onboarding_v4_entry(p_user uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when exists (select 1 from public.projects where user_id = p_user and is_active) then 'hasIdea'
    else 'noIdea'
  end;
$$;

revoke execute on function public.onboarding_v4_questions() from public, anon, authenticated;
revoke execute on function public.onboarding_v4_clean_answer(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.onboarding_v4_entry(uuid) from public, anon, authenticated;

-- Sparar ett svar med tiden det gavs (now()) och ger tillbaka tiden. Före
-- klar onboarding får ett svar ändras, och får då en ny tid. Efter den gäller
-- ingången som sparades, och bara återstående frågor (utan svar) kan
-- besvaras: 55000 annars.
create function public.save_onboarding_answer(p_question text, p_answer text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile record;
  v_entry text;
  v_answer text;
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;

  select onboarding_entry, onboarding_completed_at, onboarding_answers into v_profile
    from public.profiles where user_id = v_user for update;
  if not found then
    raise exception 'Profilraden saknas.' using errcode = 'P0002';
  end if;

  if v_profile.onboarding_completed_at is not null then
    v_entry := v_profile.onboarding_entry;
  else
    v_entry := public.onboarding_v4_entry(v_user);
  end if;

  v_answer := public.onboarding_v4_clean_answer(v_entry, p_question, to_jsonb(p_answer));

  if v_profile.onboarding_completed_at is not null and v_profile.onboarding_answers ? p_question then
    raise exception 'Frågan är redan besvarad.' using errcode = '55000';
  end if;

  update public.profiles
    set onboarding_answers = onboarding_answers
      || jsonb_build_object(p_question, jsonb_build_object('answer', v_answer, 'answered_at', now()))
    where user_id = v_user;
  return now();
end;
$$;

-- Avslutar onboardingen. Ingången måste stämma med den databasen härleder.
-- p_answers (får vara {}) prövas och slås ihop med de sparade svaren, och
-- alla kärnfrågor måste då ha svar. Skriver svaren, ingången, versionen och
-- klar-tiden i en uppdatering. Samma signatur som förut, så grant och revoke
-- står kvar.
create or replace function public.complete_onboarding(p_entry text, p_answers jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile record;
  v_entry text;
  v_key text;
  v_answers jsonb;
  v_completed_at timestamptz;
begin
  if v_user is null then
    raise exception 'Inte inloggad.' using errcode = '42501';
  end if;
  -- En okänd ingång avvisas före allt annat, som förut, även om
  -- onboardingen redan är klar.
  if p_entry is null or p_entry not in ('noIdea', 'hasIdea') then
    raise exception 'Okänd ingång.' using errcode = '22023';
  end if;

  select onboarding_completed_at, onboarding_answers into v_profile
    from public.profiles where user_id = v_user for update;
  if not found then
    raise exception 'Profilraden saknas.' using errcode = 'P0002';
  end if;
  if v_profile.onboarding_completed_at is not null then
    raise exception 'Onboardingen är redan klar.' using errcode = '55000';
  end if;

  v_entry := public.onboarding_v4_entry(v_user);
  if p_entry is distinct from v_entry then
    raise exception 'Ingången stämmer inte.' using errcode = '22023';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Svaren saknas.' using errcode = '22023';
  end if;

  v_answers := v_profile.onboarding_answers;
  for v_key in select jsonb_object_keys(p_answers) loop
    v_answers := v_answers || jsonb_build_object(
      v_key,
      jsonb_build_object(
        'answer', public.onboarding_v4_clean_answer(v_entry, v_key, p_answers -> v_key),
        'answered_at', now()
      )
    );
  end loop;

  if exists (
    select 1 from public.onboarding_v4_questions() q
    where q.entry = v_entry and q.is_core and not (v_answers ? q.question_id)
  ) then
    raise exception 'Alla kärnfrågor är inte besvarade.' using errcode = '22023';
  end if;

  update public.profiles set
      onboarding_answers = v_answers,
      onboarding_entry = v_entry,
      onboarding_version = 2,
      onboarding_completed_at = now()
    where user_id = v_user
    returning onboarding_completed_at into v_completed_at;
  return v_completed_at;
end;
$$;

revoke execute on function public.save_onboarding_answer(text, text) from public, anon;
grant execute on function public.save_onboarding_answer(text, text) to authenticated;

commit;

-- ---------------------------------------------------------------------
-- Rollback (kör manuellt, i den här ordningen, och återställ koden först):
-- 1. Kör om "create or replace function public.complete_onboarding" ur
--    20261002190000_onboarding_nya_fragor.sql.
-- 2. drop function public.save_onboarding_answer(text, text);
--    drop function public.onboarding_v4_entry(uuid);
--    drop function public.onboarding_v4_clean_answer(text, text, jsonb);
--    drop function public.onboarding_v4_questions();
-- 3. alter table public.profiles drop column onboarding_version, drop column onboarding_answers;
--    (Svaren som sparats med v4 försvinner. Konton som blivit klara med v4
--    har då tomma fritextkolumner.)
-- ---------------------------------------------------------------------
