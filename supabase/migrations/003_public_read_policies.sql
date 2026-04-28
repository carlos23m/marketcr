-- Migration 003: public read access for anonymous payment page
-- Run in Supabase SQL editor if the payment page shows "not found" for valid links

-- Grant SELECT to anon role (needed when tables are created via SQL, not the dashboard)
grant select on payment_links to anon;
grant select on businesses to anon;

-- Public read for payment links (customers accessing /p/:id)
drop policy if exists "payment_links_public_read" on payment_links;
create policy "payment_links_public_read" on payment_links
  for select using (true);

-- Public read for businesses (needed for the embedded join on the payment page)
drop policy if exists "businesses_public_read" on businesses;
create policy "businesses_public_read" on businesses
  for select using (true);
