-- Migration 011: White-label and custom domains
-- Run after 010_financing_and_payments.sql

create table if not exists custom_domains (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references businesses(id) on delete cascade,
  domain            text not null unique,
  vercel_domain_id  text,
  status            text not null default 'pending'
                    check (status in ('pending','dns_pending','active','error')),
  ssl_active        boolean not null default false,
  verified_at       timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists whitelabel_config (
  id                        uuid primary key default uuid_generate_v4(),
  business_id               uuid not null references businesses(id) on delete cascade unique,
  logo_url                  text,
  primary_color             text not null default '#1D9E75',
  secondary_color           text not null default '#085041',
  business_display_name     text,
  hide_sinpepay_branding    boolean not null default true,
  custom_footer             text,
  favicon_url               text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table custom_domains    enable row level security;
alter table whitelabel_config enable row level security;

create policy "custom_domains_own" on custom_domains
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

create policy "whitelabel_config_own" on whitelabel_config
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

-- Public read for whitelabel_config (needed by PayView on custom domains)
create policy "whitelabel_config_public_read" on whitelabel_config
  for select using (true);

create index if not exists idx_custom_domains_business on custom_domains (business_id);
create index if not exists idx_custom_domains_status on custom_domains (status) where status = 'active';

-- Tiendanube integration
create table if not exists tiendanube_stores (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid not null references businesses(id) on delete cascade,
  tn_store_id     text not null unique,
  tn_access_token text not null,
  store_url       text not null,
  installed_at    timestamptz not null default now()
);

alter table tiendanube_stores enable row level security;

create policy "tiendanube_stores_own" on tiendanube_stores
  for all using (business_id in (select business_id from profiles where id = auth.uid()));

create index if not exists idx_tiendanube_business on tiendanube_stores (business_id);
