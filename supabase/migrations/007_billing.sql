-- Migration 007: Subscription billing columns
-- Run in Supabase SQL editor after 006_api_keys.sql

-- Add billing + plan columns to businesses
alter table businesses
  add column if not exists plan              text not null default 'starter'
                                             check (plan in ('starter','pro','business')),
  add column if not exists plan_period_end   timestamptz,
  add column if not exists trial_end         timestamptz,
  add column if not exists onvo_customer_id  text unique,
  add column if not exists onvo_subscription_id text unique;

-- Auto-start 14-day Pro trial for new businesses
-- Set plan='pro' + trial_end on insert when not already set
create or replace function set_trial_on_business_insert()
returns trigger language plpgsql security definer as $$
begin
  if new.trial_end is null then
    new.trial_end  := now() + interval '14 days';
    new.plan       := 'pro';
  end if;
  return new;
end;
$$;

create trigger trg_business_trial
  before insert on businesses
  for each row execute function set_trial_on_business_insert();

-- Plan-aware helper: returns effective plan (accounts for expired trials)
create or replace function my_plan()
returns text language sql security definer as $$
  select case
    when b.trial_end > now() then b.plan
    when b.plan_period_end > now() then b.plan
    else 'starter'
  end
  from businesses b
  join profiles p on p.business_id = b.id
  where p.id = auth.uid()
$$;
