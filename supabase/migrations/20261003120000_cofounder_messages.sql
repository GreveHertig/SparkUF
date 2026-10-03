-- Medgrundaren, version 1: samtalet mellan grundaren och Medgrundaren
-- (docs/moduler/medgrundaren.md, beslut i docs/beslut.md 2026-10-03).
--
-- Körs MANUELLT i SQL Editor efter granskning, som de andra migreringarna.
-- Adaptern tål att tabellen eller funktionen saknas: då visar
-- /app/medgrundaren "Kommer snart" och inget anrop går till Gemini (utan
-- tabell kan kostnadstaket inte räknas).
--
-- En rad per meddelande. Servern skriver med grundarens egen session (ingen
-- service role). Texten är data, aldrig instruktion, och visas som ren text.
--
-- Bara select och insert. Ingen update- eller delete-policy, med flit:
-- - Kostnadstaket (40 meddelanden per dag) räknas ur raderna. Gick de att ta
--   bort kunde en grundare nollställa sitt eget tak.
-- - Historiken skrivs inte om i efterhand.
-- Raderna tas bort när kontot tas bort (on delete cascade).

create table public.cofounder_messages (
  id uuid primary key default gen_random_uuid(),
  -- Ordningen i samtalet. Sätts av databasen i den ordning raderna skrivs,
  -- så att klienten inte kan styra den med en egen tid.
  seq bigint generated always as identity,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('founder', 'cofounder')),
  -- Samma gräns som adaptern (adapters/live/CofounderConversation.ts).
  text text not null check (char_length(btrim(text)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index cofounder_messages_user_seq on public.cofounder_messages (user_id, seq desc);
create index cofounder_messages_user_role_created on public.cofounder_messages (user_id, role, created_at);

alter table public.cofounder_messages enable row level security;

create policy "cofounder_messages: select egen" on public.cofounder_messages
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "cofounder_messages: insert egen" on public.cofounder_messages
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Kostnadstaket utan kapplöpning (säkerhetsgranskningen 2026-10-03): räknar
-- dagens meddelanden från grundaren och sparar det nya i ett steg, under ett
-- lås per användare. Två samtidiga anrop kan därför inte båda passera taket.
-- Meddelandet sparas INNAN modellen anropas, så att ett misslyckat anrop också
-- räknas. Returnerar false, och sparar inget, när taket är nått.
--
-- security invoker: körs som grundaren själv, så RLS ("insert egen") gäller
-- som vanligt. Gränsen och dagens början kommer från servern
-- (core/cofounder.ts, core/stockholmDay.ts). Den som anropar funktionen
-- direkt med egna värden kan bara spara sina egna meddelanden, och anropar
-- ingen modell.
create function public.reserve_cofounder_message(p_text text, p_limit integer, p_since timestamptz)
returns boolean
language plpgsql
security invoker
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
