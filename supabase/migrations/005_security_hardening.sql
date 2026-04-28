-- Migration 005: Security hardening
-- Run in Supabase SQL editor after 004_public_read_policies.sql

-- ── Role helper ────────────────────────────────────────────────────────────
-- Returns the authenticated user's role within their business.
create or replace function my_role()
returns text language sql security definer as $$
  select coalesce(
    (select rol from profiles where id = auth.uid()),
    'none'
  )
$$;

-- ── Scope public-read policies to the anon role only ──────────────────────
-- Previously "using (true)" applied to both authenticated and anon roles,
-- meaning any logged-in user from business A could read business B's data.
-- Scoping to "to anon" ensures authenticated users are governed only by the
-- member-access policies that already restrict reads to their own business.

drop policy if exists "payment_links_public_read" on payment_links;
create policy "payment_links_anon_read" on payment_links
  for select to anon
  using (true);

drop policy if exists "businesses_public_read" on businesses;
create policy "businesses_anon_read" on businesses
  for select to anon
  using (
    -- Anonymous users may only read businesses that have at least one payment link,
    -- preventing wholesale enumeration of all business records.
    exists (
      select 1 from payment_links
      where payment_links.business_id = businesses.id
    )
  );

-- ── Restrict business updates to owner (dueno) role ───────────────────────
drop policy if exists "businesses_update" on businesses;
create policy "businesses_update" on businesses
  for update
  using  (id = my_business_id() and my_role() = 'dueno')
  with check (id = my_business_id() and my_role() = 'dueno');

-- ── Restrict invitation management to owner role ──────────────────────────
-- Previously any team member could create/delete invitations.
drop policy if exists "invitations_member_access" on invitations;

create policy "invitations_select" on invitations
  for select using (business_id = my_business_id());

create policy "invitations_insert" on invitations
  for insert with check (
    business_id = my_business_id() and my_role() = 'dueno'
  );

create policy "invitations_update" on invitations
  for update
  using  (business_id = my_business_id() and my_role() = 'dueno')
  with check (business_id = my_business_id() and my_role() = 'dueno');

create policy "invitations_delete" on invitations
  for delete using (
    business_id = my_business_id() and my_role() = 'dueno'
  );

-- ── Allow dueno to remove team members ────────────────────────────────────
-- The existing "profiles_own" policy only lets users update their own profile,
-- so removeTeamMember() was silently blocked. This policy lets an owner set
-- another member's business_id to null (the remove operation).
create policy "profiles_dueno_manage_team" on profiles
  for update
  using (
    business_id = my_business_id()
    and my_role() = 'dueno'
    and id != auth.uid()
  )
  with check (
    (business_id = my_business_id() or business_id is null)
    and my_role() = 'dueno'
  );
