-- Två nya frågor i profilsamtalet. Beslut Theodor 2026-10-02 (texterna),
-- förslag Bruno. docs/status.md, "Onboarding: två nya frågor".
--
-- * Ingång B (hasIdea): "Vem tror du skulle köpa? En gissning räcker."
--   Id `customer`, kolumn `customer_guess`. Grundarens första gissning om
--   kunden: startpunkten för Validering, och måttet på hur långt segmentet
--   snävas in senare.
-- * Ingång A (noIdea): "Vad stör du dig på i vardagen, skolan eller jobbet?"
--   Id `frustrations`, kolumn `frustrations`. Problem att bygga idéer på i
--   steg 02.
--
-- Samma regler som de andra svarskolumnerna: text, högst 1000 tecken (check
-- här, trimning och minst ett tecken i complete_onboarding), skrivbar för
-- klienten precis som role, bio, time_available, money_available och
-- risk_appetite (migrations.test.ts, PROFILES_CLIENT_WRITABLE).
--
-- complete_onboarding byts ut med samma signatur, så grant och revoke står
-- kvar. Frågorna per ingång speglar PROFILE_QUESTIONS_BY_ENTRY i
-- core/onboarding.ts, vaktat av supabase/migrations/onboardingWrite.pg.test.ts.
--
-- ORDNING: kör den här filen i SQL Editor INNAN koden mergas. Ny kod mot
-- gammal funktion gör att ingen kan bli klar med onboardingen (fel 22023,
-- "Svaren ska vara exakt ingångens frågor"). Gammal kod mot ny funktion ger
-- samma fel, så merga direkt efter körningen.
--
-- Körs MANUELLT i SQL Editor (hela filen) efter granskning. Kör sedan
-- adapters/live/rls.live.test.ts.
--
-- Rollback: se blocket längst ner.

begin;

alter table public.profiles
  add column customer_guess text,
  add column frustrations text;

alter table public.profiles
  add constraint profiles_customer_guess_langd check (char_length(customer_guess) <= 1000),
  add constraint profiles_frustrations_langd check (char_length(frustrations) <= 1000);

-- Den fullständiga listan, så att den senaste grant-satsen är hela sanningen
-- (migrations.test.ts). Kolumnrättigheter läggs till, så de gamla står kvar.
grant update (name, initials, role, bio, time_available, money_available, risk_appetite, customer_guess, frustrations)
  on table public.profiles to authenticated;

create or replace function public.complete_onboarding(p_entry text, p_answers jsonb)
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
    when 'noIdea' then array['role', 'bio', 'frustrations', 'time', 'money', 'risk']
    when 'hasIdea' then array['role', 'customer', 'time', 'money']
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
      customer_guess = coalesce(v_answers ->> 'customer', customer_guess),
      frustrations = coalesce(v_answers ->> 'frustrations', frustrations),
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

commit;

-- ---------------------------------------------------------------------
-- Rollback (kör manuellt, i den här ordningen, och återställ koden först):
-- 1. Kör om "create function public.complete_onboarding" ur
--    20261002150000_steg1_onboarding.sql som "create or replace function".
-- 2. revoke update on table public.profiles from authenticated;
--    grant update (name, initials, role, bio, time_available, money_available, risk_appetite)
--      on table public.profiles to authenticated;
-- 3. alter table public.profiles drop column customer_guess, drop column frustrations;
-- ---------------------------------------------------------------------
