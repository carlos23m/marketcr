-- Migration 013: PWA push subscriptions
-- Run after 012_locations.sql

create table if not exists push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  -- Notification preferences stored as JSON flags
  prefs       jsonb not null default '{"payments":true,"invoices":true,"daily_summary":false,"plan_reminders":true}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_own" on push_subscriptions
  for all using (profile_id = auth.uid());

create index if not exists idx_push_profile on push_subscriptions (profile_id);
