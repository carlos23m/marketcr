-- Migration 012: Multi-location support
-- Run after 011_whitelabel.sql

create table if not exists locations (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  nombre        text not null,
  direccion     text,
  sinpe_numero  text,
  is_main       boolean not null default false,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists profile_locations (
  profile_id    uuid not null references profiles(id) on delete cascade,
  location_id   uuid not null references locations(id) on delete cascade,
  primary key (profile_id, location_id)
);

alter table locations         enable row level security;
alter table profile_locations enable row level security;

-- Dueno sees all locations for their business
create policy "locations_dueno" on locations
  for all using (
    business_id in (
      select business_id from profiles
      where id = auth.uid() and rol = 'dueno'
    )
  );

-- Cajero can read their assigned locations
create policy "locations_cajero_read" on locations
  for select using (
    id in (
      select location_id from profile_locations where profile_id = auth.uid()
    )
  );

create policy "profile_locations_own" on profile_locations
  for all using (
    location_id in (
      select id from locations
      where business_id in (
        select business_id from profiles where id = auth.uid() and rol = 'dueno'
      )
    )
  );

-- Add location_id to transactional tables
alter table payment_links add column if not exists location_id uuid references locations(id);
alter table transactions   add column if not exists location_id uuid references locations(id);
alter table invoices        add column if not exists location_id uuid references locations(id);

-- Add FK for payroll tables (created in 010 before locations table existed)
alter table payroll_employees add foreign key (location_id) references locations(id);
alter table payroll_runs      add foreign key (location_id) references locations(id);

create index if not exists idx_locations_business on locations (business_id);
create index if not exists idx_profile_locations_profile on profile_locations (profile_id);
create index if not exists idx_payment_links_location on payment_links (location_id);
create index if not exists idx_transactions_location on transactions (location_id);

-- Add country/currency to businesses for regional expansion
alter table businesses
  add column if not exists country  text not null default 'CR',
  add column if not exists currency text not null default 'CRC';

-- Add is_sinpepay_admin flag to profiles for internal admin access
alter table profiles
  add column if not exists is_sinpepay_admin boolean not null default false;
