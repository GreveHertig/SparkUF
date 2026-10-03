-- Medgrundaren, PR 2 av onboarding v4 (spec v4 §3.1): varje svar slutar med
-- en konkret uppgift, som sparas med svaret. Samtidigt stängs tabellen för
-- skrivning från klienten (docs/beslut.md 2026-10-03, "Medgrundarens rader
-- skrivs bara av servern", en ändring av beslutet från #63).
--
-- Körs MANUELLT i SQL Editor direkt vid merge, som de andra migreringarna.
-- Tills den är körd kan en inloggad grundare med anon-nyckeln och sin egen
-- session lägga in rader med role = 'cofounder' i sin egen historik
-- (prövat mot SparkUF2 2026-10-03).
--
-- Varför service role: servern skrev förut med grundarens egen session. Allt
-- den sessionen får göra kan klienten också göra, med egen text. En security
-- definer-funktion som authenticated får anropa hjälper därför inte för
-- Medgrundarens svar. Svaret skrivs nu bara av servern med service role
-- (lib/server/cofounderReplies.ts), samma mönster som score_snapshots
-- (20261001120000_evidence_write_path.sql).
--
-- Efter migreringen:
-- - Grundarens meddelande sparas bara via public.reserve_cofounder_message
--   (nu security definer). Rollen är alltid 'founder', next_task alltid null,
--   och användaren är alltid auth.uid().
-- - Medgrundarens svar sparas bara av service role.
-- - Klienten kan läsa sina egna rader, som förut ("select egen").

alter table public.cofounder_messages
  add column next_task text,
  -- Uppgiften hör bara till Medgrundarens svar. Samma gräns som adaptern
  -- (COFOUNDER_TASK_MAX i ports/CofounderConversation.ts).
  add constraint cofounder_messages_next_task_check
    check (next_task is null or (role = 'cofounder' and char_length(btrim(next_task)) between 1 and 500));

-- Läsbar men stängd för skrivning (supabase/migrations/migrations.test.ts,
-- WRITE_CLOSED_TABLES). Ingen update- eller delete-policy fanns förut heller.
drop policy "cofounder_messages: insert egen" on public.cofounder_messages;
revoke insert, update, delete on table public.cofounder_messages from anon, authenticated;

-- Samma signatur och samma tak som förut, men security definer: klienten har
-- inte längre insert-rätt på tabellen. Funktionen tar inte emot user_id, roll
-- eller uppgift, så det som inte går att skicka in går inte att fuska med.
-- Gränsen och dagens början kommer från servern (core/cofounder.ts,
-- core/stockholmDay.ts). Den som anropar funktionen direkt med egna värden kan
-- bara spara sina egna meddelanden som grundare, och anropar ingen modell.
create or replace function public.reserve_cofounder_message(p_text text, p_limit integer, p_since timestamptz)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_count integer;
begin
  if v_user is null then
    raise exception 'Ingen inloggad användare.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('cofounder_messages:' || v_user::text, 0));
  select count(*) into v_count
    from public.cofounder_messages
   where user_id = v_user and role = 'founder' and created_at >= p_since;
  if v_count >= p_limit then
    return false;
  end if;
  insert into public.cofounder_messages (user_id, role, text) values (v_user, 'founder', p_text);
  return true;
end;
$$;

revoke all on function public.reserve_cofounder_message(text, integer, timestamptz) from public, anon;
grant execute on function public.reserve_cofounder_message(text, integer, timestamptz) to authenticated;
