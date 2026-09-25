-- waitlist — väntelistan på landningssidan (`/`). Bara en mejladress per rad,
-- inget namn, ingen telefon, inga andra fält.
--
-- Avviker medvetet från mönstret "select/insert/update/delete egen" i övriga
-- migreringar: den som skriver upp sig är inte inloggad och har inget user_id.
-- Besökare har INGEN rättighet på tabellen, varken select, insert, update
-- eller delete. Enda vägen in är funktionen public.join_waitlist nedan, som
-- ger exakt samma svar oavsett om adressen redan fanns. Direkt insert via
-- Supabases API skulle avslöja det (201 för ny adress, 409 för en som finns),
-- och då kunde vem som helst pröva vilka adresser som står på listan.
-- Bara grundarna ser listan, i Supabase-dashboarden.
--
-- Känd begränsning: vem som helst med den publika anon-nyckeln kan anropa
-- funktionen och lägga till rader. Inget spamskydd finns än (se
-- docs/status.md).

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  -- Normaliseras till gemener (i join_waitlist och i serverkoden). unique +
  -- kravet på gemener gör att samma adress bara kan stå på listan en gång.
  email text not null unique
    check (char_length(email) <= 254)
    check (email = lower(email))
    check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Inga rättigheter alls på tabellen för besökare eller inloggade.
revoke all on public.waitlist from anon, authenticated;

-- Stänger direktåtkomst även om någon senare råkar ge anon eller
-- authenticated en rättighet på tabellen: en restrictive policy som aldrig är
-- sann stoppar varje rad. Ger ingen rättighet i sig. Finns också för att
-- migrations.test.ts kräver minst en policy per tabell; om den ska bytas mot
-- en ändrad testregel är ett öppet beslut för Erik (docs/status.md).
-- join_waitlist påverkas inte: den körs som tabellens ägare, som inte
-- omfattas av RLS.
create policy "waitlist: ingen direktåtkomst" on public.waitlist
  as restrictive for all to anon, authenticated
  using (false)
  with check (false);

-- Enda vägen att skriva upp sig. security definer: körs med ägarens
-- rättigheter, eftersom anropande roller saknar rättigheter på tabellen.
-- search_path = '' och fullständiga namn (public.waitlist) så att ingen kan
-- kapa funktionen med egna objekt i ett annat schema.
-- Normaliserar själv (trim + gemener), eftersom funktionen går att anropa
-- direkt utan att gå via Server Action. Längd och format kontrolleras av
-- tabellens check-villkor. on conflict do nothing + returns void: samma svar
-- för ny och befintlig adress, och inget id, ingen tid och inget antal
-- lämnar databasen.
create function public.join_waitlist(p_email text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.waitlist (email)
  values (lower(trim(p_email)))
  on conflict (email) do nothing;
$$;

-- Postgres låter alla (PUBLIC) köra en ny funktion. Stäng det och öppna bara
-- för anon och authenticated.
revoke execute on function public.join_waitlist(text) from public;
grant execute on function public.join_waitlist(text) to anon, authenticated;
