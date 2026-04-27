-- Migration 002: Row Level Security policies
-- Run after 001_core_tables.sql

alter table businesses       enable row level security;
alter table profiles         enable row level security;
alter table payment_links    enable row level security;
alter table transactions     enable row level security;
alter table invoices         enable row level security;
alter table invitations      enable row level security;
alter table notification_logs enable row level security;

-- Helper function: get calling user's business_id
create or replace function my_business_id()
returns uuid language sql security definer as $$
  select business_id from profiles where id = auth.uid()
$$;

-- Businesses: members only
create policy "businesses_member_access" on businesses
  for all using (id = my_business_id());

-- Profiles: own profile only (can read teammates too)
create policy "profiles_own" on profiles
  for all using (id = auth.uid());

create policy "profiles_teammates" on profiles
  for select using (business_id = my_business_id());

-- Payment links: business members
create policy "payment_links_member_access" on payment_links
  for all using (business_id = my_business_id());

-- PUBLIC read-only policy for payment links (customer payment page)
create policy "payment_links_public_read" on payment_links
  for select using (true);

-- Transactions: business members
create policy "transactions_member_access" on transactions
  for all using (business_id = my_business_id());

-- Invoices: business members
create policy "invoices_member_access" on invoices
  for all using (business_id = my_business_id());

-- Invitations: business members can manage
create policy "invitations_member_access" on invitations
  for all using (business_id = my_business_id());

-- Notification logs: business members
create policy "notification_logs_member_access" on notification_logs
  for all using (business_id = my_business_id());
