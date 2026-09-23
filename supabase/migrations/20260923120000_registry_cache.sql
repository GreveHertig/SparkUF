-- registry_cache — gemensam servercache för råa registersvar (SCB:s
-- företagsregister-API, Bolagsverkets API för värdefulla datamängder), så att
-- samma fråga inte hämtas om inom giltighetstiden.
--
-- BESLUT (Erik 2026-09-23, docs/beslut.md): cachen är GEMENSAM och bara
-- servern läser och skriver den, via lib/server/registryCache.ts med
-- SUPABASE_SERVICE_ROLE_KEY. Skäl: om användaren skrev själv kunde hen
-- förfalska registerdata i sin cache och därmed påverka Marknad-poängen och
-- affärsplanen. Registerdata är offentlig och inte användarspecifik, så den
-- ägs inte av någon användare.
--
-- RLS är påslaget UTAN policies, och anon/authenticated har inga rättigheter.
-- Ingen klient kommer alltså åt tabellen, varken med anon-nyckeln eller med en
-- inloggad session. Bara service role, som går förbi RLS, når den. Det är ett
-- dokumenterat undantag i RLS-vakten (supabase/migrations/migrations.test.ts).
--
-- Ingenting får skrivas hit förrän dataspiken §6 fråga 4 är avgjord
-- (docs/moduler/registret.md, "Licensgrind" punkt 4). Svarsformen för SCB är
-- okänd, därför lagras svaret som jsonb. Källa och hämtdatum finns på varje rad
-- (Datalöftet).

create table public.registry_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('scb_foretagsregistret', 'bolagsverket_vdm')),
  -- Normaliserad nyckel byggd i kod av strukturerad indata (t.ex. SNI-kod +
  -- storleksklass eller org.nr), aldrig fritext från användaren.
  request_key text not null check (char_length(request_key) between 1 and 512),
  response jsonb not null,
  row_count integer not null check (row_count >= 0),
  source_name text not null,
  source_url text not null,
  fetched_at timestamptz not null,
  -- SCB uppdaterar varje natt utom lördag–söndag, så en vecka är taket.
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (source, request_key),
  check (expires_at > fetched_at and expires_at <= fetched_at + interval '7 days')
);

create index registry_cache_expires_at on public.registry_cache (expires_at);

alter table public.registry_cache enable row level security;

-- Avsiktligt INGA policies: stängd för alla klienter. Rättigheterna dras också
-- in, så att en framtida policy inte ensam räcker för att öppna tabellen.
revoke all on table public.registry_cache from anon, authenticated;
