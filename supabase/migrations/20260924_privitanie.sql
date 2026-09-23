-- Ranné privítanie, zlacnené ponuky a ručný sync.
-- Spusti raz v Supabase → SQL Editor. Skript sa dá bezpečne spustiť aj opakovane.

-- Pôvodná cena a čas poslednej zmeny ceny (badge "zlacnené", privítanie).
alter table properties add column if not exists previous_price numeric;
alter table properties add column if not exists price_changed_at timestamptz;

-- Malé úložisko stavu appky: kedy Adelka naposledy videla novinky,
-- kedy prebehol posledný ručný sync a podobne.
create table if not exists app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Rovnako ako ostatné tabuľky: RLS zapnuté bez policies, prístup len cez service_role.
alter table app_state enable row level security;
