-- waitlist — väntelistan på landningssidan (`/`). Bara en mejladress per rad,
-- inget namn, ingen telefon, inga andra fält.
--
-- Avviker medvetet från mönstret "select/insert/update/delete egen" i övriga
-- migreringar: den som skriver upp sig är inte inloggad och har inget user_id.
-- I stället finns bara en insert-policy och INGEN läs-, ändrings- eller
-- raderingspolicy, så ingen besökare kan se en enda rad, inte ens sin egen.
-- Bara grundarna ser listan, i Supabase-dashboarden.
--
-- Känd begränsning: vem som helst med den publika anon-nyckeln kan lägga till
-- rader. Inget spamskydd finns än (se docs/status.md).

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  -- Normaliseras till gemener i serverkoden innan insert. unique + kravet på
  -- gemener gör att samma adress bara kan stå på listan en gång.
  email text not null unique
    check (char_length(email) <= 254)
    check (email = lower(email))
    check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Besökare får bara skriva in kolumnen email. id och created_at sätts alltid
-- av databasen och kan inte skickas in utifrån.
revoke all on public.waitlist from anon, authenticated;
grant insert (email) on public.waitlist to anon, authenticated;

-- Formatet kontrolleras av tabellens check-villkor ovan.
create policy "waitlist: insert alla" on public.waitlist
  for insert to anon, authenticated
  with check (true);
