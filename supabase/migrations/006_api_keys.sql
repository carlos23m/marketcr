-- Migration 006: API keys & webhook infrastructure
-- Run in Supabase SQL editor after 005_security_hardening.sql

-- ── API Keys ─────────────────────────────────────────────────────────────────
create table if not exists api_keys (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  name          text not null,
  key_prefix    text not null,
  key_hash      text not null unique,
  permissions   text[] default '{}',
  environment   text not null default 'live' check (environment in ('live','test')),
  last_used_at  timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ── Webhook Endpoints ─────────────────────────────────────────────────────────
create table if not exists webhook_endpoints (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid not null references businesses(id) on delete cascade,
  url           text not null,
  events        text[] not null,
  secret        text not null,
  enabled       boolean not null default true,
  failure_count integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ── Webhook Deliveries ────────────────────────────────────────────────────────
create table if not exists webhook_deliveries (
  id            uuid primary key default uuid_generate_v4(),
  endpoint_id   uuid not null references webhook_endpoints(id) on delete cascade,
  event_type    text not null,
  payload       jsonb not null,
  response_code integer,
  response_body text,
  duration_ms   integer,
  failed        boolean not null default false,
  delivered_at  timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table api_keys          enable row level security;
alter table webhook_endpoints enable row level security;
alter table webhook_deliveries enable row level security;

create policy "api_keys_business_members" on api_keys
  for all using (business_id = my_business_id());

create policy "webhook_endpoints_business_members" on webhook_endpoints
  for all using (business_id = my_business_id());

create policy "webhook_deliveries_business_members" on webhook_deliveries
  for all using (
    endpoint_id in (
      select id from webhook_endpoints where business_id = my_business_id()
    )
  );

-- ── Indices ───────────────────────────────────────────────────────────────────
create index on api_keys (business_id);
create index on api_keys (key_hash);
create index on webhook_endpoints (business_id);
create index on webhook_deliveries (endpoint_id, delivered_at desc);
create index on payment_links (business_id, estado);
create index on transactions (business_id, fecha desc);
