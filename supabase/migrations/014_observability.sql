-- Migration 014: Error tracking, API request logs, health monitoring
-- Run after 013_pwa.sql

create table if not exists error_logs (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid,
  business_id uuid,
  message     text not null,
  stack       text,
  url         text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- No RLS — only service role can write; no user reads needed
alter table error_logs enable row level security;
-- Admins can read via service role; no user-facing policy needed

create table if not exists api_request_logs (
  id          uuid primary key default uuid_generate_v4(),
  endpoint    text not null,
  method      text not null,
  status_code integer not null,
  duration_ms integer not null,
  business_id uuid,
  created_at  timestamptz not null default now()
);

alter table api_request_logs enable row level security;
-- Only service role writes; admin reads via service role

create index if not exists idx_api_logs_endpoint on api_request_logs (endpoint, created_at desc);
create index if not exists idx_api_logs_created on api_request_logs (created_at desc);
create index if not exists idx_error_logs_created on error_logs (created_at desc);

-- Auto-delete logs older than 30 days (called by cleanup-logs cron function)
create or replace function cleanup_old_logs()
returns void language sql security definer as $$
  delete from api_request_logs where created_at < now() - interval '30 days';
  delete from error_logs       where created_at < now() - interval '30 days';
$$;
