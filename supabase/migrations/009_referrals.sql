-- Migration 009: Referral program
-- Run in Supabase SQL editor after 008_twilio_quick_items.sql

alter table businesses
  add column if not exists referral_code text unique
    default upper(substring(md5(gen_random_uuid()::text), 1, 8));

create table if not exists referrals (
  id              uuid primary key default uuid_generate_v4(),
  referrer_id     uuid not null references businesses(id) on delete cascade,
  referred_email  text not null,
  referred_id     uuid references businesses(id) on delete set null,
  status          text not null default 'pending'
                  check (status in ('pending','signed_up','converted')),
  reward_given    boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table referrals enable row level security;

create policy "referrals_business_members" on referrals
  for all using (referrer_id = my_business_id());
